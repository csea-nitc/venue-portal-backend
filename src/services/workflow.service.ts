import { PrismaClient, BookingStatus } from "../generated/prisma/client.js";
import { ActivityAction, Role } from "../generated/prisma/enums.js";

const prisma = new PrismaClient();

const pendingStatuses: BookingStatus[] = [
  BookingStatus.PENDING_COORDINATOR,
  BookingStatus.PENDING_STAFF,
  BookingStatus.PENDING_FACULTY,
  BookingStatus.PENDING_HOD
];

export class WorkflowService {
	static async approveBooking(
		bookingId: number,
		approverId: number,
		remarks: string = "",
	) {
		return await prisma.$transaction(async (tx) => {
			const booking = await tx.booking.findUnique({
				where: { bookingId },
				include: {
					club: true,
					currentHandlers: true,
				},
			});

			if (!booking) {
				throw new Error("Booking not found.");
			}

			const isPending = pendingStatuses.includes(booking.status);
			if (!isPending) {
				throw new Error("Booking is already processed or cancelled.");
			}

			const allowedHandlerIds = booking.currentHandlers.map((ch) => ch.handlerId);
			if (!allowedHandlerIds.includes(approverId)) {
				throw new Error("You are not authorized to approve this request at the current stage.");
			}

			// We need name of the approver for logging purposes
			const user = await tx.user.findUnique({
				where: { userId: approverId },
			});

			const venueHandlers = await tx.venueHandler.findMany({
				where: { venueId: booking.venueId, isActive: true },
				include: { 
					user: {
						include: {
							roles: true
						}
					}
				},
			});

			const staffs = venueHandlers.filter((vh) => vh.user.roles.some((role) => role.role === Role.STAFF_IN_CHARGE));
			const faculties = venueHandlers.filter((vh) => vh.user.roles.some((role) => role.role === Role.FACULTY_IN_CHARGE));

			if (booking.status === BookingStatus.PENDING_COORDINATOR) {
				if (venueHandlers.length === 0) {
					throw new Error(
						"No Venue Handler found to forward the request to. Approval halted.",
					);
				}

				// 1. Remove coordinator from current handlers
				await tx.bookingHandler.deleteMany({
					where: { bookingId },
				});

				// 2. Assign to all active venue staff in charge
				await tx.bookingHandler.createMany({
					data: staffs.map((s) => ({
						bookingId,
						handlerId: s.handlerId,
						handlerRole: Role.STAFF_IN_CHARGE
					})),
				});
				
				// 3. Update status to PENDING_STAFF
				const updatedBooking = await tx.booking.update({
					where: { bookingId },
					data: { status: BookingStatus.PENDING_STAFF },
				});

				await tx.activityLog.create({
					data: {
						bookingId,
						action: ActivityAction.FORWARDED,
						performedBy: approverId,
						role: Role.FACULTY_COORDINATOR,
						timestamp: new Date(),
					},
				});

				return updatedBooking;
			}

			// Conflict check used by two of the below cases
			const conflict = await tx.booking.findFirst({
				where: {
					venueId: booking.venueId,
					status: BookingStatus.APPROVED,
					NOT: { bookingId },
					AND: [
						{ eventStart: { lt: booking.eventEnd } },
						{ eventEnd: { gt: booking.eventStart } },
					],
				},
			});

			if (booking.status === BookingStatus.PENDING_STAFF) {
				if (conflict) {
					throw new Error("CONFLICT: Another request for this venue and time was just approved.");
				}

				// 1. Clear current handlers
				await tx.bookingHandler.deleteMany({
					where: { bookingId },
				});

				// 2. Assign to all active venue faculty in charge
				await tx.bookingHandler.createMany({
					data: faculties.map((s) => ({
						bookingId,
						handlerId: s.handlerId,
						handlerRole: Role.FACULTY_IN_CHARGE
					})),
				});

				// 3. Update status to PENDING_FACULTY
				const updatedBooking = await tx.booking.update({
					where: { bookingId },
					data: { status: BookingStatus.PENDING_FACULTY },
				});

				await tx.activityLog.create({
					data: {
						bookingId,
						action: ActivityAction.APPROVED,
						performedBy: approverId,
						role: Role.STAFF_IN_CHARGE,
						timestamp: new Date(),
					},
				});

				return updatedBooking;
			}

			if (booking.status === BookingStatus.PENDING_FACULTY) {
				if (conflict) {
					throw new Error("CONFLICT: Another request for this venue and time was just approved.");
				}

				const requireHodApproval = process.env.REQUIRE_HOD_APPROVAL === "true";

				// 1. Clear current handlers
				await tx.bookingHandler.deleteMany({
					where: { bookingId },
				});

				if (requireHodApproval) {
					const hod = await tx.user.findMany({
						where: { 
							roles: { 
								some: { 
									role: Role.HOD 
								} 
							}, 
							isActive: true 
						},
					});

					if(!hod) {
						throw new Error("No HOD found to forward the request to. Approval halted.");
					}

					// 2. Assign to HOD
					await tx.bookingHandler.create({
						data: {
							bookingId,
							handlerId: hod[0].userId,
							handlerRole: Role.HOD
						}
					});

					// 3. Update status to PENDING_HOD
					const updatedBooking = await tx.booking.update({
						where: { bookingId },
						data: { status: BookingStatus.PENDING_HOD },
					});

					await tx.activityLog.create({
						data: {
							bookingId,
							performedBy: approverId,
							action: ActivityAction.FORWARDED,
							role: Role.FACULTY_IN_CHARGE,
							timestamp: new Date(),
						},
					});

					return updatedBooking;
				}
				else {
					// HOD approval not required, so we can directly approve the booking
					// 2. Update status to APPROVED
					const updatedBooking = await tx.booking.update({
						where: { bookingId },
						data: { status: BookingStatus.APPROVED, updatedAt: new Date() },
					});

					await tx.activityLog.create({
						data: {
							bookingId,
							performedBy: approverId,
							action: ActivityAction.APPROVED,
							role: Role.FACULTY_IN_CHARGE,
							timestamp: new Date(),
						},
					});

					return updatedBooking;
				}
			}
		

			if (booking.status === BookingStatus.PENDING_HOD) {
				if (conflict) {
					throw new Error("CONFLICT: Another request for this venue and time was just approved.");
				}

				// 1. Clear current handlers
				await tx.bookingHandler.deleteMany({
					where: { bookingId },
				});

				// 2. Update status to APPROVED
				const updatedBooking = await tx.booking.update({
					where: { bookingId },
					data: { status: BookingStatus.APPROVED, updatedAt: new Date() },
				});

				await tx.activityLog.create({
					data: {
						bookingId,
						performedBy: approverId,
						action: ActivityAction.APPROVED,
						role: Role.HOD,
						timestamp: new Date(),
					},
				});

				return updatedBooking;
			}

			throw new Error(
				"Unable to determine status in this approval chain. Validation failed.",
			);
		});
	}

	static async rejectBooking(
		bookingId: number,
		rejecterId: number,
		reason: string,
	) {
		return await prisma.$transaction(async (tx) => {
			const booking = await tx.booking.findUnique({
				where: { bookingId },
				include: { currentHandlers: true },
			});

			if (!booking) {
				throw new Error("Booking not found.");
			}

			const isPending = pendingStatuses.includes(booking.status);

			if (!isPending) {
				throw new Error("Booking is already processed or cancelled.");
			}

			const allowedHandlerIds = booking.currentHandlers.map((ch) => ch.handlerId);
			if (!allowedHandlerIds.includes(rejecterId)) {
				throw new Error("You are not authorized to reject this request.");
			}

			// We need name of the rejecter for logging purposes
			const user = await tx.user.findUnique({
				where: { userId: rejecterId },
			});

			// 0. Get the role of rejecter
			const rejecterRole = await tx.bookingHandler.findFirst({
				where: {
					bookingId,
					handlerId: rejecterId,
				}
			});

			// 1. Clear current handlers
			await tx.bookingHandler.deleteMany({
				where: { bookingId },
			});

			// 2. Update status to REJECTED
			const updatedBooking = await tx.booking.update({
				where: { bookingId },
				data: { status: BookingStatus.REJECTED },
			});

			await tx.activityLog.create({
				data: {
					bookingId,
					performedBy: rejecterId,
					action: ActivityAction.REJECTED,
					role: rejecterRole.handlerRole,
					timestamp: new Date(),
				},
			});

			return updatedBooking;
		});
	}
}
