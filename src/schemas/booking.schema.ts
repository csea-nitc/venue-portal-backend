import {z} from 'zod'

export const createBookingSchema = z.object({
  venueId: z.number().int().positive(),
  eventName: z.string().min(3).max(200),
  eventStart: z.coerce.date(),
  eventEnd: z.coerce.date(),
  remarks: z.string().max(1000).optional(),
}).refine(data => data.eventEnd > data.eventStart, {
  message: "Event end must be after start",
});

export const updateBookingSchema = z.object({
  venueId: z.number().int().positive(),
  eventName: z.string().min(3).max(200),
  eventStart: z.coerce.date(),
  eventEnd: z.coerce.date(),
  remarks: z.string().max(1000).optional(),
}).refine(data => data.eventEnd > data.eventStart, {
  message: "Event end must be after start",
});

export const forwardBookingSchema = z.object({
  toUserId: z.number().int().positive(),
  remarks: z.string().min(1).max(1000),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;