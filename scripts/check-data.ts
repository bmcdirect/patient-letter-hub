import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const quotes = await prisma.quotes.findMany();
    const orders = await prisma.orders.findMany();
    const practices = await prisma.practice.findMany();
    const users = await prisma.user.findMany();
    
    console.log('📊 Database Contents:');
    console.log('====================');
    console.log(`Practices: ${practices.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Quotes: ${quotes.length}`);
    console.log(`Orders: ${orders.length}`);
    
    console.log('\n📝 Quotes:');
    quotes.forEach(q => console.log(`  - ${q.quoteNumber}: ${q.subject}`));
    
    console.log('\n📦 Orders:');
    orders.forEach(o => console.log(`  - ${o.orderNumber}: ${o.subject}`));
    
    console.log('\n🏥 Practices:');
    practices.forEach(p => console.log(`  - ${p.name}`));
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
