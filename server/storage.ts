import {
  users,
  events,
  eventRsvps,
  eventPosts,
  eventPolls,
  pollVotes,
  eventExpenses,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertRsvp,
  type EventPost,
  type InsertPost,
  type EventPoll,
  type InsertPoll,
  type PollVote,
  type EventExpense,
  type InsertExpense,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventWithDetails(id: number): Promise<any>;
  getUserEvents(userId: string): Promise<Event[]>;
  getPublicEvents(): Promise<any[]>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // RSVP operations
  createRsvp(rsvp: InsertRsvp): Promise<EventRsvp>;
  updateRsvp(eventId: number, userId: string, status: string, plusOneCount?: number): Promise<EventRsvp>;
  getEventRsvps(eventId: number): Promise<EventRsvp[]>;
  getUserRsvp(eventId: number, userId: string): Promise<EventRsvp | undefined>;
  
  // Post operations
  createPost(post: InsertPost): Promise<EventPost>;
  getEventPosts(eventId: number): Promise<any[]>;
  
  // Poll operations
  createPoll(poll: InsertPoll): Promise<EventPoll>;
  getEventPolls(eventId: number): Promise<any[]>;
  voteInPoll(pollId: number, userId: string, optionIndex: number): Promise<PollVote>;
  getPollVotes(pollId: number): Promise<PollVote[]>;
  
  // Expense operations
  createExpense(expense: InsertExpense): Promise<EventExpense>;
  getEventExpenses(eventId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string) {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    console.log('Upserting user with data:', userData);
    
    // Ensure we have required fields
    if (!userData.id) {
      throw new Error('User ID is required');
    }

    const insertData = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      passwordHash: userData.passwordHash || null,
      googleId: userData.googleId || null,
      updatedAt: new Date(),
    };

    try {
      const [user] = await db
        .insert(users)
        .values(insertData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: insertData.email,
            firstName: insertData.firstName,
            lastName: insertData.lastName,
            profileImageUrl: insertData.profileImageUrl,
            googleId: insertData.googleId,
            updatedAt: insertData.updatedAt,
          },
        })
        .returning();

      console.log('Upserted user result:', user);
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventWithDetails(id: number): Promise<any> {
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        host: true,
        rsvps: {
          with: {
            user: true,
          },
        },
        posts: {
          with: {
            author: true,
          },
          orderBy: desc(eventPosts.createdAt),
        },
        polls: {
          where: eq(eventPolls.isActive, true),
          with: {
            votes: true,
          },
        },
        expenses: {
          with: {
            payer: true,
          },
        },
      },
    });
    return event;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    const hostedEvents = await db.select().from(events).where(eq(events.hostId, userId));
    
    const rsvpedEvents = await db
      .select({ event: events })
      .from(events)
      .innerJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
      .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.status, 'going')));
    
    const allEvents = [...hostedEvents, ...rsvpedEvents.map(r => r.event)];
    const uniqueEvents = allEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    
    return uniqueEvents.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }

  async getPublicEvents(): Promise<any[]> {
    // First get all public events
    const publicEvents = await db
      .select()
      .from(events)
      .where(eq(events.isPublic, true))
      .orderBy(asc(events.datetime));
    
    // Then get RSVP counts for each event
    const eventsWithCounts = await Promise.all(
      publicEvents.map(async (event) => {
        const [totalRsvps] = await db
          .select({ count: count() })
          .from(eventRsvps)
          .where(eq(eventRsvps.eventId, event.id));
          
        const [goingRsvps] = await db
          .select({ count: count() })
          .from(eventRsvps)
          .where(and(
            eq(eventRsvps.eventId, event.id),
            eq(eventRsvps.status, 'going')
          ));

        return {
          ...event,
          rsvpCount: totalRsvps.count,
          goingCount: goingRsvps.count,
        };
      })
    );
    
    return eventsWithCounts;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // RSVP operations
  async createRsvp(rsvp: InsertRsvp): Promise<EventRsvp> {
    const [newRsvp] = await db.insert(eventRsvps).values(rsvp).returning();
    return newRsvp;
  }

  async updateRsvp(eventId: number, userId: string, status: string, plusOneCount = 0): Promise<EventRsvp> {
    const [updatedRsvp] = await db
      .update(eventRsvps)
      .set({ 
        status,
        plusOneCount,
        updatedAt: new Date(),
      })
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .returning();
    return updatedRsvp;
  }

  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getUserRsvp(eventId: number, userId: string): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return rsvp;
  }

  // Post operations
  async createPost(post: InsertPost): Promise<EventPost> {
    const [newPost] = await db.insert(eventPosts).values(post).returning();
    return newPost;
  }

  async getEventPosts(eventId: number): Promise<any[]> {
    return await db.query.eventPosts.findMany({
      where: eq(eventPosts.eventId, eventId),
      with: {
        author: true,
      },
      orderBy: desc(eventPosts.createdAt),
    });
  }

  // Poll operations
  async createPoll(poll: InsertPoll): Promise<EventPoll> {
    const [newPoll] = await db.insert(eventPolls).values(poll).returning();
    return newPoll;
  }

  async getEventPolls(eventId: number): Promise<any[]> {
    return await db.query.eventPolls.findMany({
      where: eq(eventPolls.eventId, eventId),
      with: {
        votes: {
          with: {
            user: true,
          },
        },
      },
    });
  }

  async voteInPoll(pollId: number, userId: string, optionIndex: number): Promise<PollVote> {
    // First, remove any existing vote from this user for this poll
    await db.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
    
    // Then insert the new vote
    const [vote] = await db.insert(pollVotes).values({
      pollId,
      userId,
      optionIndex,
    }).returning();
    return vote;
  }

  async getPollVotes(pollId: number): Promise<PollVote[]> {
    return await db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
  }

  // Expense operations
  async createExpense(expense: InsertExpense): Promise<EventExpense> {
    const [newExpense] = await db.insert(eventExpenses).values(expense).returning();
    return newExpense;
  }

  async getEventExpenses(eventId: number): Promise<any[]> {
    return await db.query.eventExpenses.findMany({
      where: eq(eventExpenses.eventId, eventId),
      with: {
        payer: true,
      },
    });
  }
}

export const storage = new DatabaseStorage();
