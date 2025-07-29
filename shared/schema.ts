import { pgTable, text, varchar, timestamp, jsonb, index, serial, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  googleId: varchar("google_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  hostId: varchar("host_id").notNull().references(() => users.id),
  eventType: varchar("event_type").notNull(), // 'offline' | 'online'
  location: text("location"),
  datetime: timestamp("datetime").notNull(),
  imageUrl: text("image_url"),
  maxGuests: integer("max_guests"),
  isPublic: boolean("is_public").default(true),
  settings: jsonb("settings"), // For storing various event settings
  posterData: jsonb("poster_data"), // For storing custom poster configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event RSVPs
export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull(), // 'going' | 'maybe' | 'not_going'
  plusOneCount: integer("plus_one_count").default(0),
  dietaryRestrictions: text("dietary_restrictions"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event updates/posts
export const eventPosts = pgTable("event_posts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event polls
export const eventPolls = pgTable("event_polls", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of poll options
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Poll votes
export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => eventPolls.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event expenses
export const eventExpenses = pgTable("event_expenses", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  paidBy: varchar("paid_by").notNull().references(() => users.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  splitAmong: jsonb("split_among").notNull(), // Array of user IDs
  category: varchar("category"),
  receipt: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedEvents: many(events),
  rsvps: many(eventRsvps),
  posts: many(eventPosts),
  polls: many(eventPolls),
  votes: many(pollVotes),
  expenses: many(eventExpenses),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  rsvps: many(eventRsvps),
  posts: many(eventPosts),
  polls: many(eventPolls),
  expenses: many(eventExpenses),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const eventPostsRelations = relations(eventPosts, ({ one }) => ({
  event: one(events, {
    fields: [eventPosts.eventId],
    references: [events.id],
  }),
  author: one(users, {
    fields: [eventPosts.authorId],
    references: [users.id],
  }),
}));

export const eventPollsRelations = relations(eventPolls, ({ one, many }) => ({
  event: one(events, {
    fields: [eventPolls.eventId],
    references: [events.id],
  }),
  creator: one(users, {
    fields: [eventPolls.createdBy],
    references: [users.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(eventPolls, {
    fields: [pollVotes.pollId],
    references: [eventPolls.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

export const eventExpensesRelations = relations(eventExpenses, ({ one }) => ({
  event: one(events, {
    fields: [eventExpenses.eventId],
    references: [events.id],
  }),
  payer: one(users, {
    fields: [eventExpenses.paidBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  datetime: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(eventPosts).omit({
  id: true,
  createdAt: true,
});

export const insertPollSchema = createInsertSchema(eventPolls).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(eventExpenses).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type EventPost = typeof eventPosts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type EventPoll = typeof eventPolls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type EventExpense = typeof eventExpenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
