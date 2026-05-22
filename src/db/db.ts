import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined. Please set it in your environment variables.");
}

// Disable prefetch as recommended by Supabase/Drizzle for serverless pooling
// Explicitly require SSL for secure remote database connection
export const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});
export const db = drizzle({ client });
