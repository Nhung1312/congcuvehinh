/** Explicit construction regression tests; offline, no real Gemini key/usage. */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeometrySvg } from '../src/renderers/GeometrySvg';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';
import { normalizeExplicitConstructions, stripGeometryProofGoals } from '../src/ai/parser/normalizeExplicitConstructions';
import { parseGeometryWithGemini, validateAndNormalizeSpec } from '../src/server/geminiGeometryService';
import type { GeometrySpecification } from '../src/ai/types';
import type { CustomAuxPoint, Point2D } from '../src/types';
import { resolveAuxiliaryPoints } from '../src/utils/resolveAuxiliaryPoints';
import { constrainTrianglePointDrag, dist, midpoint } from '../src/utils/geometryMath';
import { getGeometrySceneBoundingBox } from '../src/utils/geometrySceneBounds';
import { generateTikzCode } from '../src/export/tikzExport';

const names = ['A', 'B', 'C', 'M', 'E', 'F', 'H', 'I', 'J'];
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`);
const samePoint = (a: Point2D, b: Point2D) => { assert.ok(a && b); near(a.x, b.x); near(a.y, b.y); };
const cross = (a: Point2D, b: Point2D, c: Point2D) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

function problem(n = names, order = [0, 1, 2], reverseEquality = false, shorterFirstLeg = false) {
  const [A,B,C,M,E,F,H,I,J] = n;
  const triangle = order.map(i => n[i]).join('');
  return `Cho tam giác ${triangle} vuông tại ${A} (${shorterFirstLeg ? A+B+' < '+A+C : A+C+' < '+A+B}), gọi ${M} là trung điểm của ${B}${C}. ` +
    `Kẻ ${M}${E} ⊥ ${A}${B} tại ${E}, kẻ ${M}${F} ⊥ ${A}${C} tại ${F}. ` +
    `a) Chứng minh tứ giác ${A}${E}${M}${F} là hình chữ nhật. ` +
    `b) Lấy điểm ${H} trên tia ${M}${F} sao cho ${reverseEquality ? F+H+' = '+F+M : F+M+' = '+F+H}. Chứng minh tứ giác ${A}${H}${F}${E} là hình bình hành. ` +
    `c) Gọi ${I} là giao điểm của ${E}${H} và ${A}${F}; ${J} là trung điểm của ${M}${E}. Chứng minh ${I} là trung điểm của ${A}${F}, ${E}${H} và ${I}${J} ⊥ ${M}${E}.`;
}

function brokenAI(n = names): GeometrySpecification {
  const [A,B,C,M,E,F,H,I,J] = n;
  return { title: 'Đề kiểm thử', shapeCategory: 'triangle',
    triangle: { type: 'right', vertices: [A,B,C], specialVertex: A },
    altitudes: [{ from: A, foot: H, toLine: B+C }],
    medians: [{ from: A, midpoint: M, toSegment: B+C }],
    auxPoints: [{ name: H, type: 'projection', fromPoint: A, targetLine: B+C },
      { name: I, type: 'incenter' }, { name: J, type: 'midpoint', segment: B+C }],
    rightAngles: [{ vertex: H, ray1: A, ray2: B }, { vertex: J, ray1: I, ray2: M }],
    detectedEntities: [`Đường cao ${A}${H}`, `${I} là trung điểm ${A}${F}`],
    explanation: `${H} là chân đường cao, ${I} là tâm nội tiếp, ${A}${M} là trung tuyến.` };
}

function document(spec: GeometrySpecification) {
  return GeometrySpecificationAdapter.specToChartDocument(spec);
}
function resolved(spec: GeometrySpecification, basePoints?: [Point2D,Point2D,Point2D]) {
  const t = document(spec).data.geometry!.triangle!;
  assert.ok(t.points);
  const base = Object.fromEntries(t.vertexNames.map((n,i) => [n, (basePoints || t.points!)[i]]));
  return resolveAuxiliaryPoints(base, t.auxPoints || []);
}
function assertConstruction(points: Record<string,Point2D>, n = names) {
  const [A,B,C,M,E,F,H,I,J] = n.map(name => points[name]);
  for (const p of [A,B,C,M,E,F,H,I,J]) assert.ok(p, 'Không được thiếu điểm phụ');
  samePoint(M, midpoint(B,C));
  samePoint(F, midpoint(M,H));
  samePoint(J, midpoint(M,E));
  near(cross(M,F,H), 0);
  near(dist(F,H), dist(F,M));
  const ray = ((H.x-M.x)*(F.x-M.x)+(H.y-M.y)*(F.y-M.y)) / dist(M,F)**2;
  near(ray, 2);
  near(cross(A,F,I), 0);
  near(cross(E,H,I), 0);
  // Kết luận đúng do các phép dựng, không đưa vào giả thiết để ép hình.
  samePoint(I, midpoint(A,F));
  samePoint(I, midpoint(E,H));
  near((J.x-I.x)*(E.x-M.x)+(J.y-I.y)*(E.y-M.y), 0);
}

test('Đề người dùng: cả bộ quy tắc và JSON AI sai đều dựng đủ chuỗi M/E/F/H/I/J', () => {
  for (const source of ['rules','gemini']) {
    const s = source === 'rules' ? VietnameseGeometryParser.parse(problem()) : brokenAI();
    if (source === 'gemini') validateAndNormalizeSpec(s, problem());
    const p = resolved(s), t = document(s).data.geometry!.triangle!;
    assertConstruction(p);
    assert.ok(dist(p.A,p.C) < dist(p.A,p.B));
    assert.equal(t.type, 'right');
    assert.equal(t.altitudes?.length, 0, 'H không phải chân đường cao');
    assert.equal(t.medians?.length, 0, 'Không tự nối trung tuyến AM');
    assert.equal(t.rightAngleMarkers?.some(m => m.vertex === 'I' || m.vertex === 'J' || m.vertex === 'H'), false);
    assert.equal(t.showRightAngleMarker, true);
    assert.equal(t.rightAngleMarkers?.some(m => m.vertex === 'A'), false, 'Không vẽ chồng dấu góc vuông tại A');
    assert.ok(t.auxLines?.some(l => l.from === 'I' && l.to === 'J'));
  }
});

test('Quy tắc độc lập tên điểm, đỉnh vuông ở cả ba vị trí, đảo dấu bằng và hai thứ tự cạnh (72 biến thể)', () => {
  const sets = [names, ['P','Q','R','S','T','U','V','W','X'], ['D','E','F','K','L','M','N','P','Q']];
  for (const n of sets) for (const order of [[0,1,2],[1,0,2],[1,2,0]]) for (const reverse of [false,true])
    for (const shorter of [false,true]) for (const source of ['rules','gemini']) {
      const prompt = problem(n,order,reverse,shorter);
      const s = source === 'rules' ? VietnameseGeometryParser.parse(prompt) : brokenAI(n);
      if (source === 'gemini') validateAndNormalizeSpec(s,prompt);
      const p = resolved(s);
      assertConstruction(p,n);
      const [A,B,C] = n.map(v => p[v]);
      near((B.x-A.x)*(C.x-A.x)+(B.y-A.y)*(C.y-A.y),0);
      assert.ok(shorter ? dist(A,B)<dist(A,C) : dist(A,C)<dist(A,B));
    }
});

test('Đề ảnh: chép đề để kiểm tra giả thiết, không dùng detectedEntities/lời giải làm dữ kiện', () => {
  const s = brokenAI();
  s.problemText = problem();
  validateAndNormalizeSpec(s,'',true);
  assertConstruction(resolved(s));
  const noAltitude: GeometrySpecification = { title:'ABC', shapeCategory:'triangle',
    triangle:{type:'right',vertices:['A','B','C'],specialVertex:'A'},
    detectedEntities:['Đường cao AH'],explanation:'Kẻ AH vuông góc BC, I là trung điểm AF.' };
  validateAndNormalizeSpec(noAltitude,'Cho tam giác ABC vuông tại A. Chứng minh tứ giác AHFE là hình bình hành.');
  assert.equal(noAltitude.altitudes?.length,0);
  assert.equal(noAltitude.auxPoints?.some(p => p.name === 'H' || p.name === 'I'), false);
});

test('Đề ảnh bọc tên điểm bằng LaTeX vẫn bổ sung thứ tự cạnh khi JSON AI bỏ sót', () => {
  const s = VietnameseGeometryParser.parse(problem());
  delete s.triangle!.sideComparisons;
  const transcription = problem().replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => `\\(${label}\\)`);
  s.problemText = transcription;
  validateAndNormalizeSpec(s, '', true);
  const p = resolved(s);
  assert.ok(dist(p.A,p.C) < dist(p.A,p.B), 'AC < AB phải thắng độ dài mặc định');
  assertConstruction(p);
  assert.equal(s.problemText, transcription, 'Giữ nguyên bản chép đề để đối chiếu');
});

test('Định dạng OCR không thay đổi hình: LaTeX, Markdown, chữ nghiêng Unicode, khoảng trắng (128 biến thể)', () => {
  const formats = [
    (text: string) => text.replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => `$${label}$`),
    (text: string) => text.replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => `\\[${label}\\]`),
    (text: string) => text.replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => `\\(\\mathbf{\\mathrm{${label}}}\\)`),
    (text: string) => text.replace(/\b([A-Z]{1,4})\b/g, '**$1**'),
    (text: string) => text.replace(/[A-Z]/g, letter => String.fromCodePoint(0x1D434 + letter.charCodeAt(0) - 65)),
    (text: string) => text.replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => label.split('').join(' ')),
    (text: string) => text.replace('tam giác', '\\triangle').replaceAll('⊥', '\\perp ').replaceAll('<', '\\lt '),
    (text: string) => text.replaceAll('<', '&lt;').replace(/\b([A-Z]{2,4})\b/g, (_, label: string) => label.split('').join('\u200B')),
  ];
  for (const n of [names, ['P','Q','R','S','T','U','V','W','X']])
    for (const order of [[0,1,2],[1,2,0]]) for (const shorter of [false,true])
      for (const format of formats) for (const source of ['rules','gemini']) {
        const prompt = format(problem(n,order,true,shorter));
        const s = source === 'rules' ? VietnameseGeometryParser.parse(prompt) : brokenAI(n);
        if (source === 'gemini') {
          s.problemText = prompt;
          validateAndNormalizeSpec(s,'',true);
          assert.equal(s.problemText,prompt);
        }
        const p = resolved(s), [A,B,C] = n.map(v => p[v]);
        assertConstruction(p,n);
        assert.ok(shorter ? dist(A,B)<dist(A,C) : dist(A,C)<dist(A,B), `${source}: ${prompt}`);
        const t = document(s).data.geometry!.triangle!;
        assert.ok(t.auxLines?.some(l => [l.from,l.to].sort().join('') === [n[4],n[5]].sort().join('')), 'Giữ cạnh EF của tứ giác cần chứng minh');
        assert.equal(t.rightAngleMarkers?.some(m => m.vertex === n[6] || m.vertex === n[7] || m.vertex === n[8]), false);
      }
});

test('Phân số LaTeX và dấu lớn hơn giữ đúng độ dài, hướng tia và thứ tự cạnh', () => {
  for (const [equality,scale] of [[String.raw`AK = \frac{1}{2}\overline{BC}`,0.5],
    [String.raw`AK = \dfrac{\mathrm{BC}}{2}`,0.5], [String.raw`\tfrac{AK}{2} = BC`,2]] as const) {
    const prompt = String.raw`Cho \Delta{ABC} vuông tại A (AB \gt AC). Lấy điểm K trên tia AB sao cho \(${equality}\).`;
    const s = VietnameseGeometryParser.parse(prompt);
    const p = resolved(s);
    assert.ok(dist(p.A,p.B)>dist(p.A,p.C));
    near(dist(p.A,p.K),scale*dist(p.B,p.C));
    near(cross(p.A,p.B,p.K),0);
  }
});

test('Pipeline SDK Gemini và đề ảnh hoạt động với schema điểm trên tia (mock HTTP, không dùng quota)', async () => {
  const originalFetch = globalThis.fetch;
  let request: any;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(String(options!.body));
    const transcription = problem().replace(/\b([A-Z]{1,4})\b/g, (_, label: string) => `\\(${label}\\)`);
    return Response.json({ candidates:[{content:{role:'model',parts:[{text:JSON.stringify({...brokenAI(),problemText:transcription})}]},finishReason:'STOP'}] });
  };
  try {
    const spec = await parseGeometryWithGemini('', 'offline-test-key', {mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'});
    const p = resolved(spec);
    assertConstruction(p);
    assert.ok(dist(p.A,p.C)<dist(p.A,p.B));
    assert.equal(spec.generationInfo?.model,'gemini-3.8-flash');
    assert.ok(request.generationConfig.responseSchema.required.includes('problemText'));
    assert.ok(request.generationConfig.responseSchema.properties.auxPoints.items.properties.type.enum.includes('on-ray'));
  } finally { globalThis.fetch = originalFetch; }
});

test('Điểm trên tia tính độ dài từ gốc và tham chiếu đoạn khác; hỗ trợ hệ số và phân số', () => {
  const cases = [['AK = 2BC',2],['2BC = AK',2],['AK = 1/2BC',0.5],['2AK = BC',0.5],['AK = BC/2',0.5]] as const;
  for (const [equality,scale] of cases) {
    const spec = VietnameseGeometryParser.parse(`Cho tam giác ABC. Lấy điểm K trên tia AB sao cho ${equality}.`);
    const p = resolved(spec);
    near(dist(p.A,p.K),scale*dist(p.B,p.C));
    near(cross(p.A,p.B,p.K),0);
    assert.ok((p.K.x-p.A.x)*(p.B.x-p.A.x)+(p.K.y-p.A.y)*(p.B.y-p.A.y)>0);
  }
});

test('Đảo tia thay đổi phía dựng; đổi thứ tự đoạn độ dài không thay đổi kết quả', () => {
  const base={P:{x:10,y:20},Q:{x:70,y:100}};
  for (const [segment,center,reference,expected] of [['PQ','Q','QP',{x:130,y:180}],['QP','P','PQ',{x:-50,y:-60}]] as const) {
    const p=resolveAuxiliaryPoints(base,[{id:'x',name:'X',type:'on-ray',segment,fromPoint:center,distanceSegment:reference,rayPosition:'beyond'}]);
    samePoint(p.X,expected);
  }
});

test('Điều kiện nằm giữa/kéo dài chọn đúng nhánh khi độ dài cho hai nghiệm trên tia', () => {
  for (const [condition,ratio] of [['K nằm giữa A và B',0.5],['B nằm giữa A và K',1.5]] as const) {
    const s=VietnameseGeometryParser.parse(`Cho tam giác ABC. Lấy điểm K trên tia AB sao cho BK = AB/2 và ${condition}.`);
    const p=resolved(s);
    near(dist(p.A,p.K)/dist(p.A,p.B),ratio);
  }
});

test('Ghi chú chữ về thứ tự cạnh ưu tiên hơn dữ kiện chép từ ảnh', () => {
  const s=brokenAI();s.problemText=problem();
  validateAndNormalizeSpec(s,'AB < AC',true);
  const p=resolved(s);
  assert.ok(dist(p.A,p.B)<dist(p.A,p.C));
});

test('Giải chuỗi phụ thuộc ngược thứ tự, kể cả khi kéo/đổi hướng các đỉnh gốc', () => {
  const s=VietnameseGeometryParser.parse(problem());
  s.auxPoints!.reverse();
  const t=document(s).data.geometry!.triangle!;
  for (const [index,target] of [[1,{x:220,y:80}],[2,{x:430,y:410}],[0,{x:280,y:280}]] as const) {
    const moved=constrainTrianglePointDrag('right',t.points!,index,target,'A');
    assertConstruction(resolved(s,moved));
  }
});

test('Đối xứng tâm và tỉ số ngoài [0,1] không bị ép vào đoạn thẳng', () => {
  const s=VietnameseGeometryParser.parse('Cho tam giác PQR. Gọi X là điểm đối xứng của P qua Q.');
  const p=resolved(s);
  samePoint(p.Q,midpoint(p.P,p.X));
  const negative=resolveAuxiliaryPoints({P:{x:20,y:30},Q:{x:80,y:60}},[{id:'x',name:'X',type:'ratio',segment:'PQ',ratio:-1}]);
  samePoint(negative.X,{x:-40,y:0});
});

test('Không dựng tọa độ giả khi tia suy biến, thiếu độ dài, không giao hoặc phụ thuộc vòng', () => {
  const cases: CustomAuxPoint[]=[
    {id:'a',name:'X',type:'on-ray',segment:'AB',fromPoint:'A',distanceSegment:'AZ'},
    {id:'b',name:'Y',type:'on-ray',segment:'AA',fromPoint:'A',distanceSegment:'AB'},
    {id:'c',name:'Z',type:'on-ray',segment:'AB',fromPoint:'C',distanceSegment:'AB'},
  ];
  const p=resolveAuxiliaryPoints({A:{x:0,y:0},B:{x:1,y:0},C:{x:0,y:10}},cases);
  assert.equal(p.X,undefined);assert.equal(p.Y,undefined);assert.equal(p.Z,undefined);
});

test('Bỏ mục tiêu chứng minh vẫn giữ phép dựng ở phần b/c khi không có dấu chấm', () => {
  const prompt=problem().replaceAll('. ', '\n');
  const stripped=stripGeometryProofGoals(prompt);
  assert.match(stripped,/Lấy điểm H trên tia MF/);
  assert.match(stripped,/Gọi I là giao điểm/);
  assert.doesNotMatch(stripped,/I là trung điểm/);
  const s=VietnameseGeometryParser.parse(prompt);
  assertConstruction(resolved(s));
});

test('Một đoạn phụ bằng đoạn khác không biến tam giác vuông thành cân; hai cạnh gốc bằng nhau vẫn đúng', () => {
  const s=VietnameseGeometryParser.parse('Cho tam giác ABC vuông tại B. Gọi M là trung điểm AC. Lấy điểm N trên tia MB sao cho BN = BM.');
  assert.equal(s.triangle?.type,'right');
  assert.equal(s.triangle?.specialVertex,'B');
  const isosceles=VietnameseGeometryParser.parse('Cho tam giác PQR có PQ = QR.');
  assert.equal(isosceles.triangle?.specialVertex,'Q');
  const rightIsosceles=VietnameseGeometryParser.parse('Cho tam giác PQR vuông tại R có RP = RQ.');
  assert.equal(rightIsosceles.triangle?.type,'right-isosceles');
});

test('Các nhóm đoạn bằng nhau độc lập có ký hiệu khác nhau; nhóm nối tiếp được gộp', () => {
  const t=document(VietnameseGeometryParser.parse(problem())).data.geometry!.triangle!;
  assert.equal(new Set(t.equalSidesMarkers!.map(m=>m.tickType)).size,3);
  const s=VietnameseGeometryParser.parse('Cho tam giác ABC.');
  s.equalSegments=[{segments:['AB','AC']},{segments:['MN','PQ']},{segments:['CA','BC']}];
  const marks=document(s).data.geometry!.triangle!.equalSidesMarkers!;
  assert.equal(marks.length,2);
  assert.ok(marks.some(m=>m.segments.length===3));
  assert.notEqual(marks[0].tickType,marks[1].tickType);
  const isosceles=document(VietnameseGeometryParser.parse('Cho tam giác ABC cân tại A. Gọi M là trung điểm BC.')).data.geometry!.triangle!;
  assert.notEqual(isosceles.equalSidesMarkers![0].tickType,1,'Trung điểm đáy khác nhóm hai cạnh bên của tam giác cân');
});

test('SVG, bounds và TikZ cùng dùng điểm H/I/J được giải từ giả thiết', () => {
  const s=VietnameseGeometryParser.parse(problem()), doc=document(s), p=resolved(s);
  const svg=renderToStaticMarkup(React.createElement(GeometrySvg,{data:doc.data.geometry!,settings:doc.settings}));
  for (const n of names) assert.match(svg,new RegExp(`>${n}<\\/text>`));
  assert.doesNotMatch(svg,/NaN|Infinity/);
  assert.match(svg,new RegExp(`cx="${p.H.x}" cy="${p.H.y}"`));
  const bounds=getGeometrySceneBoundingBox(doc.data.geometry!,600,450,40);
  for(const n of names) assert.ok(p[n].x>=bounds.minX&&p[n].x<=bounds.maxX&&p[n].y>=bounds.minY&&p[n].y<=bounds.maxY);
  const tikz=generateTikzCode(doc);
  for(const n of names) assert.ok(tikz.includes(`{$${n}$}`));
  assert.ok(tikz.includes('(9.275,-16.8)'), 'H trong TikZ có cùng tọa độ với SVG');
});

test('Chuẩn hóa lại giữ nguyên quan hệ và không thêm đối tượng trùng', () => {
  const s=VietnameseGeometryParser.parse(problem());
  const before=document(s).data.geometry!.triangle!;
  normalizeExplicitConstructions(s,problem());
  const after=document(s).data.geometry!.triangle!;
  assertConstruction(resolved(s));
  assert.equal(after.auxPoints!.length,before.auxPoints!.length);
  assert.equal(after.auxLines!.length,before.auxLines!.length);
  assert.equal(after.equalSidesMarkers!.length,before.equalSidesMarkers!.length);
});

// JSON model có thể kèm các mô tả hình phụ/rỗng ngoài hình chính.
const unusedTriangles = [undefined, null, {}, {type:'right'}, {type:'right-isosceles'},
  {type:'isosceles'}, {type:'right',vertices:null}, {type:'right',vertices:[]},
  {type:'right-isosceles',vertices:['N','P','Q']}];

test('Tứ giác không đọc đỉnh tam giác phụ: đủ 7 loại, đổi tên điểm và JSON thiếu trường (126 biến thể)', () => {
  for (const type of ['rectangle','square','parallelogram','rhombus','trapezoid','isosceles-trapezoid','right-trapezoid'] as const)
    for (const vertices of [['A','B','C','D'],['P','Q','R','S']] as const) for (const triangle of unusedTriangles) {
      const [A,B,C,D] = vertices;
      const prompt = `Cho tứ giác ${vertices.join('')}. Kẻ ${A}N ⊥ ${B}${D} tại N. Gọi M là trung điểm ${B}${C}. Nối NM.`;
      const spec = {title:'Tứ giác',shapeCategory:'quadrilateral',quadrilateral:{type,vertices:[...vertices]},
        triangle,detectedEntities:[],explanation:''} as GeometrySpecification;
      validateAndNormalizeSpec(spec,prompt);
      assert.equal(spec.shapeCategory,'quadrilateral');
      assert.deepEqual(spec.rightAngles,[{vertex:'N',ray1:A,ray2:B}]);
      const doc = document(spec), q = doc.data.geometry!.quadrilateral!;
      assert.equal(doc.type,'GEOMETRY_QUADRILATERAL');
      assert.equal(q.type,type);
      assert.deepEqual(q.vertexNames,vertices);
      const points = resolveAuxiliaryPoints(Object.fromEntries(vertices.map((v,i)=>[v,q.points![i]])),q.auxPoints || []);
      assert.ok(points.N && points.M);
      near(cross(points[B],points[D],points.N),0);
      near((points[A].x-points.N.x)*(points[D].x-points[B].x)+(points[A].y-points.N.y)*(points[D].y-points[B].y),0);
      samePoint(points.M,midpoint(points[B],points[C]));
      assert.ok(q.auxLines?.some(l=>[l.from,l.to].sort().join('') === [A,'N'].sort().join('')));
      assert.ok(q.auxLines?.some(l=>[l.from,l.to].sort().join('') === 'MN'));
    }
});

test('Hình chiếu và trung điểm của tứ giác vẫn được vẽ khi JSON có cả đường cao/trung tuyến phụ', () => {
  const prompt = 'Cho hình chữ nhật ABCD với AB > AD. Kẻ AN ⊥ BD tại N. Gọi M là trung điểm BC. Nối AM và NM. Chứng minh tứ giác ANMD là hình bình hành.';
  const spec = {title:'Hình chữ nhật',shapeCategory:'quadrilateral',quadrilateral:{type:'rectangle',vertices:['A','B','C','D']},
    triangle:{type:'right-isosceles',vertices:['N','P','Q']},
    altitudes:[{from:'A',toLine:'BD',foot:'N'}],medians:[{from:'A',toSegment:'BC',midpoint:'M'}],
    detectedEntities:[],explanation:''} as GeometrySpecification;
  validateAndNormalizeSpec(spec,prompt);
  const doc = document(spec), q = doc.data.geometry!.quadrilateral!;
  assert.equal(q.type,'rectangle','Kết luận chứng minh không thay loại hình chính');
  for (const name of ['N','M']) {
    const point = q.auxPoints!.find(p=>p.name===name);
    assert.ok(point?.showPoint && point.showLabel, `${name} không bị đường đặc biệt của tam giác che mất`);
  }
  for (const segment of ['AN','AM','NM','MD']) assert.ok(q.auxLines!.some(l=>[l.from,l.to].sort().join('')===segment.split('').sort().join('')),segment);
  assert.equal(q.equalSidesMarkers![0].tickType,1,'Tam giác phụ không chiếm nhóm ký hiệu bằng nhau');
  const svg = renderToStaticMarkup(React.createElement(GeometrySvg,{data:doc.data.geometry!,settings:doc.settings}));
  assert.match(svg,/>N<\/text>/);
  assert.match(svg,/>M<\/text>/);
  assert.doesNotMatch(svg,/NaN|Infinity/);
});

test('Đường tròn, đoạn thẳng, góc, đa giác và đối xứng bỏ qua mô tả tam giác phụ chưa đầy đủ', () => {
  const cases: {prompt:string; payload:Partial<GeometrySpecification>; type:string}[] = [
    {prompt:'Cho đường tròn (O).',payload:{shapeCategory:'circle',circle:{presetType:'basic',center:'O'}},type:'GEOMETRY_CIRCLE'},
    {prompt:'Cho đoạn thẳng PQ.',payload:{shapeCategory:'line-ray',lineRay:{type:'segment',pointNames:['P','Q']}},type:'GEOMETRY_LINE_RAY'},
    {prompt:'Cho góc xOy.',payload:{shapeCategory:'angle',angle:{type:'single',vertex:'O',ray1:'x',ray2:'y',degrees:60}},type:'GEOMETRY_ANGLE'},
    {prompt:'Cho lục giác đều PQRSTU.',payload:{shapeCategory:'polygon',polygon:{type:'hexagon',sidesCount:6,vertexNames:['P','Q','R','S','T','U']}},type:'GEOMETRY_POLYGON'},
    {prompt:'Phép đối xứng tâm O.',payload:{shapeCategory:'symmetry',symmetry:{type:'central',targetShape:'segment',centerName:'O',originalNames:['P','Q'],reflectedNames:["P'","Q'"]}},type:'GEOMETRY_SYMMETRY'},
  ];
  for (const entry of cases) for (const triangle of unusedTriangles) {
    const spec = {title:'Hình phẳng',detectedEntities:[],explanation:'',...entry.payload,triangle,
      auxPoints:[{name:'N',type:'free',freeX:120,freeY:100}],rightAngles:[{vertex:'N',ray1:'P',ray2:'Q'}],
      equalSegments:[{segments:['PN','NQ']}]} as GeometrySpecification;
    validateAndNormalizeSpec(spec,entry.prompt);
    assert.equal(spec.shapeCategory,entry.payload.shapeCategory);
    assert.deepEqual(spec.rightAngles,[{vertex:'N',ray1:'P',ray2:'Q'}]);
    const doc = document(spec);
    assert.equal(doc.type,entry.type);
    const data = Object.values(doc.data.geometry!).find(v=>typeof v==='object') as any;
    assert.ok(data.auxPoints.some((p:any)=>p.name==='N' && p.showLabel));
    assert.equal(data.equalSidesMarkers[0].tickType,1);
    const svg = renderToStaticMarkup(React.createElement(GeometrySvg,{data:doc.data.geometry!,settings:doc.settings}));
    assert.doesNotMatch(svg,/NaN|Infinity/);
    assert.match(svg,/>N<\/text>/);
  }
});
