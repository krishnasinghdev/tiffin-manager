import { Logger } from "drizzle-orm/logger"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import env from "@/lib/env"

import * as schema from "./schema"

class PrettyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    const formattedQuery = query
      .replace("select", "SELECT")
      .replace(" from ", "\nFROM ")
      .replace(" where ", "\nWHERE ")
      .replace(" order by ", "\nORDER BY ")
      .replace(" and ", "\n  AND ")
      .replace(", ", ",\n  ")

    console.log(
      "+--------------------- Query ---------------------+\n" +
        `${formattedQuery}\n` +
        `PARAMS: ${params}` +
        "\n+-------------------------------------------------+\n"
    )
  }
}

let logger: boolean | PrettyLogger = true
const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined
}
const client = globalForDb.client ?? postgres(env.DATABASE_URL, { prepare: false })

if (env.NODE_ENV !== "production") {
  globalForDb.client = client
  logger = new PrettyLogger()
}

export const db = drizzle(client, { schema, casing: "snake_case", logger })
