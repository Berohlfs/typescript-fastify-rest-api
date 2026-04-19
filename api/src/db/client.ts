import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import fp from "fastify-plugin"
import type { FastifyInstance } from "fastify"

const connectionString = process.env.DATABASE_POOLING_URL

if (!connectionString) {
  throw new Error("DATABASE_POOLING_URL environment variable is not set")
}

const client = postgres(connectionString)

const db = drizzle({ client })

declare module "fastify" {
  interface FastifyInstance {
    db: typeof db
  }
}

export const dbPlugin = fp(async function dbPlugin(app: FastifyInstance) {
  app.decorate("db", db)

  app.addHook("onClose", async () => {
    await client.end()
  })
})
