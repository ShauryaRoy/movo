import { relations } from "drizzle-orm/relations";
import { events, eventPosts, users, eventRsvps, eventPolls, pollVotes, eventExpenses, expenseSettlements } from "./schema";

export const eventPostsRelations = relations(eventPosts, ({one}) => ({
	event: one(events, {
		fields: [eventPosts.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventPosts.authorId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventPosts: many(eventPosts),
	eventRsvps: many(eventRsvps),
	eventPolls: many(eventPolls),
	eventExpenses: many(eventExpenses),
	user: one(users, {
		fields: [events.hostId],
		references: [users.id]
	}),
	expenseSettlements: many(expenseSettlements),
}));

export const usersRelations = relations(users, ({many}) => ({
	eventPosts: many(eventPosts),
	eventRsvps: many(eventRsvps),
	pollVotes: many(pollVotes),
	eventPolls: many(eventPolls),
	eventExpenses: many(eventExpenses),
	events: many(events),
	expenseSettlements_fromUserId: many(expenseSettlements, {
		relationName: "expenseSettlements_fromUserId_users_id"
	}),
	expenseSettlements_toUserId: many(expenseSettlements, {
		relationName: "expenseSettlements_toUserId_users_id"
	}),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({one}) => ({
	event: one(events, {
		fields: [eventRsvps.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventRsvps.userId],
		references: [users.id]
	}),
}));

export const pollVotesRelations = relations(pollVotes, ({one}) => ({
	eventPoll: one(eventPolls, {
		fields: [pollVotes.pollId],
		references: [eventPolls.id]
	}),
	user: one(users, {
		fields: [pollVotes.userId],
		references: [users.id]
	}),
}));

export const eventPollsRelations = relations(eventPolls, ({one, many}) => ({
	pollVotes: many(pollVotes),
	event: one(events, {
		fields: [eventPolls.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventPolls.createdBy],
		references: [users.id]
	}),
}));

export const eventExpensesRelations = relations(eventExpenses, ({one}) => ({
	event: one(events, {
		fields: [eventExpenses.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventExpenses.paidBy],
		references: [users.id]
	}),
}));

export const expenseSettlementsRelations = relations(expenseSettlements, ({one}) => ({
	event: one(events, {
		fields: [expenseSettlements.eventId],
		references: [events.id]
	}),
	user_fromUserId: one(users, {
		fields: [expenseSettlements.fromUserId],
		references: [users.id],
		relationName: "expenseSettlements_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [expenseSettlements.toUserId],
		references: [users.id],
		relationName: "expenseSettlements_toUserId_users_id"
	}),
}));