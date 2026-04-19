import { z } from "zod/v4"

export const userResponseDto = z.object({
  id: z.uuid(),
  full_name: z.string().nullable(),
  email: z.email(),
  created_at: z.date(),
})
