import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";

const router: IRouter = Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
mkdirSync(uploadsDir, { recursive: true });

/**
 * Configure multer for disk storage with unique filenames
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});

/**
 * POST /api/upload
 * Upload an event poster/image
 * Returns the URL to access the uploaded file
 */
router.post("/", upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ imageUrl, message: "Image uploaded successfully" });
});

export default router;
