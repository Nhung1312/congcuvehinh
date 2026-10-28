/**
 * test_geometry_groups_a_to_f.ts
 * Kiểm thử toàn diện 15 bài toán đại diện cho 6 nhóm hình học Toán THCS Lớp 6–9:
 * Nhóm A: Hình cơ bản (đoạn thẳng, tia, trung điểm, góc, vuông góc, song song)
 * Nhóm B: Tam giác (vuông, cân, đều, nhọn, đường cao, trung tuyến, phân giác)
 * Nhóm C: Tứ giác (hình bình hành, hình chữ nhật, hình thoi, hình vuông, hình thang)
 * Nhóm D: Đường tròn (tiếp tuyến, dây cung, khoảng cách, hai tiếp tuyến)
 * Nhóm E: Dựng hình phức hợp (chuỗi điểm phụ thuộc nhiều bước, kiểm tra đổi tên đỉnh)
 * Nhóm F: Đa giác đều & Đối xứng trục/tâm (CanvasArea rendering, biến đổi, không rớt vào fallback)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { CanvasArea } from '../src/components/CanvasArea';
import { ChartDocument } from '../src/types';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';
import { dist, midpoint, projectPointToLine } from '../src/utils/geometryMath';

function renderDocumentInCanvas(doc: ChartDocument): string {
  return renderToStaticMarkup(
    React.createElement(CanvasArea, {
      currentDoc: doc,
      onCopyImage: () => {},
    })
  );
}

// =========================================================================
// NHÓM A: HÌNH CƠ BẢN (ĐOẠN THẲNG, TIA, GÓC, SONG SONG, VUÔNG GÓC)
// =========================================================================
test('Nhóm A - Bài 1: Đoạn thẳng AB, trung điểm M và đường trung trực vuông góc', () => {
  const prompt = 'Cho đoạn thẳng AB. Gọi M là trung điểm của AB. Qua M kẻ đường thẳng d vuông góc với AB.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.ok(spec.shapeCategory === 'line-ray' || spec.perpBisectors?.length || spec.auxPoints?.length);
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.ok(['GEOMETRY_LINE_RAY', 'GEOMETRY_TRIANGLE'].includes(doc.type));

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'), 'Không được rơi vào default fallback');
  assert.ok(svgHtml.includes('<svg'), 'Phải render SVG hợp lệ');
  assert.ok(!svgHtml.includes('NaN'), 'Không được có toạ độ NaN');
});

test('Nhóm A - Bài 2: Góc xOy và tia phân giác Oz', () => {
  const prompt = 'Cho góc xOy. Vẽ tia phân giác Oz của góc xOy.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'angle');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_ANGLE');
  assert.ok(doc.data.geometry?.angle);

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

// =========================================================================
// NHÓM B: TAM GIÁC
// =========================================================================
test('Nhóm B - Bài 3: Tam giác ABC vuông tại A, đường cao AH, hình chiếu D và E', () => {
  const prompt = 'Cho tam giác ABC vuông tại A. Kẻ đường cao AH vuông góc với BC tại H. Từ H kẻ HD vuông góc với AB tại D và HE vuông góc với AC tại E.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.type, 'right');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_TRIANGLE');

  const tri = doc.data.geometry?.triangle!;
  assert.ok(tri.points && tri.points.length === 3);
  const [A, B, C] = tri.points;
  const H = projectPointToLine(A, B, C).point;
  const resolved = resolveAuxiliaryPoints({ A, B, C, H }, tri.auxPoints || []);
  assert.ok(resolved.D && resolved.E);

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm B - Bài 4: Tam giác ABC cân tại A, trung tuyến AM và phân giác BD', () => {
  const prompt = 'Cho tam giác ABC cân tại A. Gọi M là trung điểm của BC. Kẻ tia phân giác BD của góc B (D thuộc AC).';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.type, 'isosceles');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_TRIANGLE');

  const tri = doc.data.geometry?.triangle!;
  const [A, B, C] = tri.points!;
  // Kiểm tra tính cân AB = AC
  const dAB = dist(A, B);
  const dAC = dist(A, C);
  assert.ok(Math.abs(dAB - dAC) < 1e-4, 'Tam giác cân tại A phải có AB = AC');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm B - Bài 5: Tam giác đều ABC và đường cao AH', () => {
  const prompt = 'Cho tam giác ABC đều. Kẻ đường cao AH vuông góc với BC tại H.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.type, 'equilateral');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);

  const tri = doc.data.geometry?.triangle!;
  const [A, B, C] = tri.points!;
  const dAB = dist(A, B);
  const dBC = dist(B, C);
  const dCA = dist(C, A);
  assert.ok(Math.abs(dAB - dBC) < 1e-4 && Math.abs(dBC - dCA) < 1e-4, 'Tam giác đều phải có 3 cạnh bằng nhau');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

// =========================================================================
// NHÓM C: TỨ GIÁC
// =========================================================================
test('Nhóm C - Bài 6: Hình bình hành ABCD và giao điểm O của 2 đường chéo', () => {
  const prompt = 'Cho hình bình hành ABCD. Gọi O là giao điểm của hai đường chéo AC và BD.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'quadrilateral');
  assert.equal(spec.quadrilateral?.type, 'parallelogram');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_QUADRILATERAL');

  const q = doc.data.geometry?.quadrilateral!;
  assert.ok(q.points && q.points.length === 4);
  const [A, B, C, D] = q.points;
  // O là trung điểm AC và BD
  const midAC = midpoint(A, C);
  const midBD = midpoint(B, D);
  assert.ok(Math.abs(midAC.x - midBD.x) < 1e-4 && Math.abs(midAC.y - midBD.y) < 1e-4, 'Hai đường chéo cắt nhau tại trung điểm');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm C - Bài 7: Hình chữ nhật ABCD và đường cao AH của tam giác ABD', () => {
  const prompt = 'Cho hình chữ nhật ABCD. Kẻ AH vuông góc với BD tại H.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'quadrilateral');
  assert.equal(spec.quadrilateral?.type, 'rectangle');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_QUADRILATERAL');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm C - Bài 8: Hình vuông ABCD', () => {
  const prompt = 'Cho hình vuông ABCD.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'quadrilateral');
  assert.equal(spec.quadrilateral?.type, 'square');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);

  const q = doc.data.geometry?.quadrilateral!;
  const [A, B, C, D] = q.points!;
  const dAB = dist(A, B);
  const dBC = dist(B, C);
  assert.ok(Math.abs(dAB - dBC) < 1e-4, 'Hình vuông có các cạnh bằng nhau');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

// =========================================================================
// NHÓM D: ĐƯỜNG TRÒN
// =========================================================================
test('Nhóm D - Bài 9: Từ điểm P ngoài đường tròn (O), kẻ hai tiếp tuyến PA, PB', () => {
  const prompt = 'Từ điểm P nằm ngoài đường tròn (O), kẻ hai tiếp tuyến PA và PB với đường tròn (A, B là các tiếp điểm). Nối OP và AB.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'circle');
  assert.equal(spec.circle?.presetType, 'two-tangents');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_CIRCLE');

  const c = doc.data.geometry?.circle!;
  assert.equal(c.showTangent, true);
  assert.equal(c.tangentType, 'two-tangents');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm D - Bài 10: Đường tròn (O), dây cung CD và khoảng cách OH', () => {
  const prompt = 'Cho đường tròn (O) và dây cung CD. Kẻ OH vuông góc với CD tại H.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'circle');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_CIRCLE');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

// =========================================================================
// NHÓM E: DỰNG HÌNH PHỨC HỢP (COMPOSITE) & KIỂM TRA ĐỔI TÊN ĐỈNH
// =========================================================================
test('Nhóm E - Bài 11: Bài toán chuẩn Section IV (ABC, AC < AB, M, ME, MF, on-ray H, I, J)', () => {
  const prompt =
    'Cho tam giác ABC vuông tại A, AC < AB. Gọi M là trung điểm BC. Từ M kẻ ME vuông góc AB tại E, MF vuông góc AC tại F. Trên tia MF lấy điểm H sao cho F nằm giữa M và H, đồng thời FM = FH. I là giao điểm EH và AF. J là trung điểm ME.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.type, 'right');

  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_TRIANGLE');

  const tri = doc.data.geometry?.triangle!;
  const [A, B, C] = tri.points!;
  const resolved = resolveAuxiliaryPoints({ A, B, C }, tri.auxPoints || []);

  for (const name of ['M', 'E', 'F', 'H', 'I', 'J']) {
    assert.ok(resolved[name], `Phải giải được toạ độ điểm ${name}`);
  }

  // M là trung điểm BC
  const midBC = midpoint(B, C);
  assert.ok(Math.hypot(resolved.M.x - midBC.x, resolved.M.y - midBC.y) < 1e-4);

  // F là trung điểm MH
  const midMH = midpoint(resolved.M, resolved.H);
  assert.ok(Math.hypot(resolved.F.x - midMH.x, resolved.F.y - midMH.y) < 1e-4);

  // J là trung điểm ME
  const midME = midpoint(resolved.M, resolved.E);
  assert.ok(Math.hypot(resolved.J.x - midME.x, resolved.J.y - midME.y) < 1e-4);

  // AC < AB
  assert.ok(dist(A, C) < dist(A, B));

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm E - Bài 12: Đổi tên đỉnh bài Section IV (tam giác DEF vuông tại D, DF < DE, N trung điểm EF, NP ⟂ DE tại P, NQ ⟂ DF tại Q, trên tia NQ lấy K sao cho Q nằm giữa N và K, QN = QK, R là giao điểm PK và DQ, S là trung điểm NP)', () => {
  const prompt =
    'Cho tam giác DEF vuông tại D, DF < DE. Gọi N là trung điểm EF. Từ N kẻ NP vuông góc DE tại P, NQ vuông góc DF tại Q. Trên tia NQ lấy điểm K sao cho Q nằm giữa N và K, đồng thời QN = QK. R là giao điểm PK và DQ. S là trung điểm NP.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.type, 'right');
  assert.deepEqual(spec.triangle?.vertices, ['D', 'E', 'F']);

  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  const tri = doc.data.geometry?.triangle!;
  const [D, E, F] = tri.points!;
  const resolved = resolveAuxiliaryPoints({ D, E, F }, tri.auxPoints || []);

  for (const name of ['N', 'P', 'Q', 'K', 'R', 'S']) {
    assert.ok(resolved[name], `Phải giải được toạ độ điểm ${name} khi đổi tên`);
  }

  // N là trung điểm EF
  const midEF = midpoint(E, F);
  assert.ok(Math.hypot(resolved.N.x - midEF.x, resolved.N.y - midEF.y) < 1e-4);

  // Q là trung điểm NK
  const midNK = midpoint(resolved.N, resolved.K);
  assert.ok(Math.hypot(resolved.Q.x - midNK.x, resolved.Q.y - midNK.y) < 1e-4);

  // S là trung điểm NP
  const midNP = midpoint(resolved.N, resolved.P);
  assert.ok(Math.hypot(resolved.S.x - midNP.x, resolved.S.y - midNP.y) < 1e-4);

  // DF < DE
  assert.ok(dist(D, F) < dist(D, E));

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(!svgHtml.includes('NaN'));
});

// =========================================================================
// NHÓM F: ĐA GIÁC ĐỀU & ĐỐI XỨNG (CANVASAREA DISPLAY & TRANSFORMS)
// =========================================================================
test('Nhóm F - Bài 13: Lục giác đều ABCDEF tâm O hiển thị chuẩn trong CanvasArea', () => {
  const prompt = 'Vẽ lục giác đều ABCDEF tâm O.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'polygon');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_POLYGON');
  assert.equal(doc.data.geometry?.subType, 'polygon');
  assert.equal(doc.data.geometry?.polygon?.sidesCount, 6);

  // QUAN TRỌNG: CanvasArea PHẢI render ra SVG đầy đủ, KHÔNG rơi vào "Chưa chọn loại hình vẽ"
  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'), 'CanvasArea phải hỗ trợ GEOMETRY_POLYGON');
  assert.ok(svgHtml.includes('<polygon') || svgHtml.includes('<path'), 'Phải có phần tử SVG đa giác');
  assert.ok(!svgHtml.includes('NaN'), 'Toạ độ đa giác không có NaN');
});

test('Nhóm F - Bài 14: Ngũ giác đều ABCDE hiển thị chuẩn trong CanvasArea', () => {
  const prompt = 'Cho đa giác đều ngũ giác ABCDE tâm O.';
  const spec = VietnameseGeometryParser.parse(prompt);
  assert.equal(spec.shapeCategory, 'polygon');
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  assert.equal(doc.type, 'GEOMETRY_POLYGON');

  const svgHtml = renderDocumentInCanvas(doc);
  assert.ok(!svgHtml.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgHtml.includes('<svg'));
  assert.ok(!svgHtml.includes('NaN'));
});

test('Nhóm F - Bài 15: Đối xứng trục và đối xứng tâm hiển thị chuẩn trong CanvasArea', () => {
  // 15a: Đối xứng trục
  const promptAxial = 'Cho tam giác ABC. Vẽ hình đối xứng với tam giác ABC qua trục d.';
  const specAxial = VietnameseGeometryParser.parse(promptAxial);
  assert.equal(specAxial.shapeCategory, 'symmetry');
  const docAxial = GeometrySpecificationAdapter.specToChartDocument(specAxial);
  assert.equal(docAxial.type, 'GEOMETRY_SYMMETRY');

  const svgAxial = renderDocumentInCanvas(docAxial);
  assert.ok(!svgAxial.includes('Chưa chọn loại hình vẽ'), 'CanvasArea phải hỗ trợ GEOMETRY_SYMMETRY');
  assert.ok(svgAxial.includes('<svg'));
  assert.ok(!svgAxial.includes('NaN'));

  // 15b: Đối xứng tâm
  const promptCentral = 'Cho tam giác ABC. Vẽ hình đối xứng với tam giác ABC qua tâm I.';
  const specCentral = VietnameseGeometryParser.parse(promptCentral);
  assert.equal(specCentral.shapeCategory, 'symmetry');
  const docCentral = GeometrySpecificationAdapter.specToChartDocument(specCentral);
  assert.equal(docCentral.type, 'GEOMETRY_SYMMETRY');

  const svgCentral = renderDocumentInCanvas(docCentral);
  assert.ok(!svgCentral.includes('Chưa chọn loại hình vẽ'));
  assert.ok(svgCentral.includes('<svg'));
  assert.ok(!svgCentral.includes('NaN'));
});
