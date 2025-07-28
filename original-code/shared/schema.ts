import { pgTable, text, integer, serial, timestamp, numeric, index, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Tenants table
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull()
});

// Practices table
export const practices = pgTable('practices', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull()
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull()
});

// Quotes table
export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  practiceId: integer('practice_id').notNull().references(() => practices.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quoteNumber: text('quote_number').unique().notNull(),
  subject: text('subject').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
}, (table) => ({
  tenantCreatedAtIdx: index('quotes_tenant_created_at_idx').on(table.tenantId, table.createdAt)
}));

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  practiceId: integer('practice_id').notNull().references(() => practices.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').unique().notNull(),
  subject: text('subject').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('draft').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
}, (table) => ({
  tenantCreatedAtIdx: index('orders_tenant_created_at_idx').on(table.tenantId, table.createdAt)
}));

// Order files table
export const orderFiles = pgTable('order_files', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull()
});

// Practice locations table
export const practiceLocations = pgTable('practice_locations', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  practiceId: integer('practice_id').notNull().references(() => practices.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  addressLine1: text('address_line1').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  isDefault: integer('is_default').default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
}, (table) => ({
  tenantPracticeIdx: index('practice_locations_tenant_practice_idx').on(table.tenantId, table.practiceId)
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true });
export const insertPracticeSchema = createInsertSchema(practices).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderFileSchema = createInsertSchema(orderFiles).omit({ id: true });
export const insertPracticeLocationSchema = createInsertSchema(practiceLocations).omit({ id: true, createdAt: true, updatedAt: true });

// Insert types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertPractice = z.infer<typeof insertPracticeSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderFile = z.infer<typeof insertOrderFileSchema>;
export type InsertPracticeLocation = z.infer<typeof insertPracticeLocationSchema>;

// Select types
export type Tenant = typeof tenants.$inferSelect;
export type Practice = typeof practices.$inferSelect;
export type User = typeof users.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderFile = typeof orderFiles.$inferSelect;
export type PracticeLocation = typeof practiceLocations.$inferSelect;