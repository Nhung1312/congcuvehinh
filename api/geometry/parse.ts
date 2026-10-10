/**
 * Vercel Serverless Function: Gemini 3.8 Flash geometry parser.
 * Supports both Web Standard Request (Fetch API) and Node.js (req, res) runtimes.
 * Never stores or logs API keys. Never uses shared keys.
 */
import { parseGeometryWithGemini } from '../../src/server/geminiGeometryService';

interface ParseOutcome {
  status: number;
  data: Record<string, any>;
}

async function executeGeometryParse(
  promptInput: unknown,
  apiKeyInput: unknown
): Promise<ParseOutcome> {
  if (typeof promptInput !== 'string' || !promptInput.trim() || promptInput.length > 6000) {
    return {
      status: 400,
      data: { error: 'Vui lòng nhập đề bài hình học (từ 1 đến 6000 ký tự).' },
    };
  }

  if (typeof apiKeyInput !== 'string' || !apiKeyInput.trim() || apiKeyInput.length > 256) {
    return {
      status: 400,
      data: { error: 'Vui lòng dán API key Gemini cá nhân để kiểm tra AI.' },
    };
  }

  try {
    const spec = await parseGeometryWithGemini(promptInput.trim(), apiKeyInput.trim());
    if (spec.generationInfo?.source !== 'gemini') {
      throw new Error('Gemini không trả về dữ liệu hình học hợp lệ.');
    }
    return {
      status: 200,
      data: { success: true, spec },
    };
  } catch (err: any) {
    const rawMsg = err?.message || 'Không gọi được Gemini 3.8 Flash.';
    return {
      status: 502,
      data: {
        code: 'GEMINI_UNAVAILABLE',
        error: rawMsg || 'Không gọi được Gemini 3.8 Flash. Kiểm tra API key, hạn mức và quyền truy cập model.',
      },
    };
  }
}

/** Web Standard Request handler (Vercel Fetch / Edge / Modern serverless runtime) */
async function handleWebRequest(request: Request): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Chỉ hỗ trợ POST.' }), {
      status: 405,
      headers,
    });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Nội dung JSON không hợp lệ.' }), {
      status: 400,
      headers,
    });
  }

  const outcome = await executeGeometryParse(body?.prompt, body?.apiKey);
  return new Response(JSON.stringify(outcome.data), {
    status: outcome.status,
    headers,
  });
}

/**
 * Universal default export:
 * Can be called as handler(req, res) in Node.js runtime,
 * or as handler(request) / { fetch: ... } in Web Standard runtime.
 */
export default async function handler(req: any, res?: any) {
  // Check if called with Node.js (req, res) convention
  if (res && typeof res.status === 'function') {
    try {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Cache-Control', 'no-store');
      }
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Chỉ hỗ trợ POST.' });
      }
      const body = req.body || {};
      const outcome = await executeGeometryParse(body?.prompt, body?.apiKey);
      return res.status(outcome.status).json(outcome.data);
    } catch (err: any) {
      return res.status(502).json({
        code: 'GEMINI_UNAVAILABLE',
        error: err?.message || 'Lỗi xử lý request Gemini.',
      });
    }
  }

  // Otherwise, handle as Web Standard Request
  return handleWebRequest(req);
}

// Attach fetch method to match the pattern used in api/health.ts
handler.fetch = (request: Request) => handleWebRequest(request);

// Export named HTTP method for Vercel Web Standard Functions
export async function POST(request: Request): Promise<Response> {
  return handleWebRequest(request);
}
