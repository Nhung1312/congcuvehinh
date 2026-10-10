/**
 * Regression tests (offline, no Gemini key required):
 * npm run test:geometry-ai
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GeometrySpecification } from '../src/ai/types';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';
import { midpoint, projectPointToLine, constrainTrianglePointDrag, dist } from '../src/utils/geometryMath';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';

const baseSpec = (changes: Partial<GeometrySpecification> = {}): GeometrySpecification => ({
  title: 'Kiểm thử dựng hình phẳng',
  shapeCategory: 'triangle',
  triangle: { type: 'general', vertices: ['A', 'B', 'C'] },
  detectedEntities: [],
  explanation: '',
  ...changes,
});

function triangleFor(spec: GeometrySpecification) {
  const triangle = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry?.triangle;
  assert.ok(triangle?.points, 'Adapter phải tạo TriangleData có tọa độ');
  return triangle;
}

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test('Đường cao AH, trung tuyến AM và trung trực AB giữ nguyên tên/cạnh', () => {
  const tri = triangleFor(baseSpec({
    altitudes: [{ from: 'A', toLine: 'BC', foot: 'H' }],
    medians: [{ from: 'A', toSegment: 'BC', midpoint: 'M' }],
    perpBisectors: [{ segment: 'AB', label: 'd', showTicks: true }],
    auxLines: [{ from: 'A', to: 'M' }, { from: 'A', to: 'H' }],
    auxPoints: [{ name: 'H', type: 'projection', fromPoint: 'A', targetLine: 'BC' }],
  }));
  assert.equal(tri.altitudes?.[0].label, 'H');
  assert.equal(tri.medians?.[0].label, 'M');
  assert.equal(tri.perpBisectors?.[0].side, 'AB');
  assert.equal(tri.perpBisectors?.[0].showTickMarks, true);
  assert.equal(tri.auxLines?.length, 0, 'Không vẽ chồng AH, AM');
  assert.equal(tri.auxPoints?.length, 0, 'Chân đường cao đã do renderer chuyên biệt vẽ');
});

test('D, E và K phụ thuộc H/D giải được dù Gemini trả về ngược thứ tự', () => {
  const tri = triangleFor(baseSpec({
    triangle: { type: 'right', vertices: ['A', 'B', 'C'], specialVertex: 'A' },
    altitudes: [{ from: 'A', toLine: 'BC', foot: 'H' }],
    medians: [{ from: 'A', toSegment: 'BC', midpoint: 'M' }],
    auxPoints: [
      { name: 'K', type: 'projection', fromPoint: 'D', targetLine: 'BC' },
      { name: 'E', type: 'projection', fromPoint: 'H', targetLine: 'AC' },
      { name: 'D', type: 'projection', fromPoint: 'H', targetLine: 'AB' },
    ],
    auxLines: [{ from: 'D', to: 'E' }, { from: 'A', to: 'M' }],
  }));
  const [A, B, C] = tri.points!;
  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AC = { x: C.x - A.x, y: C.y - A.y };
  near(AB.x * AC.x + AB.y * AC.y, 0);
  const H = projectPointToLine(A, B, C).point;
  const points = resolveAuxiliaryPoints(
    { A, B, C, H, M: midpoint(B, C) },
    tri.auxPoints || []
  );
  const D = projectPointToLine(H, A, B).point;
  const E = projectPointToLine(H, A, C).point;
  near(points.D.x, D.x);
  near(points.D.y, D.y);
  near(points.E.x, E.x);
  near(points.E.y, E.y);
  assert.ok(points.K, 'Điểm K được giải sau khi có D');
  assert.ok(tri.auxLines?.some(line => line.from === 'D' && line.to === 'E'));
  assert.ok(tri.auxLines?.some(line => line.from === 'H' && line.to === 'D'));
  assert.ok(tri.auxLines?.some(line => line.from === 'H' && line.to === 'E'));
  assert.ok(tri.rightAngleMarkers?.some(marker => marker.vertex === 'D'));
});

test('Trung điểm M, N và đoạn MN song song BC', () => {
  const tri = triangleFor(baseSpec({
    auxPoints: [
      { name: 'N', type: 'midpoint', segment: 'AC' },
      { name: 'M', type: 'midpoint', segment: 'AB' },
    ],
    auxLines: [{ from: 'M', to: 'N' }],
    parallels: [{ line1: 'MN', line2: 'BC' }],
  }));
  const [A, B, C] = tri.points!;
  const points = resolveAuxiliaryPoints({ A, B, C }, tri.auxPoints || []);
  assert.ok(points.M && points.N);
  near(points.M.x, (A.x + B.x) / 2);
  near(points.N.y, (A.y + C.y) / 2);
  const mn = { x: points.N.x - points.M.x, y: points.N.y - points.M.y };
  const bc = { x: C.x - B.x, y: C.y - B.y };
  near(mn.x * bc.y - mn.y * bc.x, 0);
  assert.equal(tri.parallelMarkers?.length, 1);
  assert.equal(tri.auxLines?.length, 1);
});

test('Không sinh điểm giả khi có tham chiếu khuyết hoặc vòng phụ thuộc', () => {
  const points = resolveAuxiliaryPoints({ A: { x: 0, y: 0 } }, [
    { id: 'p1', name: 'D', type: 'projection', fromPoint: 'E', targetLine: 'AB' },
    { id: 'p2', name: 'E', type: 'projection', fromPoint: 'D', targetLine: 'AB' },
  ]);
  assert.equal(points.D, undefined);
  assert.equal(points.E, undefined);
});

test('Đề bài tam giác ABC vuông tại A, đường cao AH, hình chiếu D, E, trung điểm M, nối DE và AM', () => {
  const prompt = 'Cho tam giác ABC vuông tại A. Kẻ AH vuông góc với BC tại H. Từ H kẻ HD vuông góc với AB tại D và HE vuông góc với AC tại E. Gọi M là trung điểm của BC. Nối DE và AM.';
  const spec = VietnameseGeometryParser.parse(prompt);
  const tri = triangleFor(spec);

  assert.equal(tri.type, 'right');
  assert.equal(tri.altitudes?.[0].label, 'H');
  assert.equal(tri.medians?.[0].label, 'M');
  assert.ok(tri.auxPoints?.some((p: any) => p.name === 'D' && p.type === 'projection' && p.fromPoint === 'H'));
  assert.ok(tri.auxPoints?.some((p: any) => p.name === 'E' && p.type === 'projection' && p.fromPoint === 'H'));
  assert.ok(tri.auxLines?.some((l: any) => l.from === 'D' && l.to === 'E'));
  assert.ok(tri.auxLines?.some((l: any) => l.from === 'H' && l.to === 'D'));
  assert.ok(tri.auxLines?.some((l: any) => l.from === 'H' && l.to === 'E'));
  assert.ok(tri.rightAngleMarkers?.some((r: any) => r.vertex === 'A'));
  assert.ok(tri.rightAngleMarkers?.some((r: any) => r.vertex === 'D'));
  assert.ok(tri.rightAngleMarkers?.some((r: any) => r.vertex === 'E'));
});

test('Kéo điểm B hoặc C trong tam giác vuông bảo toàn tuyệt đối góc vuông tại A', () => {
  const pts: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
    { x: 170, y: 340 }, // A (đỉnh vuông)
    { x: 170, y: 150 }, // B
    { x: 450, y: 340 }, // C
  ];

  // Kéo điểm B sang vị trí bất kỳ
  const resB = constrainTrianglePointDrag('right', pts, 1, { x: 230, y: 100 }, 'A');
  const dotB = (resB[1].x - resB[0].x) * (resB[2].x - resB[0].x) + (resB[1].y - resB[0].y) * (resB[2].y - resB[0].y);
  assert.equal(dotB, 0, 'Tích vô hướng AB . AC phải luôn bằng 0 (góc 90 độ)');

  // Kéo điểm C sang vị trí bất kỳ
  const resC = constrainTrianglePointDrag('right', pts, 2, { x: 480, y: 380 }, 'A');
  const dotC = (resC[1].x - resC[0].x) * (resC[2].x - resC[0].x) + (resC[1].y - resC[0].y) * (resC[2].y - resC[0].y);
  assert.equal(dotC, 0, 'Tích vô hướng AB . AC phải luôn bằng 0 khi kéo C');

  // Kéo đỉnh vuông A: toàn bộ tam giác tịnh tiến, góc vuông giữ nguyên
  const resA = constrainTrianglePointDrag('right', pts, 0, { x: 200, y: 360 }, 'A');
  const dotA = (resA[1].x - resA[0].x) * (resA[2].x - resA[0].x) + (resA[1].y - resA[0].y) * (resA[2].y - resA[0].y);
  assert.equal(dotA, 0, 'Tích vô hướng AB . AC phải luôn bằng 0 khi tịnh tiến A');
});

test('Kéo đỉnh tam giác cân bảo toàn hai cạnh bên bằng nhau', () => {
  const pts: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
    { x: 285, y: 110 }, // A (đỉnh cân)
    { x: 145, y: 340 }, // B
    { x: 425, y: 340 }, // C
  ];

  // Kéo đỉnh A: A di chuyển trên đường trung trực đáy BC
  const resApex = constrainTrianglePointDrag('isosceles', pts, 0, { x: 310, y: 90 }, 'A');
  const ab = dist(resApex[0], resApex[1]);
  const ac = dist(resApex[0], resApex[2]);
  assert.ok(Math.abs(ab - ac) < 1e-4, 'AB phải bằng AC khi kéo đỉnh cân');
});
