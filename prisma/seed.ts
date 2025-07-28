import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create practices
  const practice1 = await prisma.practice.create({
    data: {
      name: 'Downtown Medical Group',
      address: '123 Main St, Cityville',
      phone: '555-123-4567',
      email: 'contact@downtownmed.com',
    },
  });
  const practice2 = await prisma.practice.create({
    data: {
      name: 'Lakeside Family Health',
      address: '456 Lake Ave, Townsville',
      phone: '555-987-6543',
      email: 'info@lakesidehealth.com',
    },
  });

  // Create users for each practice
  const user1 = await prisma.user.create({
    data: {
      name: 'Dr. Alice Smith',
      email: 'alice@downtownmed.com',
      role: UserRole.USER,
      practiceId: practice1.id,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'Dr. Bob Jones',
      email: 'bob@downtownmed.com',
      role: UserRole.ADMIN,
      practiceId: practice1.id,
    },
  });
  const user3 = await prisma.user.create({
    data: {
      name: 'Dr. Carol Lee',
      email: 'carol@lakesidehealth.com',
      role: UserRole.USER,
      practiceId: practice2.id,
    },
  });
  const user4 = await prisma.user.create({
    data: {
      name: 'Dr. Dan Miller',
      email: 'dan@lakesidehealth.com',
      role: UserRole.ADMIN,
      practiceId: practice2.id,
    },
  });

  // Create a quote and order for each user
  for (const user of [user1, user2, user3, user4]) {
    const quote = await prisma.quotes.create({
      data: {
        practiceId: user.practiceId,
        userId: user.id,
        quoteNumber: `Q-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        status: 'pending',
        totalCost: 250.00,
        subject: 'Annual Checkup Reminder',
        estimatedRecipients: 100,
        colorMode: 'color',
        dataCleansing: true,
        ncoaUpdate: false,
        firstClassPostage: true,
        notes: 'Include new office hours.',
      },
    });
    await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        practiceId: user.practiceId,
        userId: user.id,
        status: 'created',
        subject: 'Annual Checkup Reminder',
        templateType: 'Letter',
        colorMode: 'color',
        cost: 250.00,
      },
    });
  }

  console.log('Seed data created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 