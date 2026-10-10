/**
 * Normalizes linked triangle + circumcircle + tangent constructions.
 * Shared by Gemini JSON postprocessing and rule-based parsing.
 */
import type { GeometrySpecification, GeometricAuxPointSpec } from '../types';

export function completeCompositeTriangle(spec: GeometrySpecification, text: string): GeometrySpecification {
  const raw = text
    .replace(/(?:chứng\s*minh\s*(?:rằng)?|cmr\s*:?|chứng\s*tỏ\s*(?:rằng)?)[^.?!;]*(?:[.?!;]|$)/gi, ' ')
    .replace(/\b(?:tính|tìm)\s+(?:độ\s*dài|diện\s*tích|góc|số\s*đo)[^.?!;]*(?:[.?!;]|$)/gi, ' ');
  const match = raw.match(/(?:tam\s+giác|∆)\s*([A-Z])([A-Z])([A-Z])\b/i);
  if (!match) return spec;
  const vertices = [match[1], match[2], match[3]].map(v => v.toUpperCase()) as [string, string, string];
  if (spec.shapeCategory === 'circle') spec.shapeCategory = 'triangle';
  if (spec.shapeCategory !== 'triangle') return spec;
  if (!spec.triangle) spec.triangle = { type: 'general', vertices };
  spec.triangle.vertices = vertices;
  spec.altitudes ||= [];
  spec.auxPoints ||= [];
  spec.auxLines ||= [];
  spec.rightAngles ||= [];

  if (/nội\s+tiếp\s+(?:trong\s+)?đường\s+tròn|đường\s+tròn\s+ngoại\s+tiếp\s+tam\s+giác|ngoại\s+tiếp\s+tam\s+giác/i.test(raw)) {
    spec.triangle.circumscribedCircle = true;
  }
  // Preserve distinct altitude feet D/E and orthocenter H.
  const pair = raw.match(/(?:hai|2)\s+đường\s+cao\s+([A-Z])([A-Z])\s+và\s+([A-Z])([A-Z])/i);
  if (pair) {
    for (const [fromRaw, footRaw] of [[pair[1], pair[2]], [pair[3], pair[4]]]) {
      const from = fromRaw.toUpperCase(), foot = footRaw.toUpperCase();
      if (!vertices.includes(from) || vertices.includes(foot)) continue;
      const toLine = vertices.filter(v => v !== from).join('');
      const previous = spec.altitudes.find(alt => alt.from === from);
      if (previous) { previous.foot = foot; previous.toLine = toLine; }
      else spec.altitudes.push({ from, foot, toLine, showRightAngle: true, style: 'dashed' });
    }
  }
  const orthocenter = raw.match(/(?:đường\s+cao[^.!?;]{0,120}?(?:cắt|giao)\s+nhau\s+tại|trực\s+tâm)\s+([A-Z])\b/i)?.[1]?.toUpperCase();
  if (orthocenter && !vertices.includes(orthocenter)) {
    const alts = spec.altitudes.filter((p, i, a) =>
      vertices.includes(p.from) && !vertices.includes(p.foot) && a.findIndex(t => t.from === p.from) === i);
    const [first, second] = alts;
    const point: GeometricAuxPointSpec = first && second
      ? { name: orthocenter, type: 'intersection', line1: first.from + first.foot, line2: second.from + second.foot }
      : { name: orthocenter, type: 'orthocenter' };
    const idx = spec.auxPoints.findIndex(p => p.name === orthocenter);
    if (idx < 0) spec.auxPoints.push(point);
    else spec.auxPoints[idx] = point;
  }
  if (!spec.triangle.circumscribedCircle || !/tiếp\s+tuyến/i.test(raw)) return spec;
  const atMatch = raw.match(/tiếp\s+tuyến[^.!?;]{0,100}?\btại\s+(?:điểm\s+)?([A-Z])\b/i);
  const rayMatch = raw.match(/tiếp\s+tuyến\s+([A-Z])([a-z])\b/i);
  const segMatch = raw.match(/tiếp\s+tuyến\s+([A-Z])([A-Z])\b/i);
  const at = (atMatch?.[1] || rayMatch?.[1] || segMatch?.[1])?.toUpperCase();
  if (!at || !vertices.includes(at)) return spec;
  const helper = rayMatch?.[2] || 'x';
  const dir: GeometricAuxPointSpec = { name: helper, type: 'tangent', fromPoint: at, centerPoint: 'O' };
  const oldDir = spec.auxPoints.findIndex(p => p.name === helper);
  if (oldDir < 0) spec.auxPoints.push(dir);
  else spec.auxPoints[oldDir] = dir;
  const addLine = (from: string, to: string) => {
    if (from === to || spec.auxLines!.some(l =>
      (l.from === from && l.to === to) || (l.from === to && l.to === from))) return;
    spec.auxLines!.push({ from, to, style: 'solid' });
  };
  const cut = raw.match(/(?:tiếp\s+tuyến|đường\s+thẳng)[^.!?;]{0,180}?\bcắt\s+(?:đường\s+thẳng\s+|tia\s+|cạnh\s+)?([A-Z]{2})\s+tại\s+(?:điểm\s+)?([A-Z])\b/i);
  const line = cut?.[1]?.toUpperCase(), hit = cut?.[2]?.toUpperCase();
  if (line && hit && line.length === 2 && !vertices.includes(hit)) {
    const point: GeometricAuxPointSpec = {
      name: hit,
      type: 'intersection',
      line1: at + helper,
      line2: line,
      showPoint: true,
      showLabel: true,
    };
    const i = spec.auxPoints.findIndex(p => p.name === hit);
    if (i < 0) spec.auxPoints.push(point);
    else spec.auxPoints[i] = { ...spec.auxPoints[i], ...point };

    addLine(at, hit);
    addLine(line[0], hit); // vẽ phần kéo dài cần thiết từ B/C đến T

    // Khi đã có giao điểm thật T, ẩn hoàn toàn điểm phụ hướng x trên SVG
    dir.showPoint = false;
    dir.showLabel = false;
    const hIdx = spec.auxPoints.findIndex(p => p.name === helper);
    if (hIdx >= 0) {
      spec.auxPoints[hIdx].showPoint = false;
      spec.auxPoints[hIdx].showLabel = false;
    }

    // Xóa bỏ mọi đoạn nối tới điểm phụ x
    spec.auxLines = spec.auxLines.filter(l => !(
      (l.from === at && l.to === helper) || (l.from === helper && l.to === at) ||
      l.from === helper || l.to === helper
    ));

    // Cập nhật ký hiệu góc vuông tại tiếp điểm A hướng về giao điểm T
    const ra = spec.rightAngles.find(r => r.vertex === at && (r.ray1 === helper || r.ray2 === helper));
    if (ra) {
      if (ra.ray1 === helper) ra.ray1 = hit;
      if (ra.ray2 === helper) ra.ray2 = hit;
    }
  } else {
    addLine(at, helper);
  }

  const targetRay = hit || helper;
  if (!spec.rightAngles.some(r => r.vertex === at &&
      ((r.ray1 === 'O' && r.ray2 === targetRay) || (r.ray2 === 'O' && r.ray1 === targetRay)))) {
    spec.rightAngles.push({ vertex: at, ray1: 'O', ray2: targetRay });
  }
  return spec;
}
