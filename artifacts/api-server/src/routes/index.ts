import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import eventsRouter from "./events";
import bookingsRouter from "./bookings";
import eventBookingsRouter from "./eventBookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/events", eventsRouter);
router.use("/events", eventBookingsRouter);
router.use("/bookings", bookingsRouter);

export default router;
