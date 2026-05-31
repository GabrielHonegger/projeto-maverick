import postgres from "postgres";

async function main() {
  console.log("Creating services table...");
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
      CREATE TABLE IF NOT EXISTS services (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC DEFAULT '0' NOT NULL,
        cc_ranges JSONB DEFAULT '[]'::jsonb NOT NULL,
        categories JSONB DEFAULT '[]'::jsonb NOT NULL,
        specific_bikes JSONB DEFAULT '[]'::jsonb NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `;
    console.log("Services table created successfully!");
  } catch (error) {
    console.error("Failed to create services table:", error);
  } finally {
    await client.end();
  }
}

main();
