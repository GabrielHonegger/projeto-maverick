import postgres from 'postgres';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: '.env' });

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

// Clean connection string (resolve escaped characters in password)
connectionString = connectionString.replace(/\\(\$)/g, "$1");

console.log("Connecting to Postgres...");
const sql = postgres(connectionString, { ssl: 'require', prepare: false });

async function main() {
  console.log("Creating parts_catalog table if not exists...");
  await sql`
    CREATE TABLE IF NOT EXISTS "parts_catalog" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "brand" text NOT NULL,
      "code" text NOT NULL,
      "model" text NOT NULL,
      "technical_specifications" text,
      "measurements" text,
      "price" numeric DEFAULT '0' NOT NULL,
      "cost" numeric DEFAULT '0' NOT NULL,
      "specific_bikes" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  console.log("parts_catalog table checked/created successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Database operation failed:", err);
  process.exit(1);
});
