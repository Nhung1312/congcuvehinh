import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { parseGeometryWithGemini } from './src/server/geminiGeometryService';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes go here FIRST
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'geometry-ai-server' });
  });

  app.post('/api/geometry/parse', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập đề bài hình học.' });
      }

      const spec = await parseGeometryWithGemini(prompt.trim());
      return res.json({ success: true, spec });
    } catch (err: any) {
      console.error('[API /api/geometry/parse Error]:', err);
      return res.status(500).json({
        error: err?.message || 'Lỗi khi phân tích đề bài với Gemini AI.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
