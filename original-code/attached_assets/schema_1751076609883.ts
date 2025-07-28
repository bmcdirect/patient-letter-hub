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
  numeric,
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

// User storage table (updated for routes.ts compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password_hash: varchar("password_hash").notNull(),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  is_admin: boolean("is_admin").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Practice information (updated for routes.ts compatibility)
export const practices = pgTable("practices", {
  id: serial("id").primaryKey(),
  owner_id: integer("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  main_address: text("main_address"),
  city: varchar("city"),
  state: varchar("state"),
  zip_code: varchar("zip_code"),
  taxonomy_code: varchar("taxonomy_code"),
  npi_number: varchar("npi_number"),
  operating_hours: text("operating_hours"),
  emr_id: varchar("emr_id"),
  created_at: timestamp("created_at").defaultNow(),
});

// Practice locations (for routes.ts compatibility)
export const practice_locations = pgTable("practice_locations", {
  id: serial("id").primaryKey(),
  practice_id: integer("practice_id").notNull().references(() => practices.id),
  label: varchar("label").notNull(),
  contact_name: varchar("contact_name"),
  phone: varchar("phone"),
  email: varchar("email"),
  address_line1: text("address_line1"),
  city: varchar("city"),
  state: varchar("state"),
  zip_code: varchar("zip_code"),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Practice members and roles
export const practiceMembers = pgTable("practice_members", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull().references(() => practices.id),
  userId: integer("user_id").notNull().references(() => users.id),
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
  // File upload paths
  logoPath: varchar("logo_path"),
  signaturePath: varchar("signature_path"),
  extraPagesPath: varchar("extra_pages_path"),
  recipientsPath: varchar("recipients_path"),
  // Additional form fields
  colorMode: varchar("color_mode"),
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
    fields: [practices.owner_id],
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
  id: true,
  created_at: true,
});

export const insertPracticeSchema = createInsertSchema(practices).omit({
  id: true,
  created_at: true,
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

// Modern types
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
// Modern quotes table for persistent storage
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quote_number: varchar("quote_number", { length: 20 }).notNull().unique(),
  user_id: varchar("user_id", { length: 50 }).notNull(),
  practice_id: integer("practice_id"),
  location_id: varchar("location_id", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  template_type: varchar("template_type", { length: 100 }).notNull(),
  color_mode: varchar("color_mode", { length: 20 }).notNull(),
  estimated_recipients: integer("estimated_recipients").notNull(),
  enclosures: integer("enclosures").default(0),
  notes: text("notes"),
  data_cleansing: boolean("data_cleansing").default(false),
  ncoa_update: boolean("ncoa_update").default(false),
  first_class_postage: boolean("first_class_postage").default(false),
  total_cost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("Quote"),
  converted_order_id: integer("converted_order_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Modern orders table for persistent storage
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_number: varchar("order_number", { length: 20 }).notNull().unique(),
  user_id: varchar("user_id", { length: 50 }).notNull(),
  practice_id: integer("practice_id"),
  quote_id: integer("quote_id"),
  quote_number: varchar("quote_number", { length: 20 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  template_type: varchar("template_type", { length: 100 }),
  color_mode: varchar("color_mode", { length: 20 }),
  estimated_recipients: integer("estimated_recipients"),
  recipient_count: integer("recipient_count"),
  enclosures: integer("enclosures").default(0),
  notes: text("notes"),
  data_cleansing: boolean("data_cleansing").default(false),
  ncoa_update: boolean("ncoa_update").default(false),
  first_class_postage: boolean("first_class_postage").default(false),
  total_cost: numeric("total_cost", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("Pending"),
  invoice_number: varchar("invoice_number", { length: 50 }),
  production_start_date: date("production_start_date"),
  production_end_date: date("production_end_date"),
  fulfilled_at: timestamp("fulfilled_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Legacy quotes table (keep for reference)
export const letter_quotes = pgTable("letter_quotes", {
  id: serial("id").primaryKey(),
  practice_name: varchar("practice_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  recipient_count: integer("recipient_count").notNull(),
  enclosure: boolean("enclosure").notNull(),
  letter_color: boolean("letter_color").notNull(),
  envelope_color: boolean("envelope_color").notNull(),
  ncoa: boolean("ncoa").notNull(),
  postage_type: varchar("postage_type", { length: 50 }).notNull(),
  confirmation: boolean("confirmation").notNull(),
  mail_date: date("mail_date"),
  quote_total: numeric("quote_total", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow()
});
