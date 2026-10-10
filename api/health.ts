/** Vercel Function: thử xem backend vẽ hình có được triển khai hay chưa. */
export default {
  fetch(request: Request): Response {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    return Response.json(
      { status: 'ok', service: 'geometry-ai-server', platform: 'vercel' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  },
};
