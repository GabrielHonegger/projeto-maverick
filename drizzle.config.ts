import { defineConfig } from "drizzle-kit";

let url = process.env.DATABASE_URL || "";
if (url) {
  url = url.replace(/\\(\$)/g, "$1");
}

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: url,
  },
});
