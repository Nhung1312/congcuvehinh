/** Vercel Function: Kiểm tra backend AI đã sẵn sàng hoạt động */
export default async function handler(req: any, res?: any) {
  if (res && typeof res.status === 'function') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 'no-store');
    }
    return res.status(200).json({ status: 'ok', service: 'geometry-ai-server', platform: 'vercel' });
  }
  return Response.json(
    { status: 'ok', service: 'geometry-ai-server', platform: 'vercel' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function GET(): Promise<Response> {
  return Response.json(
    { status: 'ok', service: 'geometry-ai-server', platform: 'vercel' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

