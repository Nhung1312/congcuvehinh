import type { ChartDocument, Point2D, TriangleData, QuadData, CircleData, CustomAuxPoint, CustomAuxLine, CustomRightAngleMarker } from '../types';
import {
  midpoint, dist, projectPointToLine, angleBisectorPoint, perpendicularBisectorSegment,
  getTriangleCircumcircle, getTriangleIncircle, getQuadPresetPoints, getCirclePresetPoints,
  getThalesPoints,
} from '../utils/geometryMath';
import { resolveAuxiliaryPoints } from '../utils/resolveAuxiliaryPoints';

/**
 * Export the ACTUAL geometry coordinates, not a template triangle.
 * Requires standard TikZ (\usepackage{tikz}), no tkz-euclide dependency.
 * The result is a tikzpicture fragment that can be pasted into Overleaf.
 */
const SCALE = 0.035;
const fixed = (value: number) => {
  const rounded = Number((value * SCALE).toFixed(5));
  return String(Object.is(rounded, -0) ? 0 : rounded);
};
const xy = (p: Point2D) => '(' + fixed(p.x) + ',' + fixed(-p.y) + ')';
const valid = (p: Point2D | undefined): p is Point2D =>
  Boolean(p && Number.isFinite(p.x) && Number.isFinite(p.y));
const label = (s: string) => /^[A-Za-z][A-Za-z0-9']*$/.test(s) ? s : '';
const dash = (style?: string) => style === 'dashed' ? '[dashed]' : style === 'dotted' ? '[dotted]' : '';

class TikzGeometry {
  readonly lines: string[] = [
    '% Requires \\usepackage{tikz}',
    '\\begin{tikzpicture}[line cap=round, line join=round, line width=0.6pt]',
  ];
  readonly named: Record<string, Point2D> = {};
  readonly shown = new Set<string>();
  private readonly edges = new Set<string>();

  point(name: string, p: Point2D, visible = true) {
    if (!name || !valid(p)) return;
    this.named[name] = p;
    if (visible) this.shown.add(name);
  }
  segment(a: Point2D | undefined, b: Point2D | undefined, style?: string) {
    if (!valid(a) || !valid(b) || dist(a, b) < 0.01) return;
    const key = [xy(a), xy(b)].sort().join('|');
    if (this.edges.has(key)) return;
    this.edges.add(key);
    this.lines.push('  \\draw' + dash(style) + ' ' + xy(a) + ' -- ' + xy(b) + ';');
  }
  circle(center: Point2D, radius: number, style?: string) {
    if (!valid(center) || !Number.isFinite(radius) || radius < 0.1) return;
    this.lines.push('  \\draw' + dash(style) + ' ' + xy(center) + ' circle (' + fixed(radius) + ');');
  }
  polygon(points: Point2D[]) {
    if (points.every(valid) && points.length > 2) {
      this.lines.push('  \\draw ' + points.map(xy).join(' -- ') + ' -- cycle;');
    }
  }
  rightAngle(v: Point2D | undefined, a: Point2D | undefined, b: Point2D | undefined, size = 10) {
    if (!valid(v) || !valid(a) || !valid(b)) return;
    const d1 = dist(v, a), d2 = dist(v, b);
    if (d1 < 1 || d2 < 1) return;
    const u = { x: (a.x - v.x) / d1 * size, y: (a.y - v.y) / d1 * size };
    const w = { x: (b.x - v.x) / d2 * size, y: (b.y - v.y) / d2 * size };
    const p = { x: v.x + u.x, y: v.y + u.y };
    const q = { x: p.x + w.x, y: p.y + w.y };
    const r = { x: v.x + w.x, y: v.y + w.y };
    this.lines.push('  \\draw ' + xy(p) + ' -- ' + xy(q) + ' -- ' + xy(r) + ';');
  }
  tick(a?: Point2D, b?: Point2D, count = 1) {
    if (!valid(a) || !valid(b)) return;
    const length = dist(a, b);
    if (length < 2) return;
    const n = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 5;
      const mid = { x: (a.x + b.x) / 2 + dir.x * offset, y: (a.y + b.y) / 2 + dir.y * offset };
      const one = { x: mid.x - n.x * 5, y: mid.y - n.y * 5 };
      const two = { x: mid.x + n.x * 5, y: mid.y + n.y * 5 };
      this.lines.push('  \\draw ' + xy(one) + ' -- ' + xy(two) + ';');
    }
  }
  auxiliary(points: CustomAuxPoint[] = [], segments: CustomAuxLine[] = [], marks: CustomRightAngleMarker[] = [], radius?: number) {
    const resolved = resolveAuxiliaryPoints(this.named, points, radius);
    Object.assign(this.named, resolved);
    // Aux direction points remain useful for coordinate calculations but may be hidden.
    for (const p of points) if (valid(resolved[p.name])) this.point(p.name, resolved[p.name], p.showPoint !== false || p.showLabel !== false);
    for (const l of segments) if (l.enabled !== false) this.segment(resolved[l.from], resolved[l.to], l.style);
    for (const m of marks) if (m.enabled !== false) this.rightAngle(resolved[m.vertex], resolved[m.ray1], resolved[m.ray2], m.size);
  }
  finish(): string {
    // Nodes are emitted last, so edges cannot obscure point labels.
    for (const name of this.shown) {
      const p = this.named[name];
      const escaped = label(name);
      if (!valid(p) || !escaped) continue;
      this.lines.push('  \\fill ' + xy(p) + ' circle (1.0pt);');
      this.lines.push('  \\node[above right, inner sep=1.5pt] at ' + xy(p) + ' {$' + escaped + '$};');
    }
    this.lines.push('\\end{tikzpicture}');
    return this.lines.join('\n');
  }
}

function triangleExport(out: TikzGeometry, t: TriangleData) {
  const p = t.points && t.points.length === 3 ? t.points : [
    { x: 260, y: 110 }, { x: 130, y: 340 }, { x: 430, y: 340 },
  ] as [Point2D, Point2D, Point2D];
  const names = t.vertexNames || ['A', 'B', 'C'];
  p.forEach((v, i) => out.point(names[i] || ['A', 'B', 'C'][i], v, t.showLabels !== false));
  out.polygon(p);
  if (t.showRightAngleMarker !== false && (t.type === 'right' || t.type === 'right-isosceles')) {
    const index = p.findIndex((v, i) => {
      const first = p[(i + 1) % 3], second = p[(i + 2) % 3];
      const lengths = dist(v, first) * dist(v, second);
      return lengths > 1 && Math.abs((first.x - v.x) * (second.x - v.x) +
        (first.y - v.y) * (second.y - v.y)) / lengths < 1e-6;
    });
    if (index >= 0) out.rightAngle(p[index], p[(index + 1) % 3], p[(index + 2) % 3], 12);
  }

  const circum = getTriangleCircumcircle(p[0], p[1], p[2]);
  const incircle = getTriangleIncircle(p[0], p[1], p[2]);
  out.point(t.circumscribedCircle?.centerName || 'O', circum.center, Boolean(t.circumscribedCircle?.enabled && t.circumscribedCircle.showCenter !== false));
  out.point(t.inscribedCircle?.centerName || 'I', incircle.center, Boolean(t.inscribedCircle?.enabled && t.inscribedCircle.showCenter !== false));
  if (t.circumscribedCircle?.enabled) out.circle(circum.center, circum.radius, t.circumscribedCircle.style);
  if (t.inscribedCircle?.enabled) out.circle(incircle.center, incircle.radius, t.inscribedCircle.style);

  const vIndex = (vertex: string) => ['A', 'B', 'C'].indexOf(vertex);
  for (const alt of t.altitudes || []) {
    if (alt.enabled === false) continue;
    const i = vIndex(alt.fromVertex);
    if (i < 0) continue;
    const a = p[i], b = p[(i + 1) % 3], c = p[(i + 2) % 3];
    const foot = projectPointToLine(a, b, c).point;
    out.point(alt.label || ['H', 'K', 'L'][i], foot, t.showLabels !== false);
    out.segment(a, foot, alt.style);
    if (alt.showRightAngle !== false) out.rightAngle(foot, a, b);
  }
  for (const med of t.medians || []) {
    if (med.enabled === false) continue;
    const i = vIndex(med.fromVertex);
    if (i < 0) continue;
    const b = p[(i + 1) % 3], c = p[(i + 2) % 3], middle = midpoint(b, c);
    out.point(med.label || ['M', 'N', 'P'][i], middle, t.showLabels !== false);
    out.segment(p[i], middle, med.style);
    if (med.showTickMarks !== false) { out.tick(b, middle); out.tick(middle, c); }
  }
  for (const bis of t.bisectors || []) {
    if (bis.enabled === false) continue;
    const i = vIndex(bis.fromVertex);
    if (i < 0) continue;
    const foot = angleBisectorPoint(p[i], p[(i + 1) % 3], p[(i + 2) % 3]);
    out.point(bis.label || ['D', 'E', 'F'][i], foot, t.showLabels !== false);
    out.segment(p[i], foot, bis.style);
  }
  for (const perp of t.perpBisectors || []) {
    if (perp.enabled === false) continue;
    const side = perp.side;
    const indices = side.split('').map(vIndex);
    if (indices.length !== 2 || indices.some(i => i < 0)) continue;
    const [a, b] = indices.map(i => p[i]);
    const segment = perpendicularBisectorSegment(a, b);
    out.segment(segment.start, segment.end, perp.style);
    if (perp.showRightAngle !== false) out.rightAngle(segment.mid, segment.end, a);
    if (perp.showTickMarks !== false) { out.tick(a, segment.mid); out.tick(segment.mid, b); }
  }
  if (t.thales?.enabled) {
    const result = getThalesPoints(p, t.thales.ratio || 0.4, t.thales.cutSide || 'AB-AC', names);
    out.point(t.thales.pointMName || 'M', result.M, t.thales.showLabels !== false);
    out.point(t.thales.pointNName || 'N', result.N, t.thales.showLabels !== false);
    out.segment(result.M, result.N, t.thales.lineStyle?.strokeStyle);
  }
  // Base altitude feet were registered first, allowing H = BD∩CE and T = Ax∩BC.
  out.auxiliary(t.auxPoints, t.auxLines, t.rightAngleMarkers, circum.radius);
  for (const mark of t.equalSidesMarkers || []) {
    if (!mark.enabled || typeof mark.tickType !== 'number') continue;
    for (const segment of mark.segments) {
      const ends = Array.isArray(segment) ? segment : segment.split('');
      if (ends.length === 2) out.tick(out.named[ends[0]], out.named[ends[1]], mark.tickType);
    }
  }
}

function quadrilateralExport(out: TikzGeometry, q: QuadData) {
  const p = q.points?.length === 4 ? q.points : getQuadPresetPoints(q.type);
  const names = q.vertexNames || ['A', 'B', 'C', 'D'];
  p.forEach((point, i) => out.point(names[i] || ['A', 'B', 'C', 'D'][i], point, q.showLabels !== false));
  out.polygon(p);
  if (q.diagonals?.AC?.enabled) out.segment(p[0], p[2], q.diagonals.AC.style);
  if (q.diagonals?.BD?.enabled) out.segment(p[1], p[3], q.diagonals.BD.style);
  if (q.showCircumcircle || q.type === 'cyclic') {
    const cc = getTriangleCircumcircle(p[0], p[1], p[2]);
    out.circle(cc.center, cc.radius, q.circumcircleStyle);
    out.point(q.circumcircleCenterName || 'O', cc.center, q.showCircumcircleCenter !== false);
  }
  out.auxiliary(q.auxPoints, q.auxLines, q.rightAngleMarkers);
}

function circleExport(out: TikzGeometry, c: CircleData) {
  const p = c.points?.length ? c.points : getCirclePresetPoints(c.presetType || 'basic');
  if (p.length < 2) return;
  const center = p[0];
  const radius = c.radius && c.radius > 0 ? c.radius
    : (c.presetType === 'two-tangents' || c.presetType === 'secant' ? 110 : dist(p[0], p[1]));
  out.circle(center, radius);
  out.point(c.centerName || 'O', center, c.showCenterPoint !== false);
  if (c.presetType !== 'two-tangents' && c.presetType !== 'secant') {
    out.point(c.radiusPointName || 'A', p[1], true);
    if (c.showRadius) out.segment(center, p[1]);
  }
  if (c.showChord && p[2] && p[3]) {
    out.point(c.chordPoints?.[0] || 'C', p[2]);
    out.point(c.chordPoints?.[1] || 'D', p[3]);
    out.segment(p[2], p[3]);
  }
  if (c.showTangent && c.tangentType !== 'two-tangents') {
    const point = p[1];
    const radial = { x: point.x - center.x, y: point.y - center.y };
    const length = Math.hypot(radial.x, radial.y);
    if (length > 0.01) {
      const end = { x: point.x - radial.y / length * 120, y: point.y + radial.x / length * 120 };
      const start = { x: point.x + radial.y / length * 120, y: point.y - radial.x / length * 120 };
      out.segment(start, end);
      if (c.showTangentRightAngle !== false) out.rightAngle(point, center, end);
    }
  }
  out.auxiliary(c.auxPoints, c.auxLines, c.rightAngleMarkers, radius);
}

export const generateTikzCode = (doc: ChartDocument): string => {
  const geo = doc.data.geometry;
  if (!geo || !doc.type.startsWith('GEOMETRY_')) return '% TikZ supports planar geometry documents only.';
  const out = new TikzGeometry();
  switch (geo.subType) {
    case 'triangle': if (geo.triangle) triangleExport(out, geo.triangle); break;
    case 'quadrilateral': if (geo.quadrilateral) quadrilateralExport(out, geo.quadrilateral); break;
    case 'circle': if (geo.circle) circleExport(out, geo.circle); break;
    default: return '% TikZ export for this tool is not yet implemented.';
  }
  return out.finish();
};

export const copyTikzToClipboard = async (doc: ChartDocument) => {
  const code = generateTikzCode(doc);
  try {
    await navigator.clipboard.writeText(code);
    return { success: true, message: 'Đã sao chép hình và các phép dựng sang mã TikZ.' };
  } catch {
    return { success: false, message: 'Không thể sao chép mã TikZ.' };
  }
};
