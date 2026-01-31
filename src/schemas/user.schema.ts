import { z } from "zod";

export const RoleEnum = z.enum([
    "CLUB",
    "FACULTY_COORDINATOR",
    "STAFF_IN_CHARGE",
    "FACULTY_IN_CHARGE",
    "HOD",
    "ADMIN",
]);

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email").toLowerCase().trim(),
        name: z.string().min(1).max(255),
        role: RoleEnum,
        profilePicture: z.string().url("Invalid URL").optional(),
        isActive: z.boolean().default(true),
    }),
});

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        role: RoleEnum.optional(),
        profilePicture: z.string().url("Invalid URL").optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const userIdSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type userIdInput = z.infer<typeof userIdSchema>;
