import { z } from "zod/v4"

export const paginationRequestDto = z.object({
  page: z.string().regex(/^\d+$/, "Must contain digits only").optional(),
})

export const paginationResponseDto = (itemSchema: z.ZodSchema) =>
  z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    data: itemSchema,
  })
