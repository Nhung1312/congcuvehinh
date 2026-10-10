import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { parseGeometryWithGemini } from './src/server/geminiGeometryService';
import { validateGeometryImageInput } from './src/ai/geometryImageInput';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '3mb' }));

  // API routes go here FIRST
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'geometry-ai-server' });
  });

  app.post('/api/geometry/parse', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { prompt, apiKey, image: imageInput } = req.body || {};
    let image;
    try {
      image = validateGeometryImageInput(imageInput);
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Ảnh đề không hợp lệ.' });
    }
    if (typeof prompt !== 'string' || prompt.length > 6000 || (!prompt.trim() && !image)) {
      return res.status(400).json({ error: 'Hãy nhập đề bài hoặc dán/chọn một ảnh đề (tối đa 6000 ký tự).' });
    }

    const clientKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : undefined;
    if (!clientKey && !process.env.GEMINI_API_KEY?.trim()) {
      return res.status(400).json({
        error: 'Chưa có API key Gemini. Vui lòng dán API key cá nhân vào ô nhập liệu hoặc cấu hình GEMINI_API_KEY.',
      });
    }

    const keySourceLabel = clientKey ? 'API key cá nhân' : 'API key hệ thống (server env)';
    console.log(`[API /geometry/parse] Bắt đầu gọi Gemini 3.8 Flash (${keySourceLabel})...`);

    try {
      const spec = await parseGeometryWithGemini(prompt.trim(), clientKey, image);
      if (spec.generationInfo?.source !== 'gemini') {
        throw new Error('Gemini không trả về kết quả.');
      }
      console.log(`[API /geometry/parse] Thành công: "${spec.title}" (Model: ${spec.generationInfo?.model || 'gemini-3.8-flash'})`);
      return res.json({ success: true, spec });
    } catch (err: any) {
      console.error('[API /geometry/parse] Lỗi:', err?.message || err);
      let errorMsg = err?.message || 'Không gọi được Gemini 3.8 Flash.';
      if (clientKey) {
        errorMsg = errorMsg.split(clientKey).join('***');
      }
      return res.status(502).json({
        code: 'GEMINI_UNAVAILABLE',
        error: errorMsg,
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
