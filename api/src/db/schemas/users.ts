import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  auth_id: text().unique().notNull(),
  full_name: text(),
  email: text().unique().notNull(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
