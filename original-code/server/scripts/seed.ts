import { db } from '../storage';
import { tenants, practices, users, quotes, orders, orderFiles } from '../../shared/schema';
import bcrypt from 'bcryptjs';
import { logger } from '../../logger';

async function seed() {
  logger.info('Starting database seed...');

  // Clear existing data
  await db.delete(orderFiles);
  await db.delete(orders);
  await db.delete(quotes);
  await db.delete(users);
  await db.delete(practices);
  await db.delete(tenants);

  // Insert tenants
  const [tenant1, tenant2] = await db.insert(tenants).values([
    { name: 'Riverside Family Medicine' },
    { name: 'Bright Smiles Dental' }
  ]).returning();

  logger.info({ tenant1: tenant1.name, tenant2: tenant2.name }, 'Created tenants');

  // Insert practices
  const [practice1, practice2] = await db.insert(practices).values([
    { tenantId: tenant1.id, name: 'Riverside Family Medicine' },
    { tenantId: tenant2.id, name: 'Bright Smiles Dental' }
  ]).returning();

  logger.info({ practice1: practice1.name, practice2: practice2.name }, 'Created practices');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert users
  const [user1Admin, user1Staff, user2Admin, user2Staff] = await db.insert(users).values([
    { tenantId: tenant1.id, email: 'admin@riversidefamilymed.com', passwordHash: hashedPassword, role: 'admin' },
    { tenantId: tenant1.id, email: 'staff1@riversidefamilymed.com', passwordHash: hashedPassword, role: 'staff' },
    { tenantId: tenant2.id, email: 'admin@brightsmilesdental.com', passwordHash: hashedPassword, role: 'admin' },
    { tenantId: tenant2.id, email: 'staff1@brightsmilesdental.com', passwordHash: hashedPassword, role: 'staff' }
  ]).returning();

  logger.info({ 
    users: [user1Admin.email, user1Staff.email, user2Admin.email, user2Staff.email] 
  }, 'Created users');

  // Insert quotes
  const [quote1, quote2, quote3, quote4] = await db.insert(quotes).values([
    {
      tenantId: tenant1.id,
      practiceId: practice1.id,
      userId: user1Admin.id,
      quoteNumber: 'Q-2001',
      subject: 'Patient Appointment Reminders',
      total: '150.00'
    },
    {
      tenantId: tenant1.id,
      practiceId: practice1.id,
      userId: user1Staff.id,
      quoteNumber: 'Q-2002',
      subject: 'Annual Physical Exam Notifications',
      total: '225.00'
    },
    {
      tenantId: tenant2.id,
      practiceId: practice2.id,
      userId: user2Admin.id,
      quoteNumber: 'Q-2003',
      subject: 'Dental Cleaning Reminders',
      total: '180.00'
    },
    {
      tenantId: tenant2.id,
      practiceId: practice2.id,
      userId: user2Staff.id,
      quoteNumber: 'Q-2004',
      subject: 'Orthodontic Follow-up Letters',
      total: '300.00'
    }
  ]).returning();

  logger.info({ 
    quotes: [quote1.quoteNumber, quote2.quoteNumber, quote3.quoteNumber, quote4.quoteNumber] 
  }, 'Created quotes');

  // Insert orders
  const [order1, order2, order3, order4] = await db.insert(orders).values([
    {
      tenantId: tenant1.id,
      practiceId: practice1.id,
      userId: user1Admin.id,
      orderNumber: 'O-2001',
      subject: 'Flu Shot Reminder Campaign',
      total: '275.00',
      status: 'draft'
    },
    {
      tenantId: tenant1.id,
      practiceId: practice1.id,
      userId: user1Staff.id,
      orderNumber: 'O-2002',
      subject: 'Wellness Check Notifications',
      total: '195.00',
      status: 'in-progress'
    },
    {
      tenantId: tenant2.id,
      practiceId: practice2.id,
      userId: user2Admin.id,
      orderNumber: 'O-2003',
      subject: 'Cavity Prevention Mailers',
      total: '220.00',
      status: 'draft'
    },
    {
      tenantId: tenant2.id,
      practiceId: practice2.id,
      userId: user2Staff.id,
      orderNumber: 'O-2004',
      subject: 'Teeth Whitening Promotions',
      total: '350.00',
      status: 'completed'
    }
  ]).returning();

  logger.info({ 
    orders: [order1.orderNumber, order2.orderNumber, order3.orderNumber, order4.orderNumber] 
  }, 'Created orders');

  // Insert order files (dummy CSV files for each order)
  await db.insert(orderFiles).values([
    { orderId: order1.id, filename: 'flu_shot_recipients.csv', mimetype: 'text/csv', size: 1024 },
    { orderId: order2.id, filename: 'wellness_check_patients.csv', mimetype: 'text/csv', size: 2048 },
    { orderId: order3.id, filename: 'cavity_prevention_list.csv', mimetype: 'text/csv', size: 1536 },
    { orderId: order4.id, filename: 'whitening_prospects.csv', mimetype: 'text/csv', size: 3072 }
  ]);

  logger.info('Created order files for all orders');

  logger.info('Database seed completed successfully!');
}

// Run the seed function
seed().catch(logger.error);