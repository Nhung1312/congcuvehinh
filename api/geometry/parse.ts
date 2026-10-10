/** Vercel Node.js Function for Gemini BYOK plus three free browser drawings. */
import { parseGeometryWithGemini } from '../../src/server/geminiGeometryService';
import { getGeometryTrialStatus, makeGeometryTrialCookie } from '../../src/server/geometryTrialService';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ hỗ trợ POST.' });

  const { prompt, apiKey } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000)
    return res.status(400).json({ error: 'Đề bài phải có từ 1 đến 6000 ký tự.' });
  if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 256))
    return res.status(400).json({ error: 'API key không hợp lệ.' });

  const customKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  const useTrial = !customKey;
  const trial = getGeometryTrialStatus(req.headers?.cookie);

  if (useTrial && !trial.enabled) return res.status(403).json({
    code: 'TRIAL_NOT_CONFIGURED',
    error: 'Chưa bật 3 lượt Gemini miễn phí. Hãy nhập API key cá nhân.', trial,
  });
  if (useTrial && trial.remaining <= 0) return res.status(402).json({
    code: 'TRIAL_LIMIT_REACHED',
    error: 'Bạn đã hết 3 lượt vẽ Gemini miễn phí. Hãy nhập API key cá nhân.', trial,
  });

  try {
    const spec = await parseGeometryWithGemini(prompt.trim(), customKey || undefined, useTrial);
    if (spec.generationInfo?.source !== 'gemini') throw new Error('Gemini did not return an AI result');

    if (useTrial) {
      const used = trial.used + 1;
      const nextTrial = { ...trial, used, remaining: trial.limit - used };
      res.setHeader('Set-Cookie', makeGeometryTrialCookie(used));
      return res.status(200).json({ success: true, spec, trial: nextTrial });
    }
    return res.status(200).json({ success: true, spec, trial });
  } catch {
    return res.status(502).json({
      code: 'GEMINI_UNAVAILABLE',
      error: 'Không gọi được Gemini 3.8 Flash. Hãy kiểm tra key, quyền truy cập model hoặc quota.',
      trial,
    });
  }
}
