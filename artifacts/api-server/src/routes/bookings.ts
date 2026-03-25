import { Router, type IRouter, type Request, type Response } from "express";
import QRCode from "qrcode";
import { db } from "@workspace/db";
import { bookingsTable, eventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createBookingSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  ticketCount: z.coerce.number().int().positive(),
});

/**
 * Helper: Format a booking with event and user details
 */
async function formatBooking(booking: typeof bookingsTable.$inferSelect) {
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, booking.eventId)).limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId)).limit(1);
  const [organizer] = event
    ? await db.select().from(usersTable).where(eq(usersTable.id, event.organizerId)).limit(1)
    : [null];

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
    event: event ? {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      price: parseFloat(event.price),
      organizerId: event.organizerId,
      organizerName: organizer?.name ?? "Unknown",
    } : null,
  };
}

/**
 * GET /api/bookings
 * List the current user's bookings
 */
router.get("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, userId));
  const formatted = await Promise.all(bookings.map(formatBooking));
  res.json(formatted);
});

/**
 * POST /api/bookings
 * Create a new booking for an event (attendee only)
 * Generates QR code with booking ID and payment status
 */
router.post("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "attendee") {
    res.status(403).json({ error: "Only attendees can book tickets" });
    return;
  }

  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: eventId and ticketCount are required" });
    return;
  }

  const { eventId, ticketCount } = parsed.data;

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const totalPrice = parseFloat(event.price) * ticketCount;

  // Insert booking with a placeholder QR code initially
  const [booking] = await db.insert(bookingsTable).values({
    userId,
    eventId,
    ticketCount,
    totalPrice: totalPrice.toString(),
    paymentStatus: "Pending",
    qrCodeData: "placeholder",
  }).returning();

  // Generate QR code with booking details
  const qrContent = JSON.stringify({
    bookingId: booking.id,
    paymentStatus: "Pending",
    event: event.title,
    tickets: ticketCount,
    totalPrice: `₹${totalPrice}`,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrContent, { width: 300, margin: 2 });

  // Update with the real QR code
  const [updated] = await db.update(bookingsTable)
    .set({ qrCodeData: qrCodeDataUrl })
    .where(eq(bookingsTable.id, booking.id))
    .returning();

  res.status(201).json(await formatBooking(updated));
});

/**
 * GET /api/bookings/:bookingId
 * Get a specific booking's details
 */
router.get("/:bookingId", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const bookingId = parseInt(req.params.bookingId);
  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Attendees can only see their own bookings; organizers can see bookings for their events
  if (role === "attendee" && booking.userId !== userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (role === "organizer") {
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, booking.eventId)).limit(1);
    if (!event || event.organizerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  res.json(await formatBooking(booking));
});

/**
 * POST /api/bookings/:bookingId/scan
 * Simulate QR scan: mark booking payment as Paid (organizer only)
 */
router.post("/:bookingId/scan", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can scan QR codes" });
    return;
  }

  const bookingId = parseInt(req.params.bookingId);
  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (booking.paymentStatus === "Paid") {
    res.status(400).json({ error: "This booking has already been paid" });
    return;
  }

  // Verify organizer owns the event
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, booking.eventId)).limit(1);
  if (!event || event.organizerId !== userId) {
    res.status(403).json({ error: "You can only scan bookings for your own events" });
    return;
  }

  // Update QR code with paid status
  const qrContent = JSON.stringify({
    bookingId: booking.id,
    paymentStatus: "Paid",
    event: event.title,
    tickets: booking.ticketCount,
    totalPrice: `₹${booking.totalPrice}`,
  });
  const newQrCode = await QRCode.toDataURL(qrContent, { width: 300, margin: 2 });

  const [updated] = await db.update(bookingsTable)
    .set({ paymentStatus: "Paid", qrCodeData: newQrCode })
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  res.json(await formatBooking(updated));
});

export default router;
