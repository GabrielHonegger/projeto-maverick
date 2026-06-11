const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.slice(0, index).trim();
      let val = trimmed.slice(index + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\/g, '');
      process.env[key] = val;
    });
  }
} catch (err) {
  console.warn("Failed to load .env file:", err.message);
}


const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

console.log("Connecting to:", connectionString.split('@')[1] || connectionString);

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require'
});

async function run() {
  try {
    console.log("Applying materials table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "materials" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "status" text DEFAULT 'pendente' NOT NULL,
        "cost" numeric DEFAULT '0' NOT NULL,
        "supplier_name" text,
        "supplier_phone" text,
        "reported_by" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("Materials table applied.");

    console.log("Applying notifications table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "read" boolean DEFAULT false NOT NULL,
        "type" text NOT NULL,
        "link" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("Notifications table applied.");

    console.log("Adding avg_market_value to parts_catalog if not exists...");
    try {
      await sql`
        ALTER TABLE "parts_catalog" ADD COLUMN "avg_market_value" numeric DEFAULT '0' NOT NULL
      `;
      console.log("avg_market_value added to parts_catalog.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("avg_market_value column already exists, skipping.");
      } else {
        throw err;
      }
    }

    console.log("All migrations run successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
