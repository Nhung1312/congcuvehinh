import type {
  ChartDocument, GeometryData, TriangleData, QuadData, LineRayData, AngleData, CircleData,
} from '../types';
import { getQuadPresetPoints, getLineRayPresetPoints, getAnglePresetPoints, getCirclePresetPoints } from '../utils/geometryMath';

export type TextbookCategory = 'Đường thẳng & Góc' | 'Tam giác' | 'Tứ giác' | 'Đường tròn' | 'Đồ thị & Biểu đồ';
export type TextbookTemplate = ChartDocument & {
  textbookCategory?: TextbookCategory;
  textbookGrade?: 6 | 7 | 8 | 9;
  textbookDescription?: string;
};

function template(id: string, title: string, category: TextbookCategory, grade: 6 | 7 | 8 | 9,
  description: string, geometry: GeometryData): TextbookTemplate {
  const types = { triangle: 'GEOMETRY_TRIANGLE', quadrilateral: 'GEOMETRY_QUADRILATERAL',
    circle: 'GEOMETRY_CIRCLE', 'line-ray': 'GEOMETRY_LINE_RAY', angle: 'GEOMETRY_ANGLE' } as const;
  return {
    id: `tpl_basic_${id}`, title, type: types[geometry.subType as keyof typeof types],
    createdAt: 0, updatedAt: 0, textbookCategory: category, textbookGrade: grade, textbookDescription: description,
    settings: { title, showTitle: false, fontFamily: 'Times New Roman', titleFontSize: 18, labelFontSize: 18,
      fontSize: 18, strokeWidth: 1.5, examMode: true, width: 640, height: 480,
      showLegend: false, legendPosition: 'none', backgroundColor: '#ffffff' },
    data: { geometry },
  };
}
const triangle = (partial: Partial<TriangleData> = {}): GeometryData => ({
  subType: 'triangle', triangle: {
    type: 'general', vertexNames: ['A', 'B', 'C'],
    points: [{ x: 300, y: 100 }, { x: 140, y: 350 }, { x: 470, y: 350 }],
    showVertices: true, showLabels: true, altitudes: [], medians: [], bisectors: [], perpBisectors: [],
    showRightAngleMarker: false, showEqualSidesMarker: false, showEqualAnglesMarker: false,
    showSideLengths: false, ...partial,
  },
});
const line = (type: LineRayData['type'], partial: Partial<LineRayData> = {}): GeometryData => ({
  subType: 'line-ray', lineRay: { type, points: getLineRayPresetPoints(type), pointNames: ['A', 'B', 'P', 'D'],
    showPoints: true, showLabels: true, showArrows: type === 'line' || type === 'ray',
    showMidpoint: false, showLength: false, showRightAngleMarker: type === 'perpendicular',
    showParallelMarkers: type === 'parallel', ...partial },
});
const angle = (type: AngleData['type'], partial: Partial<AngleData> = {}): GeometryData => ({
  subType: 'angle', angle: { type, points: getAnglePresetPoints(type), vertexName: 'O', ray1Name: 'x', ray2Name: 'y',
    showPoints: true, showLabels: true, showArc: true, showDegreeValue: false,
    showBisector: type === 'bisector', showEqualAngleMarks: type === 'bisector', bisectorName: 'z', ...partial },
});
const quad = (type: QuadData['type'], partial: Partial<QuadData> = {}): GeometryData => ({
  subType: 'quadrilateral', quadrilateral: { type, vertexNames: ['A', 'B', 'C', 'D'], points: getQuadPresetPoints(type),
    showVertices: true, showLabels: true, showRightAngleMarkers: true, showEqualSidesMarkers: true,
    showParallelMarkers: true, showSideLengths: false, altitudes: [], ...partial },
});
const circle = (presetType: CircleData['presetType'], partial: Partial<CircleData> = {}): GeometryData => ({
  subType: 'circle', circle: { presetType, points: getCirclePresetPoints(presetType!), radius: 110,
    centerName: 'O', showCenterPoint: true, showCenterLabel: true, showRadius: false,
    showDiameter: false, showChord: false, showArc: false, showTangent: false,
    showSecant: false, showInscribedAngle: false, showSecondCircle: false, ...partial },
});

/** Fixed local configurations, using the same editable SVG renderer as manual tools. No AI calls. */
export const BASIC_TEXTBOOK_TEMPLATES: TextbookTemplate[] = [
  template('segment', 'Đoạn thẳng AB', 'Đường thẳng & Góc', 6, 'Hai đầu mút A, B.', line('segment')),
  template('midpoint', 'Trung điểm của đoạn thẳng', 'Đường thẳng & Góc', 6, 'M nằm giữa A, B; MA = MB.',
    line('segment', { showMidpoint: true, midpointName: 'M', showEqualSegmentMarks: true })),
  template('ray', 'Tia AB', 'Đường thẳng & Góc', 6, 'Tia gốc A đi qua B.', line('ray')),
  template('line', 'Đường thẳng AB', 'Đường thẳng & Góc', 6, 'Đường thẳng qua hai điểm A, B.', line('line')),
  template('parallel', 'Hai đường thẳng song song', 'Đường thẳng & Góc', 7, 'a song song b, có ký hiệu song song.',
    line('parallel', { parallelLineLabel1: 'a', parallelLineLabel2: 'b' })),
  template('perpendicular', 'Hai đường thẳng vuông góc', 'Đường thẳng & Góc', 7, 'd vuông góc d′, có ký hiệu góc vuông.',
    line('perpendicular', { perpLineLabel1: 'd', perpLineLabel2: 'd′' })),
  template('angle', 'Góc xOy', 'Đường thẳng & Góc', 6, 'Hai tia chung gốc O.', angle('single')),
  template('angle-bisector', 'Tia phân giác của góc', 'Đường thẳng & Góc', 7, 'Oz chia góc xOy thành hai góc bằng nhau.', angle('bisector')),
  template('vertical', 'Hai góc đối đỉnh', 'Đường thẳng & Góc', 7, 'Hai đường thẳng cắt nhau tại O.',
    angle('vertical-angles', { verticalPairHighlight: 'pair-1-3' })),
  template('supplementary', 'Hai góc kề bù', 'Đường thẳng & Góc', 7, 'Hai góc kề nhau có tổng 180°.', angle('supplementary')),
  template('transversal', 'Cát tuyến cắt hai đường song song', 'Đường thẳng & Góc', 7, 'a song song b; c là cát tuyến.',
    angle('parallel-transversal', { parallelCutConfig: { line1Name: 'a', line2Name: 'b', transversalName: 'c',
      vertex1Name: 'A', vertex2Name: 'B', highlightType: 'alternate-interior', showParallelMarkers: true, showAngleNumbers: true } })),
  template('triangle', 'Tam giác ABC', 'Tam giác', 7, 'Tam giác thường, không có đường phụ.', triangle()),
  template('isosceles', 'Tam giác cân tại A', 'Tam giác', 7, 'AB = AC, có ký hiệu hai cạnh bằng nhau.',
    triangle({ type: 'isosceles', points: [{ x: 300, y: 100 }, { x: 140, y: 350 }, { x: 460, y: 350 }], showEqualSidesMarker: true })),
  template('equilateral', 'Tam giác đều', 'Tam giác', 7, 'AB = BC = CA.',
    triangle({ type: 'equilateral', points: [{ x: 300, y: 350 - 160 * Math.sqrt(3) }, { x: 140, y: 350 }, { x: 460, y: 350 }], showEqualSidesMarker: true })),
  template('right', 'Tam giác vuông tại A', 'Tam giác', 7, 'AB vuông góc AC.',
    triangle({ type: 'right', points: [{ x: 170, y: 140 }, { x: 170, y: 350 }, { x: 470, y: 140 }], showRightAngleMarker: true })),
  template('right-isosceles', 'Tam giác vuông cân tại A', 'Tam giác', 7, 'Góc A vuông; AB = AC.',
    triangle({ type: 'right-isosceles', points: [{ x: 170, y: 140 }, { x: 170, y: 350 }, { x: 380, y: 140 }], showRightAngleMarker: true, showEqualSidesMarker: true })),
  template('altitude', 'Tam giác có đường cao AH', 'Tam giác', 7, 'H thuộc BC; AH vuông góc BC.',
    triangle({ altitudes: [{ fromVertex: 'A', enabled: true, label: 'H', style: 'dashed', showRightAngle: true }] })),
  template('median', 'Tam giác có trung tuyến AM', 'Tam giác', 7, 'M là trung điểm BC; BM = MC.',
    triangle({ medians: [{ fromVertex: 'A', enabled: true, label: 'M', style: 'dashed', showTickMarks: true }] })),
  template('triangle-bisector', 'Tam giác có phân giác AD', 'Tam giác', 7, 'AD chia góc BAC thành hai góc bằng nhau.',
    triangle({ bisectors: [{ fromVertex: 'A', enabled: true, label: 'D', style: 'dashed', showAngleMarks: true }] })),
  template('perp-bisector', 'Đường trung trực của BC', 'Tam giác', 7, 'd vuông góc BC tại trung điểm M.',
    triangle({ perpBisectors: [{ side: 'BC', enabled: true, label: 'd', style: 'dashed', showRightAngle: true, showTickMarks: true }],
      auxPoints: [{ id: 'M', name: 'M', type: 'midpoint', segment: ['B', 'C'], showPoint: true, showLabel: true }] })),
  template('congruent', 'Hai tam giác bằng nhau', 'Tam giác', 7, 'ΔABC = ΔDEF theo c.c.c.; cạnh tương ứng dùng cùng số gạch.',
    triangle({ points: [{ x: 170, y: 120 }, { x: 80, y: 320 }, { x: 270, y: 320 }],
      auxPoints: [
        { id: 'D', name: 'D', type: 'free', freeX: 450, freeY: 120, showPoint: true, showLabel: true },
        { id: 'E', name: 'E', type: 'free', freeX: 360, freeY: 320, showPoint: true, showLabel: true },
        { id: 'F', name: 'F', type: 'free', freeX: 550, freeY: 320, showPoint: true, showLabel: true }],
      auxLines: [ { id: 'DE', from: 'D', to: 'E', enabled: true, style: 'solid', color: '#000', strokeWidth: 1.5 }, { id: 'EF', from: 'E', to: 'F', enabled: true, style: 'solid', color: '#000', strokeWidth: 1.5 }, { id: 'FD', from: 'F', to: 'D', enabled: true, style: 'solid', color: '#000', strokeWidth: 1.5 } ],
      equalSidesMarkers: [
        { id: 'eq1', segments: [['A', 'B'], ['D', 'E']], tickType: 1, enabled: true },
        { id: 'eq2', segments: [['B', 'C'], ['E', 'F']], tickType: 2, enabled: true },
        { id: 'eq3', segments: [['C', 'A'], ['F', 'D']], tickType: 3, enabled: true } ] })),
  template('midline', 'Đường trung bình của tam giác', 'Tam giác', 8, 'M, N là trung điểm AB, AC; MN song song BC.',
    triangle({ thales: { enabled: true, ratio: 0.5, pointMName: 'M', pointNName: 'N', showParallelMarkers: true, showPoints: true, showLabels: true },
      auxPoints: [{ id: 'M', name: 'M', type: 'midpoint', segment: ['A', 'B'], showPoint: false, showLabel: false },
        { id: 'N', name: 'N', type: 'midpoint', segment: ['A', 'C'], showPoint: false, showLabel: false }],
      equalSidesMarkers: [{ id: 'ab', segments: [['A', 'M'], ['M', 'B']], tickType: 1, enabled: true },
        { id: 'ac', segments: [['A', 'N'], ['N', 'C']], tickType: 2, enabled: true }] })),
  template('trapezoid', 'Hình thang', 'Tứ giác', 8, 'AB song song CD.', quad('trapezoid')),
  template('right-trapezoid', 'Hình thang vuông', 'Tứ giác', 8, 'AB song song CD; góc A, D vuông.', quad('right-trapezoid')),
  template('isosceles-trapezoid', 'Hình thang cân', 'Tứ giác', 8, 'AB song song CD; AD = BC.', quad('isosceles-trapezoid')),
  template('parallelogram', 'Hình bình hành có hai đường chéo', 'Tứ giác', 8, 'Hai đường chéo cắt nhau tại trung điểm O.',
    quad('parallelogram', { diagonals: { AC: { enabled: true, style: 'dashed' }, BD: { enabled: true, style: 'dashed' }, showIntersection: true, intersectionLabel: 'O' } })),
  template('rectangle', 'Hình chữ nhật', 'Tứ giác', 8, 'ABCD có bốn góc vuông.', quad('rectangle')),
  template('rhombus', 'Hình thoi', 'Tứ giác', 8, 'AB = BC = CD = DA.', quad('rhombus')),
  template('square', 'Hình vuông', 'Tứ giác', 8, 'Bốn cạnh bằng nhau, bốn góc vuông.', quad('square')),
  template('radius', 'Đường tròn và bán kính OA', 'Đường tròn', 9, 'Đường tròn tâm O, bán kính OA.',
    circle('basic', { showRadius: true, radiusPointName: 'A', showRadiusLabel: false })),
  template('diameter-chord', 'Đường kính và dây cung', 'Đường tròn', 9, 'AB là đường kính; OH vuông góc dây CD.',
    circle('diameter-chord', { showDiameter: true, diameterPoints: ['A', 'B'], showChord: true, chordPoints: ['C', 'D'],
      showChordDistance: true, chordDistanceLabel: 'H', showChordRightAngle: true, showChordMidpoint: true })),
  template('tangent', 'Tiếp tuyến tại A thuộc đường tròn', 'Đường tròn', 9, 'd tiếp xúc (O) tại A; OA vuông góc d.',
    circle('tangent-point', { showTangent: true, tangentType: 'at-point', tangentPointName: 'A', tangentLineName: 'd', showTangentRightAngle: true })),
  template('two-tangents', 'Hai tiếp tuyến từ A ngoài đường tròn', 'Đường tròn', 9, 'AB, AC là tiếp tuyến; OB ⟂ AB, OC ⟂ AC; AB = AC.',
    circle('two-tangents', { showTangent: true, tangentType: 'two-tangents', externalPointName: 'A', tangentPointsNames: ['B', 'C'],
      showCenterConnector: true, showTangentRightAngle: true, showTangentEqualMarks: true })),
  template('inscribed-angle', 'Góc nội tiếp và góc ở tâm', 'Đường tròn', 9, 'Góc AMB và góc AOB chắn cùng cung AB.',
    circle('inscribed-angle', { showInscribedAngle: true, inscribedVertexName: 'M', showCentralAngle: true })),
  template('sector', 'Hình quạt tròn AOB', 'Đường tròn', 9, 'Hai bán kính OA, OB và cung AB.',
    circle('sector', { showSectorRadii: true, arcPointNames: ['A', 'B'], showCentralAngleMarker: true,
      showCentralAngleDegree: false, sectorAngleDeg: 90, fillType: 'sector', fill: { enabled: true, color: '#dbeafe', opacity: 0.2 } })),
];

export function getTemplateCategory(doc: TextbookTemplate): TextbookCategory {
  if (doc.textbookCategory) return doc.textbookCategory;
  if (doc.type === 'GEOMETRY_TRIANGLE') return 'Tam giác';
  if (doc.type === 'GEOMETRY_QUADRILATERAL') return 'Tứ giác';
  if (doc.type === 'GEOMETRY_CIRCLE') return 'Đường tròn';
  if (doc.type === 'GEOMETRY_LINE_RAY' || doc.type === 'GEOMETRY_ANGLE') return 'Đường thẳng & Góc';
  return 'Đồ thị & Biểu đồ';
}

export function createTemplateDocument(template: ChartDocument): ChartDocument {
  const copy: ChartDocument = structuredClone(template);
  copy.id = `doc_${globalThis.crypto.randomUUID()}`;
  copy.createdAt = copy.updatedAt = Date.now();
  return copy;
}
