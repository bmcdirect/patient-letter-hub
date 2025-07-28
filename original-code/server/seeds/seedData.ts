import { db } from "../db";
import { quotes, orders, practices, users, templates } from "@shared/schema";
import { logger } from "../../logger";

export async function seedDatabase() {
  try {
    logger.info("Starting database seeding...");
    
    // Clear existing data
    await db.delete(orders);
    await db.delete(quotes);
    await db.delete(practices);
    await db.delete(templates);
    logger.info("Cleared existing data");

    // Seed Users (should already exist from auth)
    logger.info("Users should exist from authentication system");

    // Seed Practices
    const practiceData = [
      {
        id: 1,
        ownerId: "test-user-123",
        name: "Central Valley Medical Group",
        phone: "(916) 555-0123",
        email: "admin@centralvalleymed.com",
        mainAddress: "1234 Healthcare Drive",
        city: "Sacramento",
        state: "CA",
        zipCode: "95814",
        taxonomyCode: "207Q00000X",
        npiNumber: "1234567890",
        operatingHours: "Mon-Fri 8AM-5PM",
        emrId: "EMR-001",
        createdAt: new Date("2024-01-15"),
      },
      {
        id: 2,
        ownerId: "test-user-123",
        name: "Sunrise Dental Associates",
        phone: "(559) 555-0456",
        email: "office@sunrisedental.com",
        mainAddress: "567 Smile Street",
        city: "Fresno",
        state: "CA",
        zipCode: "93701",
        taxonomyCode: "122300000X",
        npiNumber: "9876543210",
        operatingHours: "Mon-Fri 7AM-6PM",
        emrId: "EMR-002",
        createdAt: new Date("2024-02-20"),
      },
      {
        id: 3,
        ownerId: "test-user-123",
        name: "Pacific Orthopedic Clinic",
        phone: "(925) 555-0789",
        email: "contact@pacificortho.com",
        mainAddress: "890 Bone Avenue",
        city: "Oakland",
        state: "CA",
        zipCode: "94612",
        taxonomyCode: "207X00000X",
        npiNumber: "5555555555",
        operatingHours: "Mon-Fri 6AM-8PM",
        emrId: "EMR-003",
        createdAt: new Date("2024-03-10"),
      }
    ];

    await db.insert(practices).values(practiceData);
    logger.info("Seeded practices");

    // Seed Templates (matching existing schema)
    const templateData = [
      {
        id: 1,
        name: "Patient Departure Notification",
        disciplineList: ["General Practice", "Family Medicine"],
        eventType: "departure",
        bodyHtml: "<p>We regret to inform you that Dr. [PHYSICIAN_NAME] will be leaving our practice effective [DATE]. We want to ensure continuity of your care during this transition.</p><p>Your medical records will remain secure, and we will assist with transferring them to your new healthcare provider upon request.</p>",
        language: "en",
        requiredFields: ["physician_name", "departure_date", "practice_name"],
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: 2,
        name: "Practice Relocation Notice", 
        disciplineList: ["All Disciplines"],
        eventType: "relocation",
        bodyHtml: "<p>We are excited to announce that our practice is moving to a new location to better serve you!</p><p><strong>New Address:</strong><br/>[NEW_ADDRESS]</p><p><strong>Effective Date:</strong> [MOVE_DATE]</p><p>All appointments will continue as scheduled at our new location.</p>",
        language: "en",
        requiredFields: ["new_address", "move_date", "phone_number"],
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: 3,
        name: "Insurance Policy Update",
        disciplineList: ["Billing", "Administrative"],
        eventType: "policy",
        bodyHtml: "<p>Important update regarding your insurance coverage effective [EFFECTIVE_DATE].</p><p>Changes include:</p><ul><li>[CHANGE_DETAILS]</li></ul><p>Please contact our billing department if you have questions.</p>",
        language: "en",
        requiredFields: ["effective_date", "change_details", "contact_info"],
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: 4,
        name: "Welcome New Patients",
        disciplineList: ["General Practice"],
        eventType: "welcome",
        bodyHtml: "<p>Welcome to [PRACTICE_NAME]! We are delighted to have you as a patient.</p><p>Your first appointment is scheduled for [APPOINTMENT_DATE] at [APPOINTMENT_TIME].</p><p>Please bring:</p><ul><li>Photo ID</li><li>Insurance cards</li><li>Current medication list</li></ul>",
        language: "en",
        requiredFields: ["practice_name", "appointment_date", "appointment_time"],
        isActive: true,
        createdAt: new Date("2024-01-01"),
      }
    ];

    await db.insert(templates).values(templateData);
    logger.info("Seeded templates");

    // Seed Quotes with "pending" status for conversion testing
    const quoteData = [
      {
        id: 10,
        quoteNumber: "Q-2001",
        userId: "test-user-123",
        practiceId: 1,
        locationId: null,
        subject: "Dr. Johnson Departure Notice",
        templateType: "departure",
        colorMode: "color",
        estimatedRecipients: 1250,
        enclosures: 1,
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: true,
        totalCost: "1875.50",
        status: "pending",
        convertedOrderId: null,
        notes: "Include business reply card for patient referrals",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      },
      {
        id: 11,
        quoteNumber: "Q-2002",
        userId: "test-user-123",
        practiceId: 2,
        locationId: null,
        subject: "Practice Relocation - New Fresno Location",
        templateType: "relocation",
        colorMode: "color",
        estimatedRecipients: 3200,
        enclosures: 2,
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: false,
        totalCost: "4125.75",
        status: "pending",
        convertedOrderId: null,
        notes: "Include map insert and new patient forms",
        createdAt: new Date("2025-01-18"),
        updatedAt: new Date("2025-01-18"),
      },
      {
        id: 12,
        quoteNumber: "Q-2003",
        userId: "test-user-123",
        practiceId: 3,
        locationId: null,
        subject: "Insurance Coverage Changes 2025",
        templateType: "policy",
        colorMode: "bw",
        estimatedRecipients: 950,
        enclosures: 0,
        dataCleansing: false,
        ncoaUpdate: false,
        firstClassPostage: false,
        totalCost: "695.25",
        status: "pending",
        convertedOrderId: null,
        notes: "Standard black and white printing only",
        createdAt: new Date("2025-01-20"),
        updatedAt: new Date("2025-01-20"),
      },
      {
        id: 13,
        quoteNumber: "Q-2004",
        userId: "test-user-123",
        practiceId: 1,
        locationId: null,
        subject: "New Patient Welcome Package",
        templateType: "welcome",
        colorMode: "color",
        estimatedRecipients: 500,
        enclosures: 3,
        dataCleansing: true,
        ncoaUpdate: false,
        firstClassPostage: false,
        totalCost: "1125.00",
        status: "pending",
        convertedOrderId: null,
        notes: "Include practice brochure, forms, and appointment card",
        createdAt: new Date("2025-01-22"),
        updatedAt: new Date("2025-01-22"),
      },
      {
        id: 14,
        quoteNumber: "Q-2005",
        userId: "test-user-123",
        practiceId: 2,
        locationId: null,
        subject: "Dental Hygiene Reminder Campaign",
        templateType: "reminder",
        colorMode: "color",
        estimatedRecipients: 2800,
        enclosures: 1,
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: false,
        totalCost: "3580.00",
        status: "pending",
        convertedOrderId: null,
        notes: "Include appointment scheduling card",
        createdAt: new Date("2025-01-25"),
        updatedAt: new Date("2025-01-25"),
      },
      {
        id: 15,
        quoteNumber: "Q-2006",
        userId: "test-user-123",
        practiceId: 3,
        locationId: null,
        subject: "Physical Therapy Schedule Changes",
        templateType: "notification",
        colorMode: "bw",
        estimatedRecipients: 750,
        enclosures: 0,
        dataCleansing: false,
        ncoaUpdate: false,
        firstClassPostage: false,
        totalCost: "487.50",
        status: "pending",
        convertedOrderId: null,
        notes: "Cost-effective black and white printing",
        createdAt: new Date("2025-01-28"),
        updatedAt: new Date("2025-01-28"),
      },
      {
        id: 16,
        quoteNumber: "Q-2007",
        userId: "test-user-123",
        practiceId: 1,
        locationId: null,
        subject: "Holiday Closure Schedule 2025",
        templateType: "notification",
        colorMode: "color",
        estimatedRecipients: 1800,
        enclosures: 0,
        dataCleansing: false,
        ncoaUpdate: false,
        firstClassPostage: false,
        totalCost: "1890.00",
        status: "pending",
        convertedOrderId: null,
        notes: "Holiday-themed design with practice logo",
        createdAt: new Date("2025-01-30"),
        updatedAt: new Date("2025-01-30"),
      },
      {
        id: 17,
        quoteNumber: "Q-2008",
        userId: "test-user-123",
        practiceId: 2,
        locationId: null,
        subject: "Annual Health Screening Reminder",
        templateType: "health",
        colorMode: "color",
        estimatedRecipients: 4500,
        enclosures: 2,
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: true,
        totalCost: "8750.25",
        status: "pending",
        convertedOrderId: null,
        notes: "Priority mailing with health screening forms",
        createdAt: new Date("2025-02-01"),
        updatedAt: new Date("2025-02-01"),
      }
    ];

    await db.insert(quotes).values(quoteData);
    logger.info("Seeded quotes with pending status");

    logger.info({
      practices: practiceData.length,
      templates: templateData.length,
      quotes: quoteData.length
    }, "Database seeding completed successfully");
    
  } catch (error) {
    logger.error({ error }, "Database seeding failed");
    throw error;
  }
}

// Function to run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      logger.info("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Seeding failed");
      process.exit(1);
    });
}