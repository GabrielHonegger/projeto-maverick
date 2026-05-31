const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Manually parse .env to get DATABASE_URL
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let databaseUrl = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    // Extract the URL and handle basic unescaping
    let val = line.substring('DATABASE_URL='.length).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    // Replace escaped \$ with $
    databaseUrl = val.replace(/\\(\$)/g, '$');
  }
});

if (!databaseUrl) {
  console.error("Could not find DATABASE_URL in .env");
  process.exit(1);
}

console.log("Connecting to Database (URL length:", databaseUrl.length, ")...");

const sql = postgres(databaseUrl, { 
  prepare: false,
  ssl: 'require'
});

async function main() {
  try {
    console.log("Executing SQL to create technicians table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "technicians" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "role" text NOT NULL,
        "phone" text,
        "email" text,
        "active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("SQL executed successfully! Table technicians is ready.");
  } catch (error) {
    console.error("Failed to execute SQL migration:", error);
  } finally {
    await sql.end();
  }
}

main();
