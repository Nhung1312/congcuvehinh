import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AI_GEOMETRY_PRESETS } from '../src/ai/aiPresets';
import { buildGeometryPresetDocument } from '../src/ai/geometryPresetDocuments';
import { CanvasArea } from '../src/components/CanvasArea';
import { GeometrySvg } from '../src/renderers/GeometrySvg';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { projectPointToLine, angleBisectorPoint, midpoint } from '../src/utils/geometryMath';
import type { GeometrySpecification } from '../src/ai/types';

for (const preset of AI_GEOMETRY_PRESETS) {
  test(`${preset.title}: mở offline và có hình trong CanvasArea`, () => {
    const doc = buildGeometryPresetDocument(preset);
    const data = doc.data.geometry!;
    assert.ok(data[data.subType === 'line-ray' ? 'lineRay' : data.subType]);
    const html = renderToStaticMarkup(React.createElement(CanvasArea, { currentDoc: doc, onCopyImage() {} }));
    assert.ok(html.includes('id="svg-math-canvas"'), 'Canvas phải chọn được renderer');
    assert.ok(/<(line|path|polygon|circle)\b/.test(html));
    assert.equal(/NaN|Infinity|Chưa chọn loại hình vẽ/.test(html), false);
  });
}

test('Mẫu dựng sẵn không thay đổi settings hay tài liệu đã mở', () => {
  const doc = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[0]);
  const before = structuredClone(doc);
  const next = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[11], doc.settings);
  assert.deepEqual(doc, before);
  next.data.geometry!.quadrilateral!.vertexNames[0] = 'X';
  assert.equal(buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[11]).data.geometry!.quadrilateral!.vertexNames[0], 'A');
});

test('Hình thang giữ AB // CD, đường chéo cắt nhau; chữ nhật có góc vuông', () => {
  for (const index of [5, 6, 11]) {
    const q = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[index]).data.geometry!.quadrilateral!;
    assert.ok(q.diagonals?.AC.enabled && q.diagonals?.BD.enabled);
    assert.equal(q.diagonals?.intersectionLabel, 'O');
    assert.equal(q.auxLines?.length, 0, 'Không tự thêm tiếp tuyến/bán kính');
    assert.equal(q.rightAngleMarkers?.length, 0);
    const [a, b, c, d] = q.points!;
    if (index !== 5) assert.ok(Math.abs((b.x-a.x)*(d.y-c.y)-(b.y-a.y)*(d.x-c.x)) < 1e-6);
    if (index === 11) assert.ok(Math.abs((b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)) < 1e-6);
  }
});

test('Tam giác cân: H, M, D trùng nhau; tam giác vuông tại A có AH ⟂ BC', () => {
  const tri = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[3]).data.geometry!.triangle!;
  const [a, b, c] = tri.points!;
  const h = projectPointToLine(a, b, c).point;
  assert.deepEqual(h, midpoint(b, c));
  const d = angleBisectorPoint(a, b, c);
  assert.ok(Math.hypot(h.x-d.x,h.y-d.y) < 1e-6);
  const [ra, rb, rc] = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[4]).data.geometry!.triangle!.points!;
  assert.ok(Math.abs((rb.x-ra.x)*(rc.x-ra.x)+(rb.y-ra.y)*(rc.y-ra.y)) < 1e-6);
});

test('Nhãn chân trùng nhau được gộp; khi kéo thành tam giác thường các nhãn tách lại', () => {
  const doc = buildGeometryPresetDocument(AI_GEOMETRY_PRESETS[3]);
  const render = () => renderToStaticMarkup(React.createElement(GeometrySvg, { data: doc.data.geometry!, settings: doc.settings }));
  const html = render();
  assert.equal((html.match(/>H = M = D<\/text>/g) || []).length, 1);
  doc.data.geometry!.triangle!.type = 'general';
  doc.data.geometry!.triangle!.points![0].x += 45;
  const moved = render();
  assert.equal(moved.includes('H = M = D'), false);
  for (const name of ['H', 'M', 'D']) assert.ok(moved.includes(`>${name}</text>`));
});

test('Giao hai đường thường chứa A không bị nhận nhầm là tiếp tuyến', () => {
  for (const vertices of [['A','B','C','D'], ['K','L','M','N']] as [string,string,string,string][]) {
    const [a,b,c,d] = vertices;
    const spec: GeometrySpecification = { title: 'Hai đường chéo', shapeCategory: 'quadrilateral',
      quadrilateral: { type: 'rectangle', vertices }, auxPoints: [{ name: 'O', type: 'intersection', line1: a+c, line2: b+d }],
      auxLines: [{ from: a, to: c }, { from: b, to: d }], detectedEntities: [], explanation: '' };
    const q = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry!.quadrilateral!;
    assert.deepEqual(q.auxLines?.map(l => [l.from,l.to]), [[a,c],[b,d]]);
    assert.equal(q.rightAngleMarkers?.length, 0);
  }
});

test('Tiếp tuyến dùng tên phụ bất kỳ, giao điểm khai báo ở line2 dạng mảng', () => {
  const spec: GeometrySpecification = { title: 'Tiếp tuyến', shapeCategory: 'triangle',
    triangle: { type: 'general', vertices: ['K','L','M'], circumscribedCircle: true },
    auxPoints: [{ name: 'y', type: 'tangent', fromPoint: 'K', centerPoint: 'O' },
      { name: 'T', type: 'intersection', line1: ['L','M'], line2: ['K','y'] }],
    auxLines: [{ from: 'K', to: 'y' }], rightAngles: [{ vertex: 'K', ray1: 'O', ray2: 'y' }], detectedEntities: [], explanation: '' };
  const t = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry!.triangle!;
  assert.ok(t.auxLines?.some(l => l.from === 'K' && l.to === 'T'));
  assert.ok(t.auxLines?.some(l => l.from === 'O' && l.to === 'K'));
  assert.equal(t.auxLines?.some(l => l.to === 'y'), false);
  assert.equal(t.auxPoints?.find(p => p.name === 'y')?.showLabel, false);
  assert.ok(t.rightAngleMarkers?.some(m => m.vertex === 'K' && m.ray2 === 'T'));
});
