/** Trial-status endpoint with lazy-loaded logic to isolate startup errors. */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Chỉ hỗ trợ GET.' }, { status: 405 });
    }
    try {
      const { getGeometryTrialStatus } = await import('../../src/server/geometryTrialService');
      return Response.json(getGeometryTrialStatus(request.headers.get('cookie')), {
        headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
      });
    } catch (error) {
      // No secrets or stack traces are returned. Check Vercel runtime logs for details.
      console.error('[Geometry trial status] Function module/runtime error:', error instanceof Error ? error.name : 'unknown');
      return Response.json({
        code: 'TRIAL_STATUS_UNAVAILABLE',
        error: 'Không đọc được trạng thái dùng thử; cần kiểm tra Vercel Function runtime.',
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
