/** Deterministic, geometry-preserving label layout for school diagrams.
 * Moves only text, never mathematical points, segments, arcs or markers.
 * SVG dimensions are estimated here, then the browser measures final bounds.
 */
import type { Point2D } from '../types';

export interface LayoutLabel {
  name: string;
  point: Point2D;
}
export interface LayoutSegment { start: Point2D; end: Point2D }
export interface LayoutLabelPosition {
  x: number;
  y: number;
  textAnchor: 'middle';
  dominantBaseline: 'central';
}
interface Rect { x1: number; x2: number; y1: number; y2: number }

function inside(p: Point2D, r: Rect, margin = 0): boolean {
  return p.x >= r.x1 - margin && p.x <= r.x2 + margin &&
    p.y >= r.y1 - margin && p.y <= r.y2 + margin;
}
function overlaps(a: Rect, b: Rect, margin = 0): boolean {
  return a.x1 - margin < b.x2 && a.x2 + margin > b.x1 &&
    a.y1 - margin < b.y2 && a.y2 + margin > b.y1;
}
function segmentHitsRect(segment: LayoutSegment, r: Rect): boolean {
  const { start: a, end: b } = segment;
  if (inside(a, r) || inside(b, r)) return true;
  const dx = b.x - a.x, dy = b.y - a.y;
  let low = 0, high = 1;
  // Parametric segment/rectangle intersection (Liang-Barsky).
  for (const [p, q] of [
    [-dx, a.x - r.x1], [dx, r.x2 - a.x],
    [-dy, a.y - r.y1], [dy, r.y2 - a.y],
  ]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) low = Math.max(low, t);
      else high = Math.min(high, t);
      if (low > high) return false;
    }
  }
  return true;
}

/**
 * Ordered priority: vertices first, then dependent/auxiliary points.
 * Recomputed from live points after dragging; no mutation of ChartDocument.
 */
export function layoutGeometryPointLabels(
  labels: LayoutLabel[],
  segments: LayoutSegment[],
  obstacles: Point2D[],
  fontSize = 14
): Record<string, LayoutLabelPosition> {
  const result: Record<string, LayoutLabelPosition> = {};
  const taken: Rect[] = [];
  if (labels.length === 0) return result;
  const valid = labels.filter(({ name, point }) => Boolean(name) &&
    Number.isFinite(point.x) && Number.isFinite(point.y));
  const cloud = obstacles.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const center = cloud.length ? {
    x: cloud.reduce((sum, p) => sum + p.x, 0) / cloud.length,
    y: cloud.reduce((sum, p) => sum + p.y, 0) / cloud.length,
  } : { x: 0, y: 0 };
  const directions = [
    [1, -1], [-1, -1], [1, 1], [-1, 1],
    [0, -1], [0, 1], [1, 0], [-1, 0],
  ];
  valid.forEach(({ name, point }) => {
    if (result[name]) return;
    let best: { x: number; y: number; rect: Rect; score: number } | null = null;
    const labelWidth = Math.max(fontSize * 0.65, name.length * fontSize * 0.6);
    const hw = labelWidth / 2 + 1.5, hh = fontSize * 0.59 + 1.5;
    const outgoingX = point.x - center.x, outgoingY = point.y - center.y;
    const outLen = Math.hypot(outgoingX, outgoingY) || 1;
    directions.forEach(([vx, vy], i) => {
      const len = Math.hypot(vx, vy);
      // Offset accounts for text extents; anchor remains near its point.
      const x = point.x + (vx / len) * (hw + 9);
      const y = point.y + (vy / len) * (hh + 9);
      const rect = { x1: x - hw, x2: x + hw, y1: y - hh, y2: y + hh };
      let score = i * 0.015;
      for (const other of cloud) {
        if (inside(other, rect, 4)) score += 500;
      }
      for (const line of segments) {
        if (segmentHitsRect(line, rect)) score += 135;
      }
      for (const existing of taken) {
        if (overlaps(rect, existing, 3)) score += 900;
      }
      score -= ((vx / len) * outgoingX + (vy / len) * outgoingY) / outLen * 2;
      if (!best || score < best.score) best = { x, y, rect, score };
    });
    if (best) {
      const chosen = best as { x: number; y: number; rect: Rect };
      result[name] = {
        x: chosen.x, y: chosen.y,
        textAnchor: 'middle', dominantBaseline: 'central',
      };
      taken.push(chosen.rect);
    }
  });
  return result;
}
