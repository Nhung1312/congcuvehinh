import test from 'node:test';
import assert from 'node:assert/strict';
import { aspectFitSceneViewBox, getGeometrySceneBoundingBox } from '../src/utils/geometrySceneBounds';
import { layoutGeometryPointLabels } from '../src/utils/smartGeometryLayout';
import { getRightAngleMarkerPath } from '../src/utils/geometryMath';

const fit = (minX: number, maxX: number, minY: number, maxY: number) =>
  aspectFitSceneViewBox({ minX, maxX, minY, maxY }, 600, 450);

function assertContains(box: ReturnType<typeof fit>, p: { x: number; y: number }) {
  assert.ok(p.x >= box.minX - 0.00001 && p.x <= box.minX + box.width + 0.00001);
  assert.ok(p.y >= box.minY - 0.00001 && p.y <= box.minY + box.height + 0.00001);
}

test('Tight viewport removes forced old-canvas whitespace while preserving 4:3 aspect', () => {
  const box = fit(150, 420, 110, 340);
  assert.ok(box.minX > 0);
  assert.ok(box.width < 600);
  assert.ok(Math.abs(box.width / box.height - 4 / 3) < 1e-10);
  for (const p of [{ x: 150, y: 110 }, { x: 420, y: 340 }]) assertContains(box, p);
});

test('Remote tangent intersection T stays in the viewBox: no fake movement of T', () => {
  const T = { x: -700, y: -800 };
  const B = { x: 130, y: 340 };
  const box = fit(-700, 450, -800, 400);
  assertContains(box, T);
  assertContains(box, B);
  assert.equal(T.x, -700);
});

test('Extreme horizontal and vertical geometries are not distorted', () => {
  for (const box of [fit(-800, 1200, 10, 60), fit(30, 80, -800, 1200)]) {
    assert.ok(Math.abs(box.width / box.height - 4 / 3) < 1e-10);
    assert.ok(box.width > 0 && box.height > 0);
  }
});

test('Degenerate/nonfinite viewBox falls back to the canvas safely', () => {
  assert.deepEqual(fit(NaN, 120, 0, 90), { minX: 0, minY: 0, width: 600, height: 450 });
  assert.deepEqual(fit(25, 25, 10, 10), { minX: 0, minY: 0, width: 600, height: 450 });
});

test('Labels never change the mathematical vertices/edges', () => {
  const points = [{ x: 220, y: 110 }, { x: 130, y: 340 }, { x: 430, y: 340 }];
  const frozen = JSON.stringify(points);
  const names = ['A', 'B', 'C'];
  const edges = points.map((start, i) => ({ start, end: points[(i + 1) % 3] }));
  const positions = layoutGeometryPointLabels(points.map((point, i) => ({ name: names[i], point })), edges, points);
  assert.equal(Object.keys(positions).length, 3);
  assert.equal(JSON.stringify(points), frozen);
  for (const [i, name] of names.entries()) {
    assert.ok(Math.hypot(positions[name].x - points[i].x, positions[name].y - points[i].y) >= 10);
  }
});

test('Nearby point names are placed deterministically without overlap in simple scene', () => {
  const labels = [{ name: 'D', point: { x: 120, y: 120 } }, { name: 'N', point: { x: 138, y: 120 } }];
  const segments = [{ start: { x: 105, y: 120 }, end: { x: 155, y: 120 } }];
  const first = layoutGeometryPointLabels(labels, segments, labels.map(l => l.point));
  const second = layoutGeometryPointLabels(labels, segments, labels.map(l => l.point));
  assert.deepEqual(first, second);
  const p = first.D, q = first.N;
  assert.ok(Math.abs(p.x - q.x) > 12 || Math.abs(p.y - q.y) > 20);
});

test('Auxiliary point labels consider line segments as collision obstacles', () => {
  const origin = { x: 100, y: 100 };
  const line = { start: { x: 80, y: 80 }, end: { x: 120, y: 120 } };
  const label = layoutGeometryPointLabels([{ name: 'H', point: origin }], [line], [origin]).H;
  assert.ok(label.x !== origin.x || label.y !== origin.y);
  assert.equal(label.textAnchor, 'middle');
});

test('A false right-angle marker remains suppressed by the geometry engine', () => {
  assert.equal(getRightAngleMarkerPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 90, y: 20 }), '');
  assert.notEqual(getRightAngleMarkerPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }), '');
});

test('Symmetry scene bounds contain reflected points even before browser measurement', () => {
  const bounds = getGeometrySceneBoundingBox({
    subType: 'symmetry',
    symmetry: { type: 'axial', targetShape: 'triangle',
      originalPoints: [{x: 120,y:80}, {x:130,y:190},{x:170,y:210}],
      axisPoints: [{x:300,y:70},{x:300,y:370}] },
  }, 600, 450);
  const view = aspectFitSceneViewBox(bounds, 600, 450);
  assert.ok(bounds.maxX >= 480);
  assertContains(view, {x:480,y:80});
  assertContains(view, {x:120,y:80});
});

test('Circular/small scenes preserve finite non-distorted viewport dimensions', () => {
  const bounds = getGeometrySceneBoundingBox({
    subType:'circle', circle: {points:[{x:300,y:250},{x:400,y:250}],radius:100},
  }, 600, 450);
  const view = aspectFitSceneViewBox(bounds, 600, 450);
  for (const p of [{x:200,y:250},{x:400,y:250},{x:300,y:150},{x:300,y:350}]) assertContains(view,p);
  assert.ok(Math.abs(view.width / view.height - 4/3) < 1e-9);
});
