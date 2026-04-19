import { app } from "./app"

app.listen({ port: Number(process.env.PORT), host: "0.0.0.0" }).then(() => {
  console.log(`Server is running on port ${process.env.PORT}!`)
})

async function closeGracefully(signal: string) {
  console.log(`Received ${signal}, closing server...`)
  await app.close()
  process.exit(0)
}

process.on("SIGINT", closeGracefully)
process.on("SIGTERM", closeGracefully)
