import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  json,
  date,
  time,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============ ENUMS ============

export const userRoleEnum = pgEnum("user_role", [
  "member",
  "mentor",
  "admin",
  "moderator",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "upcoming",
  "completed",
  "cancelled",
]);

export const expertiseCategoryEnum = pgEnum("expertise_category", [
  "technical",
  "product",
  "business",
  "growth",
  "design",
  "fundraising",
]);

// ============ USERS ============

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  avatar: text("avatar"),
  bio: text("bio"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ MENTOR PROFILES ============

export const mentorProfiles = pgTable("mentor_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  bio: text("bio").notNull(),
  expertise: json("expertise").$type<string[]>().notNull().default([]),
  skills: json("skills").$type<string[]>().notNull().default([]),
  rating: real("rating").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  socialLinks: json("social_links")
    .$type<{
      linkedin?: string;
      twitter?: string;
      website?: string;
    }>()
    .notNull()
    .default({}),
  location: text("location"),
  languages: json("languages").$type<string[]>().default([]),
  sessionFormat: text("session_format").default("30-min Video Call"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ AVAILABILITY SLOTS ============

export const availabilitySlots = pgTable("availability_slots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  mentorProfileId: text("mentor_profile_id")
    .notNull()
    .references(() => mentorProfiles.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  booked: boolean("booked").notNull().default(false),
  bookedByUserId: text("booked_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
}, (table) => [
  index("idx_slots_mentor_date").on(table.mentorProfileId, table.date),
  index("idx_slots_booked").on(table.mentorProfileId, table.booked),
]);

// ============ BOOKINGS ============

export const bookings = pgTable("bookings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  mentorProfileId: text("mentor_profile_id")
    .notNull()
    .references(() => mentorProfiles.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  availabilitySlotId: text("availability_slot_id").references(
    () => availabilitySlots.id
  ),
  date: date("date", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  topic: text("topic").notNull(),
  description: text("description"),
  status: bookingStatusEnum("status").notNull().default("upcoming"),
  notes: text("notes"),
  rating: integer("rating"),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("idx_bookings_user_status").on(table.userId, table.status),
  index("idx_bookings_mentor").on(table.mentorProfileId),
  index("idx_bookings_date").on(table.date),
]);

// ============ SESSION NOTES ============

export const sessionNotes = pgTable("session_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  actionItems: json("action_items")
    .$type<Array<{ text: string; completed: boolean }>>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ one, many }) => ({
  mentorProfile: one(mentorProfiles, {
    fields: [users.id],
    references: [mentorProfiles.userId],
  }),
  bookings: many(bookings),
}));

export const mentorProfilesRelations = relations(
  mentorProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [mentorProfiles.userId],
      references: [users.id],
    }),
    availabilitySlots: many(availabilitySlots),
    bookings: many(bookings),
  })
);

export const availabilitySlotsRelations = relations(
  availabilitySlots,
  ({ one }) => ({
    mentorProfile: one(mentorProfiles, {
      fields: [availabilitySlots.mentorProfileId],
      references: [mentorProfiles.id],
    }),
    bookedByUser: one(users, {
      fields: [availabilitySlots.bookedByUserId],
      references: [users.id],
    }),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  mentorProfile: one(mentorProfiles, {
    fields: [bookings.mentorProfileId],
    references: [mentorProfiles.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  availabilitySlot: one(availabilitySlots, {
    fields: [bookings.availabilitySlotId],
    references: [availabilitySlots.id],
  }),
  sessionNotes: many(sessionNotes),
}));

export const sessionNotesRelations = relations(sessionNotes, ({ one }) => ({
  booking: one(bookings, {
    fields: [sessionNotes.bookingId],
    references: [bookings.id],
  }),
}));
