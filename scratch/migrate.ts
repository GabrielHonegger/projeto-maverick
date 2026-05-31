import postgres from "postgres";

const connectionString = (process.env.DATABASE_URL || "").replace(/\\(\$)/g, "$1");

const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});

async function run() {
  try {
    console.log("Running migration with connection string:", connectionString ? "Configured" : "None");
    await client`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS fuel_refueling_value numeric DEFAULT '0' NOT NULL;`;
    await client`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS fuel_refueling_liters numeric DEFAULT '0' NOT NULL;`;
    await client`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS fuel_refueling_receipt_photo text;`;
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
