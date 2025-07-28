import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless with WebSocket
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use fetch-based queries to avoid connection issues

// Strict database security - no fallbacks in production
if (!process.env.DATABASE_URL) {
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? "DATABASE_URL environment variable is required in production. Please configure your database connection."
    : "DATABASE_URL must be set. Did you forget to provision a database?";
  throw new Error(errorMessage);
}

// Validate database URL format for production
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection string in production");
}

// Configure pool with connection limits to prevent timeout issues
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit concurrent connections for development
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 10000 // 10 second connection timeout
});

export const db = drizzle({ client: pool, schema });