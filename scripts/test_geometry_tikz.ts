import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTikzCode } from '../src/export/tikzExport';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { getQuadPresetPoints } from '../src/utils/geometryMath';
import type { ChartDocument } from '../src/types';

const create = (spec: string) =>
  GeometrySpecificationAdapter.specToChartDocument(VietnameseGeometryParser.parse(spec));

test('Xuất tam giác có đường cao AH, hình chiếu D/E, trung tuyến AM và nối DE', () => {
  const doc = create('Cho tam giác ABC vuông tại A. Kẻ AH vuông góc BC tại H. Từ H kẻ HD vuông góc AB tại D, HE vuông góc AC tại E. Gọi M là trung điểm BC. Nối DE và AM.');
  const tikz = generateTikzCode(doc);
  assert.match(tikz, /\\begin\{tikzpicture\}/);
  assert.match(tikz, /\\end\{tikzpicture\}/);
  for (const name of ['A','B','C','H','D','E','M']) assert.ok(tikz.includes('{$' + name + '$}'), 'Missing ' + name);
  assert.ok((tikz.match(/\\draw/g) || []).length >= 6, 'Sides and auxiliary segments must be exported');
});

test('Xuất tam giác nội tiếp (O) và trực tâm H từ hai đường cao', () => {
  const doc = create('Cho tam giác ABC nhọn nội tiếp đường tròn (O), hai đường cao BD và CE cắt nhau tại H.');
  const tikz = generateTikzCode(doc);
  assert.match(tikz, /circle \(/);
  for (const name of ['O','H','D','E']) assert.ok(tikz.includes('{$' + name + '$}'), 'Missing '+name);
  assert.ok((tikz.match(/\\draw/g) || []).length >= 4);
});

test('Xuất tứ giác đúng tọa độ người dùng đã chỉnh sửa', () => {
  const doc = create('Cho hình bình hành ABCD.');
  const quad = doc.data.geometry?.quadrilateral;
  assert.ok(quad);
  quad!.points = getQuadPresetPoints('parallelogram');
  quad!.points[0] = { x: 240, y: 150 };
  const tikz = generateTikzCode(doc);
  assert.ok(tikz.includes('(8.4,-5.25)'), 'Must export dragged coordinates, not initial template');
  assert.ok(tikz.includes('{$D$}'));
});

test('Xuất đường tròn cơ bản cùng bán kính', () => {
  const doc = create('Cho đường tròn tâm O bán kính OA.');
  const tikz = generateTikzCode(doc);
  assert.match(tikz, /circle \(/);
  assert.ok(tikz.includes('{$O$}'));
});

test('Không được trả lại hình tam giác mẫu khi loại hình không hỗ trợ', () => {
  const fake = { type: 'GEOMETRY_ANGLE', data: { geometry: { subType: 'angle' } } } as ChartDocument;
  const tikz = generateTikzCode(fake);
  assert.ok(tikz.startsWith('% TikZ export'));
});
