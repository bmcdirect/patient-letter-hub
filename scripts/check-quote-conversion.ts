import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkQuoteConversion() {
  try {
    console.log('🔍 Checking quote conversion status...')
    
    // 1. Check the converted quote
    const convertedQuote = await prisma.quotes.findFirst({
      where: { quoteNumber: 'Q-1755286449176' }
    })
    
    if (convertedQuote) {
      console.log('✅ Found converted quote:', {
        id: convertedQuote.id,
        quoteNumber: convertedQuote.quoteNumber,
        status: convertedQuote.status,
        practiceId: convertedQuote.practiceId,
        userId: convertedQuote.userId
      })
    } else {
      console.log('❌ Quote Q-1755286449176 not found')
      return
    }
    
    // 2. Check if any orders were created
    const orders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true
      }
    })
    
    console.log(`\n📋 Found ${orders.length} orders in database:`)
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber} - Status: ${order.status}`)
      console.log(`   Practice: ${order.practice?.name || 'Unknown'}`)
      console.log(`   User: ${order.user?.email || 'Unknown'}`)
      console.log(`   Created: ${order.createdAt}`)
    })
    
    // 3. Check if there are any orders linked to the converted quote's practice
    const practiceOrders = await prisma.orders.findMany({
      where: { practiceId: convertedQuote.practiceId },
      include: { practice: true, user: true }
    })
    
    console.log(`\n🏥 Orders for practice ${convertedQuote.practiceId}:`)
    if (practiceOrders.length > 0) {
      practiceOrders.forEach(order => {
        console.log(`   ${order.orderNumber} - ${order.status} - ${order.user?.email}`)
      })
    } else {
      console.log('   No orders found for this practice')
    }
    
    // 4. Check the orders API endpoint data
    console.log('\n🔌 Checking orders API data...')
    const apiOrders = await prisma.orders.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`API endpoint would return ${apiOrders.length} orders`)
    
  } catch (error) {
    console.error('❌ Error checking quote conversion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkQuoteConversion()
