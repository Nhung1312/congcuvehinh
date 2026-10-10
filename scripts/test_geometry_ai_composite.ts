import test from 'node:test';
import assert from 'node:assert/strict';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { completeCompositeTriangle } from '../src/ai/parser/completeCompositeTriangle';
import { getTriangleCircumcircle, midpoint, projectPointToLine } from '../src/utils/geometryMath';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';

const problem = 'Cho tam giác ABC nhọn, AB < AC, nội tiếp đường tròn (O). Kẻ hai đường cao BD và CE của tam giác ABC (D thuộc AC, E thuộc AB), chúng cắt nhau tại H. Gọi M là trung điểm BC. Kẻ tiếp tuyến với đường tròn (O) tại A, tiếp tuyến này cắt đường thẳng BC tại T. a) Chứng minh AH vuông góc BC. b) Chứng minh B, C, D, E cùng thuộc một đường tròn. c) Chứng minh TA² = TB × TC.';

test('Hình Toán 9 hỗn hợp: tam giác, (O), trực tâm, M và tiếp tuyến cắt BC tại T', () => {
  const spec = VietnameseGeometryParser.parse(problem);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.circumscribedCircle, true);
  assert.ok(spec.altitudes?.some(p => p.from === 'B' && p.foot === 'D'));
  assert.ok(spec.altitudes?.some(p => p.from === 'C' && p.foot === 'E'));
  assert.ok(spec.auxPoints?.some(p => p.name === 'H' && p.type === 'intersection'));
  assert.ok(spec.auxPoints?.some(p => p.name === 'T' && p.type === 'intersection' && p.line2 === 'BC'));
  assert.ok(spec.auxPoints?.some(p => p.name === 'x' && p.type === 'tangent'));
  assert.equal(spec.altitudes?.some(p => p.from === 'A' && p.foot === 'H'), false);
  const tri = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry?.triangle;
  assert.ok(tri?.circumscribedCircle?.enabled);
  const [A, B, C] = tri!.points!;
  const D = projectPointToLine(B, A, C).point, E = projectPointToLine(C, A, B).point;
  const O = getTriangleCircumcircle(A, B, C).center;
  const p = resolveAuxiliaryPoints({ A, B, C, D, E, O }, tri!.auxPoints || []);
  assert.ok(p.H && p.T && p.M, 'Must resolve all auxiliary points');
  const perpendicular = (u: {x:number;y:number}, v:{x:number;y:number}) => u.x * v.x + u.y * v.y;
  assert.ok(Math.abs(perpendicular({ x:p.H.x-B.x,y:p.H.y-B.y },{x:C.x-A.x,y:C.y-A.y})) < 1e-6);
  assert.ok(Math.abs(perpendicular({ x:p.H.x-C.x,y:p.H.y-C.y },{x:B.x-A.x,y:B.y-A.y})) < 1e-6);
  assert.ok(Math.abs(perpendicular({ x:p.T.x-A.x,y:p.T.y-A.y },{x:A.x-O.x,y:A.y-O.y})) < 1e-6);
  assert.ok(Math.abs((p.T.x-B.x)*(C.y-B.y)-(p.T.y-B.y)*(C.x-B.x)) < 1e-6);
  const M = midpoint(B, C);
  assert.ok(Math.abs(p.M.x-M.x) < 1e-6 && Math.abs(p.M.y-M.y) < 1e-6);
  assert.ok(tri!.auxLines?.some(l => l.from === 'A' && l.to === 'T'));
  assert.ok(tri!.auxPoints?.some(q => q.name === 'x' && q.showPoint === false));
});

test('Gemini phân loại circle không được làm mất tam giác ABC', () => {
  const spec = completeCompositeTriangle({
    shapeCategory:'circle',title:'Kết hợp',circle:{presetType:'basic',center:'O'},
    detectedEntities:[],explanation:'',
  }, problem);
  assert.equal(spec.shapeCategory, 'triangle');
  assert.equal(spec.triangle?.circumscribedCircle,true);
  assert.ok(spec.auxPoints?.find(p => p.name === 'T'));
});

test('Tiếp tuyến Ax độc lập vẫn hiển thị tia và dấu vuông góc', () => {
  const spec = VietnameseGeometryParser.parse('Cho tam giác ABC nội tiếp đường tròn (O). Kẻ tiếp tuyến Ax tại A.');
  const t = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry?.triangle;
  assert.ok(t?.auxLines?.some(l => l.from === 'A' && l.to === 'x'));
  assert.ok(t?.rightAngleMarkers?.some(p => p.vertex === 'A'));
  assert.ok(t?.auxPoints?.some(p => p.name === 'x' && p.showLabel !== false));
});

test('Không biến mục tiêu chứng minh tiếp tuyến thành phép dựng', () => {
  const spec = VietnameseGeometryParser.parse('Cho tam giác ABC nội tiếp đường tròn (O). Chứng minh AT là tiếp tuyến của (O) tại A.');
  assert.equal(spec.auxPoints?.some(p => p.type === 'tangent'),false);
});
