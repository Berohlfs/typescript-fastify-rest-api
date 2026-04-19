import { fastify } from "fastify"
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { fastifyCors } from "@fastify/cors"
import { dbPlugin } from "./db/client"
import { usersRoutes } from "./routes/users.routes"
import { authPlugin } from "./plugins/auth.plugin"
import { fastifyRateLimit } from "@fastify/rate-limit"

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

export type AppType = typeof app

app.register(fastifyCors, {
  origin: [
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})

app.register(fastifyRateLimit, {
  max: 60,
  timeWindow: "1 minute",
})

app.register(dbPlugin)

app.register(authPlugin)

app.register(usersRoutes, { prefix: "/users" })
