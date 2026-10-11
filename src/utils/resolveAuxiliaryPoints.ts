/**
 * Giải các điểm phụ theo quan hệ phụ thuộc thay vì thứ tự Gemini trả về.
 * Hàm thuần: kéo thả điểm gốc sẽ tính lại toàn bộ điểm phụ khi SVG render.
 */
import type { CustomAuxPoint, Point2D } from '../types';
import {
  lineIntersection,
  midpoint,
  projectPointToLine,
  resolvePointCoordinate,
  getTriangleCircumcircle,
  getTriangleIncircle,
} from './geometryMath';

function endpoints(value: string | string[] | undefined, points: Record<string, Point2D>): [Point2D, Point2D] | null {
  if (!value) return null;
  let names: string[];
  if (Array.isArray(value)) {
    names = value;
  } else {
    const trimmed = value.trim();
    if (trimmed.includes(',')) {
      names = trimmed.split(',').map(s => s.trim());
    } else if (trimmed.includes('-')) {
      names = trimmed.split('-').map(s => s.trim());
    } else if (trimmed.includes("'")) {
      const tokens = trimmed.match(/[A-Za-z0-9]+'?/g);
      names = tokens && tokens.length === 2 ? tokens : trimmed.split('');
    } else {
      names = trimmed.split('');
    }
  }
  if (names.length !== 2) return null;
  const first = resolvePointCoordinate(names[0], points);
  const second = resolvePointCoordinate(names[1], points);
  return first && second ? [first, second] : null;
}

function computePoint(point: CustomAuxPoint, points: Record<string, Point2D>, defaultCircleRadius?: number): Point2D | null {
  if (point.type === 'midpoint' || point.type === 'ratio') {
    const segment = endpoints(point.segment, points);
    if (!segment) return null;
    if (point.type === 'midpoint') return midpoint(...segment);
    const ratio = point.ratio;
    if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return null;
    return {
      x: segment[0].x + (segment[1].x - segment[0].x) * ratio,
      y: segment[0].y + (segment[1].y - segment[0].y) * ratio,
    };
  }

  if (point.type === 'projection') {
    const from = point.fromPoint && resolvePointCoordinate(point.fromPoint, points);
    const target = endpoints(point.targetLine, points);
    return from && target ? projectPointToLine(from, ...target).point : null;
  }

  // Giao của tia có hướng với đường tròn tâm fromPoint, bán kính là một
  // độ dài phụ thuộc. Không dùng tọa độ tự do hoặc gán vai trò theo tên điểm.
  if (point.type === 'on-ray') {
    const ray = endpoints(point.segment, points);
    const reference = endpoints(point.distanceSegment, points);
    const center = point.fromPoint && resolvePointCoordinate(point.fromPoint, points);
    const scale = point.distanceRatio ?? 1;
    if (!ray || !reference || !center || !Number.isFinite(scale) || scale <= 0) return null;
    const dx = ray[1].x - ray[0].x, dy = ray[1].y - ray[0].y;
    const a = dx * dx + dy * dy;
    const radius = Math.hypot(reference[1].x - reference[0].x, reference[1].y - reference[0].y) * scale;
    if (a < 1e-12 || radius < 1e-8) return null;
    const ox = ray[0].x - center.x, oy = ray[0].y - center.y;
    const b = 2 * (ox * dx + oy * dy);
    const c = ox * ox + oy * oy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    const tolerance = 1e-10 * Math.max(b * b, Math.abs(4 * a * c), 1);
    if (discriminant < -tolerance) return null;
    const root = Math.sqrt(Math.max(0, discriminant));
    const candidates = [(-b - root) / (2 * a), (-b + root) / (2 * a)]
      // Một điểm mới khác hai điểm đã đặt tên trên tia.
      .filter(t => t > 1e-8 && Math.abs(t - 1) > 1e-8)
      .filter(t => point.rayPosition === 'between' ? t < 1 : point.rayPosition === 'beyond' ? t > 1 : true);
    if (!candidates.length) return null;
    const t = candidates[0];
    return { x: ray[0].x + t * dx, y: ray[0].y + t * dy };
  }

  if (point.type === 'intersection') {
    const first = endpoints(point.line1, points);
    const second = endpoints(point.line2, points);
    return first && second ? lineIntersection(...first, ...second) : null;
  }

  // Trực tâm (Giao điểm các đường cao)
  if (point.type === 'orthocenter' || (point as any).type === 'ortho') {
    const verts = (point as any).triangleVertices || ['A', 'B', 'C'];
    const pA = resolvePointCoordinate(verts[0], points);
    const pB = resolvePointCoordinate(verts[1], points);
    const pC = resolvePointCoordinate(verts[2], points);
    if (pA && pB && pC) {
      // Đường cao từ A vuông góc BC: vector hướng perp(BC)
      const vBC = { x: pC.x - pB.x, y: pC.y - pB.y };
      const d1 = { x: -vBC.y, y: vBC.x };
      const pA2 = { x: pA.x + d1.x, y: pA.y + d1.y };
      // Đường cao từ B vuông góc AC: vector hướng perp(AC)
      const vAC = { x: pC.x - pA.x, y: pC.y - pA.y };
      const d2 = { x: -vAC.y, y: vAC.x };
      const pB2 = { x: pB.x + d2.x, y: pB.y + d2.y };
      return lineIntersection(pA, pA2, pB, pB2);
    }
  }

  // Trọng tâm G (Giao điểm các đường trung tuyến)
  if (point.type === 'centroid' || (point as any).type === 'gravity') {
    const verts = (point as any).triangleVertices || ['A', 'B', 'C'];
    const pA = resolvePointCoordinate(verts[0], points);
    const pB = resolvePointCoordinate(verts[1], points);
    const pC = resolvePointCoordinate(verts[2], points);
    if (pA && pB && pC) {
      return {
        x: (pA.x + pB.x + pC.x) / 3,
        y: (pA.y + pB.y + pC.y) / 3,
      };
    }
  }

  // Tâm đường tròn nội tiếp I
  if (point.type === 'incenter') {
    const verts = (point as any).triangleVertices || ['A', 'B', 'C'];
    const pA = resolvePointCoordinate(verts[0], points);
    const pB = resolvePointCoordinate(verts[1], points);
    const pC = resolvePointCoordinate(verts[2], points);
    if (pA && pB && pC) {
      return getTriangleIncircle(pA, pB, pC).center;
    }
  }

  // Tâm đường tròn ngoại tiếp O
  if (point.type === 'circumcenter') {
    const verts = (point as any).triangleVertices || ['A', 'B', 'C'];
    const pA = resolvePointCoordinate(verts[0], points);
    const pB = resolvePointCoordinate(verts[1], points);
    const pC = resolvePointCoordinate(verts[2], points);
    if (pA && pB && pC) {
      return getTriangleCircumcircle(pA, pB, pC).center;
    }
  }

  if (point.type === 'free') {
    return typeof point.freeX === 'number' && typeof point.freeY === 'number'
      && Number.isFinite(point.freeX) && Number.isFinite(point.freeY)
      ? { x: point.freeX, y: point.freeY } : null;
  }

  if (point.type === 'on-circle' && typeof point.angle === 'number' && Number.isFinite(point.angle)) {
    const center = resolvePointCoordinate(point.centerPoint || 'O', points);
    const radius = point.radius ?? defaultCircleRadius;
    if (!center || typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) return null;
    const radians = point.angle * Math.PI / 180;
    return { x: center.x + radius * Math.cos(radians), y: center.y + radius * Math.sin(radians) };
  }

  // Điểm trên tiếp tuyến của đường tròn tại điểm fromPoint: vector tiếp tuyến vuông góc bán kính
  if (point.type === 'tangent' || (point as any).type === 'tangent-point') {
    const at = point.fromPoint && resolvePointCoordinate(point.fromPoint, points);
    const center = resolvePointCoordinate(point.centerPoint || 'O', points);
    if (at && center) {
      const rx = at.x - center.x;
      const ry = at.y - center.y;
      const rLen = Math.hypot(rx, ry);
      if (rLen > 1e-4) {
        // Hướng tiếp tuyến vuông góc bán kính
        const tanUnit = { x: -ry / rLen, y: rx / rLen };
        const d = (point as any).length ?? 90;
        return { x: at.x + tanUnit.x * d, y: at.y + tanUnit.y * d };
      }
    }
  }
  return null;
}

export function resolveAuxiliaryPoints(
  namedPoints: Record<string, Point2D>,
  auxPoints: CustomAuxPoint[],
  defaultCircleRadius?: number
): Record<string, Point2D> {
  const resolved: Record<string, Point2D> = { ...namedPoints };
  const pending = auxPoints.filter(point => Boolean(point.name));

  // Các tên do auxPoints định nghĩa không được dùng tọa độ mặc định cũ (M, N, D...).
  for (const point of pending) delete resolved[point.name];

  // Tối đa N lượt: mỗi lượt thành công giải ít nhất một điểm.
  for (let pass = 0; pass < pending.length; pass++) {
    let progress = false;
    for (const point of pending) {
      if (resolved[point.name]) continue;
      const computed = computePoint(point, resolved, defaultCircleRadius);
      if (!computed || !Number.isFinite(computed.x) || !Number.isFinite(computed.y)) continue;
      resolved[point.name] = computed;
      progress = true;
    }
    if (!progress) break; // Thiếu tham chiếu, vòng phụ thuộc hoặc đường thẳng song song.
  }
  return resolved;
}
