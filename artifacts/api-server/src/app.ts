import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { mkdirSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Ensure uploads directory exists for static serving
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
mkdirSync(uploadsDir, { recursive: true });

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET ?? "event-platform-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Serve uploaded event posters as static files at /api/uploads/
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

export default app;
