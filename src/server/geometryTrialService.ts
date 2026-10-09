/**
 * Three complimentary Gemini geometry drawings per browser.
 * Based on Matsuda AI's signed HttpOnly cookie trial, reduced from 5 to 3.
 *
 * IMPORTANT: A signed cookie prevents client-side counter editing, not clearing
 * cookies / switching devices / concurrent requests. This is a limited pilot.
 * Use server-side DB reservations + authenticated identities for paid-scale limits.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const FREE_GEOMETRY_LIMIT = 3;
const COOKIE_NAME = 'congcuvehinh_geometry_trial_v1';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface GeometryTrialStatus {
  enabled: boolean;
  limit: number;
  used: number;
  remaining: number;
}

export function isGeometryTrialEnabled(): boolean {
  return process.env.ENABLE_FREE_GEOMETRY_TRIAL === 'true'
    && Boolean(process.env.GEMINI_API_KEY?.trim())
    && Boolean(process.env.TRIAL_SIGNING_SECRET?.trim());
}

function sign(payload: string): string {
  // Only used after isGeometryTrialEnabled confirms the signing secret exists.
  return createHmac('sha256', process.env.TRIAL_SIGNING_SECRET || '')
    .update(payload)
    .digest('base64url');
}

export function readGeometryTrialUsage(cookieHeader: string | null | undefined): number {
  if (!isGeometryTrialEnabled() || !cookieHeader) return 0;
  try {
    const tokenPart = cookieHeader.split(';').map(part => part.trim())
      .find(part => part.startsWith(`${COOKIE_NAME}=`));
    if (!tokenPart) return 0;
    const token = decodeURIComponent(tokenPart.slice(COOKIE_NAME.length + 1));
    const parts = token.split('.');
    if (parts.length !== 2) return 0;
    const [payloadB64, actual] = parts;
    const expected = sign(payloadB64);
    const actualBuf = Buffer.from(actual);
    const expectedBuf = Buffer.from(expected);
    if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return 0;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload?.v !== 1) return 0;
    const used = Number(payload?.used);
    if (!Number.isInteger(used) || used < 0 || used > FREE_GEOMETRY_LIMIT) return 0;
    return used;
  } catch {
    return 0;
  }
}

export function getGeometryTrialStatus(cookieHeader?: string | null): GeometryTrialStatus {
  const enabled = isGeometryTrialEnabled();
  const used = enabled ? readGeometryTrialUsage(cookieHeader) : 0;
  return {
    enabled, limit: FREE_GEOMETRY_LIMIT, used,
    remaining: enabled ? Math.max(0, FREE_GEOMETRY_LIMIT - used) : 0,
  };
}

export function makeGeometryTrialCookie(used: number): string {
  if (!isGeometryTrialEnabled()) throw new Error('Dùng thử chưa được cấu hình trên máy chủ.');
  const count = Math.max(0, Math.min(FREE_GEOMETRY_LIMIT, Math.floor(used)));
  const payloadB64 = Buffer.from(JSON.stringify({ used: count, v: 1 }), 'utf8').toString('base64url');
  const token = `${payloadB64}.${sign(payloadB64)}`;
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`;
}
