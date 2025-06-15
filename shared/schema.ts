import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice information
export const practices = pgTable("practices", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  taxonomy: varchar("taxonomy").notNull(), // Medical, Dental, etc.
  npi: varchar("npi"),
  address: text("address").notNull(),
  phone: varchar("phone"),
  logoUrl: varchar("logo_url"),
  defaultSenderName: varchar("default_sender_name"),
  signatureImageUrl: varchar("signature_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice members and roles
export const practiceMembers = pgTable("practice_members", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull().references(() => practices.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull(), // Owner, Manager, Billing
  createdAt: timestamp("created_at").defaultNow(),
});

// Letter templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  disciplineList: jsonb("discipline_list"), // Array of disciplines
  eventType: varchar("event_type").notNull(),
  bodyHtml: text("body_html").notNull(),
  language: varchar("language").default("en"),
  requiredFields: jsonb("required_fields"), // JSON schema for form fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Letter jobs/mailings
export const letterJobs = pgTable("letter_jobs", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull().references(() => practices.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  templateId: integer("template_id").references(() => templates.id),
  templateType: varchar("template_type").notNull(), // 'template' or 'custom'
  status: varchar("status").notNull().default("draft"), // draft, pending, printing, mailed, complete
  eventType: varchar("event_type"),
  subject: varchar("subject"),
  bodyHtml: text("body_html"),
  eventData: jsonb("event_data"), // Form data specific to event type
  totalRecipients: integer("total_recipients").default(0),
  validRecipients: integer("valid_recipients").default(0),
  scheduledDatetime: timestamp("scheduled_datetime"),
  mailedAt: timestamp("mailed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual letters within a job
export const letters = pgTable("letters", {
  id: serial("id").primaryKey(),
  letterJobId: integer("letter_job_id").notNull().references(() => letterJobs.id),
  addressId: integer("address_id").notNull().references(() => addresses.id),
  pageCount: integer("page_count").default(1),
  imbCode: varchar("imb_code"),
  certifiedTracking: varchar("certified_tracking"),
  status: varchar("status").default("pending"), // pending, printed, mailed, delivered, returned
  createdAt: timestamp("created_at").defaultNow(),
});

// Address book for recipients
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  letterJobId: integer("letter_job_id").notNull().references(() => letterJobs.id),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  line1: varchar("line1").notNull(),
  line2: varchar("line2"),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zip5: varchar("zip5").notNull(),
  zip4: varchar("zip4"),
  ncoaMoveCode: varchar("ncoa_move_code"),
  isValid: boolean("is_valid").default(false),
  dpvCode: varchar("dpv_code"),
  mergeData: jsonb("merge_data"), // Additional merge fields from CSV
  createdAt: timestamp("created_at").defaultNow(),
});

// Tracking events for letters
export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  letterId: integer("letter_id").notNull().references(() => letters.id),
  eventCode: varchar("event_code").notNull(),
  eventDate: timestamp("event_date").notNull(),
  description: text("description"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Regulatory alerts
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  taxonomyList: jsonb("taxonomy_list"), // Array of applicable taxonomies
  title: varchar("title").notNull(),
  bodyHtml: text("body_html").notNull(),
  sourceUrl: varchar("source_url"),
  publishedDate: timestamp("published_date").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedPractices: many(practices),
  practiceMembers: many(practiceMembers),
  letterJobs: many(letterJobs),
}));

export const practicesRelations = relations(practices, ({ one, many }) => ({
  owner: one(users, {
    fields: [practices.ownerId],
    references: [users.id],
  }),
  members: many(practiceMembers),
  letterJobs: many(letterJobs),
}));

export const letterJobsRelations = relations(letterJobs, ({ one, many }) => ({
  practice: one(practices, {
    fields: [letterJobs.practiceId],
    references: [practices.id],
  }),
  creator: one(users, {
    fields: [letterJobs.createdBy],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [letterJobs.templateId],
    references: [templates.id],
  }),
  letters: many(letters),
  addresses: many(addresses),
}));

export const lettersRelations = relations(letters, ({ one, many }) => ({
  letterJob: one(letterJobs, {
    fields: [letters.letterJobId],
    references: [letterJobs.id],
  }),
  address: one(addresses, {
    fields: [letters.addressId],
    references: [addresses.id],
  }),
  trackingEvents: many(trackingEvents),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPracticeSchema = createInsertSchema(practices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLetterJobSchema = createInsertSchema(letterJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertPractice = z.infer<typeof insertPracticeSchema>;
export type Practice = typeof practices.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertLetterJob = z.infer<typeof insertLetterJobSchema>;
export type LetterJob = typeof letterJobs.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;
export type Letter = typeof letters.$inferSelect;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
