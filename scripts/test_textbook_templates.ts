import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TEXTBOOK_TEMPLATES } from '../src/storage/storageService';
import { BASIC_TEXTBOOK_TEMPLATES, createTemplateDocument } from '../src/storage/textbookTemplates';
import { GeometrySvg } from '../src/renderers/GeometrySvg';
import { dist, getTwoTangentContactPoints, midpoint } from '../src/utils/geometryMath';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('Mọi mẫu hình có sẵn vẽ được SVG hữu hạn, có nội dung và ID xem trước riêng', () => {
  const ids = new Set<string>();
  for (const tpl of TEXTBOOK_TEMPLATES) {
    assert.ok(!ids.has(tpl.id)); ids.add(tpl.id);
    if (!tpl.data.geometry) continue;
    const svg = renderToStaticMarkup(React.createElement(GeometrySvg, {
      data: tpl.data.geometry, settings: tpl.settings, svgId: `preview-${tpl.id}`,
    }));
    assert.ok(!/NaN|Infinity|undefined/.test(svg), tpl.title);
    assert.match(svg, /id="preview-/);
    assert.match(svg, /<(line|path|polygon|circle)\s/);
    assert.ok(!svg.includes('id="svg-math-canvas"'));
  }
});

test('Mẫu tam giác cân, đều, vuông và vuông cân thỏa điều kiện hình học', () => {
  for (const tpl of BASIC_TEXTBOOK_TEMPLATES) {
    const t = tpl.data.geometry?.triangle;
    if (!t?.points || t.type === 'general') continue;
    const [a,b,c] = t.points;
    if (t.type === 'isosceles' || t.type === 'equilateral' || t.type === 'right-isosceles') near(dist(a,b), dist(a,c));
    if (t.type === 'equilateral') near(dist(a,b), dist(b,c));
    if (t.type === 'right' || t.type === 'right-isosceles') near((b.x-a.x)*(c.x-a.x)+(b.y-a.y)*(c.y-a.y),0);
  }
});

test('Hai tam giác c.c.c. có các cạnh tương ứng bằng nhau và ba nhóm ký hiệu', () => {
  const t = BASIC_TEXTBOOK_TEMPLATES.find(t=>t.id.endsWith('_congruent'))!.data.geometry!.triangle!;
  const [a,b,c] = t.points!;
  const points = resolveAuxiliaryPoints({ A:a, B:b, C:c }, t.auxPoints!);
  near(dist(a,b), dist(points.D,points.E)); near(dist(b,c), dist(points.E,points.F)); near(dist(c,a), dist(points.F,points.D));
  assert.deepEqual(t.equalSidesMarkers!.map(m=>m.tickType),[1,2,3]);
});

test('Mẫu đường trung bình thỏa MN song song BC và MN = BC/2', () => {
  const t = BASIC_TEXTBOOK_TEMPLATES.find(t=>t.id.endsWith('_midline'))!.data.geometry!.triangle!;
  const [a,b,c] = t.points!;
  const points = resolveAuxiliaryPoints({ A:a, B:b, C:c }, t.auxPoints!);
  near(points.M.x,midpoint(a,b).x); near(points.N.y,midpoint(a,c).y);
  near(dist(points.M,points.N),dist(b,c)/2);
  near((points.N.x-points.M.x)*(c.y-b.y)-(points.N.y-points.M.y)*(c.x-b.x),0);
});

test('Tiếp tuyến từ A ngoài (O): B, C thuộc (O), AB = AC và vuông góc bán kính', () => {
  const c = BASIC_TEXTBOOK_TEMPLATES.find(t=>t.id.endsWith('_two-tangents'))!.data.geometry!.circle!;
  const [o,a] = c.points!; const {p1:b,p2:d,isValid} = getTwoTangentContactPoints(o,c.radius!,a);
  assert.ok(isValid); near(dist(o,b),c.radius!); near(dist(o,d),c.radius!); near(dist(a,b),dist(a,d));
  for (const p of [b,d]) near((p.x-o.x)*(a.x-p.x)+(p.y-o.y)*(a.y-p.y),0);
  const svg = renderToStaticMarkup(React.createElement(GeometrySvg,{data:{subType:'circle',circle:c},settings:TEXTBOOK_TEMPLATES[0].settings}));
  for (const label of ['O','A','B','C']) assert.ok(svg.includes(`>${label}</text>`));
});

test('Chọn mẫu tạo tài liệu độc lập, không đổi mẫu gốc hoặc trùng ID', () => {
  const source = BASIC_TEXTBOOK_TEMPLATES[0]; const original = structuredClone(source);
  const a = createTemplateDocument(source), b = createTemplateDocument(source);
  assert.notEqual(a.id,b.id); assert.notEqual(a.id,source.id);
  a.data.geometry!.lineRay!.pointNames![0] = 'X';
  assert.deepEqual(source,original); assert.ok(a.createdAt > 0); assert.equal(a.createdAt,a.updatedAt);
});


test('Dấu góc vuông được vẽ tại tiếp điểm của cả hai mẫu tiếp tuyến', () => {
  for (const [suffix, count] of [['_tangent', 1], ['_two-tangents', 2]] as const) {
    const tpl = BASIC_TEXTBOOK_TEMPLATES.find(t => t.id.endsWith(suffix))!;
    const svg = renderToStaticMarkup(React.createElement(GeometrySvg, { data: tpl.data.geometry!, settings: tpl.settings }));
    assert.equal((svg.match(/<path d="M[^"]*" stroke="#475569"/g) || []).length, count);
  }
});
