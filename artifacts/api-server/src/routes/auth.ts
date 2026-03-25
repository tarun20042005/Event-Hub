import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["attendee", "organizer"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["attendee", "organizer"]),
});

/**
 * POST /api/auth/register
 * Register a new user (attendee or organizer)
 */
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    password: hashedPassword,
    role,
  }).returning();

  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    message: "Registered successfully",
  });
});

/**
 * POST /api/auth/login
 * Login with email, password, and role
 */
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password, role } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.role !== role) {
    res.status(401).json({ error: `This account is registered as a ${user.role}, not ${role}` });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    message: "Logged in successfully",
  });
});

/**
 * POST /api/auth/logout
 * Destroy the current session
 */
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

/**
 * GET /api/auth/me
 * Return current authenticated user info
 */
router.get("/me", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
