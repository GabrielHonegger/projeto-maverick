const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let databaseUrl = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    let val = line.substring('DATABASE_URL='.length).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    databaseUrl = val.replace(/\\(\$)/g, '$');
  }
});

if (!databaseUrl) {
  console.error("Could not find DATABASE_URL in .env");
  process.exit(1);
}

const sql = postgres(databaseUrl, { 
  prepare: false,
  ssl: 'require'
});

async function main() {
  try {
    console.log("Executing SQL to create profiles table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "role" text DEFAULT 'ajudante' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("SQL executed successfully! Table profiles is ready.");
  } catch (error) {
    console.error("Failed to execute SQL migration:", error);
  } finally {
    await sql.end();
  }
}

main();
