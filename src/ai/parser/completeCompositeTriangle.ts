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

  // 1. Chuẩn hóa các điểm trung điểm (M của BC, N của DK...)
  const midRegex = /(?:trung\s+điểm\s+([A-Z])(?:\s+của\s+([A-Z]{2}))?|(?:gọi\s+)?([A-Z])\s+là\s+trung\s+điểm\s+(?:của\s+([A-Z]{2}))?)/gi;
  let midMatch;
  while ((midMatch = midRegex.exec(raw)) !== null) {
    const mid = (midMatch[1] || midMatch[3])?.toUpperCase();
    const seg = (midMatch[2] || midMatch[4] || 'BC')?.toUpperCase();
    if (!mid || mid.length !== 1 || seg.length !== 2) continue;

    if (!spec.auxPoints.some(p => p.name === mid)) {
      spec.auxPoints.push({
        name: mid,
        type: 'midpoint',
        segment: seg,
        showPoint: true,
        showLabel: true,
      });
      spec.equalSegments ||= [];
      if (!spec.equalSegments.some(es => es.segments.includes(`${seg[0]}${mid}`))) {
        spec.equalSegments.push({
          segments: [`${seg[0]}${mid}`, `${mid}${seg[1]}`],
          tickType: 1,
        });
      }
    }
  }

  // 2. Chuẩn hóa các hình chiếu vuông góc (MD ⟂ AB tại D, ME ⟂ AC tại E, DK ⟂ AC tại K...)
  const projRegex = /(?:[Tt]ừ\s+([A-Z])\s+[kK]ẻ\s+)?\b([A-Z])([A-Z])\b\s*(?:vuông\s*góc|⊥)\s*(?:với\s+)?\b([A-Z]{2})\b(?:\s+tại\s+([A-Z]))?|\b([A-Z])\b\s+là\s+hình\s+chiếu\s+(?:vuông\s+góc\s+)?của\s+([A-Z])\s+(?:trên|lên)\s+\b([A-Z]{2})\b/g;
  let projMatch;
  while ((projMatch = projRegex.exec(raw)) !== null) {
    let fromP: string;
    let name: string;
    let targetLine: string;

    if (projMatch[6] && projMatch[7] && projMatch[8]) {
      name = projMatch[6].toUpperCase();
      fromP = projMatch[7].toUpperCase();
      targetLine = projMatch[8].toUpperCase();
    } else {
      fromP = (projMatch[1] || projMatch[2]).toUpperCase();
      name = (projMatch[5] || projMatch[3]).toUpperCase();
      targetLine = (projMatch[4] || '').toUpperCase();
    }

    if (fromP && name && targetLine && fromP !== name && targetLine.length === 2 && !targetLine.includes(name)) {
      if (!spec.auxPoints.some(p => p.name === name)) {
        spec.auxPoints.push({
          name,
          type: 'projection',
          fromPoint: fromP,
          targetLine,
          showPoint: true,
          showLabel: true,
        });
      }
      const hasProjLine = spec.auxLines.some(
        l => (l.from === fromP && l.to === name) || (l.from === name && l.to === fromP)
      );
      if (!hasProjLine) {
        spec.auxLines.push({ from: fromP, to: name, style: 'solid' });
      }
      const hasRA = spec.rightAngles.some(r => r.vertex === name);
      if (!hasRA) {
        spec.rightAngles.push({ vertex: name, ray1: fromP, ray2: targetLine[0] });
      }
    }
  }

  // 3. Chuẩn hóa các đoạn nối phụ ("Nối OB, AM, DE, MN và BT"...)
  const connectClauses = raw.matchAll(/\b(?:[Nn]ối|kẻ\s+các\s+đoạn\s+thẳng|kẻ\s+đoạn\s+thẳng)\s+([^.!?;\n]+)/gi);
  for (const clause of connectClauses) {
    const content = clause[1];
    const segMatches = content.matchAll(/\b([A-Z])([A-Z])\b/g);
    for (const m of segMatches) {
      const p1 = m[1].toUpperCase();
      const p2 = m[2].toUpperCase();
      if (p1 === p2) continue;
      const isAlreadyInAuxLines = spec.auxLines.some(
        l => (l.from === p1 && l.to === p2) || (l.from === p2 && l.to === p1)
      );
      if (!isAlreadyInAuxLines) {
        spec.auxLines.push({ from: p1, to: p2, style: 'solid' });
      }
    }
    const withMatches = content.matchAll(/\b([A-Z])\s+với\s+([A-Z])\b/g);
    for (const m of withMatches) {
      const p1 = m[1].toUpperCase();
      const p2 = m[2].toUpperCase();
      if (p1 === p2) continue;
      const isAlreadyInAuxLines = spec.auxLines.some(
        l => (l.from === p1 && l.to === p2) || (l.from === p2 && l.to === p1)
      );
      if (!isAlreadyInAuxLines) {
        spec.auxLines.push({ from: p1, to: p2, style: 'solid' });
      }
    }
  }

  if (!spec.triangle.circumscribedCircle || !/tiếp\s+tuyến/i.test(raw)) return spec;
  const atMatch = raw.match(/tiếp\s+tuyến[^.!?;]{0,100}?\btại\s+(?:điểm\s+)?([A-Z])\b/i);
  const rayMatch = raw.match(/tiếp\s+tuyến\s+([A-Z])([a-z])\b/i);
  const segMatch = raw.match(/tiếp\s+tuyến\s+([A-Z])([A-Z])\b/i);
  const at = (atMatch?.[1] || rayMatch?.[1] || segMatch?.[1])?.toUpperCase();
  if (!at || !vertices.includes(at)) return spec;
  const helper = rayMatch?.[2] || 'x';
  const center = 'O';
  const dir: GeometricAuxPointSpec = { name: helper, type: 'tangent', fromPoint: at, centerPoint: center };
  const oldDir = spec.auxPoints.findIndex(p => p.name === helper);
  if (oldDir < 0) spec.auxPoints.push(dir);
  else spec.auxPoints[oldDir] = dir;
  const addLine = (from: string, to: string, style: 'solid' | 'dashed' = 'solid') => {
    if (from === to) return;
    const existing = spec.auxLines!.find(l =>
      (l.from === from && l.to === to) || (l.from === to && l.to === from)
    );
    if (!existing) {
      spec.auxLines!.push({ from, to, style });
    } else if (style === 'dashed') {
      existing.style = 'dashed';
    }
  };

  // Tự động dựng bán kính OA/OB từ tâm O đến tiếp điểm (nét đứt)
  addLine(center, at, 'dashed');

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
      ((r.ray1 === center && r.ray2 === targetRay) || (r.ray2 === center && r.ray1 === targetRay)))) {
    spec.rightAngles.push({ vertex: at, ray1: center, ray2: targetRay });
  }
  return spec;
}
