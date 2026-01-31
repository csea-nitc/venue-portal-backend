import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { email, name, role, profilePicture, isActive } = req.body;
        const newAdmin = await prisma.user.create({
            data: {
                email,
                name,
                role,
                profilePicture,
                isActive,
            },
        });

        res.status(201).json({
            message: "Admin created successfully",
            newAdmin,
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
            error: "Failed to create Admin",
            details: error.message,
        });
    }
};

export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const Admins = await prisma.user.findMany({
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

        res.status(200).json({ Admins });
    } catch (error: any) {
        res.status(500).json({
            error: "Failed To get Admins",
            details: error.message,
        });
    }
};

export const getAdminById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const Admin = await prisma.user.findUnique({
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

        if (!Admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.status(200).json({ Admin });
    } catch (error: any) {
        res.status(500).json({
            error: "Failed to fetch Admin",
            details: error.message,
        });
    }
};

export const updateAdminById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { name, role, profilePicture, isActive } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (profilePicture !== undefined)
            updates.profilePicture = profilePicture;
        if (isActive !== undefined) updates.isActive = isActive;

        const Admin = await prisma.user.update({
            where: { userId: Number(userId) },
            data: updates,
        });

        res.status(200).json({ message: "Admin updated successfully", Admin });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(500).json({
            error: "Failed to update Admin",
            details: error.message,
        });
    }
};

export const deleteAdminById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        await prisma.user.delete({
            where: { userId: Number(userId) },
        });
        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(500).json({
            error: "Failed to delete Admin",
            details: error.message,
        });
    }
};
