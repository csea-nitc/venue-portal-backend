import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const getAllClubs = async (req: Request, res: Response) => {
    try {
        const clubs = await prisma.club.findMany({
            include: {
                coordinator: {
                    select: { name: true, email: true }
                }
            }
        });
        res.status(200).json({ success: true, data: clubs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getClubById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const club = await prisma.club.findUnique({
            where: { clubId: Number(id) },
            include: {
                coordinator: true,
                user: true,
                bookings: true
            }
        });

        if (!club) return res.status(404).json({ success: false, message: "Club not found" });

        res.status(200).json({ success: true, data: club });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createClub = async (req: Request, res: Response) => {
    try {
        const { clubId, clubName, secretaryName, secretaryEmail, contactNumber, facultyCoordinatorId } = req.body;

        const newClub = await prisma.club.create({
            data: {
                clubId, // This must be an existing User ID with Role.CLUB
                clubName,
                secretaryName,
                secretaryEmail,
                contactNumber,
                facultyCoordinatorId
            }
        });

        res.status(201).json({ success: true, data: newClub });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyClubProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).userId;
        const role = (req.user as any).role;

        if (role !== 'CLUB') {
            return res.status(403).json({ success: false, message: "Only club accounts can access this." });
        }

        const club = await prisma.club.findUnique({
            where: { clubId: userId },
            include: {
                coordinator: { select: { name: true, email: true } },
                bookings: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!club) return res.status(404).json({ success: false, message: "Club profile not found." });

        res.status(200).json({ success: true, data: club });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};