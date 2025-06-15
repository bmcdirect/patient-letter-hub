import {
  users,
  practices,
  templates,
  letterJobs,
  addresses,
  letters,
  trackingEvents,
  alerts,
  type User,
  type UpsertUser,
  type Practice,
  type InsertPractice,
  type Template,
  type InsertTemplate,
  type LetterJob,
  type InsertLetterJob,
  type Address,
  type InsertAddress,
  type Letter,
  type TrackingEvent,
  type Alert,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  
  // Practice operations
  createPractice(practice: InsertPractice): Promise<Practice>;
  getUserPractices(userId: string): Promise<Practice[]>;
  getPractice(id: number): Promise<Practice | undefined>;
  
  // Template operations
  getTemplates(filters?: { eventType?: string; discipline?: string }): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Letter job operations
  createLetterJob(job: InsertLetterJob): Promise<LetterJob>;
  getLetterJob(id: number): Promise<LetterJob | undefined>;
  updateLetterJobStatus(id: number, status: string): Promise<void>;
  getPracticeLetterJobs(practiceId: number): Promise<LetterJob[]>;
  
  // Address operations
  createAddresses(addresses: InsertAddress[]): Promise<Address[]>;
  getJobAddresses(jobId: number): Promise<Address[]>;
  updateAddressValidation(id: number, isValid: boolean, dpvCode?: string): Promise<void>;
  
  // Letter operations
  createLetters(letters: { letterJobId: number; addressId: number; pageCount?: number }[]): Promise<Letter[]>;
  getJobLetters(jobId: number): Promise<Letter[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: string): Promise<Payment[]>;
  
  // Credit bundle operations
  createCreditBundle(bundle: { userId: string; credits: number; paymentId?: number }): Promise<CreditBundle>;
  getUserCreditBundles(userId: string): Promise<CreditBundle[]>;
  
  // Alert operations
  getActiveAlerts(taxonomy?: string): Promise<Alert[]>;
  
  // Dashboard statistics
  getDashboardStats(practiceId: number): Promise<{
    pendingApproval: number;
    inPrint: number;
    delivered: number;
    creditsBalance: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ creditBalance: credits, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createPractice(practice: InsertPractice): Promise<Practice> {
    const [newPractice] = await db.insert(practices).values(practice).returning();
    return newPractice;
  }

  async getUserPractices(userId: string): Promise<Practice[]> {
    return await db.select().from(practices).where(eq(practices.ownerId, userId));
  }

  async getPractice(id: number): Promise<Practice | undefined> {
    const [practice] = await db.select().from(practices).where(eq(practices.id, id));
    return practice;
  }

  async getTemplates(filters?: { eventType?: string; discipline?: string }): Promise<Template[]> {
    let query = db.select().from(templates).where(eq(templates.isActive, true));
    
    if (filters?.eventType) {
      query = query.where(eq(templates.eventType, filters.eventType));
    }
    
    return await query.orderBy(templates.name);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async createLetterJob(job: InsertLetterJob): Promise<LetterJob> {
    const [newJob] = await db.insert(letterJobs).values(job).returning();
    return newJob;
  }

  async getLetterJob(id: number): Promise<LetterJob | undefined> {
    const [job] = await db.select().from(letterJobs).where(eq(letterJobs.id, id));
    return job;
  }

  async updateLetterJobStatus(id: number, status: string): Promise<void> {
    await db
      .update(letterJobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(letterJobs.id, id));
  }

  async getPracticeLetterJobs(practiceId: number): Promise<LetterJob[]> {
    return await db
      .select()
      .from(letterJobs)
      .where(eq(letterJobs.practiceId, practiceId))
      .orderBy(desc(letterJobs.createdAt))
      .limit(10);
  }

  async createAddresses(addressList: InsertAddress[]): Promise<Address[]> {
    return await db.insert(addresses).values(addressList).returning();
  }

  async getJobAddresses(jobId: number): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.letterJobId, jobId));
  }

  async updateAddressValidation(id: number, isValid: boolean, dpvCode?: string): Promise<void> {
    await db
      .update(addresses)
      .set({ isValid, dpvCode })
      .where(eq(addresses.id, id));
  }

  async createLetters(letterList: { letterJobId: number; addressId: number; pageCount?: number }[]): Promise<Letter[]> {
    return await db.insert(letters).values(letterList).returning();
  }

  async getJobLetters(jobId: number): Promise<Letter[]> {
    return await db.select().from(letters).where(eq(letters.letterJobId, jobId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createCreditBundle(bundle: { userId: string; credits: number; paymentId?: number }): Promise<CreditBundle> {
    const [newBundle] = await db
      .insert(creditBundles)
      .values({
        ...bundle,
        remaining: bundle.credits,
      })
      .returning();
    return newBundle;
  }

  async getUserCreditBundles(userId: string): Promise<CreditBundle[]> {
    return await db
      .select()
      .from(creditBundles)
      .where(eq(creditBundles.userId, userId))
      .orderBy(desc(creditBundles.purchaseDate));
  }

  async getActiveAlerts(taxonomy?: string): Promise<Alert[]> {
    let query = db.select().from(alerts).where(eq(alerts.isActive, true));
    
    if (taxonomy) {
      query = query.where(sql`${alerts.taxonomyList} @> ${JSON.stringify([taxonomy])}`);
    }
    
    return await query.orderBy(desc(alerts.publishedDate)).limit(5);
  }

  async getDashboardStats(practiceId: number): Promise<{
    pendingApproval: number;
    inPrint: number;
    delivered: number;
    creditsBalance: number;
  }> {
    const [pendingApproval] = await db
      .select({ count: sql<number>`count(*)` })
      .from(letterJobs)
      .where(and(eq(letterJobs.practiceId, practiceId), eq(letterJobs.status, 'pending')));

    const [inPrint] = await db
      .select({ count: sql<number>`count(*)` })
      .from(letterJobs)
      .where(and(eq(letterJobs.practiceId, practiceId), eq(letterJobs.status, 'printing')));

    const [delivered] = await db
      .select({ count: sql<number>`count(*)` })
      .from(letters)
      .innerJoin(letterJobs, eq(letters.letterJobId, letterJobs.id))
      .where(and(eq(letterJobs.practiceId, practiceId), eq(letters.status, 'delivered')));

    // Get practice owner's credit balance
    const [practice] = await db.select().from(practices).where(eq(practices.id, practiceId));
    const [owner] = await db.select().from(users).where(eq(users.id, practice?.ownerId || ''));

    return {
      pendingApproval: pendingApproval?.count || 0,
      inPrint: inPrint?.count || 0,
      delivered: delivered?.count || 0,
      creditsBalance: owner?.creditBalance || 0,
    };
  }
}

export const storage = new DatabaseStorage();
