import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authRoutes from "./routes/auth";
import georoutes from "./routes/georoutes";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authMiddleware } from "./middlewares/authMiddleware";
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage }); // Create the upload instance

const app = express();
const PORT = 3000;


const uploadDir = join(__dirname, '../client/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Add this middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// API route (local logic)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from server check" });
});

// Mount your API routes
app.use("/api/auth", authRoutes);
app.use("/api/gis", authMiddleware, georoutes);
app.use("/api/users", authMiddleware, userRoutes); // base path

// Upload endpoint
import type { Request, Response } from "express";

app.post(
  "/api/upload",
  upload.single("image"),
  (req: express.Request, res: express.Response): void => {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    res.json({
      message: "File uploaded successfully",
      fileUrl: `/uploads/${req.file.filename}`,
    });
  }
);

// Handle 404 for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found checking hmr" });
});

// Proxy all frontend routes to Vite dev server
app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:5173",
    changeOrigin: true,
    ws: true,
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
