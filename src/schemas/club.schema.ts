import { z } from "zod";

export const createClubSchema = z.object({
    body: z.object({
        clubName: z.string().min(1).max(255),
        secretaryName: z.string().min(1).max(255),
        secretaryEmail: z.string().email("Invalid email").toLowerCase().trim(),
        contactNumber: z
            .string()
            .regex(/^[0-9]{10}$/, "Invalid phone number")
            .trim(),
        facultyCoordinatorId: z.number().int().positive(),
        isActive: z.boolean().default(true),
    }),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
