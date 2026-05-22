import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as recommended by Supabase/Drizzle for serverless pooling
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle({ client });
