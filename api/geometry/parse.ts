/**
 * Gemini geometry endpoint for Vercel Node.js Functions.
 * Match the Web Fetch signature already used by api/health.ts.
 * Import Gemini lazily so module loading errors return diagnostic JSON
 * instead of crashing the entire serverless function at startup.
 *
 * Never echo, store or log a user's API key.
 */

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function safeErrorMessage(error: unknown, apiKey: string): string {
  const raw = error instanceof Error ? error.message : 'Yêu cầu Gemini thất bại.';
  // Extra protection in case the upstream provider includes the credential.
  const sanitized = apiKey ? raw.split(apiKey).join('[REDACTED]') : raw;
  return sanitized.slice(0, 1200);
}

async function loadGeminiService() {
  // A dynamic import permits a clean SERVICE_INIT_FAILED response if runtime
  // dependency resolution fails on Vercel, rather than FUNCTION_INVOCATION_FAILED.
  return import('../../src/server/geminiGeometryService');
}

async function handle(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      // GET is a no-key diagnostic and makes NO calls to Gemini's API.
      try {
        const module = await loadGeminiService();
        if (typeof module.parseGeometryWithGemini !== 'function') {
          return json({ status: 'unavailable', code: 'SERVICE_INIT_FAILED' }, 503);
        }
        return json({
          status: 'ok',
          service: 'geometry-ai-parser',
          model: 'gemini-3.8-flash',
          geminiApi: 'not_checked',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // GET has no credentials, but still exclude paths and arbitrary long messages.
        const detail = message.slice(0, 350).replace(/AIza[\\w-]+/g, '[REDACTED]');
        return json({
          status: 'unavailable',
          code: 'SERVICE_INIT_FAILED',
          error: 'Vercel không nạp được dịch vụ Gemini.',
          diagnostic: detail,
        }, 503);
      }
    }

    if (request.method !== 'POST') {
      return json({ code: 'METHOD_NOT_ALLOWED', error: 'Chỉ hỗ trợ GET kiểm tra và POST phân tích hình.' }, 405);
    }

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return json({ code: 'INVALID_JSON', error: 'Nội dung yêu cầu không hợp lệ.' }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ code: 'INVALID_JSON', error: 'Nội dung JSON không hợp lệ.' }, 400);
    }

    const prompt = body.prompt;
    const key = body.apiKey;
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 6000) {
      return json({ code: 'INVALID_PROMPT', error: 'Vui lòng nhập đề bài từ 1 đến 6000 ký tự.' }, 400);
    }
    if (typeof key !== 'string' || !key.trim() || key.length > 256) {
      return json({ code: 'MISSING_API_KEY', error: 'Vui lòng nhập API key Gemini cá nhân.' }, 400);
    }

    let parseGeometryWithGemini: typeof import('../../src/server/geminiGeometryService').parseGeometryWithGemini;
    try {
      ({ parseGeometryWithGemini } = await loadGeminiService());
    } catch {
      return json({
        code: 'SERVICE_INIT_FAILED',
        error: 'Dịch vụ Gemini không khởi tạo trên Vercel. Cần kiểm tra Function Logs.',
      }, 503);
    }

    try {
      const spec = await parseGeometryWithGemini(prompt.trim(), key.trim());
      if (spec.generationInfo?.source !== 'gemini') {
        return json({
          code: 'INVALID_AI_RESULT',
          error: 'Gemini không trả về dữ liệu GeometrySpecification hợp lệ.',
        }, 502);
      }
      return json({ success: true, spec });
    } catch (error) {
      return json({
        code: 'GEMINI_REQUEST_FAILED',
        error: safeErrorMessage(error, key.trim()),
      }, 502);
    }
  } catch {
    // Never log request bodies or keys in error handling.
    return json({
      code: 'GEOMETRY_API_ERROR',
      error: 'API vẽ hình gặp lỗi nội bộ. Cần xem Function Logs trên Vercel.',
    }, 500);
  }
}

export default {
  fetch: handle,
};
