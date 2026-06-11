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

console.log("Connecting to database...");
const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require'
});

async function run() {
  try {
    console.log("Adding needed_by_date and needed_by_time to materials table...");
    
    // Add needed_by_date column if not exists
    try {
      await sql`
        ALTER TABLE "materials" ADD COLUMN "needed_by_date" text;
      `;
      console.log("Column needed_by_date added.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("Column needed_by_date already exists, skipping.");
      } else {
        throw err;
      }
    }

    // Add needed_by_time column if not exists
    try {
      await sql`
        ALTER TABLE "materials" ADD COLUMN "needed_by_time" text;
      `;
      console.log("Column needed_by_time added.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("Column needed_by_time already exists, skipping.");
      } else {
        throw err;
      }
    }

    console.log("Database update completed successfully!");
  } catch (error) {
    console.error("Database update failed:", error);
  } finally {
    await sql.end();
  }
}

run();
