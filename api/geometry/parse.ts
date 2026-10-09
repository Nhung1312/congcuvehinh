/**
 * Vercel Function: Gemini Geometry BYOK and 3 complimentary AI drawings.
 * Free drawings are counted after a successful Gemini result, using a signed
 * HttpOnly cookie like Matsuda AI. This does not prevent cookie deletion,
 * simultaneous requests, or switching devices; paid-scale anti-abuse requires DB.
 */
import { parseGeometryWithGemini } from '../../src/server/geminiGeometryService';
import {
  getGeometryTrialStatus,
  makeGeometryTrialCookie,
} from '../../src/server/geometryTrialService';

const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' };

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Chỉ hỗ trợ POST.' }, { status: 405, headers });
    }
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Nội dung JSON không hợp lệ.' }, { status: 400, headers }); }

    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Thiếu thông tin yêu cầu.' }, { status: 400, headers });
    }
    const { prompt, apiKey } = body as { prompt?: unknown; apiKey?: unknown };
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000) {
      return Response.json({ error: 'Đề bài phải có từ 1 đến 6000 ký tự.' }, { status: 400, headers });
    }
    if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 256)) {
      return Response.json({ error: 'API key không hợp lệ.' }, { status: 400, headers });
    }

    const customKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    const useTrial = !customKey;
    const trial = getGeometryTrialStatus(request.headers.get('cookie'));

    if (useTrial && !trial.enabled) {
      return Response.json({
        code: 'TRIAL_NOT_CONFIGURED',
        error: 'Chưa bật trải nghiệm 3 lượt Gemini miễn phí trên Vercel. Vui lòng nhập API key cá nhân.',
        trial,
      }, { status: 403, headers });
    }
    if (useTrial && trial.remaining <= 0) {
      return Response.json({
        code: 'TRIAL_LIMIT_REACHED',
        error: 'Bạn đã dùng hết 3 lượt vẽ Gemini miễn phí. Hãy nhập API key cá nhân để tiếp tục.',
        trial,
      }, { status: 402, headers });
    }

    try {
      // Shared system key is NEVER used on BYOK requests.
      const spec = await parseGeometryWithGemini(
        prompt.trim(), customKey || undefined, useTrial
      );
      if (spec.generationInfo?.source !== 'gemini') {
        throw new Error('Gemini chưa hoàn tất yêu cầu.');
      }

      if (useTrial) {
        const nextUsed = trial.used + 1;
        const nextTrial = { ...trial, used: nextUsed, remaining: trial.limit - nextUsed };
        const response = Response.json({ success: true, spec, trial: nextTrial }, { headers });
        response.headers.set('Set-Cookie', makeGeometryTrialCookie(nextUsed));
        return response;
      }
      return Response.json({ success: true, spec, trial }, { headers });
    } catch {
      // Failed Gemini requests never spend a free trial credit or leak API errors/key.
      return Response.json({
        code: 'GEMINI_UNAVAILABLE',
        error: 'Gemini 3.8 Flash không thực hiện được yêu cầu. Kiểm tra API key, quyền truy cập model hoặc quota.',
        trial,
      }, { status: 502, headers });
    }
  },
};
