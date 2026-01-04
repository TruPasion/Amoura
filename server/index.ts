import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authRoutes from "./routes/auth";
import georoutes from "./routes/georoutes";
import userRoutes from "./routes/userRoutes";
import feedRoutes from "./routes/feedRoutes";
import chatRoutes from "./routes/chat";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authMiddleware } from "./middlewares/authMiddleware";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import gcsRoutes from "./routes/gcs";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

const uploadDir = join(__dirname, "../client/public/uploads");
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
app.use("/api/gis", authMiddleware, rateLimitMiddleware, georoutes);
app.use("/api/users", authMiddleware, rateLimitMiddleware, userRoutes);
app.use("/api/actions", authMiddleware, rateLimitMiddleware, feedRoutes);
app.use("/api/chat", authMiddleware, rateLimitMiddleware, chatRoutes);
// Serve static files from the uploads directory

// GCS upload/view endpoints
app.use("/api/gcs", authMiddleware, gcsRoutes);

// Handle 404 for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found checking hmr" });
});

console.log("NODE_ENV:", process.env.NODE_ENV);

if (process.env.NODE_ENV === "production") {
  // Production: serve built static files
  app.use(express.static(join(__dirname, "../client/dist")));

  // SPA fallback - serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(join(__dirname, "../client/dist/index.html"));
  });
} else {
  // Development: proxy to Vite dev server
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
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
