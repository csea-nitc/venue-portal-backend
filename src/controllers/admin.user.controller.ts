import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, name, role, profilePicture, isActive } = req.body;
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                role,
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
                role: true,
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
        const { name, role, profilePicture, isActive } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (profilePicture !== undefined)
            updates.profilePicture = profilePicture;
        if (isActive !== undefined) updates.isActive = isActive;

        const user = await prisma.user.update({
            where: { userId: Number(userId) },
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
