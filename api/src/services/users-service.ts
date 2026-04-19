import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { users } from "../db/schemas/users"
import { count, eq } from "drizzle-orm"

export class UsersService {
  constructor(private db: NodePgDatabase) {
    this.db = db
  }

  async getUsers(page: number) {
    const limit = 10

    const data = await this.db
      .select()
      .from(users)
      .limit(limit)
      .offset((page - 1) * limit)

    const [total] = await this.db.select({ count: count() }).from(users)

    return {
      page,
      limit,
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
      data,
    }
  }

  async updateUser(userId: string, data: { full_name: string | null }) {
    const [updated] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning()

    return updated
  }
}
