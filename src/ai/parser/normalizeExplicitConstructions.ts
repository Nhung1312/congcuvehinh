/**
 * Các giả thiết được viết rõ trong đề luôn thắng suy luận/giá trị mặc định.
 * Dùng chung cho JSON Gemini (kể cả đề ảnh) và bộ phân tích tiếng Việt.
 */
import type { GeometricAuxPointSpec, GeometrySpecification } from '../types';

export function stripGeometryProofGoals(text: string): string {
  return text.normalize('NFC')
    .replace(/(?:chứng\s*minh\s*(?:rằng)?|cmr\s*:?|chứng\s*tỏ\s*(?:rằng)?)[\s\S]*?(?=[.?!]|\n\s*(?:[a-z0-9]+\)|(?:Gọi|Lấy|Kẻ|Nối|Từ)\s)|[;\s]+[a-z]\)\s*(?:Gọi|Lấy|Kẻ|Nối|Từ)\s|;\s*(?:Gọi|Lấy|Kẻ|Nối|Từ)\s|$)/gi, ' ')
    .replace(/(?:tính|tìm)\s+(?:độ\s*dài|diện\s*tích|góc|số\s*đo)[^.?!;]*/gi, ' ');
}

const segmentKey = (segment: string | string[]) =>
  (Array.isArray(segment) ? segment : segment.split('')).map(s => s.toUpperCase()).sort().join(':');

function distanceTerm(text: string): { segment: string; factor: number } | null {
  const match = text.trim().match(/^(?:(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?\s*\*?\s*)?([A-Z])\s*([A-Z])(?:\s*\/\s*(\d+(?:[.,]\d+)?))?$/i);
  if (!match) return null;
  const factor = Number((match[1] || '1').replace(',', '.')) /
    Number((match[2] || match[5] || '1').replace(',', '.'));
  return Number.isFinite(factor) && factor > 0
    ? { segment: (match[3] + match[4]).toUpperCase(), factor } : null;
}

export function normalizeExplicitConstructions(spec: GeometrySpecification, problemText: string): GeometrySpecification {
  const raw = stripGeometryProofGoals(problemText);
  spec.auxPoints ||= [];
  spec.auxLines ||= [];
  spec.altitudes ||= [];
  spec.medians ||= [];
  spec.bisectors ||= [];
  spec.rightAngles ||= [];
  spec.equalSegments ||= [];

  const addLine = (from: string, to: string) => {
    if (from === to) return;
    const key = segmentKey(from + to);
    // Không vẽ chồng một cạnh có sẵn hoặc đường đặc biệt đã được dựng đúng.
    const vertices = spec.triangle?.vertices;
    if (vertices?.includes(from) && vertices.includes(to)) return;
    const quad = spec.quadrilateral?.vertices;
    if (spec.shapeCategory === 'quadrilateral' && quad?.some((p, i) => segmentKey(p + quad[(i + 1) % 4]) === key)) return;
    if (spec.altitudes!.some(p => segmentKey(p.from + p.foot) === key) ||
        spec.medians!.some(p => segmentKey(p.from + p.midpoint) === key) ||
        spec.auxLines!.some(p => segmentKey(p.from + p.to) === key)) return;
    spec.auxLines!.push({ from, to, style: 'solid' });
  };
  const addEqual = (first: string, second: string) => {
    const keys = [segmentKey(first), segmentKey(second)].sort().join('|');
    if (!spec.equalSegments!.some(p => p.segments.map(segmentKey).sort().join('|') === keys)) {
      spec.equalSegments!.push({ segments: [first, second], tickType: 1 });
    }
  };
  const setPoint = (point: GeometricAuxPointSpec) => {
    const name = point.name;
    const discardedLines = new Set<string>();
    spec.altitudes = spec.altitudes!.filter(alt => {
      if (alt.foot !== name) return true;
      const correct = point.type === 'projection' && alt.from === point.fromPoint &&
        segmentKey(alt.toLine) === segmentKey(point.targetLine!);
      if (!correct) discardedLines.add(segmentKey(alt.from + name));
      return correct;
    });
    spec.medians = spec.medians!.filter(med => {
      if (med.midpoint !== name) return true;
      const medianCommand = new RegExp(`trung\\s+tuyến\\s+${med.from}${name}\\b`, 'i');
      const segment = new RegExp(`\\b(?:${med.from}${name}|${name}${med.from})\\b`, 'i');
      const connectCommand = [...raw.matchAll(/(?:nối|kẻ\s+(?:các\s+)?đoạn\s+thẳng)\s+([^.!?;\n]+)/gi)]
        .some(match => segment.test(match[1]));
      const correct = point.type === 'midpoint' && segmentKey(med.toSegment) === segmentKey(point.segment!) &&
        (medianCommand.test(raw) || connectCommand);
      if (!correct) discardedLines.add(segmentKey(med.from + name));
      return correct;
    });
    spec.bisectors = spec.bisectors!.filter(bis => {
      if (bis.foot !== name) return true;
      discardedLines.add(segmentKey(bis.from + name));
      return false;
    });
    const previous = spec.auxPoints!.find(p => p.name === name);
    const changed = previous && Object.entries(point).some(([key, value]) =>
      JSON.stringify(previous[key as keyof GeometricAuxPointSpec]) !== JSON.stringify(value));
    if (changed || discardedLines.size) {
      if (previous?.type === 'projection' && previous.fromPoint) discardedLines.add(segmentKey(previous.fromPoint + name));
      // Bỏ ký hiệu gắn với phép dựng sai trước khi thêm quan hệ thật bên dưới.
      spec.equalSegments = spec.equalSegments!.filter(p => !p.segments.some(s =>
        (Array.isArray(s) ? s : s.split('')).includes(name)));
    }
    spec.auxLines = spec.auxLines!.filter(p => !discardedLines.has(segmentKey(p.from + p.to)));
    spec.rightAngles = spec.rightAngles!.filter(p => p.vertex !== name);
    spec.auxPoints = spec.auxPoints!.filter(p => p.name !== name);
    spec.auxPoints.push({ ...point, showPoint: true, showLabel: true });
  };

  // Loại hình và đỉnh đặc biệt phải lấy từ giả thiết, không từ tứ giác cần chứng minh.
  const triangleMatch = raw.match(/(?:tam\s+giác|[∆Δ])\s*([A-Z])\s*([A-Z])\s*([A-Z])\b([^.!?;]*)/i);
  const otherBase = raw.search(/(?:tứ\s+giác|hình\s+(?:chữ\s+nhật|vuông|thang|bình\s+hành|thoi))/i);
  if (triangleMatch && (otherBase < 0 || triangleMatch.index! < otherBase)) {
    const vertices = [triangleMatch[1], triangleMatch[2], triangleMatch[3]].map(v => v.toUpperCase()) as [string, string, string];
    spec.shapeCategory = 'triangle';
    spec.triangle ||= { type: 'general', vertices };
    spec.triangle.vertices = vertices;
    const description = triangleMatch[4].split(/(?:gọi|kẻ|lấy|nối)\s/i)[0];
    const right = description.match(/vuông\s+(cân\s+)?tại\s+([A-Z])\b/i);
    if (right && vertices.includes(right[2].toUpperCase())) {
      spec.triangle.type = right[1] ? 'right-isosceles' : 'right';
      spec.triangle.specialVertex = right[2].toUpperCase();
      if (!right[1]) delete spec.triangle.equalSides;
    }
    for (const match of raw.matchAll(/\b([A-Z]{2})\s*(?:=|bằng)\s*([A-Z]{2})\b/gi)) {
      const first = match[1].toUpperCase(), second = match[2].toUpperCase();
      if (![...first, ...second].every(v => vertices.includes(v)) || segmentKey(first) === segmentKey(second)) continue;
      const apex = [...first].find(v => second.includes(v));
      if (!apex) continue;
      if (right && apex !== spec.triangle.specialVertex) continue;
      spec.triangle.type = right ? 'right-isosceles' : 'isosceles';
      spec.triangle.specialVertex = apex;
      spec.triangle.equalSides = [first, second];
    }
    const comparisons = [...raw.matchAll(/\b([A-Z]{2})\s*(<|>|nhỏ\s+hơn|lớn\s+hơn|ngắn\s+hơn|dài\s+hơn)\s*([A-Z]{2})\b/gi)]
      .map(m => ({ first: m[1].toUpperCase(), operator: m[2], second: m[3].toUpperCase() }))
      .filter(m => [...m.first, ...m.second].every(v => vertices.includes(v)) && m.first[0] !== m.first[1] && m.second[0] !== m.second[1])
      .map(m => /^(?:>|lớn|dài)/i.test(m.operator)
        ? { shorter: m.second, longer: m.first } : { shorter: m.first, longer: m.second });
    if (comparisons.length) {
      const latest = new Map<string, { shorter: string; longer: string }>();
      for (const comparison of comparisons) {
        const key = [segmentKey(comparison.shorter), segmentKey(comparison.longer)].sort().join('|');
        latest.set(key, comparison);
      }
      spec.triangle.sideComparisons = [...latest.values()];
    }
  }

  // Không mặc định BC: nhận đủ cả "trung điểm BC" và "trung điểm của ME".
  const midpointPatterns = [
    /\b([A-Z])\s+là\s+trung\s+điểm\s+(?:của\s+)?(?:đoạn\s+thẳng\s+)?([A-Z]{2})\b/gi,
    /trung\s+điểm\s+([A-Z])\s+của\s+(?:đoạn\s+thẳng\s+)?([A-Z]{2})\b/gi,
  ];
  for (const pattern of midpointPatterns) for (const match of raw.matchAll(pattern)) {
    const name = match[1].toUpperCase(), segment = match[2].toUpperCase();
    if (segment.includes(name)) continue;
    setPoint({ name, type: 'midpoint', segment });
    addEqual(segment[0] + name, name + segment[1]);
  }

  // Hình chiếu được xác định từ điểm nguồn và đường nhận, không từ tên H/D/E.
  const projection = /(?:từ\s+([A-Z])\s+kẻ\s+)?\b([A-Z])([A-Z])\s*(?:vuông\s*góc|⊥)\s*(?:với\s+)?([A-Z]{2})\s+tại\s+([A-Z])\b|\b([A-Z])\s+là\s+hình\s+chiếu\s+(?:vuông\s+góc\s+)?của\s+([A-Z])\s+(?:trên|lên)\s+([A-Z]{2})\b/gi;
  for (const match of raw.matchAll(projection)) {
    const name = (match[6] || match[5]).toUpperCase();
    const source = (match[7] || match[1] || (match[2].toUpperCase() === name ? match[3] : match[2])).toUpperCase();
    const targetLine = (match[8] || match[4]).toUpperCase();
    if (name === source || targetLine.includes(name)) continue;
    setPoint({ name, type: 'projection', fromPoint: source, targetLine });
    addLine(source, name);
    spec.rightAngles.push({ vertex: name, ray1: source, ray2: targetLine[0] });
  }

  // Tia PQ có gốc P, hướng qua Q; độ dài có thể tham chiếu bất kỳ đoạn đã dựng.
  const rayPattern = /(?:lấy|gọi|chọn)\s+(?:điểm\s+)?([A-Z])\s+(?:nằm\s+)?(?:trên|thuộc)\s+tia\s+([A-Z])([A-Z])\s+(?:sao\s+)?cho\s+([^.!?;]+)/gi;
  for (const match of raw.matchAll(rayPattern)) {
    const name = match[1].toUpperCase(), segment = (match[2] + match[3]).toUpperCase();
    if (segment.includes(name)) continue;
    const equality = match[4].split(/[,\n]|(?:và|nối|kẻ|gọi)\s/i)[0].split('=');
    if (equality.length !== 2) continue;
    const terms = equality.map(distanceTerm);
    if (!terms[0] || !terms[1]) continue;
    const unknownIndex = terms.findIndex(t => t!.segment.includes(name));
    if (unknownIndex < 0) continue;
    const unknown = terms[unknownIndex]!, known = terms[1 - unknownIndex]!;
    if (known.segment.includes(name)) continue;
    const fromPoint = unknown.segment.replace(name, '');
    const ratio = known.factor / unknown.factor;
    const previous = spec.auxPoints.find(p => p.name === name && p.type === 'on-ray' &&
      p.segment === segment && p.fromPoint === fromPoint);
    const between = new RegExp(`${name}\\s+(?:nằm\\s+)?giữa\\s+${segment[0]}\\s+và\\s+${segment[1]}`, 'i').test(match[4]);
    const beyond = new RegExp(`${segment[1]}\\s+(?:nằm\\s+)?giữa\\s+${segment[0]}\\s+và\\s+${name}`, 'i').test(match[4]);
    const uniqueBeyond = fromPoint === segment[1] && segmentKey(known.segment) === segmentKey(segment) && ratio >= 1;
    const rayPosition = between ? 'between' : (beyond || uniqueBeyond) ? 'beyond' : previous?.rayPosition;
    setPoint({ name, type: 'on-ray', segment, fromPoint,
      distanceSegment: known.segment, distanceRatio: ratio,
      ...(rayPosition ? { rayPosition } : {}),
    });
    addLine(segment[0], name);
    if (unknown.factor === known.factor) addEqual(unknown.segment, known.segment);
  }

  const reflection = /\b([A-Z])\s+(?:là\s+điểm\s+)?đối\s+xứng\s+(?:của|với)\s+([A-Z])\s+qua\s+(?:điểm\s+)?([A-Z])\b/gi;
  for (const match of raw.matchAll(reflection)) {
    const [name, original, center] = match.slice(1).map(v => v.toUpperCase());
    if (new Set([name, original, center]).size !== 3) continue;
    setPoint({ name, type: 'ratio', segment: original + center, ratio: 2 });
    addLine(original, name);
    addEqual(original + center, center + name);
  }

  const intersectionPatterns = [
    /\b([A-Z])\s+(?:là\s+)?giao\s+điểm\s+(?:của\s+)?(?:hai\s+đường\s+thẳng\s+|đường\s+thẳng\s+)?([A-Z]{2})\s*(?:và|với|,)\s*(?:đường\s+thẳng\s+)?([A-Z]{2})\b/gi,
    /\b([A-Z]{2})\s+(?:và|với)\s+([A-Z]{2})\s+(?:cắt|giao)\s+nhau\s+tại\s+([A-Z])\b/gi,
  ];
  for (const [index, pattern] of intersectionPatterns.entries()) for (const match of raw.matchAll(pattern)) {
    const name = match[index === 0 ? 1 : 3].toUpperCase();
    const line1 = match[index === 0 ? 2 : 1].toUpperCase(), line2 = match[index === 0 ? 3 : 2].toUpperCase();
    if (line1.includes(name) || line2.includes(name)) continue;
    setPoint({ name, type: 'intersection', line1, line2 });
    addLine(line1[0], line1[1]);
    addLine(line2[0], line2[1]);
  }

  // Chỉ nối cạnh của hình được nhắc trong mục tiêu chứng minh; không gán hình
  // chữ nhật/bình hành, trung điểm hay dấu vuông góc từ kết luận cần chứng minh.
  const known = new Set([...(spec.triangle?.vertices || spec.quadrilateral?.vertices || []),
    ...spec.auxPoints.map(p => p.name), ...spec.altitudes.map(p => p.foot), ...spec.medians.map(p => p.midpoint)]);
  for (const match of problemText.matchAll(/tứ\s+giác\s+([A-Z]{4})\b/gi)) {
    const names = match[1].toUpperCase().split('');
    if (names.every(p => known.has(p))) names.forEach((p, i) => addLine(p, names[(i + 1) % 4]));
  }
  for (const match of problemText.matchAll(/\b([A-Z]{2})\s*(?:⊥|vuông\s+góc|\/\/|song\s+song)\s*([A-Z]{2})\b/gi)) {
    for (const segment of match.slice(1).map(s => s.toUpperCase())) {
      if ([...segment].every(p => known.has(p))) addLine(segment[0], segment[1]);
    }
  }
  if (spec.triangle && ['right', 'right-isosceles'].includes(spec.triangle.type)) {
    const vertex = spec.triangle.specialVertex || spec.triangle.vertices[0];
    const others = spec.triangle.vertices.filter(p => p !== vertex);
    if (!spec.rightAngles.some(p => p.vertex === vertex) && others.length === 2) {
      spec.rightAngles.push({ vertex, ray1: others[0], ray2: others[1] });
    }
  }
  return spec;
}
