import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { bookingsTable, eventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/**
 * GET /api/events/:eventId/bookings
 * Get all bookings for a specific event (organizer only, must own event)
 */
router.get("/:eventId/bookings", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can view event bookings" });
    return;
  }

  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.organizerId !== userId) {
    res.status(403).json({ error: "You can only view bookings for your own events" });
    return;
  }

  const [organizer] = await db.select().from(usersTable).where(eq(usersTable.id, event.organizerId)).limit(1);

  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.eventId, eventId));

  const formatted = await Promise.all(bookings.map(async (booking) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId)).limit(1);
    return {
      id: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      ticketCount: booking.ticketCount,
      totalPrice: parseFloat(booking.totalPrice),
      paymentStatus: booking.paymentStatus,
      qrCodeData: booking.qrCodeData,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "Unknown",
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        price: parseFloat(event.price),
        organizerId: event.organizerId,
        organizerName: organizer?.name ?? "Unknown",
      },
    };
  }));

  res.json(formatted);
});

export default router;
