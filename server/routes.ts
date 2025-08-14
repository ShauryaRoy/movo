import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuthRoutes, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertRsvpSchema, insertPostSchema, insertPollSchema, insertExpenseSchema, insertSettlementSchema } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import path from "path";
import express from "express";

// ES module __dirname workaround
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Only set up auth routes here
  setupAuthRoutes(app);

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json(null);
    }
    res.json(req.user);
  });

  // Event routes
  app.post('/api/events', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to create an event." });
    }
    try {
      const userId = req.user.id;
      // Manually create event data with proper date handling
      const eventData = {
        title: req.body.title,
        description: req.body.description,
        hostId: userId,
        eventType: req.body.eventType,
        location: req.body.location,
        datetime: new Date(req.body.datetime),
        imageUrl: req.body.imageUrl,
        maxGuests: req.body.maxGuests,
        isPublic: req.body.isPrivate ? false : true, // Convert isPrivate to isPublic
        themeId: req.body.themeId || 'quantum-dark', // Add theme support
        settings: req.body.settings,
        posterData: req.body.posterData,
      };
      console.log("[Create Event] Incoming request body:", req.body);
      console.log("[Create Event] Parsed eventData:", eventData);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        console.error("[Create Event] Error stack:", error.stack);
        res.status(500).json({ message: "Failed to create event", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to create event", error: String(error) });
      }
    }
  });

  // Health check route
  app.get('/api/health', async (req, res) => {
    try {
      // Simple database connectivity test
      const result = await db.execute(sql`SELECT 1 as test`);
      res.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: 'error', 
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/events/discover', async (req: any, res) => {
    try {
      const events = await storage.getPublicEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Failed to fetch public events" });
    }
  });

  app.get('/api/events', async (req: any, res) => {
    try {
      const userId = req.user?.id
      console.log(`[DEBUG] Fetching events for user: ${userId}`);
      const events = await storage.getUserEvents(userId);
      console.log(`[DEBUG] Found ${events?.length || 0} events for user ${userId}`);
      if (events && events.length > 0) {
        console.log(`[DEBUG] Event IDs:`, events.map((e: any) => e.id));
      }
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log(`[DEBUG] Fetching event with ID: ${eventId}`);
      const event = await storage.getEventWithDetails(eventId);
      console.log(`[DEBUG] Event found:`, event ? 'YES' : 'NO');
      if (!event) {
        console.log(`[DEBUG] Event ${eventId} not found in database`);
        return res.status(404).json({ message: "Event not found" });
      }
      console.log(`[DEBUG] Returning event data for ID ${eventId}:`, {
        title: event.title,
        id: event.id,
        hostId: event.hostId
      });
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Add share route for events
  app.get('/api/events/:id/share', async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEventWithDetails(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get RSVP counts
      const rsvpCounts = await storage.getEventRsvpCounts(eventId);
      
      // Get user's RSVP status if authenticated
      let userRsvpStatus = null;
      if (req.isAuthenticated?.() && req.user) {
        const userRsvp = await storage.getUserRsvp(eventId, req.user.id);
        userRsvpStatus = userRsvp?.status || null;
      }

      // Get host information
      const host = await storage.getUser(event.hostId);

      const eventWithDetails = {
        ...event,
        ...rsvpCounts,
        userRsvpStatus,
        hostName: host ? `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email : "Unknown Host"
      };

      res.json(eventWithDetails);
    } catch (error) {
      console.error("Error fetching event for sharing:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

app.put('/api/events/:id', async (req: any, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user?.id; // ← Use actual logged-in user ID

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const event = await storage.getEvent(eventId);

    if (!event || event.hostId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    const eventData = insertEventSchema.partial().parse(req.body);
    const updatedEvent = await storage.updateEvent(eventId, eventData);
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});


  app.delete('/api/events/:id', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to delete an event." });
    }
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // Use actual authenticated user ID
      
      const event = await storage.getEvent(eventId);
      if (!event || event.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      
      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // RSVP routes
  app.post('/api/events/:id/rsvp', async (req: any, res) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "You must be logged in to RSVP." });
      }
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // Use the actual authenticated user ID
      const { status, plusOneCount = 0, dietaryRestrictions, comments } = req.body;
      
      // Check if RSVP already exists
      const existingRsvp = await storage.getUserRsvp(eventId, userId);
      
      if (existingRsvp) {
        const updatedRsvp = await storage.updateRsvp(eventId, userId, status, plusOneCount);
        res.json(updatedRsvp);
      } else {
        const rsvpData = insertRsvpSchema.parse({
          eventId,
          userId,
          status,
          plusOneCount,
          dietaryRestrictions,
          comments,
        });
        const rsvp = await storage.createRsvp(rsvpData);
        res.json(rsvp);
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Failed to update RSVP" });
    }
  });

  app.get('/api/events/:id/rsvps', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rsvps = await storage.getEventRsvps(eventId);
      
      // Get detailed user information for each RSVP
      const detailedRsvps = await Promise.all(
        rsvps.map(async (rsvp: any) => {
          const user = await storage.getUser(rsvp.userId);
          return { ...rsvp, user };
        })
      );
      
      res.json(detailedRsvps);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  // Post routes
  app.post('/api/events/:id/posts', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to create a post." });
    }
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // Use actual authenticated user ID
      const postData = insertPostSchema.parse({
        ...req.body,
        eventId,
        authorId: userId,
      });
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/events/:id/posts', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const posts = await storage.getEventPosts(eventId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Poll routes
  app.post('/api/events/:id/polls', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to create a poll." });
    }
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // Use actual authenticated user ID
      console.log("[Create Poll] User ID from session:", userId);
      console.log("[Create Poll] Request body:", req.body);
      const pollData = insertPollSchema.parse({
        ...req.body,
        eventId,
        createdBy: userId,
      });
      console.log("[Create Poll] Final poll data:", pollData);
      const poll = await storage.createPoll(pollData);
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get('/api/events/:id/polls', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const polls = await storage.getEventPolls(eventId);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.post('/api/polls/:id/vote', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to vote in a poll." });
    }
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id; // Use actual authenticated user ID
      const { optionIndex } = req.body;
      
      const vote = await storage.voteInPoll(pollId, userId, optionIndex);
      res.json(vote);
    } catch (error) {
      console.error("Error voting in poll:", error);
      res.status(500).json({ message: "Failed to vote in poll" });
    }
  });

  // Expense routes
  app.post('/api/events/:id/expenses', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to create an expense." });
    }
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // Use actual authenticated user ID
      
      console.log("[Create Expense] Raw request body:", JSON.stringify(req.body, null, 2));
      
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        eventId,
        paidBy: userId,
      });
      
      console.log("[Create Expense] Parsed expense data:", JSON.stringify(expenseData, null, 2));
      
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.get('/api/events/:id/expenses', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const expenses = await storage.getEventExpenses(eventId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Settlement routes
  app.post('/api/events/:eventId/settlements', async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ message: "You must be logged in to record a settlement." });
    }
    try {
      const eventId = parseInt(req.params.eventId);
      const settlementData = insertSettlementSchema.parse({
        ...req.body,
        eventId,
      });
      const settlement = await storage.createSettlement(settlementData);
      res.json(settlement);
    } catch (error) {
      console.error("Error creating settlement:", error);
      res.status(500).json({ message: "Failed to record settlement" });
    }
  });

  app.get('/api/events/:eventId/settlements', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const settlements = await storage.getEventSettlements(eventId);
      res.json(settlements);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      res.status(500).json({ message: "Failed to fetch settlements" });
    }
  });

  // Only serve static files in production mode
  // In development, Vite handles this
  if (process.env.NODE_ENV !== "development") {
    // Serve static files from the client directory
    app.use(express.static(path.join(__dirname, "../client/dist")));

    // Catch-all route to serve index.html for SPA routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
