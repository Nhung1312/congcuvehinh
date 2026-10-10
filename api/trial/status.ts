/** Vercel Node.js Function: return trial status safely, without invoking Gemini. */
import { getGeometryTrialStatus } from '../../src/server/geometryTrialService';

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Chỉ hỗ trợ GET.' });
  try {
    return res.status(200).json(getGeometryTrialStatus(req.headers?.cookie));
  } catch (error) {
    // No secrets are logged or exposed by the status endpoint.
    console.error('[Geometry trial status] Runtime failed:', error instanceof Error ? error.name : 'unknown');
    return res.status(503).json({
      code: 'TRIAL_STATUS_UNAVAILABLE',
      error: 'Chưa đọc được số lượt dùng thử. Vui lòng kiểm tra Vercel runtime.',
    });
  }
}
