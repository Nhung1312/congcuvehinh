import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { parseGeometryWithGemini } from './src/server/geminiGeometryService';
import { getGeometryTrialStatus, makeGeometryTrialCookie } from './src/server/geometryTrialService';

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

  app.get('/api/trial/status', (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    return res.json(getGeometryTrialStatus(req.headers.cookie));
  });

  app.post('/api/geometry/parse', async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    const { prompt, apiKey } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000) {
      return res.status(400).json({ error: 'Đề bài phải có từ 1 đến 6000 ký tự.' });
    }
    if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 256)) {
      return res.status(400).json({ error: 'API key không hợp lệ.' });
    }
    const customKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    const useTrial = !customKey;
    const trial = getGeometryTrialStatus(req.headers.cookie);

    if (useTrial && !trial.enabled) {
      return res.status(403).json({
        code: 'TRIAL_NOT_CONFIGURED',
        error: 'Chưa bật trải nghiệm 3 lượt Gemini miễn phí. Vui lòng nhập API key cá nhân.',
        trial,
      });
    }
    if (useTrial && trial.remaining <= 0) {
      return res.status(402).json({
        code: 'TRIAL_LIMIT_REACHED',
        error: 'Bạn đã dùng hết 3 lượt vẽ Gemini miễn phí. Hãy nhập API key cá nhân để tiếp tục.',
        trial,
      });
    }
    try {
      const spec = await parseGeometryWithGemini(prompt.trim(), customKey || undefined, useTrial);
      if (spec.generationInfo?.source !== 'gemini') {
        throw new Error('Gemini chưa hoàn tất yêu cầu.');
      }
      if (useTrial) {
        const nextUsed = trial.used + 1;
        res.setHeader('Set-Cookie', makeGeometryTrialCookie(nextUsed));
        return res.json({
          success: true, spec,
          trial: { ...trial, used: nextUsed, remaining: trial.limit - nextUsed },
        });
      }
      return res.json({ success: true, spec, trial });
    } catch {
      return res.status(502).json({
        code: 'GEMINI_UNAVAILABLE',
        error: 'Gemini 3.8 Flash không thực hiện được yêu cầu. Kiểm tra API key hoặc hạn mức.',
        trial,
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
