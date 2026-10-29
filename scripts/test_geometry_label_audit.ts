import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { GeometrySvg } from '../src/renderers/GeometrySvg';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';

const problemA = 'Cho hình chữ nhật PQRS có PQ > PS. Kẻ PN vuông góc với QS tại N. Gọi M là trung điểm của QR. Nối PM và MN. Gọi O là giao điểm của PR và QS.';

test('Trường hợp A: Phân tích đề hình chữ nhật PQRS', () => {
  const spec = VietnameseGeometryParser.parse(problemA);
  console.log('Spec A:', JSON.stringify(spec, null, 2));

  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  console.log('Doc A quad:', JSON.stringify(doc.data.geometry?.quadrilateral, null, 2));

  const html = renderToStaticMarkup(
    React.createElement(GeometrySvg, {
      data: doc.data.geometry!,
      settings: doc.settings,
    })
  );

  // Tìm tất cả các thẻ text chứa chữ O
  const oMatches = Array.from(html.matchAll(/>\s*O\s*<\/text>/g));
  console.log('Number of O text labels in SVG:', oMatches.length);

  // Tìm các nhãn điểm trong SVG
  const labelMatches = Array.from(html.matchAll(/>\s*([A-Za-z0-9]+)\s*<\/text>/g)).map(m => m[1]);
  console.log('All labels found in SVG:', labelMatches);

  // Tìm tất cả các line và path
  const lines = Array.from(html.matchAll(/<line ([^>]+)>/g)).map(m => m[1]);
  console.log('Lines count:', lines.length);
  lines.forEach((l, i) => console.log(`Line ${i}:`, l));

  // Kiểm tra parallel paths
  const parallelPaths = Array.from(html.matchAll(/<path[^>]*d="([^"]+)"[^>]*stroke-width="1\.3"/g)).map(m => m[1]);
  console.log('Parallel paths count:', parallelPaths.length);

  assert.equal(spec.shapeCategory, 'quadrilateral');
  assert.equal(spec.quadrilateral?.type, 'rectangle');

  // Khẳng định 1: Nhãn O chỉ xuất hiện đúng 1 lần duy nhất trong toàn bộ SVG
  assert.equal(oMatches.length, 1, 'Nhãn O chỉ được xuất hiện đúng 1 lần duy nhất');

  // Khẳng định 2: Tất cả các nhãn P, Q, R, S, M, N, O đều xuất hiện đúng 1 lần
  for (const name of ['P', 'Q', 'R', 'S', 'M', 'N', 'O']) {
    const count = labelMatches.filter(l => l === name).length;
    assert.equal(count, 1, `Nhãn ${name} phải xuất hiện đúng 1 lần, thực tế: ${count}`);
  }

  // Khẳng định 3: Không vẽ đè 2 đường chéo (1 nét đứt 1 nét liền)
  const dashedDiagonals = lines.filter(l => l.includes('stroke-dasharray="6 4"'));
  assert.equal(dashedDiagonals.length, 0, 'Không được vẽ đè 2 đường chéo nét đứt khi đã có đường chéo nét liền');

  // Khẳng định 4: Nhãn N đặt tránh góc vuông
  const [nTag] = html.match(/<text\b[^>]*>\s*N\s*<\/text>/) || [];
  assert.ok(nTag, 'Phải tìm thấy thẻ nhãn N trong SVG');
  const ny = parseFloat(nTag.match(/\by="([^"]+)"/)?.[1] || '');
  const nx = parseFloat(nTag.match(/\bx="([^"]+)"/)?.[1] || '');
  console.log('Position of label N:', { nx, ny });
  assert.ok(ny > 252, `Tọa độ y của nhãn N (${ny}) phải nằm dưới góc vuông (y > 252)`);
});

test('Trường hợp A2: Kiểm tra khi bật showParallelMarkers, mũi tên song song tự động tránh trung điểm M', () => {
  const spec = VietnameseGeometryParser.parse(problemA);
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  // Bật thủ công showParallelMarkers
  doc.data.geometry!.quadrilateral!.showParallelMarkers = true;

  const html = renderToStaticMarkup(
    React.createElement(GeometrySvg, {
      data: doc.data.geometry!,
      settings: doc.settings,
    })
  );

  // Tìm tất cả các path mũi tên song song
  const arrowPaths = Array.from(html.matchAll(/<path[^>]*d="([^"]+)"[^>]*stroke-width="1\.3"/g)).map(m => m[1]);
  assert.ok(arrowPaths.length > 0, 'Phải có mũi tên song song');

  // Kiểm tra không có mũi tên nào có tọa độ đỉnh trùng (410, 220) - tọa độ trung điểm M
  for (const p of arrowPaths) {
    assert.equal(p.includes('410 220'), false, 'Mũi tên song song không được trùng đúng tọa độ (410, 220) của điểm M');
  }
});

const problemB = 'Cho đường tròn (O) và điểm P nằm ngoài đường tròn. Từ P kẻ hai tiếp tuyến PA, PB với đường tròn (A, B là các tiếp điểm). Gọi H là giao điểm của OP và AB.';

test('Trường hợp B: Phân tích đề đường tròn (O) hai tiếp tuyến PA, PB và H = OP giao AB', () => {
  const spec = VietnameseGeometryParser.parse(problemB);
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  const html = renderToStaticMarkup(
    React.createElement(GeometrySvg, {
      data: doc.data.geometry!,
      settings: doc.settings,
    })
  );

  const labelMatches = Array.from(html.matchAll(/>\s*([A-Za-z0-9]+)\s*<\/text>/g)).map(m => m[1]);
  console.log('All labels found in SVG Case B:', labelMatches);

  assert.equal(spec.shapeCategory, 'circle');
  assert.equal(spec.circle?.presetType, 'two-tangents');

  // Khẳng định: Các điểm O, P, A, B, H mỗi điểm xuất hiện đúng 1 lần
  for (const name of ['O', 'P', 'A', 'B', 'H']) {
    const count = labelMatches.filter(l => l === name).length;
    assert.equal(count, 1, `Nhãn ${name} trong Case B phải xuất hiện đúng 1 lần, thực tế: ${count}`);
  }
});


