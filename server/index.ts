import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = 3000;

// Add this middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// API route (local logic)
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server check' });
});

// Mount your API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // base path

// Handle 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found checking hmr' });
});

// Proxy all frontend routes to Vite dev server
app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  })
);



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
