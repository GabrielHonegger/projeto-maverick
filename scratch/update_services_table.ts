import postgres from "postgres";

async function main() {
  console.log("Updating services table, adding estimated_time column...");
  let connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
  if (connectionString) {
    connectionString = connectionString.replace(/\\(\$)/g, "$1");
  }

  const client = postgres(connectionString, { 
    prepare: false,
    ssl: 'require'
  });

  try {
    await client`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_time TEXT NOT NULL DEFAULT '';
    `;
    console.log("Services table updated successfully!");
  } catch (error) {
    console.error("Failed to update services table:", error);
  } finally {
    await client.end();
  }
}

main();
