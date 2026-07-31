import { Request, Response } from "express";
import { PrismaClient, BookingStatus } from "../generated/prisma/client.js";
import { Role } from "../generated/prisma/enums.js";
import { getApprovedConflict } from "../services/booking.service.js";
import { WorkflowService } from "../services/workflow.service.js";
import {
  sendBookingSubmittedEmail,
  sendHandlerAssignedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  BookingEmailData
} from "../services/email.service.js";

const prisma = new PrismaClient();

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { venueId, eventName, eventStart, eventEnd, initialHandlerId } = req.body;
    const clubId = req.user?.userId;

    if (!clubId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const approvedConflict = await getApprovedConflict(venueId, new Date(eventStart), new Date(eventEnd));
    if (approvedConflict) {
      return res.status(409).json({
        success: false,
        message: "This venue is already officially booked for the selected time slot."
      });
    }


    const clubProfile = await prisma.club.findUnique({
      where: { clubId }
    });
    if (!clubProfile) {
      return res.status(404).json({
        success: false,
        message: "Club profile not found for this user."
      });
    }
    // club's coordinator
    const handlerId = initialHandlerId || clubProfile.facultyCoordinatorId;


    const booking = await prisma.booking.create({
      data: {
        clubId,
        venueId,
        eventName,
        eventStart: new Date(eventStart),
        eventEnd: new Date(eventEnd),
        status: BookingStatus.PENDING_COORDINATOR,
        currentHandlers: {
          create: {
            handlerId,
            handlerRole: Role.FACULTY_COORDINATOR
          }
        }
      },
      include: {
        currentHandlers: {
          include: {
            handler: true
          }
        }
      }
    });

    // --- EMAIL NOTIFICATION ---
    try {
      const clubUser = await prisma.user.findUnique({ where: { userId: clubId } });
      const handlerUser = await prisma.user.findUnique({ where: { userId: handlerId } });
      const venue = await prisma.venue.findUnique({ where: { venueId } });

      if (clubUser && handlerUser && venue) {
        const emailData: BookingEmailData = {
          bookingId: booking.bookingId,
          eventName: booking.eventName,
          venueName: venue.name,
          eventStart: booking.eventStart,
          eventEnd: booking.eventEnd,
          clubName: clubUser.name,
          portalUrl: process.env.FRONTEND_URL || "http://localhost:3000"
        };
        
        await sendBookingSubmittedEmail(clubUser.email, emailData);
        await sendHandlerAssignedEmail(handlerUser.email, handlerUser.name, emailData);
      }
    } catch (emailErr) {
      console.error("Failed to enqueue emails for createBooking:", emailErr);
    }
    // --------------------------

    return res.status(201).json({ success: true, data: booking });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

export const approveBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const approverId = req.user?.userId;
  const { remarks } = req.body;

  if (!approverId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await WorkflowService.approveBooking(Number(id), approverId, remarks);

    // --- EMAIL NOTIFICATION ---
    try {
      const bookingInfo = await prisma.booking.findUnique({
        where: { bookingId: Number(id) },
        include: {
          club: { include: { user: true } },
          venue: true,
          currentHandlers: { include: { handler: true } }
        }
      });

      if (bookingInfo) {
        const emailData: BookingEmailData = {
          bookingId: bookingInfo.bookingId,
          eventName: bookingInfo.eventName,
          venueName: bookingInfo.venue.name,
          eventStart: bookingInfo.eventStart,
          eventEnd: bookingInfo.eventEnd,
          clubName: bookingInfo.club.user.name,
          portalUrl: process.env.FRONTEND_URL || "http://localhost:3000"
        };

        if (result.status === BookingStatus.APPROVED) {
          const approver = await prisma.user.findUnique({ where: { userId: approverId } });
          await sendBookingApprovedEmail(
            bookingInfo.club.user.email,
            emailData,
            approver?.name || "App Team"
          );
        } else if (
          result.status === BookingStatus.PENDING_STAFF ||
          result.status === BookingStatus.PENDING_FACULTY ||
          result.status === BookingStatus.PENDING_HOD
        ) {
          for (const ch of bookingInfo.currentHandlers) {
            await sendHandlerAssignedEmail(ch.handler.email, ch.handler.name, emailData);
          }
        }
      }
    } catch (emailErr) {
      console.error("Failed to enqueue emails for approveBooking:", emailErr);
    }
    // --------------------------

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const rejecterId = req.user?.userId;
  const { reason } = req.body;

  if (!rejecterId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await WorkflowService.rejectBooking(Number(id), rejecterId, reason);

    // --- EMAIL NOTIFICATION ---
    try {
      const bookingInfo = await prisma.booking.findUnique({
        where: { bookingId: Number(id) },
        include: {
          club: { include: { user: true } },
          venue: true
        }
      });

      if (bookingInfo) {
        const emailData: BookingEmailData = {
          bookingId: bookingInfo.bookingId,
          eventName: bookingInfo.eventName,
          venueName: bookingInfo.venue.name,
          eventStart: bookingInfo.eventStart,
          eventEnd: bookingInfo.eventEnd,
          clubName: bookingInfo.club.user.name,
          portalUrl: process.env.FRONTEND_URL || "http://localhost:3000"
        };
        const rejecter = await prisma.user.findUnique({ where: { userId: rejecterId } });

        await sendBookingRejectedEmail(
          bookingInfo.club.user.email,
          emailData,
          rejecter?.name || "App Team",
          reason
        );
      }
    } catch (emailErr) {
      console.error("Failed to enqueue emails for rejectBooking:", emailErr);
    }
    // --------------------------

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};


export const listBookings = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const requestedRole = req.query.role;
  if (typeof requestedRole !== "string") {
    return res.status(400).json({ success: false, message: "role query param is required" });
  }

  if (!user.role.includes(requestedRole as Role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: requested role is not attached to this user"
    });
  }

  try {
    let whereClause: any = {};

    if (requestedRole === "HOD" || requestedRole === "ADMIN") {
      whereClause = {};
    } else if (requestedRole === "STAFF_IN_CHARGE" || requestedRole === "FACULTY_IN_CHARGE") {
      const managedVenues = await prisma.venueHandler.findMany({
        where: { handlerId: user.userId, isActive: true },
        select: { venueId: true }
      });
      const managedVenueIds = managedVenues.map(vh => vh.venueId);

      whereClause.OR = [
        { currentHandlers: { some: { handlerId: user.userId } } },
        {
          venueId: { in: managedVenueIds },
          status: { in: [BookingStatus.PENDING_STAFF, BookingStatus.PENDING_FACULTY] }
        }
      ];
    } else if (requestedRole === "FACULTY_COORDINATOR") {
      whereClause.OR = [
        { currentHandlers: { some: { handlerId: user.userId } } },
        { club: { facultyCoordinatorId: user.userId } }
      ];
    } else if (requestedRole === "CLUB") {
      whereClause.clubId = user.userId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        club: true,
        venue: true,
        currentHandlers: {
          include: {
            handler: {
              select: {
                userId: true,
                name: true,
                email: true,
                roles: {
                  select: { role: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ success: true, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingId: Number(id) },
      include: {
        club: true,
        venue: true,
        currentHandlers: {
          include: {
            handler: {
              select: {
                userId: true,
                name: true,
                email: true,
                roles: {
                  select: { role: true }
                }
              }
            }
          }
        },
        logs: {
          include: {
            actor: {
              select: {
                userId: true,
                name: true,
                email: true,
                roles: {
                  select: { role: true }
                }
              }
            }
          },
          orderBy: { timestamp: "asc" }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailableVenues = async (req: Request, res: Response) => {
  try {
    const venues = await prisma.venue.findMany({
      where: {
        isAvailable: true,
        handlers: {
          some: {}
        }
      },
      select: {
        venueId: true,
        name: true,
        venueType: true,
        location: true,
        capacity: true,
        isAvailable: true,
      }
    });
    return res.json({ success: true, venues });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVenueSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        venueId: Number(id),
        status: {
          in: ["APPROVED", "PENDING_COORDINATOR", "PENDING_STAFF", "PENDING_FACULTY", "PENDING_HOD"]
        }
      },
      select: {
        bookingId: true,
        clubId: true,
        eventStart: true,
        eventEnd: true,
        status: true
      }
    });

    return res.json({ success: true, bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};