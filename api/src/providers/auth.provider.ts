import {
  createClerkClient,
  verifyToken as clerkVerifyToken,
} from "@clerk/backend"

class AuthProvider {
  private client

  constructor() {
    const secretKey = process.env.CLERK_SECRET_KEY
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY

    if (!secretKey) {
      throw new Error("CLERK_SECRET_KEY environment variable is not set")
    }

    if (!publishableKey) {
      throw new Error("CLERK_PUBLISHABLE_KEY environment variable is not set")
    }

    this.client = createClerkClient({ secretKey, publishableKey })
  }

  async verifyToken(token: string): Promise<{ sub: string } | null> {
    try {
      const payload = await clerkVerifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })
      if (!payload.sub) {
        return null
      }
      return { sub: payload.sub }
    } catch {
      return null
    }
  }

  async getUser(authId: string) {
    try {
      const user = await this.client.users.getUser(authId)

      if (!user) {
        return null
      }

      return {
        auth_id: authId,
        full_name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        email: user.emailAddresses[0]?.emailAddress,
      }
    } catch (error) {
      return null
    }
  }
}

export const authProvider = new AuthProvider()
