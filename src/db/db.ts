import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

// Disable prefetch as recommended by Supabase/Drizzle for serverless pooling
// Explicitly require SSL for secure remote database connection only when a real connection string is provided
export const client = postgres(connectionString, { 
  prepare: false,
  ssl: process.env.DATABASE_URL ? 'require' : false
});

export const db = drizzle({ client });


