/** Vercel Node.js API: Gemini 3.8 Flash only, using a personal API key per request. */
import { parseGeometryWithGemini } from '../../src/server/geminiGeometryService';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ hỗ trợ POST.' });
  const { prompt, apiKey } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000) {
    return res.status(400).json({ error: 'Đề bài phải có từ 1 đến 6000 ký tự.' });
  }
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.length > 256) {
    return res.status(400).json({ error: 'Vui lòng dán API key Gemini cá nhân để kiểm tra AI.' });
  }
  try {
    const spec = await parseGeometryWithGemini(prompt.trim(), apiKey.trim());
    if (spec.generationInfo?.source !== 'gemini') {
      throw new Error('Gemini không trả về dữ liệu hình học.');
    }
    return res.status(200).json({ success: true, spec });
  } catch {
    return res.status(502).json({
      code: 'GEMINI_UNAVAILABLE',
      error: 'Không gọi được Gemini 3.8 Flash. Kiểm tra API key, hạn mức và quyền truy cập model.',
    });
  }
}
