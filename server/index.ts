import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authRoutes from "./routes/auth.js";
import georoutes from "./routes/georoutes.js";
import userRoutes from "./routes/userRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import chatRoutes from "./routes/chat.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { uploadToMinIO } from "./controllers/uploadController.js";
import { downloadFromMinIO } from "./controllers/downloadController.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

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
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/actions", authMiddleware, feedRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);

// Upload endpoint using MinIO
app.post("/api/upload", authMiddleware, uploadToMinIO);

// Download endpoint for serving files from MinIO
app.get("/uploads/:path", downloadFromMinIO);

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

// Proxy WebSocket upgrade requests on /ws to the WS server
app.use(
  "/ws",
  createProxyMiddleware({
    target: "ws://localhost:8000", // your WS backend
    ws: true,
    changeOrigin: true,
    pathRewrite: {
      "^/ws": "", // optional: strip `/ws` before sending to target
    },
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
