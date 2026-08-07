import { Request, Response } from "express";
import { PrismaClient, Role } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, name, role, profilePicture, isActive } = req.body;
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                roles: {
                    create: role.map((userRole: string) => ({ role: userRole })),
                },
                profilePicture,
                isActive,
            },
        });

        res.status(201).json({
            message: "User created successfully",
            user: newUser,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            const field = error.meta?.target?.[0] || "field";

            return res.status(409).json({
                error: `${field} already exists`,
                details: `The provided ${field} is already in use`,
            });
        }
        res.status(500).json({
            error: "Failed to create user",
            details: error.message,
        });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                userId: true,
                email: true,
                name: true,
                roles: {
                    select: {
                        role: true,
                    },
                },
                profilePicture: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json({ users });
    } catch (error: any) {
        res.status(500).json({
            error: "Failed to get users",
            details: error.message,
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { userId: Number(userId) },
            include: {
                roles: {
                    select: {
                        role: true,
                    },
                },
                clubProfile: true,
                coordinatedClubs: true,
                venueAssignments: {
                    include: {
                        venue: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error: any) {
        res.status(500).json({
            error: "Failed to fetch user",
            details: error.message,
        });
    }
};

export const updateUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const userIdNumber = Number(userId);
        const { name, roles, profilePicture, isActive } = req.body;

        console.log(typeof userId);
        console.log(userId);

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (roles !== undefined) {
            const currentUser = await prisma.user.findUnique({
                where: { userId: userIdNumber },
                select: {
                    roles: {
                        select: {
                            role: true,
                        },
                    },
                },
            });

            if (!currentUser) {
                return res.status(404).json({ error: "User not found" });
            }

            const currentRoles = currentUser.roles.map((userRole: { role: Role }) => userRole.role);
            const requestedRoles = roles as Role[];
            const droppedRoles = currentRoles.filter((role: Role) => !requestedRoles.includes(role));

            if (droppedRoles.length > 0) {
                const conflictingHandler = await prisma.bookingHandler.findFirst({
                    where: {
                        handlerId: userIdNumber,
                        handlerRole: {
                            in: droppedRoles,
                        },
                    },
                });

                if (conflictingHandler) {
                    return res.status(409).json({
                        error: "Cannot remove role while it is still assigned to a booking workflow handler",
                        details: `The following roles are still referenced by booking handlers: ${droppedRoles.join(", ")}`,
                    });
                }
            }

            updates.roles = {
                deleteMany: {},
                create: requestedRoles.map((userRole: string) => ({ role: userRole })),
            };
        }
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;
        if (isActive !== undefined) updates.isActive = isActive;

        const user = await prisma.user.update({
            where: { userId: userIdNumber },
            data: updates,
        });

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({
            error: "Failed to update user",
            details: error.message,
        });
    }
};

export const deleteUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        await prisma.user.delete({
            where: { userId: Number(userId) },
        });
        res.status(200).json({ message: `User ${userId} deleted successfully` });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({
            error: "Failed to delete user",
            details: error.message,
        });
    }
};
