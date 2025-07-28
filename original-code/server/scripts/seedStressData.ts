import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { quotes, orders, orderFiles } from '../../shared/schema';
import { logger } from '../../logger';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Simple faker-like functions
const subjects = [
  'Annual Health Screening Reminder',
  'Vaccination Schedule Update',
  'Appointment Confirmation',
  'Insurance Information Update',
  'Prescription Refill Notice',
  'Lab Results Available',
  'Wellness Program Information',
  'Flu Shot Availability',
  'New Patient Welcome',
  'Billing Statement Notice',
  'Telehealth Appointment Instructions',
  'Preventive Care Reminder',
  'Specialist Referral Information',
  'Medical Records Request',
  'Treatment Plan Update',
  'Follow-up Appointment Reminder',
  'Test Results Review',
  'Medication Compliance Notice',
  'Health Education Materials',
  'Emergency Contact Update'
];

const statuses = ['pending', 'approved', 'converted', 'draft'];
const orderStatuses = ['draft', 'pending', 'in-progress', 'completed', 'delivered'];

const fileTypes = [
  { field: 'dataFile', filename: 'recipients.csv', mimetype: 'text/csv', size: 15000 },
  { field: 'letterFile', filename: 'letter.pdf', mimetype: 'application/pdf', size: 45000 },
  { field: 'letterheadFile', filename: 'letterhead.pdf', mimetype: 'application/pdf', size: 25000 },
  { field: 'logoFile', filename: 'logo.png', mimetype: 'image/png', size: 8000 },
  { field: 'envelopeFile', filename: 'envelope.pdf', mimetype: 'application/pdf', size: 12000 },
  { field: 'signatureFile', filename: 'signature.png', mimetype: 'image/png', size: 5000 }
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTotal(): string {
  const amount = (Math.random() * 2000 + 100).toFixed(2);
  return amount;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedStressData() {
  logger.info('Starting stress data seeding...');
  
  try {
    // Get existing tenants
    const tenants = [
      { id: 1, name: 'Riverside Family Medicine' },
      { id: 2, name: 'Bright Smiles Dental' }
    ];
    
    for (const tenant of tenants) {
      logger.info({ tenantName: tenant.name, tenantId: tenant.id }, 'Seeding data for tenant');
      
      // Seed 50 quotes per tenant
      logger.info('Creating 50 quotes...');
      const quoteData = [];
      for (let i = 0; i < 50; i++) {
        const now = new Date();
        const createdAt = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
        
        quoteData.push({
          tenantId: tenant.id,
          practiceId: tenant.id, // Using tenant ID as practice ID
          userId: tenant.id, // Using tenant ID as user ID
          quoteNumber: `Q-${Date.now()}-${i.toString().padStart(3, '0')}`,
          subject: randomChoice(subjects),
          total: randomTotal(),
          status: randomChoice(statuses),
          createdAt: createdAt,
          updatedAt: createdAt,
        });
      }
      
      await db.insert(quotes).values(quoteData);
      
      // Seed 50 orders per tenant
      logger.info('Creating 50 orders...');
      const orderData = [];
      for (let i = 0; i < 50; i++) {
        const now = new Date();
        const createdAt = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
        
        orderData.push({
          tenantId: tenant.id,
          practiceId: tenant.id,
          userId: tenant.id,
          orderNumber: `O-${Date.now()}-${i.toString().padStart(3, '0')}`,
          subject: randomChoice(subjects),
          total: randomTotal(),
          status: randomChoice(orderStatuses),
          createdAt: createdAt,
          updatedAt: createdAt,
        });
      }
      
      const insertedOrders = await db.insert(orders).values(orderData).returning();
      
      // Seed 1-3 mock files per order
      logger.info('Creating order files...');
      const fileData = [];
      for (const order of insertedOrders) {
        const numFiles = randomInt(1, 3);
        for (let i = 0; i < numFiles; i++) {
          const fileType = randomChoice(fileTypes);
          fileData.push({
            orderId: order.id,
            filename: `${order.orderNumber}_${fileType.filename}`,
            mimetype: fileType.mimetype,
            size: fileType.size,
            createdAt: new Date(),
          });
        }
      }
      
      if (fileData.length > 0) {
        await db.insert(orderFiles).values(fileData);
      }
      
      logger.info({ quotes: quoteData.length, orders: orderData.length, files: fileData.length }, 'Created data for tenant');
    }
    
    logger.info('Stress data seeding completed successfully!');
    
  } catch (error) {
    logger.error({ error }, 'Error seeding stress data');
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedStressData()
    .then(() => {
      logger.info('Seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Seeding failed');
      process.exit(1);
    });
}

export { seedStressData };