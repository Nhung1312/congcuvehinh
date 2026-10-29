import React, { useState } from 'react';
import {
  BaseChartSettings,
  GeometryData,
  TriangleData,
  QuadData,
  LineRayData,
  AngleData,
  CircleData,
  PolygonData,
  SymmetryData,
  DocumentAiMetadata,
} from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';
import { TriangleEditor } from './TriangleEditor';
import { QuadEditor } from './QuadEditor';
import { LineRayEditor } from './LineRayEditor';
import { AngleEditor } from './AngleEditor';
import { CircleEditor } from './CircleEditor';
import { RegularPolygonEditor } from './RegularPolygonEditor';
import { SymmetryEditor } from './SymmetryEditor';
import { AIProblemPromptCard } from './AIProblemPromptCard';
import { AI_GEOMETRY_PRESETS, GeometryProblemPreset } from '../../ai/aiPresets';
import {
  Sliders,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getQuadPresetPoints,
  getLineRayPresetPoints,
  getAnglePresetPoints,
  getCirclePresetPoints,
  getRegularPolygonPresetPoints,
  getSymmetryPresetPoints,
  getDefaultPolygonVertexNames,
} from '../../utils/geometryMath';

interface GeometryEditorProps {
  data: GeometryData;
  settings: BaseChartSettings;
  metadata?: DocumentAiMetadata;
  onUpdateAiPrompt?: (newPrompt: string) => void;
  onRerunAI?: (prompt: string) => Promise<void> | void;
  isAIRunning?: boolean;
  onChangeData: (data: GeometryData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const GeometryEditor: React.FC<GeometryEditorProps> = ({
  data,
  settings,
  metadata,
  onUpdateAiPrompt,
  onRerunAI,
  isAIRunning = false,
  onChangeData,
  onChangeSettings,
}) => {
  const subType = data.subType || 'triangle';

  // Điều khiển các accordion: "Chỉnh sửa hình" mặc định mở, "Đề mẫu tham khảo" mặc định đóng
  const [isGeometryOpen, setIsGeometryOpen] = useState(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const currentTriangle: TriangleData = data.triangle || {
    type: 'general',
    vertexNames: ['A', 'B', 'C'],
    points: [
      { x: 260, y: 110 },
      { x: 130, y: 340 },
      { x: 430, y: 340 },
    ],
    showVertices: true,
    showLabels: true,
    altitudes: [
      { fromVertex: 'A', enabled: true, label: 'H', style: 'dashed', showRightAngle: true },
    ],
    medians: [],
    bisectors: [],
    perpBisectors: [],
    showRightAngleMarker: true,
    showEqualSidesMarker: true,
    showSideLengths: false,
    sideLengthLabels: ['', '', ''],
  };

  const defaultQuadType = data.quadrilateral?.type || 'rectangle';
  const currentQuad: QuadData = {
    type: defaultQuadType,
    vertexNames: data.quadrilateral?.vertexNames || ['A', 'B', 'C', 'D'],
    points: data.quadrilateral?.points || getQuadPresetPoints(defaultQuadType),
    showVertices: data.quadrilateral?.showVertices !== false,
    showLabels: data.quadrilateral?.showLabels !== false,
    fill: data.quadrilateral?.fill || { enabled: false, color: '#3b82f6', opacity: 0.25 },
    edgeStyles: data.quadrilateral?.edgeStyles || {},
    vertexStyles: data.quadrilateral?.vertexStyles || {},
    labelStyles: data.quadrilateral?.labelStyles || {},
    diagonals: data.quadrilateral?.diagonals || {
      AC: { enabled: data.quadrilateral?.showDiagonals || false, style: 'dashed', color: '#64748b' },
      BD: { enabled: data.quadrilateral?.showDiagonals || false, style: 'dashed', color: '#64748b' },
      showIntersection: false,
      intersectionLabel: 'O',
    },
    altitudes: data.quadrilateral?.altitudes || [],
    showRightAngleMarkers: data.quadrilateral?.showRightAngleMarkers ?? true,
    showEqualSidesMarkers: data.quadrilateral?.showEqualSidesMarkers ?? (defaultQuadType === 'square' || defaultQuadType === 'rhombus'),
    showParallelMarkers: data.quadrilateral?.showParallelMarkers ?? true,
    showSideLengths: data.quadrilateral?.showSideLengths || false,
    sideLengthLabels: data.quadrilateral?.sideLengthLabels || ['', '', '', ''],
    ...(data.quadrilateral || {}),
  };

  const defaultLineRayType = data.lineRay?.type || 'segment';
  const currentLineRay: LineRayData = {
    type: defaultLineRayType,
    pointNames: data.lineRay?.pointNames || ['A', 'B', 'C', 'D'],
    points: data.lineRay?.points || getLineRayPresetPoints(defaultLineRayType),
    showPoints: data.lineRay?.showPoints !== false,
    showLabels: data.lineRay?.showLabels !== false,
    showMidpoint: data.lineRay?.showMidpoint || false,
    midpointName: data.lineRay?.midpointName || 'M',
    showEqualSegmentMarks: data.lineRay?.showEqualSegmentMarks !== false,
    showLength: data.lineRay?.showLength || false,
    lengthValue: data.lineRay?.lengthValue || '6 cm',
    showArrows: data.lineRay?.showArrows !== false,
    showParallelMarkers: data.lineRay?.showParallelMarkers !== false,
    parallelLineLabel1: data.lineRay?.parallelLineLabel1 || 'a',
    parallelLineLabel2: data.lineRay?.parallelLineLabel2 || 'b',
    showRightAngleMarker: data.lineRay?.showRightAngleMarker !== false,
    perpLineLabel1: data.lineRay?.perpLineLabel1 || 'd',
    perpLineLabel2: data.lineRay?.perpLineLabel2 || "d'",
    intersectionName: data.lineRay?.intersectionName || 'O',
    showIntersectionPoint: data.lineRay?.showIntersectionPoint !== false,
    line1Style: data.lineRay?.line1Style || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    line2Style: data.lineRay?.line2Style || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    ...(data.lineRay || {}),
  };

  const defaultAngleType = data.angle?.type || 'single';
  const currentAngle: AngleData = {
    type: defaultAngleType,
    vertexName: data.angle?.vertexName || 'O',
    ray1Name: data.angle?.ray1Name || 'x',
    ray2Name: data.angle?.ray2Name || 'y',
    ray3Name: data.angle?.ray3Name || 'z',
    bisectorName: data.angle?.bisectorName || 't',
    points: data.angle?.points || getAnglePresetPoints(defaultAngleType),
    showPoints: data.angle?.showPoints !== false,
    showLabels: data.angle?.showLabels !== false,
    showBisector: data.angle?.showBisector || false,
    showAngleArc: data.angle?.showAngleArc !== false,
    showAngleValue: data.angle?.showAngleValue || false,
    angleValue: data.angle?.angleValue || 60,
    showEqualAngleMarks: data.angle?.showEqualAngleMarks !== false,
    arcRadius: data.angle?.arcRadius || 36,
    lineStyle: data.angle?.lineStyle || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    bisectorStyle: data.angle?.bisectorStyle || { color: '#dc2626', strokeWidth: 1.8, style: 'dashed' },
    ...(data.angle || {}),
  };

  const defaultCircleType = data.circle?.type || 'basic';
  const currentCircle: CircleData = {
    type: defaultCircleType,
    centerName: data.circle?.centerName || 'O',
    points: data.circle?.points || getCirclePresetPoints(defaultCircleType),
    radius: data.circle?.radius || 110,
    showCenter: data.circle?.showCenter !== false,
    showRadius: data.circle?.showRadius || false,
    radiusLabel: data.circle?.radiusLabel || 'R',
    radiusPointName: data.circle?.radiusPointName || 'A',
    showDiameter: data.circle?.showDiameter || false,
    diameterPoint1: data.circle?.diameterPoint1 || 'A',
    diameterPoint2: data.circle?.diameterPoint2 || 'B',
    chords: data.circle?.chords || [],
    tangents: data.circle?.tangents || [],
    inscribedTriangles: data.circle?.inscribedTriangles || [],
    circleStyle: data.circle?.circleStyle || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    ...(data.circle || {}),
  };

  const defaultPolygonSides = data.polygon?.sides || 6;
  const currentPolygon: PolygonData = {
    sides: defaultPolygonSides,
    centerName: data.polygon?.centerName || 'O',
    vertexNames: data.polygon?.vertexNames || getDefaultPolygonVertexNames(defaultPolygonSides),
    points: data.polygon?.points || getRegularPolygonPresetPoints(defaultPolygonSides),
    showVertices: data.polygon?.showVertices !== false,
    showLabels: data.polygon?.showLabels !== false,
    showCenter: data.polygon?.showCenter || false,
    showCenterLabel: data.polygon?.showCenterLabel !== false,
    showRadii: data.polygon?.showRadii || false,
    showApothem: data.polygon?.showApothem || false,
    showSideLengths: data.polygon?.showSideLengths || false,
    sideLengthValue: data.polygon?.sideLengthValue || '4 cm',
    showCircumcircle: data.polygon?.showCircumcircle || false,
    showIncircle: data.polygon?.showIncircle || false,
    fill: data.polygon?.fill || { enabled: false, color: '#10b981', opacity: 0.2 },
    edgeStyles: data.polygon?.edgeStyles || {},
    vertexStyles: data.polygon?.vertexStyles || {},
    labelStyles: data.polygon?.labelStyles || {},
    polygonStyle: data.polygon?.polygonStyle || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    ...(data.polygon || {}),
  };

  const defaultSymmetryType = data.symmetry?.type || 'axial';
  const defaultSymmetryShape = data.symmetry?.targetShape || 'point';
  const currentSymmetry: SymmetryData = {
    type: defaultSymmetryType,
    targetShape: defaultSymmetryShape,
    axisLabel: data.symmetry?.axisLabel || 'd',
    centerName: data.symmetry?.centerName || 'I',
    circleRadius: data.symmetry?.circleRadius || 50,
    showConnectingDashedLines: data.symmetry?.showConnectingDashedLines !== false,
    showRightAngleMarkers: data.symmetry?.showRightAngleMarkers !== false,
    showEqualDistanceMarkers: data.symmetry?.showEqualDistanceMarkers !== false,
    showOriginalLabels: data.symmetry?.showOriginalLabels !== false,
    showReflectedLabels: data.symmetry?.showReflectedLabels !== false,
    ...getSymmetryPresetPoints(defaultSymmetryType, defaultSymmetryShape),
    ...(data.symmetry || {}),
  };

  return (
    <div className="space-y-3.5">
      {/* 1. ƯU TIÊN HÀNG ĐẦU: Mục ĐỀ BÀI ĐANG DỰNG (khi hình có nguồn AI) */}
      {(metadata?.aiPrompt || metadata?.aiQuestionImage) && (
        <AIProblemPromptCard
          metadata={metadata}
          onUpdatePrompt={onUpdateAiPrompt || (() => {})}
          onRerunAI={onRerunAI}
          isAIRunning={isAIRunning}
        />
      )}

      {/* 2. Mục CHỈNH SỬA HÌNH: có thể mở/thu gọn (mặc định mở) */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsGeometryOpen(!isGeometryOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 transition text-left border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Chỉnh sửa hình
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              (
              {subType === 'triangle'
                ? 'Tam giác'
                : subType === 'quadrilateral'
                ? 'Tứ giác'
                : subType === 'line-ray'
                ? 'Đoạn thẳng/Tia'
                : subType === 'circle'
                ? 'Đường tròn'
                : subType === 'polygon'
                ? 'Đa giác đều'
                : subType === 'symmetry'
                ? 'Đối xứng'
                : 'Góc'}
              )
            </span>
          </div>
          <div className="text-slate-400">
            {isGeometryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isGeometryOpen && (
          <div className="p-3 space-y-4">
            {/* SubType Editor */}
            <div className="space-y-3">
              {subType === 'triangle' && (
                <TriangleEditor
                  triangle={currentTriangle}
                  onChangeTriangle={(newTriangle) =>
                    onChangeData({
                      ...data,
                      triangle: newTriangle,
                    })
                  }
                />
              )}

              {subType === 'quadrilateral' && (
                <QuadEditor
                  quad={currentQuad}
                  onChangeQuad={(newQuad) =>
                    onChangeData({
                      ...data,
                      quadrilateral: newQuad,
                    })
                  }
                />
              )}

              {subType === 'line-ray' && (
                <LineRayEditor
                  lineRay={currentLineRay}
                  onChangeLineRay={(newLineRay) =>
                    onChangeData({
                      ...data,
                      lineRay: newLineRay,
                    })
                  }
                />
              )}

              {subType === 'angle' && (
                <AngleEditor
                  angle={currentAngle}
                  onChangeAngle={(newAngle) =>
                    onChangeData({
                      ...data,
                      angle: newAngle,
                    })
                  }
                />
              )}

              {subType === 'circle' && (
                <CircleEditor
                  circle={currentCircle}
                  onChangeCircle={(newCircle) =>
                    onChangeData({
                      ...data,
                      circle: newCircle,
                    })
                  }
                />
              )}

              {subType === 'polygon' && (
                <RegularPolygonEditor
                  polygon={currentPolygon}
                  onChangePolygon={(newPolygon) =>
                    onChangeData({
                      ...data,
                      polygon: newPolygon,
                    })
                  }
                />
              )}

              {subType === 'symmetry' && (
                <SymmetryEditor
                  symmetry={currentSymmetry}
                  onChangeSymmetry={(newSymmetry) =>
                    onChangeData({
                      ...data,
                      symmetry: newSymmetry,
                    })
                  }
                />
              )}
            </div>

            {/* Tiêu đề & Kiểu font SGK */}
            <div className="pt-3 border-t border-slate-100">
              <CommonStyleEditor
                settings={settings}
                onChangeSettings={onChangeSettings}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Mục ĐỀ MẪU THAM KHẢO (12 đề SGK): có thể mở/thu gọn (mặc định ĐÓNG) */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsPresetsOpen(!isPresetsOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-100 text-amber-700">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Đề mẫu tham khảo (12 đề SGK)
            </span>
          </div>
          <div className="text-slate-400">
            {isPresetsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isPresetsOpen && (
          <div className="p-3 border-t border-slate-200 space-y-2 max-h-72 overflow-y-auto">
            {AI_GEOMETRY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (onRerunAI) {
                    onRerunAI(preset.prompt);
                  }
                }}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 border border-slate-200 rounded-lg text-xs transition group space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-blue-800 text-[11px]">
                    {preset.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold group-hover:bg-blue-200 group-hover:text-blue-800">
                    {preset.grade}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 group-hover:text-slate-700 font-normal">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
