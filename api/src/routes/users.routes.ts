import type { AppType } from "../app"
// import { UsersService } from "../services/users-service"
import {
  userResponseDto,
} from "../dto/users.dto"

export async function usersRoutes(app: AppType) {
  // const usersService = new UsersService(app.db)

  app.addHook("preHandler", app.authenticate)

  // GET /users/me
  app.get(
    "/me",
    {
      schema: {
        response: {
          200: userResponseDto,
        },
      },
    },
    async (request, reply) => {
      return reply.status(200).send(request.user!)
    },
  )
}
