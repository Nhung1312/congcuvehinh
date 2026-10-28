/**
 * geometrySceneBounds.ts - Tính toán Bounding Box và ViewBox SVG toàn cảnh
 * Đảm bảo các điểm phụ ngoài hình (như giao điểm T của tiếp tuyến và BC)
 * và đường tròn, đường phụ đều hiển thị đầy đủ, không bị cắt mép.
 */
import type { Point2D, CustomAuxPoint, CustomAuxLine, TriangleData, GeometryData } from '../types';
import {
  BoundingBox,
  calculatePointsBoundingBox,
  getExpandedSvgViewBox,
  getTriangleCircumcircle,
  getTriangleIncircle,
  midpoint,
  projectPointToLine,
  angleBisectorPoint,
  computeReflectedPoints,
} from './geometryMath';
import { resolveAuxiliaryPoints } from './resolveAuxiliaryPoints';

export interface SceneBoundingBoxResult extends BoundingBox {
  viewBox: string;
  expandedViewBox: string;
}

/**
 * Thu thập tất cả tọa độ hiển thị thực tế của cảnh hình học
 */
export function getGeometrySceneBoundingBox(
  data: GeometryData | any,
  canvasWidth: number = 560,
  canvasHeight: number = 440,
  padding: number = 40
): SceneBoundingBoxResult {
  if (!data) {
    const defaultBox = calculatePointsBoundingBox([], 0);
    return {
      ...defaultBox,
      viewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
      expandedViewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
    };
  }

  const subType = data.subType || 'triangle';
  const points: Point2D[] = [];

  if (subType === 'triangle') {
    const t: TriangleData = data.triangle || {};
    const triPoints: [Point2D, Point2D, Point2D] =
      t.points && t.points.length === 3
        ? (t.points as [Point2D, Point2D, Point2D])
        : [
            { x: 260, y: 110 },
            { x: 130, y: 340 },
            { x: 430, y: 340 },
          ];

    points.push(...triPoints);
    const [pA, pB, pC] = triPoints;
    const vNames = t.vertexNames || ['A', 'B', 'C'];
    const nameA = vNames[0] || 'A';
    const nameB = vNames[1] || 'B';
    const nameC = vNames[2] || 'C';

    // Đường tròn ngoại tiếp
    let circumCenter: Point2D | null = null;
    let circumRadius: number | undefined = undefined;
    if (t.circumscribedCircle?.enabled) {
      try {
        const circum = getTriangleCircumcircle(pA, pB, pC);
        circumCenter = circum.center;
        circumRadius = circum.radius;
        points.push(circumCenter);
        // Biên bao của đường tròn
        points.push({ x: circumCenter.x - circumRadius, y: circumCenter.y });
        points.push({ x: circumCenter.x + circumRadius, y: circumCenter.y });
        points.push({ x: circumCenter.x, y: circumCenter.y - circumRadius });
        points.push({ x: circumCenter.x, y: circumCenter.y + circumRadius });
      } catch {
        // bỏ qua nếu tam giác thẳng hàng
      }
    }

    // Đường tròn nội tiếp
    let inCenter: Point2D | null = null;
    if (t.inscribedCircle?.enabled) {
      try {
        const inc = getTriangleIncircle(pA, pB, pC);
        inCenter = inc.center;
        points.push(inCenter);
        points.push({ x: inCenter.x - inc.radius, y: inCenter.y });
        points.push({ x: inCenter.x + inc.radius, y: inCenter.y });
        points.push({ x: inCenter.x, y: inCenter.y - inc.radius });
        points.push({ x: inCenter.x, y: inCenter.y + inc.radius });
      } catch {
        // bỏ qua
      }
    }

    // Điểm neo cơ sở
    const anchors: Record<string, Point2D> = {
      A: pA,
      B: pB,
      C: pC,
      [nameA]: pA,
      [nameB]: pB,
      [nameC]: pC,
      AB: midpoint(pA, pB),
      BC: midpoint(pB, pC),
      CA: midpoint(pC, pA),
      AC: midpoint(pA, pC),
    };
    if (circumCenter) anchors['O'] = circumCenter;
    if (inCenter) anchors['I'] = inCenter;

    // Chân các đường cao / trung tuyến
    const opposite = (vertex: string): [Point2D, Point2D, Point2D] => {
      if (vertex === nameB || vertex === 'B') return [pB, pA, pC];
      if (vertex === nameC || vertex === 'C') return [pC, pA, pB];
      return [pA, pB, pC];
    };
    for (const alt of t.altitudes || []) {
      if (!alt.enabled) continue;
      const [from, s1, s2] = opposite(alt.fromVertex);
      const label = alt.label || (alt.fromVertex === 'B' ? 'D' : alt.fromVertex === 'C' ? 'E' : 'H');
      const foot = projectPointToLine(from, s1, s2).point;
      anchors[label] = foot;
      points.push(foot);
    }
    for (const med of t.medians || []) {
      if (!med.enabled) continue;
      const [, s1, s2] = opposite(med.fromVertex);
      const label = med.label || (med.fromVertex === 'B' ? 'N' : med.fromVertex === 'C' ? 'P' : 'M');
      const mid = midpoint(s1, s2);
      anchors[label] = mid;
      points.push(mid);
    }
    for (const bis of t.bisectors || []) {
      if (!bis.enabled) continue;
      const [from, s1, s2] = opposite(bis.fromVertex);
      const label = bis.label || (bis.fromVertex === 'B' ? 'E' : bis.fromVertex === 'C' ? 'F' : 'D');
      const bp = angleBisectorPoint(from, s1, s2);
      anchors[label] = bp;
      points.push(bp);
    }

    // Giải toàn bộ các auxPoints
    const rawAuxPoints: CustomAuxPoint[] = [...(t.auxPoints || []), ...(data.auxPoints || [])];
    const uniqueAuxPoints: CustomAuxPoint[] = [];
    const seenNames = new Set<string>();
    for (const p of rawAuxPoints) {
      if (!p.name || seenNames.has(p.name)) continue;
      seenNames.add(p.name);
      uniqueAuxPoints.push(p);
    }

    const resolved = resolveAuxiliaryPoints(anchors, uniqueAuxPoints, circumRadius);

    // Kiểm tra xem có giao điểm thực tế nào trên tiếp tuyến không
    const hasTangentIntersection = uniqueAuxPoints.some(
      (o) =>
        o.type === 'intersection' &&
        ((typeof o.line1 === 'string' && o.line1.includes('x')) ||
          (typeof o.line2 === 'string' && o.line2.includes('x')))
    );

    for (const p of uniqueAuxPoints) {
      // Ẩn điểm phụ hướng x nếu đã có giao điểm thực tế T
      if (hasTangentIntersection && (p.name === 'x' || p.type === 'tangent')) {
        continue;
      }
      if (p.showPoint === false && p.showLabel === false) {
        continue;
      }
      const coord = resolved[p.name];
      if (coord && Number.isFinite(coord.x) && Number.isFinite(coord.y)) {
        points.push(coord);
      }
    }

    // AuxLines
    const allAuxLines: CustomAuxLine[] = [...(t.auxLines || []), ...(data.auxLines || [])];
    for (const line of allAuxLines) {
      if (line.enabled === false) continue;
      if (hasTangentIntersection && (line.from === 'x' || line.to === 'x')) continue;
      const p1 = resolved[line.from] || anchors[line.from];
      const p2 = resolved[line.to] || anchors[line.to];
      if (p1 && Number.isFinite(p1.x) && Number.isFinite(p1.y)) points.push(p1);
      if (p2 && Number.isFinite(p2.x) && Number.isFinite(p2.y)) points.push(p2);
    }
  } else if (subType === 'quadrilateral') {
    const q = data.quadrilateral || {};
    if (q.points && Array.isArray(q.points)) {
      points.push(...q.points);
    }
    const rawAux = [...(q.auxPoints || []), ...(data.auxPoints || [])];
    const anchors: Record<string, Point2D> = {};
    if (q.points && q.points.length === 4) {
      const names = q.vertexNames || ['A', 'B', 'C', 'D'];
      names.forEach((name: string, i: number) => {
        anchors[name] = q.points[i];
      });
    }
    const resolved = resolveAuxiliaryPoints(anchors, rawAux);
    for (const p of rawAux) {
      if (p.showPoint !== false || p.showLabel !== false) {
        const pt = resolved[p.name];
        if (pt) points.push(pt);
      }
    }
  } else if (subType === 'circle') {
    const c = data.circle || {};
    if (c.points && Array.isArray(c.points) && c.points.length > 0) {
      points.push(...c.points);
      const center = c.points[0];
      const r = c.radius || 100;
      points.push({ x: center.x - r, y: center.y });
      points.push({ x: center.x + r, y: center.y });
      points.push({ x: center.x, y: center.y - r });
      points.push({ x: center.x, y: center.y + r });
    }
    const rawAux = [...(c.auxPoints || []), ...(data.auxPoints || [])];
    const anchors: Record<string, Point2D> = {};
    if (c.points?.[0]) anchors['O'] = c.points[0];
    const resolved = resolveAuxiliaryPoints(anchors, rawAux, c.radius);
    for (const p of rawAux) {
      if (p.showPoint !== false || p.showLabel !== false) {
        const pt = resolved[p.name];
        if (pt) points.push(pt);
      }
    }
  } else if (subType === 'line-ray') {
    const lr = data.lineRay || {};
    if (lr.points && Array.isArray(lr.points)) points.push(...lr.points);
  } else if (subType === 'angle') {
    const a = data.angle || {};
    if (a.points && Array.isArray(a.points)) points.push(...a.points);
  } else if (subType === 'polygon') {
    const p = data.polygon || {};
    if (p.points && Array.isArray(p.points) && p.points.length > 0) {
      points.push(...p.points);
    }
    if (p.center && p.radius) {
      points.push(
        { x: p.center.x - p.radius, y: p.center.y },
        { x: p.center.x + p.radius, y: p.center.y },
        { x: p.center.x, y: p.center.y - p.radius },
        { x: p.center.x, y: p.center.y + p.radius }
      );
    }
  } else if (subType === 'symmetry') {
    const s = data.symmetry || {};
    if (s.originalPoints && Array.isArray(s.originalPoints)) {
      points.push(...s.originalPoints);
      try {
        const refl = computeReflectedPoints(s.type || 'axial', s.originalPoints, s.axisPoints, s.centerPoint);
        if (refl && Array.isArray(refl)) points.push(...refl);
      } catch {
        // ignore if symmetry points incomplete
      }
    }
    if (s.axisPoints && Array.isArray(s.axisPoints)) points.push(...s.axisPoints);
    if (s.centerPoint) points.push(s.centerPoint);
  }

  const bbox = calculatePointsBoundingBox(points, padding);
  const expanded = getExpandedSvgViewBox(bbox, canvasWidth, canvasHeight);

  return {
    ...bbox,
    viewBox: expanded.viewBox,
    expandedViewBox: expanded.viewBox,
  };
}


/** Expand the scene to the physical SVG aspect ratio without stretching angles or circles. */
export function aspectFitSceneViewBox(
  bounds: Pick<SceneBoundingBoxResult, 'minX' | 'maxX' | 'minY' | 'maxY'>,
  canvasWidth: number,
  canvasHeight: number
): { minX: number; minY: number; width: number; height: number } {
  const width = Math.max(1, canvasWidth);
  const height = Math.max(1, canvasHeight);
  const minX = Math.min(0, bounds.minX), maxX = Math.max(width, bounds.maxX);
  const minY = Math.min(0, bounds.minY), maxY = Math.max(height, bounds.maxY);
  let outW = maxX - minX, outH = maxY - minY;
  let x = minX, y = minY;
  const aspect = width / height;
  if (outW / outH < aspect) {
    const margin = (outH * aspect - outW) / 2;
    x -= margin;
    outW += 2 * margin;
  } else {
    const margin = (outW / aspect - outH) / 2;
    y -= margin;
    outH += 2 * margin;
  }
  return { minX: x, minY: y, width: outW, height: outH };
}
