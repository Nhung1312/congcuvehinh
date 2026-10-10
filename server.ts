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
    res.setHeader('Cache-Control', 'no-store');
    const { prompt, apiKey } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000)
      return res.status(400).json({ error: 'Đề bài phải có từ 1 đến 6000 ký tự.' });
    if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.length > 256)
      return res.status(400).json({ error: 'Vui lòng nhập API key Gemini cá nhân.' });
    try {
      const spec = await parseGeometryWithGemini(prompt.trim(), apiKey.trim());
      if (spec.generationInfo?.source !== 'gemini') throw new Error('Gemini không trả về kết quả.');
      return res.json({ success: true, spec });
    } catch {
      return res.status(502).json({ code: 'GEMINI_UNAVAILABLE', error: 'Không gọi được Gemini 3.8 Flash bằng API key này.' });
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
