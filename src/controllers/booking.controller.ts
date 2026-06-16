import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { getApprovedConflict } from "../services/booking.service.js";

const prisma = new PrismaClient();

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { venueId, eventName, eventStart, eventEnd, initialHandlerId } = req.body;
    const clubId = (req.user as any).userId; 

    const approvedConflict = await getApprovedConflict(venueId, new Date(eventStart), new Date(eventEnd));
    if (approvedConflict) {
      return res.status(409).json({
        success: false,
        message: "This venue is already officially booked for the selected time slot."
      });
    }

    let handlerId = initialHandlerId;

    if (!handlerId) {
      // Auto-assignment: Pick the FACULTY_IN_CHARGE of this venue if student not picked
      const autoHandler = await prisma.venueHandler.findFirst({
        where: { venueId, isActive: true, role: 'FACULTY_IN_CHARGE' },
        select: { handlerId: true }
      });
      handlerId = autoHandler?.handlerId;
    }

    if (!handlerId) {
      return res.status(400).json({ 
        success: false,
        message: "Could not assign a faculty reviewer. Please select one manually." 
      });
    }

    const booking = await prisma.booking.create({
      data: {
        clubId,
        venueId,
        eventName,
        eventStart: new Date(eventStart),
        eventEnd: new Date(eventEnd),
        currentHandlerId: handlerId,
        status: "PENDING"
      }
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const approveBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = (req.user as any).userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { bookingId: Number(id) }
      });

      if (!booking || booking.status !== 'PENDING') {
          throw new Error("Invalid booking or already processed.");
      }

      // Re-verify that no OTHER booking for this venue was approved while this one was pending
      const finalConflictCheck = await tx.booking.findFirst({
        where: {
          venueId: booking.venueId,
          status: 'APPROVED',
          NOT: { bookingId: booking.bookingId },
          AND: [
            { eventStart: { lt: booking.eventEnd } },
            { eventEnd: { gt: booking.eventStart } },
          ],
        },
      });

      if (finalConflictCheck) {
        throw new Error("CONFLICT: Another request for this venue and time was just approved.");
      }

      return await tx.booking.update({
        where: { bookingId: Number(id) },
        data: { status: 'APPROVED' }
      });
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};