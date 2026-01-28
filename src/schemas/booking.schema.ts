import {z} from 'zod'

export const createBookingSchema = z.object({
  body: z.object({
    venueId: z.number().int().positive(),
    eventName: z.string().min(1).max(255),
    eventStart: z.string().datetime(),
    eventEnd: z.string().datetime(),
  })
});

export const updateBookingSchema = z.object({
  body: z.object({
    venueId: z.number().int().positive(),
    eventName: z.string().min(1).max(255),
    eventStart: z.string().datetime(),
    eventEnd: z.string().datetime(),
  })
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;