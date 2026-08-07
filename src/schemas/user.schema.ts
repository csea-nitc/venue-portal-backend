import { z } from "zod";

export const RoleEnum = z.enum([
    "CLUB",
    "FACULTY_COORDINATOR",
    "STAFF_IN_CHARGE",
    "FACULTY_IN_CHARGE",
    "HOD",
    "ADMIN",
]);

export const createUserSchema: z.ZodType = z.object({
    body: z.object({
        email: z.email("Invalid email").toLowerCase().trim(),
        name: z.string().min(1).max(255),
        role: z.array(RoleEnum).min(1),
        profilePicture: z.url("Invalid URL").optional(),
        isActive: z.boolean().default(true),
    }),
});

export const updateUserSchema: z.ZodType = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        role: z.array(RoleEnum).optional(),
        profilePicture: z.url("Invalid URL").optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const userIdSchema: z.ZodType = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type userIdInput = z.infer<typeof userIdSchema>;
