import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanSlateSetup() {
  try {
    console.log('🧹 Starting clean slate setup...')
    
    // 1. CLEAR ALL EXISTING DATA
    console.log('🗑️  Clearing all existing data...')
    
    // Clear in correct order to avoid foreign key constraints
    await prisma.orderStatusHistory.deleteMany()
    await prisma.orderApprovals.deleteMany()
    await prisma.orderFiles.deleteMany()
    await prisma.invoices.deleteMany()
    await prisma.quotes.deleteMany()
    await prisma.orders.deleteMany()
    await prisma.emailNotifications.deleteMany()
    await prisma.user.deleteMany()
    await prisma.practice.deleteMany()
    
    console.log('✅ All existing data cleared')
    
    // 2. CREATE FRESH PRACTICES
    console.log('🏥 Creating fresh practices...')
    
        const brightSmilesPractice = await prisma.practice.create({
      data: {
        name: 'Bright Smiles Dental',
        organizationId: 'org_30ut9E4OtIT3bh0D1FVyDwlZ2tj',
        address: '789 Dental Plaza, Suite 100, Riverside, CA 92501',
        phone: '(555) 234-5678',
        email: 'admin@brightsmilesdental.com'
      }
    })
    
    const riversidePractice = await prisma.practice.create({
      data: {
        name: 'Riverside Family Medicine',
        organizationId: 'org_30ut6cLeepKYTXumxP21jmz6ree',
        address: '1245 Riverside Drive, Riverside, CA 92501',
        phone: '(555) 123-4567',
        email: 'admin@riversidefamilymed.com'
      }
    })
    
    const massCommPractice = await prisma.practice.create({
      data: {
        name: 'Mass Communications Inc',
        organizationId: 'mass-communications-inc',
        address: '100 Business Center Dr, Suite 200, Boston, MA 02110',
        phone: '(555) 987-6543',
        email: 'info@masscomminc.com'
      }
    })
    
    console.log('✅ Created practices:', {
      brightSmiles: brightSmilesPractice.id,
      riverside: riversidePractice.id,
      massComm: massCommPractice.id
    })
    
    // 3. CREATE FRESH USERS WITH PROPER ROLES
    console.log('👥 Creating fresh users...')
    
    const bmcUser = await prisma.user.create({
      data: {
        clerkId: 'user_30utcXXAFEen5gc7nT3e3lAqMTV',
        name: 'Bmc Direct',
        email: 'bmcdirect1@gmail.com',
        role: UserRole.USER,
        practiceId: brightSmilesPractice.id  // Bright Smiles Dental
      }
    })
    
    const davesUser = await prisma.user.create({
      data: {
        clerkId: 'user_30utLFMUBj7kOvPslTBZ6CZkiQt',
        name: 'Dave Sweeney',
        email: 'daves@masscomminc.com',
        role: UserRole.USER,
        practiceId: riversidePractice.id  // Riverside Family Medicine
      }
    })
    
    const superAdminUser = await prisma.user.create({
      data: {
        clerkId: 'user_314b0h210YO1X1IwZjrnigzSFa9',
        name: 'Super Admin',
        email: 'superadmin@masscomminc.com',
        role: UserRole.ADMIN,
        practiceId: null  // No practice - Admin Dashboard access only
      }
    })
    
    console.log('✅ Created users:', {
      bmc: bmcUser.id,
      daves: davesUser.id,
      superAdmin: superAdminUser.id
    })
    
    // 4. VERIFY THE SETUP
    console.log('🔍 Verifying setup...')
    
    const practices = await prisma.practice.findMany({
      include: {
        users: true
      }
    })
    
    const users = await prisma.user.findMany({
      include: {
        practice: true
      }
    })
    
    console.log('\n📊 FINAL DATABASE STATE:')
    console.log('========================')
    
    practices.forEach(practice => {
      console.log(`\n🏥 Practice: ${practice.name}`)
      console.log(`   ID: ${practice.id}`)
      console.log(`   Users: ${practice.users.length}`)
      practice.users.forEach(user => {
        console.log(`     - ${user.email} (${user.role})`)
      })
    })
    
    console.log('\n👥 Users:')
    users.forEach(user => {
      console.log(`   ${user.email} → ${user.practice?.name || 'NO PRACTICE'} (${user.role})`)
    })
    
    console.log('\n🎉 Clean slate setup completed successfully!')
    console.log('💡 Test the app now - practices should load in dropdowns')
    
  } catch (error) {
    console.error('❌ Error during clean slate setup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanSlateSetup()
