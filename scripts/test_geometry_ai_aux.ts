/**
 * Regression tests (offline, no Gemini key required):
 * npm run test:geometry-ai
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GeometrySpecification } from '../src/ai/types';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';
import { midpoint, projectPointToLine, constrainTrianglePointDrag, constrainQuadPointDrag, constrainCircleDrag, getQuadPresetPoints, getTriangleCircumcircle, dist } from '../src/utils/geometryMath';
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

test('Không tự thêm đường trung tuyến khi đề chỉ cho trung điểm', () => {
  const prompt = 'Cho tam giác ABC nhọn. Gọi M là trung điểm của BC. Từ M kẻ đường thẳng d vuông góc với BC.';
  const spec = VietnameseGeometryParser.parse(prompt);
  const tri = triangleFor(spec);

  // Không có đường trung tuyến AM trong medians
  assert.equal(tri.medians?.length || 0, 0, 'Không tự thêm trung tuyến AM khi đề chỉ nói M là trung điểm');
  // M phải nằm trong auxPoints
  assert.ok(tri.auxPoints?.some((p: any) => p.name === 'M' && p.type === 'midpoint'), 'Điểm M phải được nhận diện là trung điểm');
});

test('Trực tâm H là giao điểm hai đường cao BD và CE', () => {
  const prompt = 'Cho tam giác ABC nhọn có hai đường cao BD và CE cắt nhau tại H.';
  const spec = VietnameseGeometryParser.parse(prompt);
  const tri = triangleFor(spec);

  assert.equal(tri.altitudes?.length, 2, 'Phải có 2 đường cao BD và CE');
  assert.ok(tri.auxPoints?.some((p: any) => p.name === 'H'), 'Phải có trực tâm H trong auxPoints');

  const [A, B, C] = tri.points!;
  const D = projectPointToLine(B, A, C).point;
  const E = projectPointToLine(C, A, B).point;
  const resolved = resolveAuxiliaryPoints({ A, B, C, D, E }, tri.auxPoints || []);
  assert.ok(resolved.H, 'Trực tâm H phải giải được toạ độ');

  // Kiểm tra H thỏa mãn: BH vuông góc AC và CH vuông góc AB
  const BH = { x: resolved.H.x - B.x, y: resolved.H.y - B.y };
  const AC = { x: C.x - A.x, y: C.y - A.y };
  const dotBH_AC = BH.x * AC.x + BH.y * AC.y;
  assert.ok(Math.abs(dotBH_AC) < 1e-4, 'BH phải vuông góc với AC');

  const CH = { x: resolved.H.x - C.x, y: resolved.H.y - C.y };
  const AB = { x: B.x - A.x, y: B.y - A.y };
  const dotCH_AB = CH.x * AB.x + CH.y * AB.y;
  assert.ok(Math.abs(dotCH_AB) < 1e-4, 'CH phải vuông góc với AB');
});

test('Bài toán kết hợp Toán 9: tam giác nội tiếp đường tròn (O), 2 đường cao, trực tâm H và tiếp tuyến Ax', () => {
  const prompt = 'Cho tam giác ABC nhọn nội tiếp đường tròn (O), hai đường cao BD và CE cắt nhau tại H. Kẻ tiếp tuyến Ax của đường tròn (O).';
  const spec = VietnameseGeometryParser.parse(prompt);
  const tri = triangleFor(spec);

  // Kiểm tra đường tròn ngoại tiếp
  assert.ok(tri.circumscribedCircle?.enabled, 'Tam giác phải có đường tròn ngoại tiếp');
  // Kiểm tra 2 đường cao
  assert.equal(tri.altitudes?.length, 2, 'Phải có 2 đường cao BD và CE');
  // Kiểm tra tiếp tuyến Ax
  assert.ok(tri.auxPoints?.some((p: any) => p.name === 'x' && p.type === 'tangent'), 'Phải có điểm x trên tiếp tuyến');
  assert.ok(tri.auxLines?.some((l: any) => (l.from === 'A' && l.to === 'x') || (l.from === 'x' && l.to === 'A')), 'Phải có tia tiếp tuyến Ax');
  assert.ok(tri.rightAngleMarkers?.some((r: any) => r.vertex === 'A'), 'Tiếp tuyến Ax phải có góc vuông tại tiếp điểm A với bán kính OA');
});

test('Tam giác tù có góc lớn hơn 90 độ', () => {
  const prompt = 'Cho tam giác ABC tù tại A.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.triangle?.type, 'obtuse');
  const tri = triangleFor(spec);
  assert.equal(tri.type, 'obtuse');

  const [A, B, C] = tri.points!;
  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AC = { x: C.x - A.x, y: C.y - A.y };
  const dot = AB.x * AC.x + AB.y * AC.y;
  assert.ok(dot < 0, `Tích vô hướng AB . AC phải âm (${dot} < 0) để góc A > 90 độ`);
});

test('Tỉ số Ta-lét tính đúng theo trung điểm (0.5) hoặc phân số, không mặc định 0.45', () => {
  // Test 1: Đề Ta-lét có trung điểm -> tỉ số phải là 0.5
  const promptMid = 'Cho tam giác ABC. M là trung điểm AB, N là trung điểm AC. Đoạn thẳng MN song song BC theo định lý Ta-lét.';
  const specMid = VietnameseGeometryParser.parse(promptMid);
  const triMid = triangleFor(specMid);
  assert.equal(triMid.thales?.ratio, 0.5, 'Tỉ số Ta-lét khi có trung điểm phải là 0.5, không dùng 0.45');

  // Test 2: Đề Ta-lét có tỉ số 1/3
  const specRatio: GeometrySpecification = {
    title: 'Định lý Ta-lét trong tam giác ABC tỉ số 1/3',
    shapeCategory: 'triangle',
    triangle: { type: 'general', vertices: ['A', 'B', 'C'] },
    parallels: [{ line1: 'MN', line2: 'BC' }],
    detectedEntities: [],
    explanation: 'MN song song BC với tỉ số 1/3',
  };
  const triRatio = triangleFor(specRatio);
  assert.ok(Math.abs(triRatio.thales?.ratio! - 1 / 3) < 1e-4, 'Tỉ số Ta-lét khi đề cho 1/3 phải là 1/3');
});

test('Không biến kết luận cần chứng minh thành giả thiết', () => {
  const prompt = 'Cho tam giác ABC nhọn có đường cao AH. M là trung điểm BC. Chứng minh rằng AM vuông góc với BC.';
  const spec = VietnameseGeometryParser.parse(prompt);
  const tri = triangleFor(spec);

  // Kết luận "AM vuông góc BC" không được biến thành giả thiết góc vuông tại M
  assert.ok(!tri.rightAngleMarkers?.some((r: any) => r.vertex === 'M'), 'Không được tạo ký hiệu góc vuông tại M từ câu chứng minh');
  // Không biến AM thành đường cao
  assert.equal(tri.altitudes?.length, 1, 'Chỉ có đường cao AH từ giả thiết');
  assert.equal(tri.altitudes?.[0].label, 'H');
});

test('Kéo tam giác tù phải giữ góc tù đúng đỉnh, không biến thành tam giác nhọn', () => {
  const pts: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
    { x: 40, y: 60 }, { x: 160, y: 60 }, { x: 5, y: 150 },
  ];
  const updated = constrainTrianglePointDrag('obtuse', pts, 2, { x: 90, y: 140 }, 'A');
  const [A, B, C] = updated;
  const dot = (B.x - A.x) * (C.x - A.x) + (B.y - A.y) * (C.y - A.y);
  assert.ok(dot < 0, 'Góc A phải vẫn tù khi kéo C');
  assert.notDeepEqual(C, { x: 90, y: 140 }, 'Không cho con trỏ phá tính chất góc tù');
});

test('Tam giác vuông xoay vẫn giữ vuông góc chính xác khi kéo một cạnh', () => {
  const pts: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
    { x: 10, y: 20 }, { x: 100, y: 80 }, { x: -30, y: 80 },
  ];
  const moved = constrainTrianglePointDrag('right', pts, 1, { x: 120, y: 150 }, 'A');
  const [A, B, C] = moved;
  const dot = (B.x - A.x) * (C.x - A.x) + (B.y - A.y) * (C.y - A.y);
  assert.ok(Math.abs(dot) < 1e-8, 'Không làm tròn tọa độ làm mất góc 90 độ');
});

test('Các tứ giác đặc biệt giữ quan hệ cơ bản khi kéo', () => {
  const parallel = constrainQuadPointDrag('parallelogram', getQuadPresetPoints('parallelogram'), 1, { x: 390, y: 190 });
  const [A, B, C, D] = parallel;
  assert.ok(Math.abs((B.x - A.x) - (C.x - D.x)) < 1e-8);
  assert.ok(Math.abs((B.y - A.y) - (C.y - D.y)) < 1e-8);
  const rectangle = constrainQuadPointDrag('rectangle', getQuadPresetPoints('rectangle'), 1, { x: 380, y: 170 });
  const [P, Q, R] = rectangle;
  assert.ok(Math.abs((Q.x - P.x) * (R.x - Q.x) + (Q.y - P.y) * (R.y - Q.y)) < 1e-8);
  const rhombus = constrainQuadPointDrag('rhombus', getQuadPresetPoints('rhombus'), 1, { x: 460, y: 180 });
  const sides = rhombus.map((p, i) => dist(p, rhombus[(i + 1) % 4]));
  assert.ok(Math.max(...sides) - Math.min(...sides) < 1e-8);
});

test('Tứ giác nội tiếp: kéo một đỉnh trùng tâm không làm mất tính nội tiếp', () => {
  const pts = getQuadPresetPoints('cyclic');
  const reference = getTriangleCircumcircle(pts[1], pts[2], pts[3]);
  const updated = constrainQuadPointDrag('cyclic', pts, 0, reference.center);
  assert.deepEqual(updated[0], pts[0], 'Hướng chiếu không xác định: giữ nguyên vị trí đỉnh');
});

test('Đường tròn: không cho bán kính bằng 0 và giữ điểm trên đường tròn khi kéo', () => {
  const center = { x: 210, y: 210 }, radial = { x: 310, y: 210 };
  const basic = constrainCircleDrag('basic', [center, radial], 1, center);
  assert.equal(dist(basic[0], basic[1]), 100, 'Không cho kéo A trùng tâm O');
  const inscribed = [center, radial, { x: 210, y: 310 }];
  const moved = constrainCircleDrag('inscribed-angle', inscribed, 2, center);
  assert.deepEqual(moved[2], inscribed[2], 'Không đặt điểm trên đường tròn vào tâm');
  const translated = constrainCircleDrag('basic', [center, radial], 0, { x: 250, y: 250 });
  assert.equal(dist(translated[0], translated[1]), 100, 'Dịch tâm giữ nguyên bán kính');
});
