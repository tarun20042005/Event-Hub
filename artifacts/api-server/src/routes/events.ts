import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { eventsTable, usersTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  price: z.coerce.number().min(0),
});

/**
 * Helper to format an event with organizer name
 */
async function formatEvent(event: typeof eventsTable.$inferSelect, organizerName?: string) {
  if (!organizerName) {
    const [org] = await db.select().from(usersTable).where(eq(usersTable.id, event.organizerId)).limit(1);
    organizerName = org?.name ?? "Unknown";
  }
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    price: parseFloat(event.price),
    organizerId: event.organizerId,
    organizerName,
  };
}

/**
 * GET /api/events
 * List all events with optional search and date filter
 */
router.get("/", async (req: Request, res: Response) => {
  const { search, date } = req.query as { search?: string; date?: string };

  let query = db.select().from(eventsTable);

  const allEvents = await query;

  let filtered = allEvents;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(s) || e.location.toLowerCase().includes(s)
    );
  }
  if (date) {
    filtered = filtered.filter(e => e.date === date);
  }

  const formatted = await Promise.all(filtered.map(e => formatEvent(e)));
  res.json(formatted);
});

/**
 * GET /api/events/my
 * Get events created by the current organizer
 */
router.get("/my", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can access this" });
    return;
  }

  const events = await db.select().from(eventsTable).where(eq(eventsTable.organizerId, userId));
  const [org] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const formatted = events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    time: e.time,
    location: e.location,
    price: parseFloat(e.price),
    organizerId: e.organizerId,
    organizerName: org?.name ?? "Unknown",
  }));

  res.json(formatted);
});

/**
 * GET /api/events/:eventId
 * Get a specific event by ID
 */
router.get("/:eventId", async (req: Request, res: Response) => {
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

  res.json(await formatEvent(event));
});

/**
 * POST /api/events
 * Create a new event (organizer only)
 */
router.post("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can create events" });
    return;
  }

  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }

  const { title, description, date, time, location, price } = parsed.data;

  const [event] = await db.insert(eventsTable).values({
    title,
    description,
    date,
    time,
    location,
    price: price.toString(),
    organizerId: userId,
  }).returning();

  res.status(201).json(await formatEvent(event));
});

/**
 * PUT /api/events/:eventId
 * Update an event (organizer only, must own the event)
 */
router.put("/:eventId", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can update events" });
    return;
  }

  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }

  const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (existing.organizerId !== userId) {
    res.status(403).json({ error: "You can only update your own events" });
    return;
  }

  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { title, description, date, time, location, price } = parsed.data;

  const [updated] = await db.update(eventsTable)
    .set({ title, description, date, time, location, price: price.toString() })
    .where(eq(eventsTable.id, eventId))
    .returning();

  res.json(await formatEvent(updated));
});

/**
 * DELETE /api/events/:eventId
 * Delete an event (organizer only, must own the event)
 */
router.delete("/:eventId", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const role = (req.session as any).role;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role !== "organizer") {
    res.status(403).json({ error: "Only organizers can delete events" });
    return;
  }

  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }

  const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (existing.organizerId !== userId) {
    res.status(403).json({ error: "You can only delete your own events" });
    return;
  }

  await db.delete(eventsTable).where(eq(eventsTable.id, eventId));
  res.json({ message: "Event deleted successfully" });
});

export default router;
