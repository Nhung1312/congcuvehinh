import React from 'react';
import {
  BaseChartSettings,
  GeometryData,
  TriangleData,
  QuadData,
  LineRayData,
  AngleData,
  CircleData,
} from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';
import { TriangleEditor } from './TriangleEditor';
import { QuadEditor } from './QuadEditor';
import { LineRayEditor } from './LineRayEditor';
import { AngleEditor } from './AngleEditor';
import { CircleEditor } from './CircleEditor';
import {
  getQuadPresetPoints,
  getLineRayPresetPoints,
  getAnglePresetPoints,
  getCirclePresetPoints,
} from '../../utils/geometryMath';

interface GeometryEditorProps {
  data: GeometryData;
  settings: BaseChartSettings;
  onChangeData: (data: GeometryData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const GeometryEditor: React.FC<GeometryEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const subType = data.subType || 'triangle';

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
    degrees: data.angle?.degrees || 60,
    autoCalculateDegrees: data.angle?.autoCalculateDegrees ?? true,
    showDegreeValue: data.angle?.showDegreeValue !== false,
    arcRadius: data.angle?.arcRadius || 34,
    showArc: data.angle?.showArc !== false,
    showBisector: data.angle?.showBisector || defaultAngleType === 'bisector',
    bisectorName: data.angle?.bisectorName || 'z',
    showEqualAngleMarks: data.angle?.showEqualAngleMarks !== false,
    fill: data.angle?.fill || { enabled: false, color: '#fef08a', opacity: 0.35 },
    points: data.angle?.points || getAnglePresetPoints(defaultAngleType),
    parallelCutConfig: data.angle?.parallelCutConfig || {
      line1Name: 'a',
      line2Name: 'b',
      transversalName: 'c',
      vertex1Name: 'A',
      vertex2Name: 'B',
      highlightType: 'alternate-interior',
      showParallelMarkers: true,
      showAngleNumbers: true,
    },
    ray1Style: data.angle?.ray1Style || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    ray2Style: data.angle?.ray2Style || { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    ...(data.angle || {}),
  };

  const defaultCirclePreset = data.circle?.presetType || 'basic';
  const currentCircle: CircleData = {
    presetType: defaultCirclePreset,
    centerName: data.circle?.centerName || 'O',
    radius: data.circle?.radius || 110,
    showCenterPoint: data.circle?.showCenterPoint !== false,
    showCenterLabel: data.circle?.showCenterLabel !== false,
    showRadius: data.circle?.showRadius !== false,
    radiusPointName: data.circle?.radiusPointName || 'A',
    radiusLabel: data.circle?.radiusLabel || 'R',
    showRadiusLabel: data.circle?.showRadiusLabel !== false,
    showDiameter: data.circle?.showDiameter || false,
    diameterPoints: data.circle?.diameterPoints || ['A', 'B'],
    showDiameterLabel: data.circle?.showDiameterLabel || false,
    diameterLabel: data.circle?.diameterLabel || 'd',
    showChord: data.circle?.showChord || false,
    chordPoints: data.circle?.chordPoints || ['C', 'D'],
    showChordDistance: data.circle?.showChordDistance !== false,
    chordDistanceLabel: data.circle?.chordDistanceLabel || 'H',
    showChordMidpoint: data.circle?.showChordMidpoint !== false,
    showChordRightAngle: data.circle?.showChordRightAngle !== false,
    showArc: data.circle?.showArc || false,
    arcType: data.circle?.arcType || 'minor',
    arcPoints: data.circle?.arcPoints || ['A', 'B'],
    arcName: data.circle?.arcName || 'AB',
    showArcName: data.circle?.showArcName !== false,
    showTangent: data.circle?.showTangent || false,
    tangentType: data.circle?.tangentType || 'at-point',
    tangentPointName: data.circle?.tangentPointName || 'A',
    tangentLineName: data.circle?.tangentLineName || 'Ax',
    externalPointName: data.circle?.externalPointName || 'P',
    tangentPointsNames: data.circle?.tangentPointsNames || ['A', 'B'],
    showTangentRightAngle: data.circle?.showTangentRightAngle !== false,
    showTangentEqualMarks: data.circle?.showTangentEqualMarks !== false,
    showCenterConnector: data.circle?.showCenterConnector !== false,
    showChordAB: data.circle?.showChordAB || false,
    showSecant: data.circle?.showSecant || false,
    secantPointsNames: data.circle?.secantPointsNames || ['C', 'D'],
    showInscribedAngle: data.circle?.showInscribedAngle || false,
    inscribedVertexName: data.circle?.inscribedVertexName || 'P',
    showCentralAngle: data.circle?.showCentralAngle || false,
    showSecondCircle: data.circle?.showSecondCircle || false,
    center2Name: data.circle?.center2Name || "O'",
    radius2: data.circle?.radius2 || 80,
    showIntersections: data.circle?.showIntersections !== false,
    intersectionNames: data.circle?.intersectionNames || ['A', 'B'],
    fill: data.circle?.fill || { enabled: false, color: '#3b82f6', opacity: 0.25 },
    fillType: data.circle?.fillType || 'full',
    points: data.circle?.points || getCirclePresetPoints(defaultCirclePreset),
    circleStyle: data.circle?.circleStyle || { strokeColor: '#000000', strokeWidth: 1.8, strokeStyle: 'solid' },
    radiusStyle: data.circle?.radiusStyle || { strokeColor: '#000000', strokeWidth: 1.5, strokeStyle: 'solid' },
    diameterStyle: data.circle?.diameterStyle || { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' },
    chordStyle: data.circle?.chordStyle || { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' },
    arcStyle: data.circle?.arcStyle || { strokeColor: '#ec4899', strokeWidth: 2.8, strokeStyle: 'solid' },
    tangentStyle: data.circle?.tangentStyle || { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' },
    ...(data.circle || {}),
  };

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
      />

      {/* 2. Thông số Hình phẳng */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {subType === 'triangle'
            ? 'Thiết lập Tam giác SGK'
            : subType === 'quadrilateral'
            ? 'Thiết lập Tứ giác SGK'
            : subType === 'line-ray'
            ? 'Thiết lập Đường thẳng & Đoạn thẳng'
            : subType === 'circle'
            ? 'Thiết lập Đường tròn SGK'
            : 'Thiết lập Góc & Phân giác'}
        </h4>

        {/* 1. Tam giác */}
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

        {/* 2. Tứ giác */}
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

        {/* 3. Đường thẳng / Tia / Đoạn thẳng / Song song / Vuông góc */}
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

        {/* 4. Góc & Tia phân giác */}
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

        {/* 5. Đường tròn */}
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
      </div>
    </div>
  );
};

