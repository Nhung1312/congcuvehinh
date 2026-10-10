/**
 * Fit a triangle's actually drawn geometry (including distant constructed intersections)
 * into its SVG. This is a pure helper for rendering, tests and pointer coordinates.
 * The document's vertex coordinates are never mutated to fit the viewport.
 */
import type { Point2D, TriangleData } from '../types';
import {
  midpoint, projectPointToLine, angleBisectorPoint,
  getTriangleCircumcircle, getTriangleIncircle, getThalesPoints,
} from './geometryMath';
import { resolveAuxiliaryPoints } from './resolveAuxiliaryPoints';

export interface GeometryViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const finitePoint = (point: Point2D | undefined | null): point is Point2D =>
  Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));

export function getTriangleVisibleGeometry(
  t: TriangleData,
  vertices: [Point2D, Point2D, Point2D]
): { visiblePoints: Point2D[]; resolved: Record<string, Point2D> } {
  const [a, b, c] = vertices;
  const labels = t.vertexNames?.length === 3 ? t.vertexNames : ['A', 'B', 'C'];
  const base: Record<string, Point2D> = {
    A: a, B: b, C: c, [labels[0]]: a, [labels[1]]: b, [labels[2]]: c,
  };
  const visiblePoints: Point2D[] = [a, b, c];
  const opposite = (vertex: string): [Point2D, Point2D, Point2D] => {
    const index = labels.indexOf(vertex);
    const i = index === -1 ? ['A', 'B', 'C'].indexOf(vertex) : index;
    const position = i < 0 ? 0 : i;
    return [vertices[position], vertices[(position + 1) % 3], vertices[(position + 2) % 3]];
  };

  for (const alt of t.altitudes || []) {
    if (!alt.enabled) continue;
    const [from, left, right] = opposite(alt.fromVertex);
    const foot = projectPointToLine(from, left, right).point;
    base[alt.label || (alt.fromVertex === 'B' ? 'K' : alt.fromVertex === 'C' ? 'L' : 'H')] = foot;
    visiblePoints.push(foot);
  }
  for (const med of t.medians || []) {
    if (!med.enabled) continue;
    const [, left, right] = opposite(med.fromVertex);
    const middle = midpoint(left, right);
    base[med.label || (med.fromVertex === 'B' ? 'N' : med.fromVertex === 'C' ? 'P' : 'M')] = middle;
    visiblePoints.push(middle);
  }
  for (const bis of t.bisectors || []) {
    if (!bis.enabled) continue;
    const [from, left, right] = opposite(bis.fromVertex);
    const foot = angleBisectorPoint(from, left, right);
    base[bis.label || (bis.fromVertex === 'B' ? 'E' : bis.fromVertex === 'C' ? 'F' : 'D')] = foot;
    visiblePoints.push(foot);
  }

  const circum = getTriangleCircumcircle(a, b, c);
  const inCircle = getTriangleIncircle(a, b, c);
  base[t.circumscribedCircle?.centerName || 'O'] = circum.center;
  base.O = circum.center;
  base[t.inscribedCircle?.centerName || 'I'] = inCircle.center;
  base.I = inCircle.center;
  if (t.circumscribedCircle?.enabled) {
    const { center, radius } = circum;
    visiblePoints.push(
      { x: center.x - radius, y: center.y - radius },
      { x: center.x + radius, y: center.y + radius },
    );
  }
  if (t.inscribedCircle?.enabled) {
    const { center, radius } = inCircle;
    visiblePoints.push(
      { x: center.x - radius, y: center.y - radius },
      { x: center.x + radius, y: center.y + radius },
    );
  }

  // All geometrical aliases used by the triangle renderer must resolve from the same points.
  Object.assign(base, {
    D: inCircle.contactPoints.onBC,
    E: inCircle.contactPoints.onCA,
    F: inCircle.contactPoints.onAB,
    M: midpoint(a, b),
    N: midpoint(a, c),
    AB: midpoint(a, b), BC: midpoint(b, c),
    AC: midpoint(a, c), CA: midpoint(c, a),
  });
  // Actual altitudes/bisectors take precedence over in-circle defaults.
  for (const alt of t.altitudes || []) {
    if (!alt.enabled) continue;
    const [from, left, right] = opposite(alt.fromVertex);
    base[alt.label || (alt.fromVertex === 'B' ? 'K' : alt.fromVertex === 'C' ? 'L' : 'H')] =
      projectPointToLine(from, left, right).point;
  }
  for (const med of t.medians || []) {
    if (!med.enabled) continue;
    const [, left, right] = opposite(med.fromVertex);
    base[med.label || (med.fromVertex === 'B' ? 'N' : med.fromVertex === 'C' ? 'P' : 'M')] = midpoint(left, right);
  }
  if (t.thales?.enabled) {
    const cut = getThalesPoints(vertices, t.thales.ratio ?? 0.4, t.thales.cutSide || 'AB-AC', labels);
    base[t.thales.pointMName || 'M'] = cut.M;
    base[t.thales.pointNName || 'N'] = cut.N;
    visiblePoints.push(cut.M, cut.N);
  }
  // Note: hide a tangent direction helper 'x' when it only serves to intersect BC at T.
  // It is still present in 'resolved' so intersection calculation remains correct.
  const resolved = resolveAuxiliaryPoints(base, t.auxPoints || [], circum.radius);
  for (const p of t.auxPoints || []) {
    if (p.showPoint === false && p.showLabel === false) continue;
    if (finitePoint(resolved[p.name])) visiblePoints.push(resolved[p.name]);
  }
  for (const line of t.auxLines || []) {
    if (line.enabled === false) continue;
    if (finitePoint(resolved[line.from])) visiblePoints.push(resolved[line.from]);
    if (finitePoint(resolved[line.to])) visiblePoints.push(resolved[line.to]);
  }
  return { visiblePoints: visiblePoints.filter(finitePoint), resolved };
}

/** Preserve the original view when everything already fits. */
export function fitTriangleViewBox(
  t: TriangleData,
  vertices: [Point2D, Point2D, Point2D],
  width: number,
  height: number,
  padding = 36,
): GeometryViewBox {
  const standard = { x: 0, y: 0, width, height };
  if (width <= 0 || height <= 0) return standard;
  const { visiblePoints } = getTriangleVisibleGeometry(t, vertices);
  if (visiblePoints.length === 0) return standard;
  let minX = Math.min(...visiblePoints.map(p => p.x));
  let maxX = Math.max(...visiblePoints.map(p => p.x));
  let minY = Math.min(...visiblePoints.map(p => p.y));
  let maxY = Math.max(...visiblePoints.map(p => p.y));
  const safe = Math.max(20, padding);
  if (minX >= safe && maxX <= width - safe && minY >= safe && maxY <= height - safe) return standard;
  minX = Math.min(0, minX - safe);
  maxX = Math.max(width, maxX + safe);
  minY = Math.min(0, minY - safe);
  maxY = Math.max(height, maxY + safe);
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const targetRatio = width / height;
  if (boxWidth / boxHeight > targetRatio) {
    const extra = boxWidth / targetRatio - boxHeight;
    minY -= extra / 2;
    maxY += extra / 2;
  } else {
    const extra = boxHeight * targetRatio - boxWidth;
    minX -= extra / 2;
    maxX += extra / 2;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
