import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('📝 Creating sample quotes and orders...');
    
    // Get the existing practices and users
    const brightSmilesPractice = await prisma.practice.findFirst({
      where: { name: 'Bright Smiles Dental' }
    });
    
    const bmcUser = await prisma.user.findFirst({
      where: { email: 'bmcdirect1@gmail.com' }
    });
    
    if (!brightSmilesPractice || !bmcUser) {
      console.log('❌ Required practice or user not found. Run clean-slate-setup.ts first.');
      return;
    }
    
    // Create sample quotes
    const sampleQuotes = [
      {
        quoteNumber: `Q-${Date.now()}-001`,
        subject: 'Patient Newsletter - Q4 2024',
        totalCost: 1250.00,
        estimatedRecipients: 500,
        colorMode: 'Color',
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: true,
        notes: 'Quarterly patient newsletter with dental health tips'
      },
      {
        quoteNumber: `Q-${Date.now()}-002`,
        subject: 'Appointment Reminders - January 2025',
        totalCost: 850.00,
        estimatedRecipients: 300,
        colorMode: 'Black & White',
        dataCleansing: false,
        ncoaUpdate: true,
        firstClassPostage: true,
        notes: 'Monthly appointment reminder postcards'
      }
    ];
    
    for (const quoteData of sampleQuotes) {
      await prisma.quotes.create({
        data: {
          ...quoteData,
          practiceId: brightSmilesPractice.id,
          userId: bmcUser.id,
          status: 'pending'
        }
      });
    }
    
    console.log('✅ Created sample quotes');
    
    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: `O-${Date.now()}-001`,
        subject: 'Patient Newsletter - Q4 2024',
        status: 'pending',
        cost: 1250.00,
        colorMode: 'Color'
      },
      {
        orderNumber: `O-${Date.now()}-002`,
        subject: 'Appointment Reminders - January 2025',
        status: 'pending',
        cost: 850.00,
        colorMode: 'Black & White'
      }
    ];
    
    for (const orderData of sampleOrders) {
      await prisma.orders.create({
        data: {
          ...orderData,
          practiceId: brightSmilesPractice.id,
          userId: bmcUser.id
        }
      });
    }
    
    console.log('✅ Created sample orders');
    
    // Verify the data
    const quotes = await prisma.quotes.findMany({
      where: { practiceId: brightSmilesPractice.id }
    });
    
    const orders = await prisma.orders.findMany({
      where: { practiceId: brightSmilesPractice.id }
    });
    
    console.log('\n📊 Sample Data Created:');
    console.log(`   Quotes: ${quotes.length}`);
    console.log(`   Orders: ${orders.length}`);
    
    console.log('\n🎉 Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
