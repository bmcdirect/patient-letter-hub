import {
  tenants,
  practices,
  users,
  quotes,
  orders,
  orderFiles,
  practiceLocations,
  type Tenant,
  type Practice,
  type User,
  type Quote,
  type Order,
  type OrderFile,
  type PracticeLocation,
  type InsertTenant,
  type InsertPractice,
  type InsertUser,
  type InsertQuote,
  type InsertOrder,
  type InsertOrderFile,
  type InsertPracticeLocation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByName(name: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Practice operations
  getPractice(id: number): Promise<Practice | undefined>;
  getPracticesByTenant(tenantId: number): Promise<Practice[]>;
  createPractice(practice: InsertPractice): Promise<Practice>;

  // Quote operations
  getQuote(id: number): Promise<Quote | undefined>;
  getQuotes(userId: string, tenantId: number, offset?: number, limit?: number): Promise<Quote[]>;
  getQuotesByTenant(tenantId: number): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, updates: Partial<InsertQuote>): Promise<Quote>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(userId: string, tenantId: number): Promise<Order[]>;
  getOrdersByTenant(tenantId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order>;

  // Order file operations
  getOrderFiles(orderId: number): Promise<OrderFile[]>;
  createOrderFile(orderFile: InsertOrderFile): Promise<OrderFile>;

  // Practice location operations
  getPracticeLocations(practiceId: number, tenantId: number): Promise<PracticeLocation[]>;
  createPracticeLocation(location: InsertPracticeLocation): Promise<PracticeLocation>;
  updatePracticeLocation(id: number, updates: Partial<InsertPracticeLocation>): Promise<PracticeLocation>;
  deletePracticeLocation(id: number): Promise<void>;
}

// Database implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getTenantByName(name: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.name, name)).limit(1);
    return result[0];
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    return result[0];
  }

  // Practice operations
  async getPractice(id: number): Promise<Practice | undefined> {
    const result = await db.select().from(practices).where(eq(practices.id, id)).limit(1);
    return result[0];
  }

  async getPracticesByTenant(tenantId: number): Promise<Practice[]> {
    return await db.select().from(practices).where(eq(practices.tenantId, tenantId));
  }

  async createPractice(practice: InsertPractice): Promise<Practice> {
    const result = await db.insert(practices).values(practice).returning();
    return result[0];
  }

  // Quote operations
  async getQuote(id: number): Promise<Quote | undefined> {
    const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    return result[0];
  }

  async getQuotes(userId: string, tenantId: number, offset = 0, limit = 25): Promise<Quote[]> {
    return await db.select().from(quotes)
      .where(and(eq(quotes.userId, parseInt(userId)), eq(quotes.tenantId, tenantId)))
      .orderBy(desc(quotes.createdAt))
      .offset(offset)
      .limit(limit);
  }

  async getQuotesByTenant(tenantId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.tenantId, tenantId)).orderBy(desc(quotes.createdAt));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const result = await db.insert(quotes).values(quote).returning();
    return result[0];
  }

  async updateQuote(id: number, updates: Partial<InsertQuote>): Promise<Quote> {
    const result = await db.update(quotes).set(updates).where(eq(quotes.id, id)).returning();
    return result[0];
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrders(userId: string, tenantId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(and(eq(orders.userId, parseInt(userId)), eq(orders.tenantId, tenantId)))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByTenant(tenantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.tenantId, tenantId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order> {
    const result = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return result[0];
  }

  // Order file operations
  async getOrderFiles(orderId: number): Promise<OrderFile[]> {
    return await db.select().from(orderFiles).where(eq(orderFiles.orderId, orderId));
  }

  async createOrderFile(orderFile: InsertOrderFile): Promise<OrderFile> {
    const result = await db.insert(orderFiles).values(orderFile).returning();
    return result[0];
  }

  // Practice location operations
  async getPracticeLocations(practiceId: number, tenantId: number): Promise<PracticeLocation[]> {
    return await db.select().from(practiceLocations)
      .where(and(eq(practiceLocations.practiceId, practiceId), eq(practiceLocations.tenantId, tenantId)))
      .orderBy(desc(practiceLocations.isDefault), practiceLocations.label);
  }

  async createPracticeLocation(location: InsertPracticeLocation): Promise<PracticeLocation> {
    const result = await db.insert(practiceLocations).values(location).returning();
    return result[0];
  }

  async updatePracticeLocation(id: number, updates: Partial<InsertPracticeLocation>): Promise<PracticeLocation> {
    const result = await db.update(practiceLocations).set(updates).where(eq(practiceLocations.id, id)).returning();
    return result[0];
  }

  async deletePracticeLocation(id: number): Promise<void> {
    await db.delete(practiceLocations).where(eq(practiceLocations.id, id));
  }
}

// Export storage instance
export const storage = new DatabaseStorage();
export { db };