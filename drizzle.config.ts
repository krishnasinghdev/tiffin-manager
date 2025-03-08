import { defineConfig } from "drizzle-kit"

import env from "@/lib/env"

export default defineConfig({
  out: "./server/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
