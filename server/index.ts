import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3000;

// API route (local logic)
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server check' });
});

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
