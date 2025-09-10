import { PrismaClient } from "@prisma/client"
// import "server-only";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient
}

// Debug database connection
console.log("🔍 Database connection debug:");
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("  - DATABASE_URL preview:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + "..." : "undefined");

export let prisma: PrismaClient
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient()
  }
  prisma = global.cachedPrisma
}
