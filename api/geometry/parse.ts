/**
 * Vercel Function: API Gemini 3.8 Flash.
 * BYOK: nhận key riêng theo từng HTTPS request, KHÔNG lưu key/log request.
 */
import { parseGeometryWithGemini } from '../../src/server/geminiGeometryService';

const headers = { 'Cache-Control': 'no-store' };

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Chỉ hỗ trợ POST.' }, { status: 405, headers });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Nội dung JSON không hợp lệ.' }, { status: 400, headers });
    }
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

    try {
      const spec = await parseGeometryWithGemini(prompt.trim(), apiKey as string | undefined);
      return Response.json({ success: true, spec }, { headers });
    } catch (error: unknown) {
      // Thông báo từ service đã được kiểm soát; không trả dữ liệu chứa key upstream.
      const message = error instanceof Error ? error.message : 'Máy chủ Gemini đang lỗi.';
      return Response.json({ error: message }, { status: 502, headers });
    }
  },
};
