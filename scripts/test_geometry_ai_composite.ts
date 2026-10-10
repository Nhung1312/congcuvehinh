import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeometrySvg } from '../src/renderers/GeometrySvg';
import { CanvasArea } from '../src/components/CanvasArea';
import { aspectFitSceneViewBox } from '../src/utils/geometrySceneBounds';
import { getRightAngleMarkerPath } from '../src/utils/geometryMath';
import assert from 'node:assert/strict';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { completeCompositeTriangle } from '../src/ai/parser/completeCompositeTriangle';
import { getTriangleCircumcircle, midpoint, projectPointToLine } from '../src/utils/geometryMath';
import { getGeometrySceneBoundingBox } from '../src/utils/geometrySceneBounds';
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

test('Hồi quy Đợt 2: Tam giác nhọn nội tiếp (O) + BD, CE cắt nhau tại H, M trung điểm BC, tiếp tuyến tại A cắt BC tại T', () => {
  const problemReal = 'Cho tam giác ABC nhọn, AB nhỏ hơn AC, nội tiếp đường tròn (O). Kẻ hai đường cao BD và CE cắt nhau tại H. Gọi M là trung điểm BC. Kẻ tiếp tuyến của đường tròn (O) tại A, tiếp tuyến này cắt đường thẳng BC tại T.';
  const spec = VietnameseGeometryParser.parse(problemReal);
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec);
  const tri = doc.data.geometry?.triangle!;

  // 1. Có điểm T trong dữ liệu hiển thị (hiển thị cả điểm và nhãn)
  const pointT = tri.auxPoints?.find(p => p.name === 'T');
  assert.ok(pointT, 'Phải có điểm T trong auxPoints');
  assert.equal(pointT.showPoint !== false, true, 'Điểm T phải được hiển thị');
  assert.equal(pointT.showLabel !== false, true, 'Nhãn T phải được hiển thị');

  // 2. Không hiển thị x khi đã có T
  const pointX = tri.auxPoints?.find(p => p.name === 'x');
  if (pointX) {
    assert.equal(pointX.showPoint, false, 'Điểm phụ x phải ẩn khi đã có T');
    assert.equal(pointX.showLabel, false, 'Nhãn x phải ẩn khi đã có T');
  }
  assert.equal(tri.auxLines?.some(l => l.from === 'x' || l.to === 'x'), false, 'Không có đoạn nối tới x');

  // 3. Có đoạn nối AT và phần kéo dài của BC đến T
  assert.ok(
    tri.auxLines?.some(l => (l.from === 'A' && l.to === 'T') || (l.from === 'T' && l.to === 'A')),
    'Phải có đoạn phụ AT hiển thị đúng'
  );
  assert.ok(
    tri.auxLines?.some(
      l =>
        (l.from === 'B' && l.to === 'T') ||
        (l.from === 'T' && l.to === 'B') ||
        (l.from === 'C' && l.to === 'T') ||
        (l.from === 'T' && l.to === 'C')
    ),
    'Phải có phần kéo dài cần thiết từ B/C đến T'
  );

  // 4. Ký hiệu vuông góc tại A hướng theo tia AT (không hướng x)
  const raA = tri.rightAngleMarkers?.find(r => r.vertex === 'A');
  if (raA) {
    assert.notEqual(raA.ray1, 'x', 'Ký hiệu vuông góc không dùng điểm phụ x');
    assert.notEqual(raA.ray2, 'x', 'Ký hiệu vuông góc không dùng điểm phụ x');
  }

  // 5. Bounding box sau render có chứa T và mở rộng an toàn
  const [A, B, C] = tri.points!;
  const D = projectPointToLine(B, A, C).point;
  const E = projectPointToLine(C, A, B).point;
  const O = getTriangleCircumcircle(A, B, C).center;
  const resolved = resolveAuxiliaryPoints({ A, B, C, D, E, O }, tri.auxPoints || []);
  assert.ok(resolved.T, 'Điểm T phải resolve tọa độ thành công');

  const bbox = getGeometrySceneBoundingBox(doc.data.geometry!, 560, 440, 40);
  assert.ok(
    bbox.minX <= resolved.T.x,
    `Bounding box minX (${bbox.minX}) phải <= T.x (${resolved.T.x}) để chứa T`
  );
  assert.ok(
    bbox.maxX >= resolved.T.x,
    `Bounding box maxX (${bbox.maxX}) phải >= T.x (${resolved.T.x}) để chứa T`
  );
  assert.ok(
    bbox.minY <= resolved.T.y,
    `Bounding box minY (${bbox.minY}) phải <= T.y (${resolved.T.y}) để chứa T`
  );
  assert.ok(
    bbox.maxY >= resolved.T.y,
    `Bounding box maxY (${bbox.maxY}) phải >= T.y (${resolved.T.y}) để chứa T`
  );

  // 6. AT vuông góc OA (tích vô hướng = 0)
  const vecAT = { x: resolved.T.x - A.x, y: resolved.T.y - A.y };
  const vecOA = { x: A.x - O.x, y: A.y - O.y };
  const dotProd = vecAT.x * vecOA.x + vecAT.y * vecOA.y;
  assert.ok(Math.abs(dotProd) < 1e-5, `AT phải vuông góc OA, dotProd=${dotProd}`);

  // 7. T nằm trên đường thẳng BC (tích có hướng = 0)
  const crossProd = (resolved.T.x - B.x) * (C.y - B.y) - (resolved.T.y - B.y) * (C.x - B.x);
  assert.ok(Math.abs(crossProd) < 1e-5, `T phải nằm trên đường thẳng BC, crossProd=${crossProd}`);
});


test('Bỏ đề trên hình và giữ T, không hiện điểm trợ giúp x', () => {
  const prompt = 'Cho tam giác ABC nhọn nội tiếp đường tròn (O). Kẻ tiếp tuyến của (O) tại A, tiếp tuyến này cắt đường thẳng BC tại T.';
  const doc = GeometrySpecificationAdapter.specToChartDocument(VietnameseGeometryParser.parse(prompt));
  const svg = renderToStaticMarkup(React.createElement(GeometrySvg, {
    data: doc.data.geometry!, settings: doc.settings,
  }));
  assert.ok(!svg.includes(doc.title), 'Không in tiêu đề đề bài vào trong hình');
  assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'), 'SVG không làm méo góc và đường tròn');
  assert.match(svg, />T<\/text>/, 'Hiện giao điểm T');
  assert.doesNotMatch(svg, />x<\/text>/, 'Ẩn trợ điểm x khi T có mặt');
});

test('Bố cục tiếp tuyến ngắn hơn mà tam giác vẫn nhọn', () => {
  const spec = VietnameseGeometryParser.parse('Cho tam giác ABC nhọn nội tiếp đường tròn (O). Kẻ tiếp tuyến tại A cắt đường thẳng BC tại T.');
  const t = GeometrySpecificationAdapter.specToChartDocument(spec).data.geometry!.triangle!;
  const [A, B, C] = t.points!;
  const dot = (u: {x:number;y:number}, v: {x:number;y:number}) => u.x*v.x + u.y*v.y;
  const vec = (p: {x:number;y:number}, q: {x:number;y:number}) => ({x:q.x-p.x,y:q.y-p.y});
  assert.ok(dot(vec(A,B),vec(A,C)) > 0 && dot(vec(B,A),vec(B,C)) > 0 && dot(vec(C,A),vec(C,B)) > 0,
    'ABC vẫn là tam giác nhọn');
  assert.ok(Math.hypot(A.x-B.x,A.y-B.y) < Math.hypot(A.x-C.x,A.y-C.y), 'AB vẫn nhỏ hơn AC');
  const O = getTriangleCircumcircle(A,B,C).center;
  const result = resolveAuxiliaryPoints({A,B,C,O},t.auxPoints||[]);
  assert.ok(result.T);
  assert.ok(Math.abs(result.T.x-B.x) < Math.hypot(B.x-C.x,B.y-C.y), 'T gần BC hơn để hình chính lớn');
  assert.ok(Math.abs(dot(vec(A,O),vec(A,result.T))) < 1e-5, 'OA vuông góc AT');
});

test('Viewport giữ đúng tỉ lệ và bao trọn điểm ngoài', () => {
  const bounds = aspectFitSceneViewBox({minX:-300,maxX:480,minY:20,maxY:410},600,450);
  assert.ok(Math.abs(bounds.width/bounds.height - 600/450) < 1e-8, 'viewBox phải giữ tỉ lệ chuẩn');
  assert.ok(bounds.minX <= -300 && bounds.minY <= 20);
  assert.ok(bounds.minX+bounds.width >= 480 && bounds.minY+bounds.height >= 410);
});

test('Ký hiệu góc vuông phải có hai cạnh vuông góc thật', () => {
  const A={x:100,y:100}, O={x:160,y:180}, T={x:20,y:160};
  const path=getRightAngleMarkerPath(A,O,T,10);
  assert.match(path,/^M /);
  const numbers=Array.from(path.matchAll(/-?\d+(?:\.\d+)?/g), x => Number(x[0]));
  const [x1,y1,x2,y2,x3,y3]=numbers;
  const first={x:x2-x1,y:y2-y1}, second={x:x3-x2,y:y3-y2};
  assert.ok(Math.abs(first.x*second.x+first.y*second.y) < 1e-8, 'Hai nét ở góc kí hiệu phải vuông');
  assert.equal(getRightAngleMarkerPath(A,{x:200,y:100},{x:160,y:140}), '', 'Không vẽ dấu vuông vào góc không phải 90 độ');
});


test('CanvasArea không để nút kéo xanh lệch khỏi hình SVG khi viewBox thay đổi', () => {
  const doc = GeometrySpecificationAdapter.specToChartDocument(
    VietnameseGeometryParser.parse(
      'Cho tam giác ABC nhọn nội tiếp đường tròn (O). Kẻ tiếp tuyến tại A cắt đường thẳng BC tại T.'
    )
  );
  const html = renderToStaticMarkup(React.createElement(CanvasArea, {
    currentDoc: doc,
    onCopyImage: () => {},
  }));
  assert.ok(html.includes('id="svg-math-canvas"'), 'GeometrySvg phải là nơi dựng hình');
  assert.ok(html.includes('viewBox="'), 'Giữ lại viewBox để xử lý điểm T ở ngoài tam giác');
  assert.doesNotMatch(html, /rgba\(59, 130, 246, 0\.15\)|Kéo thả điểm này/,
    'Không được còn nút overlay xanh đặt theo tọa độ CSS');
  assert.doesNotMatch(html, /pointer-events:none/,
    'SVG phải nhận trực tiếp sự kiện pointer để kéo A/B/C');
});
