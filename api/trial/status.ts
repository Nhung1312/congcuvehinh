/** Current three-drawing trial count. Never returns the shared API key. */
import { getGeometryTrialStatus } from '../../src/server/geometryTrialService';

export default {
  fetch(request: Request): Response {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Chỉ hỗ trợ GET.' }, { status: 405 });
    }
    return Response.json(
      getGeometryTrialStatus(request.headers.get('cookie')),
      { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } }
    );
  },
};
