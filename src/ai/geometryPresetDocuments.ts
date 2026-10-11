import type { BaseChartSettings, ChartDocument } from '../types';
import type { GeometrySpecification } from './types';
import { AI_GEOMETRY_PRESETS, type GeometryProblemPreset } from './aiPresets';
import { GeometrySpecificationAdapter } from './adapter/geometrySpecificationAdapter';

// Mỗi mẫu có phép dựng xác định sẵn. Không phân tích lại đề bằng AI/parser
// khi người dùng mở mẫu; các điểm phụ vẫn được engine tính theo đỉnh khi kéo.
type Construction = Pick<GeometrySpecification, 'shapeCategory'> & Partial<GeometrySpecification>;
const triangle = { type: 'general', vertices: ['A', 'B', 'C'] } as const;
const altitude = { from: 'A', toLine: 'BC', foot: 'H', showRightAngle: true };
const median = { from: 'A', toSegment: 'BC', midpoint: 'M', showTicks: true };
const bisector = { from: 'A', toSegment: 'BC', foot: 'D', showEqualAngleArcs: true };
const constructions: Record<string, Construction> = {
  'preset-1': { shapeCategory: 'triangle', triangle: { ...triangle, vertices: [...triangle.vertices] }, altitudes: [altitude] },
  'preset-2': { shapeCategory: 'triangle', triangle: { ...triangle, vertices: [...triangle.vertices] }, medians: [median] },
  'preset-3': { shapeCategory: 'triangle', triangle: { ...triangle, vertices: [...triangle.vertices] }, bisectors: [bisector] },
  'preset-4': { shapeCategory: 'triangle', triangle: { type: 'isosceles', vertices: ['A', 'B', 'C'], specialVertex: 'A' },
    altitudes: [altitude], medians: [median], bisectors: [bisector] },
  'preset-5': { shapeCategory: 'triangle', triangle: { type: 'right', vertices: ['A', 'B', 'C'], specialVertex: 'A' }, altitudes: [altitude] },
  'preset-6': { shapeCategory: 'quadrilateral', quadrilateral: { type: 'general', vertices: ['A', 'B', 'C', 'D'], showDiagonals: true, diagonalIntersection: 'O' } },
  'preset-7': { shapeCategory: 'quadrilateral', quadrilateral: { type: 'trapezoid', vertices: ['A', 'B', 'C', 'D'], parallelSides: ['AB', 'CD'], showDiagonals: true, diagonalIntersection: 'O' } },
  'preset-8': { shapeCategory: 'circle', circle: { presetType: 'diameter-chord', center: 'O', chordPoints: ['C', 'D'], chordFoot: 'H' } },
  'preset-9': { shapeCategory: 'circle', circle: { presetType: 'tangent-point', center: 'O', radiusValue: 3, tangentPoint: 'A', tangentLineName: 'Ax' } },
  'preset-10': { shapeCategory: 'angle', angle: { type: 'parallel-transversal', vertex: 'A', ray1: 'a', ray2: 'c',
    parallelCutConfig: { line1: 'a', line2: 'b', transversal: 'c', vertex1: 'A', vertex2: 'B', highlightType: 'alternate-interior' } } },
  'preset-11': { shapeCategory: 'circle', circle: { presetType: 'two-tangents', center: 'O', externalPoint: 'P', twoTangentPoints: ['A', 'B'] } },
  'preset-12': { shapeCategory: 'quadrilateral', quadrilateral: { type: 'rectangle', vertices: ['A', 'B', 'C', 'D'], showDiagonals: true, diagonalIntersection: 'O' } },
  'preset-13': { shapeCategory: 'triangle', triangle: { ...triangle, vertices: [...triangle.vertices] }, parallels: [{ line1: 'MN', line2: 'BC' }] },
  'preset-14': { shapeCategory: 'symmetry', symmetry: { type: 'axial', targetShape: 'triangle', axisLabel: 'd', originalNames: ['A', 'B', 'C'], reflectedNames: ["A'", "B'", "C'"] } },
  'preset-15': { shapeCategory: 'symmetry', symmetry: { type: 'central', targetShape: 'segment', centerName: 'I', originalNames: ['A', 'B'], reflectedNames: ["A'", "B'"] } },
  'preset-16': { shapeCategory: 'polygon', polygon: { type: 'pentagon', sidesCount: 5, vertexNames: ['A', 'B', 'C', 'D', 'E'], centerName: 'O', showCircumcircle: true, showRadii: true } },
};

export function buildGeometryPresetDocument(preset: GeometryProblemPreset, settings?: BaseChartSettings): ChartDocument {
  // Chỉ mở các mẫu đã có trong danh sách, không dùng ID để đoán một hình khác.
  const definition = AI_GEOMETRY_PRESETS.find(item => item.id === preset.id);
  const construction = constructions[preset.id];
  if (!definition || !construction) throw new Error('Không tìm thấy bản dựng của hình mẫu.');
  const spec: GeometrySpecification = {
    ...structuredClone(construction),
    title: definition.topic,
    problemText: definition.prompt,
    detectedEntities: [],
    explanation: 'Hình mẫu dựng sẵn, không sử dụng AI.',
  };
  const doc = GeometrySpecificationAdapter.specToChartDocument(spec, settings ? { ...settings } : undefined);
  if (definition.id === 'preset-9' && doc.data.geometry?.circle) {
    doc.data.geometry.circle.showRadius = true;
    doc.data.geometry.circle.radiusLabel = '3 cm';
  }
  return doc;
}
