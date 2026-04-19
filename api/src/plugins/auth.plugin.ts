import fp from "fastify-plugin"
import type { FastifyReply } from "fastify"
import { authProvider } from "../providers/auth.provider"
import { users } from "../db/schemas/users"
import { eq } from "drizzle-orm"

declare module "fastify" {
  interface FastifyRequest {
    user: typeof users.$inferSelect | null
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

export const authPlugin = fp(async function authPlugin(app) {
  app.decorateRequest("user", null)

  app.decorate("authenticate", async function (request, reply) {
    let payload: { sub: string } | null = null

    // Dev authentication bypass
    const isDev = process.env.NODE_ENV === "development"
    const isLocalhost = request.ip === "127.0.0.1" || request.ip === "::1"

    const canUseDevAuth =
      isDev && process.env.DEV_AUTH_ENABLED === "true" && isLocalhost

    if (
      canUseDevAuth &&
      request.headers["x-dev-auth-secret"] === process.env.DEV_AUTH_SECRET &&
      typeof process.env.DEV_AUTH_USER_ID === "string" &&
      typeof request.headers["x-dev-auth-user-id"] === "string" &&
      request.headers["x-dev-auth-user-id"] === process.env.DEV_AUTH_USER_ID
    ) {
      payload = { sub: process.env.DEV_AUTH_USER_ID }
    } else {
      // Normal authentication
      const authHeader = request.headers.authorization

      if (!authHeader?.startsWith("Bearer ")) {
        return reply.code(401).send({
          error: "Missing or invalid Authorization header",
        })
      }

      const token = authHeader.slice(7)

      payload = await authProvider.verifyToken(token)

      if (!payload) {
        return reply.code(401).send({
          error: "Invalid or expired token",
        })
      }
    }

    const authId = payload.sub

    let user: typeof users.$inferSelect | null = null

    let [existingUser] = await app.db
      .select()
      .from(users)
      .where(eq(users.auth_id, authId))

    if (existingUser) {
      user = existingUser
    } else {
      const authUser = await authProvider.getUser(authId)

      if (!authUser) {
        return reply.code(401).send({
          error: "User not found",
        })
      }

      const [newUser] = await app.db.insert(users).values(authUser).returning()

      user = newUser
    }

    request.user = user
  })
})
