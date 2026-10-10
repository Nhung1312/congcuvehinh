import React, { useState, useRef, useEffect } from 'react';
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
  Point2D,
  StrokeDashType,
  CustomAuxLine,
  CustomAuxPoint,
  CustomRightAngleMarker,
  CustomParallelMarker,
  CustomEqualSidesMarker,
  CustomEqualAnglesMarker,
} from '../types';
import { resolveAuxiliaryPoints } from '../utils/resolveAuxiliaryPoints';
import { fitTriangleViewBox } from '../utils/geometryViewBox';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, getMathFontFamily } from '../constants/style';
import {
  dist,
  midpoint,
  projectPointToLine,
  angleBisectorPoint,
  perpendicularBisectorSegment,
  getSmartVertexLabelPosition,
  getRightAngleMarkerPath,
  getSegmentTickMarks,
  getEqualAngleArcPath,
  lineIntersection,
  getParallelArrowsPath,
  getQuadPresetPoints,
  constrainTrianglePointDrag,
  constrainQuadPointDrag,
  getLineRayPresetPoints,
  getAnglePresetPoints,
  constrainLineRayDrag,
  constrainAngleDrag,
  getCirclePresetPoints,
  constrainCircleDrag,
  getTwoTangentContactPoints,
  getLineCircleIntersections,
  getTwoCirclesIntersections,
  getCircleArcSvgPath,
  getCircleSectorSvgPath,
  getCircleSegmentSvgPath,
  calculateAngle,
  getAngleArcAndFill,
  extendLine,
  getParallelLineThroughPoint,
  getPerpendicularLineThroughPoint,
  vecNorm,
  vecSub,
  vecScale,
  vecAdd,
  getAdvancedEqualAngleArcSvg,
  getAdvancedSegmentTicks,
  getArrowHeadSvg,
  resolvePointCoordinate,
  getTriangleCircumcircle,
  getTriangleIncircle,
  getCommonTangents,
  findLineRaySegmentIntersection,
  getThalesCutVertices,
  getThalesPoints,
  projectPointOntoSegmentRatio,
  getPolygonPresetSides,
  getRegularPolygonPresetPoints,
  getDefaultPolygonVertexNames,
  constrainRegularPolygonDrag,
  reflectPointAxial,
  reflectPointCentral,
  computeReflectedPoints,
  getSymmetryPresetPoints,
  constrainSymmetryDrag,
} from '../utils/geometryMath';

interface GeometrySvgProps {
  data: GeometryData;
  settings: BaseChartSettings;
  onUpdateTrianglePoints?: (points: [Point2D, Point2D, Point2D]) => void;
  onUpdateTriangleData?: (triangle: TriangleData) => void;
  onUpdateQuadPoints?: (points: [Point2D, Point2D, Point2D, Point2D]) => void;
  onUpdateLineRayPoints?: (points: Point2D[]) => void;
  onUpdateAnglePoints?: (points: Point2D[]) => void;
  onUpdateCirclePoints?: (points: Point2D[], radius?: number) => void;
  onUpdatePolygonData?: (polygon: PolygonData) => void;
  onUpdateSymmetryData?: (symmetry: SymmetryData) => void;
}

export const GeometrySvg: React.FC<GeometrySvgProps> = ({
  data,
  settings,
  onUpdateTrianglePoints,
  onUpdateTriangleData,
  onUpdateQuadPoints,
  onUpdateLineRayPoints,
  onUpdateAnglePoints,
  onUpdateCirclePoints,
  onUpdatePolygonData,
  onUpdateSymmetryData,
}) => {
  const { subType = 'triangle', triangle, quadrilateral, circle, angle, lineRay, polygon, symmetry } = data;

  const width = settings.width || 560;
  const height = settings.height || 440;
  // The assignment text remains available in document metadata, not on the geometry itself.
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.main;
  const fontSize = settings.fontSize || SGK_STYLE.fontSize.label;

  // State cho việc kéo điểm trực tiếp trên SVG
  const [draggingVertex, setDraggingVertex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Khởi tạo toạ độ tam giác nếu chưa có
  const getInitialTrianglePoints = (tType: string): [Point2D, Point2D, Point2D] => {
    if (tType === 'right') {
      return [
        { x: 170, y: 120 },
        { x: 170, y: 340 },
        { x: 440, y: 340 },
      ];
    } else if (tType === 'right-isosceles') {
      return [
        { x: 180, y: 130 },
        { x: 180, y: 340 },
        { x: 390, y: 340 },
      ];
    } else if (tType === 'equilateral') {
      const cx = width / 2;
      const cy = 250;
      const side = 260;
      const h = (side * Math.sqrt(3)) / 2;
      return [
        { x: cx, y: cy - (2 * h) / 3 },
        { x: cx - side / 2, y: cy + h / 3 },
        { x: cx + side / 2, y: cy + h / 3 },
      ];
    } else if (tType === 'isosceles') {
      return [
        { x: 280, y: 110 },
        { x: 140, y: 340 },
        { x: 420, y: 340 },
      ];
    }
    // Tam giác thường
    return [
      { x: 260, y: 110 },
      { x: 130, y: 340 },
      { x: 430, y: 340 },
    ];
  };

  // Lấy các toạ độ đỉnh tam giác hiện tại
  const trianglePoints: [Point2D, Point2D, Point2D] =
    triangle?.points && triangle.points.length === 3
      ? triangle.points
      : getInitialTrianglePoints(triangle?.type || 'general');
  // Fit all constructed points, including an intersection T outside the triangle.
  // Recompute as the user drags vertices; never move the source coordinates to fit.
  const viewport = subType === 'triangle'
    ? fitTriangleViewBox(triangle || { type: 'general', vertexNames: ['A', 'B', 'C'] }, trianglePoints, width, height)
    : { x: 0, y: 0, width, height };

  // Lấy toạ độ đỉnh tứ giác hiện tại
  const quadPoints: [Point2D, Point2D, Point2D, Point2D] =
    quadrilateral?.points && quadrilateral.points.length === 4
      ? quadrilateral.points
      : getQuadPresetPoints(quadrilateral?.type || 'rectangle');

  // Lấy toạ độ đường thẳng / tia / đoạn thẳng
  const lineRayPoints: Point2D[] =
    lineRay?.points && lineRay.points.length > 0
      ? lineRay.points
      : getLineRayPresetPoints(lineRay?.type || 'segment');

  // Lấy toạ độ góc
  const anglePoints: Point2D[] =
    angle?.points && angle.points.length > 0
      ? angle.points
      : getAnglePresetPoints(angle?.type || 'single');

  // Lấy toạ độ đường tròn
  const circlePoints: Point2D[] =
    circle?.points && circle.points.length > 0
      ? circle.points
      : getCirclePresetPoints(circle?.presetType || 'basic');

  // Xử lý sự kiện kéo thả chuột trên Canvas
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggingVertex(index);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingVertex === null || !svgRef.current) return;

    // The SVG may have an expanded viewBox, so map the pointer through the actual
    // SVG coordinate transform (rather than assuming a fixed 0..width pixel range).
    const screenMatrix = svgRef.current.getScreenCTM();
    if (!screenMatrix) return;
    const clientPoint = svgRef.current.createSVGPoint();
    clientPoint.x = e.clientX;
    clientPoint.y = e.clientY;
    const localPoint = clientPoint.matrixTransform(screenMatrix.inverse());
    let newX = Math.round(localPoint.x);
    let newY = Math.round(localPoint.y);

    // Giới hạn trong khung vẽ
    newX = Math.max(30, Math.min(width - 30, newX));
    newY = Math.max(35, Math.min(height - 30, newY));

    if (subType === 'triangle') {
      if (draggingVertex === 10) {
        // Kéo điểm M của định lý Ta-lét trên cạnh tam giác
        if (triangle?.thales?.enabled && onUpdateTriangleData) {
          const cutSide = triangle.thales.cutSide || 'AB-AC';
          const { top, left } = getThalesCutVertices(trianglePoints, cutSide);
          const newRatio = projectPointOntoSegmentRatio({ x: newX, y: newY }, top, left);
          onUpdateTriangleData({
            ...triangle,
            thales: {
              ...triangle.thales,
              ratio: newRatio,
            },
          });
        }
      } else if (onUpdateTrianglePoints && draggingVertex < 3) {
        const tType = triangle?.type || 'general';
        const constrainedPoints = constrainTrianglePointDrag(
          tType,
          trianglePoints,
          draggingVertex,
          { x: newX, y: newY },
          triangle?.specialVertex,
          triangle?.vertexNames
        );
        onUpdateTrianglePoints(constrainedPoints);
      }
    } else if (subType === 'quadrilateral' && onUpdateQuadPoints) {
      const qType = quadrilateral?.type || 'rectangle';
      const constrainedPoints = constrainQuadPointDrag(qType, quadPoints, draggingVertex, {
        x: newX,
        y: newY,
      });
      onUpdateQuadPoints(constrainedPoints);
    } else if (subType === 'line-ray' && onUpdateLineRayPoints) {
      const lrType = lineRay?.type || 'segment';
      const constrainedPoints = constrainLineRayDrag(lrType, lineRayPoints, draggingVertex, {
        x: newX,
        y: newY,
      });
      onUpdateLineRayPoints(constrainedPoints);
    } else if (subType === 'angle' && onUpdateAnglePoints) {
      const aType = angle?.type || 'single';
      const constrainedPoints = constrainAngleDrag(aType, anglePoints, draggingVertex, {
        x: newX,
        y: newY,
      });
      onUpdateAnglePoints(constrainedPoints);
    } else if (subType === 'circle' && onUpdateCirclePoints) {
      const cType = circle?.presetType || 'basic';
      const constrainedPoints = constrainCircleDrag(cType, circlePoints, draggingVertex, {
        x: newX,
        y: newY,
      });
      const newRadius = dist(constrainedPoints[0], constrainedPoints[1]);
      onUpdateCirclePoints(constrainedPoints, newRadius);
    } else if (subType === 'polygon' && onUpdatePolygonData) {
      const currentPoly: PolygonData = polygon || {
        type: 'pentagon',
        sidesCount: 5,
        center: { x: width / 2, y: height / 2 },
        radius: 120,
        vertexNames: ['A', 'B', 'C', 'D', 'E'],
      };
      const updated = constrainRegularPolygonDrag(currentPoly, draggingVertex, { x: newX, y: newY });
      onUpdatePolygonData({
        ...currentPoly,
        center: updated.center,
        radius: updated.radius,
        rotationAngle: updated.rotationAngle,
        points: updated.points,
      });
    } else if (subType === 'symmetry' && onUpdateSymmetryData) {
      const currentSym: SymmetryData = symmetry || {
        type: 'axial',
        targetShape: 'triangle',
        ...getSymmetryPresetPoints('axial', 'triangle'),
      };
      let dragTarget: 'original' | 'axis' | 'center' = 'original';
      let dragIdx = draggingVertex;
      if (draggingVertex >= 100 && draggingVertex < 200) {
        dragTarget = 'axis';
        dragIdx = draggingVertex - 100;
      } else if (draggingVertex >= 200) {
        dragTarget = 'center';
        dragIdx = 0;
      }
      const updated = constrainSymmetryDrag(currentSym, dragTarget, dragIdx, { x: newX, y: newY });
      onUpdateSymmetryData({
        ...currentSym,
        originalPoints: updated.originalPoints,
        axisPoints: updated.axisPoints,
        centerPoint: updated.centerPoint,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingVertex !== null) {
      setDraggingVertex(null);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Helper lấy dash array theo chuẩn SGK
  const getDashArray = (style?: StrokeDashType | string) => {
    if (style === 'dashed') return '6 4';
    if (style === 'dotted') return '2 3';
    return undefined;
  };

  // ==========================================
  // RENDER CÁC YẾU TỐ PHỤ & KÝ HIỆU HÌNH HỌC (GIAI ĐOẠN 3.2)
  // ==========================================
  const renderAuxiliaryElements = (
    namedPoints: Record<string, Point2D>,
    auxData?: {
      auxLines?: CustomAuxLine[];
      auxPoints?: CustomAuxPoint[];
      rightAngleMarkers?: CustomRightAngleMarker[];
      parallelMarkers?: CustomParallelMarker[];
      equalSidesMarkers?: CustomEqualSidesMarker[];
      equalAnglesMarkers?: CustomEqualAnglesMarker[];
    }
  ) => {
    if (!auxData) return null;
    const {
      auxLines = [],
      auxPoints = [],
      rightAngleMarkers = [],
      parallelMarkers = [],
      equalSidesMarkers = [],
      equalAnglesMarkers = [],
    } = auxData;

    // Giải chuỗi H → D/E dù điểm phụ được trả về không đúng thứ tự.
    const pointsMap = resolveAuxiliaryPoints(namedPoints, auxPoints, circle?.radius);

    return (
      <g id="auxiliary-elements-layer">
        {/* 1. Ký hiệu góc bằng nhau (Equal Angle Arcs) */}
        {equalAnglesMarkers.filter((m) => m.enabled !== false).map((m, idx) => (
          <g key={`eqAngle-${m.id || idx}`}>
            {m.angles?.map((ang, aIdx) => {
              const v = resolvePointCoordinate(ang.vertex, pointsMap);
              const r1 = resolvePointCoordinate(ang.ray1, pointsMap);
              const r2 = resolvePointCoordinate(ang.ray2, pointsMap);
              if (!v || !r1 || !r2) return null;
              const res = getAdvancedEqualAngleArcSvg(v, r1, r2, m.arcType || 1);
              const color = m.color || strokeColor;
              return (
                <g key={`ang-${aIdx}`}>
                  {res.arcs.map((arcD, i) => (
                    <path key={`arc-${i}`} d={arcD} fill="none" stroke={color} strokeWidth={1.2} />
                  ))}
                  {res.ticks?.map((t, i) => (
                    <line key={`t-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={1.2} />
                  ))}
                  {res.dots?.map((d, i) => (
                    <circle key={`dot-${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={color} />
                  ))}
                </g>
              );
            })}
          </g>
        ))}

        {/* 2. Đoạn nối / Đường phụ tùy ý (Auxiliary Lines) */}
        {auxLines.filter((l) => l.enabled !== false).map((line, idx) => {
          const pStart = resolvePointCoordinate(line.from, pointsMap);
          const pEnd = resolvePointCoordinate(line.to, pointsMap);
          if (!pStart || !pEnd) return null;
          const color = line.color || strokeColor;
          const width = line.strokeWidth || 1.3;
          const dash = getDashArray(line.style || 'dashed');
          const dir = vecSub(pEnd, pStart);
          const midP = midpoint(pStart, pEnd);

          return (
            <g key={`auxLine-${line.id || idx}`}>
              <line
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
              {/* Mũi tên kết thúc */}
              {(line.arrows === 'end' || line.arrows === 'both') && (
                <path
                  d={getArrowHeadSvg(pEnd, dir, 8).path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.3}
                />
              )}
              {/* Mũi tên bắt đầu */}
              {(line.arrows === 'start' || line.arrows === 'both') && (
                <path
                  d={getArrowHeadSvg(pStart, vecScale(dir, -1), 8).path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.3}
                />
              )}
              {/* Nhãn đoạn phụ */}
              {line.showLabel && line.label && (
                <text
                  x={midP.x + 8}
                  y={midP.y - 8}
                  fontSize={fontSize - 2}
                  fontStyle="italic"
                  fontWeight="semibold"
                  fill={color}
                  fontFamily={fontFamily}
                >
                  {line.label}
                </text>
              )}
              {/* Trung điểm đoạn phụ */}
              {line.showMidpoint && (
                <g>
                  <circle cx={midP.x} cy={midP.y} r={2.5} fill={color} />
                  {line.midpointLabel && (
                    <text
                      x={midP.x + 6}
                      y={midP.y - 6}
                      fontSize={fontSize - 2}
                      fontStyle="italic"
                      fontWeight="bold"
                      fill={color}
                      fontFamily={fontFamily}
                    >
                      {line.midpointLabel}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 3. Ký hiệu góc vuông (Right Angle Markers) */}
        {rightAngleMarkers.filter((m) => m.enabled !== false).map((m, idx) => {
          const v = resolvePointCoordinate(m.vertex, pointsMap);
          const r1 = resolvePointCoordinate(m.ray1, pointsMap);
          const r2 = resolvePointCoordinate(m.ray2, pointsMap);
          if (!v || !r1 || !r2) return null;
          const raPath = getRightAngleMarkerPath(v, r1, r2, m.size || 10);
          return (
            <path
              key={`ra-${m.id || idx}`}
              d={raPath}
              fill="none"
              stroke={m.color || strokeColor}
              strokeWidth={m.strokeWidth || 1.2}
            />
          );
        })}

        {/* 4. Ký hiệu song song (Parallel Markers) */}
        {parallelMarkers.filter((m) => m.enabled !== false).map((m, idx) => {
          const seg1 = m.segment1;
          const seg2 = m.segment2;
          if (!seg1 || !seg2 || seg1.length < 2 || seg2.length < 2) return null;
          const s1_p1 = resolvePointCoordinate(seg1[0], pointsMap);
          const s1_p2 = resolvePointCoordinate(seg1[1], pointsMap);
          const s2_p1 = resolvePointCoordinate(seg2[0], pointsMap);
          const s2_p2 = resolvePointCoordinate(seg2[1], pointsMap);
          if (!s1_p1 || !s1_p2 || !s2_p1 || !s2_p2) return null;

          const pCount = (m.arrowCount === 2 ? 2 : 1) as 1 | 2;
          const path1 = getParallelArrowsPath(s1_p1, s1_p2, pCount);
          const path2 = getParallelArrowsPath(s2_p1, s2_p2, pCount);
          const color = m.color || strokeColor;

          return (
            <g key={`par-${m.id || idx}`}>
              <path d={path1} fill="none" stroke={color} strokeWidth={1.3} />
              <path d={path2} fill="none" stroke={color} strokeWidth={1.3} />
            </g>
          );
        })}

        {/* 5. Ký hiệu cạnh bằng nhau (Equal Sides Markers) */}
        {equalSidesMarkers.filter((m) => m.enabled !== false).map((m, idx) => (
          <g key={`eqSides-${m.id || idx}`}>
            {m.segments?.map((seg, sIdx) => {
              if (!seg || seg.length < 2) return null;
              const p1 = resolvePointCoordinate(seg[0], pointsMap);
              const p2 = resolvePointCoordinate(seg[1], pointsMap);
              if (!p1 || !p2) return null;
              const res = getAdvancedSegmentTicks(p1, p2, m.tickType || 1);
              const color = m.color || strokeColor;
              return (
                <g key={`seg-${sIdx}`}>
                  {res.lines?.map((l, i) => (
                    <line key={`l-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={1.3} />
                  ))}
                  {res.circle && (
                    <circle cx={res.circle.cx} cy={res.circle.cy} r={res.circle.r} fill={color} />
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* 6. Điểm phụ và Nhãn điểm phụ (Auxiliary Points & Labels) */}
        {auxPoints.filter((p) => p.showPoint !== false || p.showLabel !== false).map((p, idx) => {
          const pt = pointsMap[p.name];
          if (!pt) return null;
          const color = p.color || strokeColor;
          return (
            <g key={`auxPt-${p.id || idx}`}>
              {p.showPoint !== false && (
                <circle cx={pt.x} cy={pt.y} r={2.8} fill={color} />
              )}
              {p.showLabel !== false && p.name && (
                <text
                  x={pt.x + 8}
                  y={pt.y - 8}
                  fontSize={fontSize}
                  fontStyle="italic"
                  fontWeight="bold"
                  fill={color}
                  fontFamily={fontFamily}
                >
                  {p.name}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Render Tam giác nâng cao chuẩn SGK
  const renderTriangle = () => {
    const t: TriangleData = triangle || {
      type: 'general',
      vertexNames: ['A', 'B', 'C'],
    };

    const [pA, pB, pC] = trianglePoints;
    const vNames = t.vertexNames || ['A', 'B', 'C'];
    const nameA = vNames[0] || 'A';
    const nameB = vNames[1] || 'B';
    const nameC = vNames[2] || 'C';

    const showLabels = t.showLabels !== false;
    const showVertices = t.showVertices !== false;

    // Style từng cạnh (nếu không có thì dùng style chung của tài liệu)
    const styleAB = t.edgeStyles?.AB || {};
    const styleBC = t.edgeStyles?.BC || {};
    const styleCA = t.edgeStyles?.CA || {};

    const colorAB = styleAB.strokeColor || strokeColor;
    const widthAB = styleAB.strokeWidth || strokeWidth;
    const dashAB = getDashArray(styleAB.strokeStyle);

    const colorBC = styleBC.strokeColor || strokeColor;
    const widthBC = styleBC.strokeWidth || strokeWidth;
    const dashBC = getDashArray(styleBC.strokeStyle);

    const colorCA = styleCA.strokeColor || strokeColor;
    const widthCA = styleCA.strokeWidth || strokeWidth;
    const dashCA = getDashArray(styleCA.strokeStyle);

    // Style từng đỉnh
    const vStyleA = t.vertexStyles?.A || {};
    const vStyleB = t.vertexStyles?.B || {};
    const vStyleC = t.vertexStyles?.C || {};

    // Style từng nhãn chữ
    const lStyleA = t.labelStyles?.A || {};
    const lStyleB = t.labelStyles?.B || {};
    const lStyleC = t.labelStyles?.C || {};

    // Vị trí nhãn đỉnh thông minh
    const labelA = getSmartVertexLabelPosition(pA, pB, pC, 20);
    const labelB = getSmartVertexLabelPosition(pB, pC, pA, 20);
    const labelC = getSmartVertexLabelPosition(pC, pA, pB, 20);

    // ==========================================
    // 1. ĐƯỜNG CAO (Altitudes)
    // ==========================================
    const altitudes = t.altitudes || (t.showAltitudes ? [{ fromVertex: 'A', enabled: true, style: 'dashed', showRightAngle: true }] : []);

    const renderedAltitudes = altitudes
      .filter((alt) => alt.enabled)
      .map((alt, idx) => {
        let fromP = pA;
        let baseP1 = pB;
        let baseP2 = pC;
        let defaultLabel = 'H';

        if (alt.fromVertex === 'B') {
          fromP = pB;
          baseP1 = pA;
          baseP2 = pC;
          defaultLabel = 'K';
        } else if (alt.fromVertex === 'C') {
          fromP = pC;
          baseP1 = pA;
          baseP2 = pB;
          defaultLabel = 'L';
        }

        const proj = projectPointToLine(fromP, baseP1, baseP2);
        const footP = proj.point;
        const footLabel = alt.label || defaultLabel;
        const footLabelPos = getSmartVertexLabelPosition(footP, baseP1, fromP, 16);
        const altColor = alt.color || strokeColor;
        const altWidth = alt.strokeWidth || 1.2;
        const altDash = getDashArray(alt.style || 'dashed');

        // Ký hiệu góc vuông tại chân đường cao
        const raPath = getRightAngleMarkerPath(footP, fromP, baseP1, 10);

        return (
          <g key={`alt-${alt.fromVertex}-${idx}`} id={`altitude-${alt.fromVertex}`}>
            {/* Nếu chân đường cao nằm ngoài đoạn cạnh (tam giác tù), kẻ đường dóng kéo dài cạnh bằng nét đứt */}
            {!proj.isInsideSegment && (
              <line
                x1={proj.t < 0 ? baseP1.x : baseP2.x}
                y1={proj.t < 0 ? baseP1.y : baseP2.y}
                x2={footP.x}
                y2={footP.y}
                stroke={altColor}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Đoạn đường cao */}
            <line
              x1={fromP.x}
              y1={fromP.y}
              x2={footP.x}
              y2={footP.y}
              stroke={altColor}
              strokeWidth={altWidth}
              strokeDasharray={altDash}
            />

            {/* Ký hiệu góc vuông tại chân đường cao */}
            {alt.showRightAngle !== false && (
              <path d={raPath} fill="none" stroke={altColor} strokeWidth={1} />
            )}

            {/* Chân đường cao node & label */}
            <circle cx={footP.x} cy={footP.y} r={2.5} fill={altColor} />
            {showLabels && (
              <text
                x={footLabelPos.x}
                y={footLabelPos.y}
                textAnchor={footLabelPos.textAnchor}
                dominantBaseline={footLabelPos.dominantBaseline}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontWeight="semibold"
                fill={altColor}
              >
                {footLabel}
              </text>
            )}
          </g>
        );
      });

    // ==========================================
    // 2. TRUNG TUYẾN (Medians)
    // ==========================================
    const medians = t.medians || (t.showMedians ? [{ fromVertex: 'A', enabled: true, style: 'dashed', showTickMarks: true }] : []);

    const renderedMedians = medians
      .filter((med) => med.enabled)
      .map((med, idx) => {
        let fromP = pA;
        let baseP1 = pB;
        let baseP2 = pC;
        let defaultLabel = 'M';
        let tickCount: 1 | 2 | 3 = 1;

        if (med.fromVertex === 'B') {
          fromP = pB;
          baseP1 = pA;
          baseP2 = pC;
          defaultLabel = 'N';
          tickCount = 2;
        } else if (med.fromVertex === 'C') {
          fromP = pC;
          baseP1 = pA;
          baseP2 = pB;
          defaultLabel = 'P';
          tickCount = 3;
        }

        const midP = midpoint(baseP1, baseP2);
        const midLabel = med.label || defaultLabel;
        const midLabelPos = getSmartVertexLabelPosition(midP, baseP1, fromP, 16);
        const medColor = med.color || strokeColor;
        const medWidth = med.strokeWidth || 1.2;
        const medDash = getDashArray(med.style || 'dashed');

        // Ký hiệu 2 đoạn bằng nhau ở trung điểm
        const ticks1 = med.showTickMarks !== false ? getSegmentTickMarks(baseP1, midP, tickCount, 8, 3) : null;
        const ticks2 = med.showTickMarks !== false ? getSegmentTickMarks(midP, baseP2, tickCount, 8, 3) : null;

        return (
          <g key={`med-${med.fromVertex}-${idx}`} id={`median-${med.fromVertex}`}>
            {/* Đường trung tuyến */}
            <line
              x1={fromP.x}
              y1={fromP.y}
              x2={midP.x}
              y2={midP.y}
              stroke={medColor}
              strokeWidth={medWidth}
              strokeDasharray={medDash}
            />

            {/* Ký hiệu 2 đoạn bằng nhau */}
            {Array.isArray(ticks1) &&
              ticks1.map((l, i) => (
                <line key={`t1-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={medColor} strokeWidth={1.2} />
              ))}
            {Array.isArray(ticks2) &&
              ticks2.map((l, i) => (
                <line key={`t2-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={medColor} strokeWidth={1.2} />
              ))}

            {/* Điểm trung điểm */}
            <circle cx={midP.x} cy={midP.y} r={2.5} fill={medColor} />
            {showLabels && (
              <text
                x={midLabelPos.x}
                y={midLabelPos.y}
                textAnchor={midLabelPos.textAnchor}
                dominantBaseline={midLabelPos.dominantBaseline}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontWeight="semibold"
                fill={medColor}
              >
                {midLabel}
              </text>
            )}
          </g>
        );
      });

    // ==========================================
    // 3. ĐƯỜNG PHÂN GIÁC (Bisectors)
    // ==========================================
    const bisectors = t.bisectors || (t.showBisectors ? [{ fromVertex: 'A', enabled: true, style: 'dashed', showAngleMarks: true }] : []);

    const renderedBisectors = bisectors
      .filter((bis) => bis.enabled)
      .map((bis, idx) => {
        let fromP = pA;
        let adj1 = pB;
        let adj2 = pC;
        let defaultLabel = 'D';

        if (bis.fromVertex === 'B') {
          fromP = pB;
          adj1 = pA;
          adj2 = pC;
          defaultLabel = 'E';
        } else if (bis.fromVertex === 'C') {
          fromP = pC;
          adj1 = pA;
          adj2 = pB;
          defaultLabel = 'F';
        }

        const footD = angleBisectorPoint(fromP, adj1, adj2);
        const labelD = bis.label || defaultLabel;
        const dLabelPos = getSmartVertexLabelPosition(footD, adj1, fromP, 16);
        const bisColor = bis.color || strokeColor;
        const bisWidth = bis.strokeWidth || 1.2;
        const bisDash = getDashArray(bis.style || 'dashed');

        // Ký hiệu 2 góc bằng nhau tại đỉnh
        const arc1 = getEqualAngleArcPath(fromP, adj1, footD, 22);
        const arc2 = getEqualAngleArcPath(fromP, footD, adj2, 22);

        return (
          <g key={`bis-${bis.fromVertex}-${idx}`} id={`bisector-${bis.fromVertex}`}>
            {/* Tia/Đoạn phân giác */}
            <line
              x1={fromP.x}
              y1={fromP.y}
              x2={footD.x}
              y2={footD.y}
              stroke={bisColor}
              strokeWidth={bisWidth}
              strokeDasharray={bisDash}
            />

            {/* Ký hiệu 2 cung góc bằng nhau */}
            {bis.showAngleMarks !== false && (
              <g>
                <path d={arc1.path} fill="none" stroke={bisColor} strokeWidth={1} />
                <path d={arc2.path} fill="none" stroke={bisColor} strokeWidth={1} />
                <circle cx={arc1.midAnglePos.x} cy={arc1.midAnglePos.y} r={1.5} fill={bisColor} />
                <circle cx={arc2.midAnglePos.x} cy={arc2.midAnglePos.y} r={1.5} fill={bisColor} />
              </g>
            )}

            {/* Điểm D và nhãn */}
            <circle cx={footD.x} cy={footD.y} r={2.5} fill={bisColor} />
            {showLabels && (
              <text
                x={dLabelPos.x}
                y={dLabelPos.y}
                textAnchor={dLabelPos.textAnchor}
                dominantBaseline={dLabelPos.dominantBaseline}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontWeight="semibold"
                fill={bisColor}
              >
                {labelD}
              </text>
            )}
          </g>
        );
      });

    // ==========================================
    // 4. ĐƯỜNG TRUNG TRỰC (Perpendicular Bisectors)
    // ==========================================
    const perpBisectors = t.perpBisectors || [];

    const renderedPerpBisectors = perpBisectors
      .filter((pb) => pb.enabled)
      .map((pb, idx) => {
        let p1 = pB;
        let p2 = pC;
        let oppP = pA;

        if (pb.side === 'AC') {
          p1 = pA;
          p2 = pC;
          oppP = pB;
        } else if (pb.side === 'AB') {
          p1 = pA;
          p2 = pB;
          oppP = pC;
        }

        const seg = perpendicularBisectorSegment(p1, p2, 70);
        const midP = seg.mid;
        const pbColor = pb.color || strokeColor;
        const pbWidth = pb.strokeWidth || 1.2;
        const pbDash = getDashArray(pb.style || 'dashed');
        const raPath = getRightAngleMarkerPath(midP, seg.start, p1, 10);
        const ticks1 = pb.showTickMarks !== false ? getSegmentTickMarks(p1, midP, 1, 8, 3) : null;
        const ticks2 = pb.showTickMarks !== false ? getSegmentTickMarks(midP, p2, 1, 8, 3) : null;

        return (
          <g key={`perpBis-${pb.side}-${idx}`} id={`perpBis-${pb.side}`}>
            {/* Đường thẳng trung trực */}
            <line
              x1={seg.start.x}
              y1={seg.start.y}
              x2={seg.end.x}
              y2={seg.end.y}
              stroke={pbColor}
              strokeWidth={pbWidth}
              strokeDasharray={pbDash}
            />

            {/* Ký hiệu vuông góc */}
            {pb.showRightAngle !== false && (
              <path d={raPath} fill="none" stroke={pbColor} strokeWidth={1} />
            )}

            {/* Ký hiệu 2 đoạn bằng nhau */}
            {Array.isArray(ticks1) &&
              ticks1.map((l, i) => (
                <line key={`pt1-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={pbColor} strokeWidth={1.2} />
              ))}
            {Array.isArray(ticks2) &&
              ticks2.map((l, i) => (
                <line key={`pt2-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={pbColor} strokeWidth={1.2} />
              ))}

            {/* Tên đường thẳng (ví dụ: d) */}
            {pb.label && (
              <text
                x={seg.start.x - 8}
                y={seg.start.y}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontWeight="semibold"
                fill={pbColor}
              >
                {pb.label}
              </text>
            )}
          </g>
        );
      });

    // ==========================================
    // 5. KÝ HIỆU GÓC VUÔNG CHÍNH CHO TAM GIÁC VUÔNG
    // ==========================================
    const isRightTriangle = t.type === 'right' || t.type === 'right-isosceles';
    let rightAngleMarkerSvg: React.ReactNode = null;

    if (t.showRightAngleMarker !== false && isRightTriangle) {
      // Tìm đỉnh có góc gần 90 độ nhất trong tam giác
      const dAB = dist(pA, pB);
      const dBC = dist(pB, pC);
      const dCA = dist(pC, pA);

      // Định lý Pytago đảo tìm cạnh huyền lớn nhất
      if (dCA >= dAB && dCA >= dBC) {
        // Vuông tại B
        const raPath = getRightAngleMarkerPath(pB, pA, pC, 12);
        rightAngleMarkerSvg = <path d={raPath} fill="none" stroke={strokeColor} strokeWidth={1.2} />;
      } else if (dBC >= dAB && dBC >= dCA) {
        // Vuông tại A
        const raPath = getRightAngleMarkerPath(pA, pB, pC, 12);
        rightAngleMarkerSvg = <path d={raPath} fill="none" stroke={strokeColor} strokeWidth={1.2} />;
      } else {
        // Vuông tại C
        const raPath = getRightAngleMarkerPath(pC, pA, pB, 12);
        rightAngleMarkerSvg = <path d={raPath} fill="none" stroke={strokeColor} strokeWidth={1.2} />;
      }
    }

    // ==========================================
    // 6. KÝ HIỆU CẠNH BẰNG NHAU (Tam giác cân / đều / vuông cân)
    // ==========================================
    let equalSideMarksSvg: React.ReactNode = null;
    const shouldShowEqualSides =
      t.showEqualSidesMarker ||
      t.type === 'isosceles' ||
      t.type === 'equilateral' ||
      t.type === 'right-isosceles';

    if (shouldShowEqualSides) {
      if (t.type === 'equilateral') {
        const tAB = getSegmentTickMarks(pA, pB, 1, 9, 3);
        const tBC = getSegmentTickMarks(pB, pC, 1, 9, 3);
        const tCA = getSegmentTickMarks(pC, pA, 1, 9, 3);
        equalSideMarksSvg = (
          <g stroke={strokeColor} strokeWidth={1.3}>
            {Array.isArray(tAB) && tAB.map((l, i) => <line key={`eqAB-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
            {Array.isArray(tBC) && tBC.map((l, i) => <line key={`eqBC-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
            {Array.isArray(tCA) && tCA.map((l, i) => <line key={`eqCA-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
          </g>
        );
      } else if (t.type === 'isosceles') {
        const tAB = getSegmentTickMarks(pA, pB, 2, 9, 3);
        const tAC = getSegmentTickMarks(pA, pC, 2, 9, 3);
        equalSideMarksSvg = (
          <g stroke={strokeColor} strokeWidth={1.3}>
            {Array.isArray(tAB) && tAB.map((l, i) => <line key={`eqAB-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
            {Array.isArray(tAC) && tAC.map((l, i) => <line key={`eqAC-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
          </g>
        );
      } else if (t.type === 'right-isosceles') {
        const tAB = getSegmentTickMarks(pA, pB, 1, 9, 3);
        const tBC = getSegmentTickMarks(pB, pC, 1, 9, 3);
        equalSideMarksSvg = (
          <g stroke={strokeColor} strokeWidth={1.3}>
            {Array.isArray(tAB) && tAB.map((l, i) => <line key={`eqAB-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
            {Array.isArray(tBC) && tBC.map((l, i) => <line key={`eqBC-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
          </g>
        );
      }
    }

    // ==========================================
    // 7. ĐỘ DÀI CẠNH (Tùy chọn)
    // ==========================================
    const sideLabels = t.sideLengthLabels || [];
    const sideLabelsSvg = t.showSideLengths && (
      <g fontSize={fontSize - 2} fontStyle="italic" fill="#334155">
        {sideLabels[0] && (
          <text
            x={(pB.x + pC.x) / 2}
            y={(pB.y + pC.y) / 2 + 15}
            textAnchor="middle"
          >
            {sideLabels[0]}
          </text>
        )}
        {sideLabels[1] && (
          <text
            x={(pA.x + pC.x) / 2 + 12}
            y={(pA.y + pC.y) / 2}
            textAnchor="start"
          >
            {sideLabels[1]}
          </text>
        )}
        {sideLabels[2] && (
          <text
            x={(pA.x + pB.x) / 2 - 12}
            y={(pA.y + pB.y) / 2}
            textAnchor="end"
          >
            {sideLabels[2]}
          </text>
        )}
      </g>
    );

    // ==========================================
    // 7. ĐƯỜNG TRÒN NGOẠI TIẾP VÀ NỘI TIẾP TAM GIÁC (TOOL 2)
    // ==========================================
    const circumcircleData = getTriangleCircumcircle(pA, pB, pC);
    const pCircumO = circumcircleData.center;
    const circumR = circumcircleData.radius;
    let circumcircleSvg: React.ReactNode = null;

    if (t.circumscribedCircle?.enabled) {
      const cColor = t.circumscribedCircle.color || '#2563eb';
      const cDash = getDashArray(t.circumscribedCircle.style || 'solid');
      const cWidth = (t.circumscribedCircle as any)?.strokeWidth || 1.3;
      const centerName = t.circumscribedCircle.centerName || 'O';
      const oLabelPos = getSmartVertexLabelPosition(pCircumO, pA, pB, 15);
      const showRadii = t.circumscribedCircle.showRadii;

      circumcircleSvg = (
        <g id="triangle-circumscribed-circle">
          <circle
            cx={pCircumO.x}
            cy={pCircumO.y}
            r={circumR}
            fill="none"
            stroke={cColor}
            strokeWidth={cWidth}
            strokeDasharray={cDash}
          />
          {t.circumscribedCircle.showCenter !== false && (
            <g>
              <circle cx={pCircumO.x} cy={pCircumO.y} r={3} fill={cColor} />
              {showLabels && (
                <text
                  x={oLabelPos.x}
                  y={oLabelPos.y}
                  textAnchor={oLabelPos.textAnchor}
                  dominantBaseline={oLabelPos.dominantBaseline}
                  fontSize={fontSize - 1}
                  fontStyle="italic"
                  fontWeight="bold"
                  fill={cColor}
                  fontFamily={fontFamily}
                >
                  {centerName}
                </text>
              )}
            </g>
          )}
          {showRadii && (
            <g stroke={cColor} strokeWidth={1} strokeDasharray="3 3">
              <line x1={pCircumO.x} y1={pCircumO.y} x2={pA.x} y2={pA.y} />
              <line x1={pCircumO.x} y1={pCircumO.y} x2={pB.x} y2={pB.y} />
              <line x1={pCircumO.x} y1={pCircumO.y} x2={pC.x} y2={pC.y} />
            </g>
          )}
        </g>
      );
    }

    const incircleData = getTriangleIncircle(pA, pB, pC);
    const pIncenterI = incircleData.center;
    const inR = incircleData.radius;
    const { onBC: pD_incircle, onCA: pE_incircle, onAB: pF_incircle } = incircleData.contactPoints;
    let incircleSvg: React.ReactNode = null;

    if (t.inscribedCircle?.enabled) {
      const iColor = t.inscribedCircle.color || '#ea580c';
      const iDash = getDashArray(t.inscribedCircle.style || 'solid');
      const iWidth = (t.inscribedCircle as any)?.strokeWidth || 1.3;
      const centerName = t.inscribedCircle.centerName || 'I';
      const iLabelPos = getSmartVertexLabelPosition(pIncenterI, pA, pB, 15);
      const showRadii = t.inscribedCircle.showRadii !== false;
      const showContactLabels = (t.inscribedCircle as any)?.showContactPoints !== false;

      const raD = getRightAngleMarkerPath(pD_incircle, pIncenterI, pC, 8);
      const raE = getRightAngleMarkerPath(pE_incircle, pIncenterI, pA, 8);
      const raF = getRightAngleMarkerPath(pF_incircle, pIncenterI, pB, 8);

      incircleSvg = (
        <g id="triangle-inscribed-circle">
          <circle
            cx={pIncenterI.x}
            cy={pIncenterI.y}
            r={inR}
            fill="none"
            stroke={iColor}
            strokeWidth={iWidth}
            strokeDasharray={iDash}
          />
          {t.inscribedCircle.showCenter !== false && (
            <g>
              <circle cx={pIncenterI.x} cy={pIncenterI.y} r={3} fill={iColor} />
              {showLabels && (
                <text
                  x={iLabelPos.x}
                  y={iLabelPos.y}
                  textAnchor={iLabelPos.textAnchor}
                  dominantBaseline={iLabelPos.dominantBaseline}
                  fontSize={fontSize - 1}
                  fontStyle="italic"
                  fontWeight="bold"
                  fill={iColor}
                  fontFamily={fontFamily}
                >
                  {centerName}
                </text>
              )}
            </g>
          )}
          {showRadii && (
            <g>
              <line x1={pIncenterI.x} y1={pIncenterI.y} x2={pD_incircle.x} y2={pD_incircle.y} stroke={iColor} strokeWidth={1.1} strokeDasharray="3 3" />
              <line x1={pIncenterI.x} y1={pIncenterI.y} x2={pE_incircle.x} y2={pE_incircle.y} stroke={iColor} strokeWidth={1.1} strokeDasharray="3 3" />
              <line x1={pIncenterI.x} y1={pIncenterI.y} x2={pF_incircle.x} y2={pF_incircle.y} stroke={iColor} strokeWidth={1.1} strokeDasharray="3 3" />
              <path d={raD} fill="none" stroke={iColor} strokeWidth={1} />
              <path d={raE} fill="none" stroke={iColor} strokeWidth={1} />
              <path d={raF} fill="none" stroke={iColor} strokeWidth={1} />
            </g>
          )}
          {showContactLabels && (
            <g>
              <circle cx={pD_incircle.x} cy={pD_incircle.y} r={2.5} fill={iColor} />
              <circle cx={pE_incircle.x} cy={pE_incircle.y} r={2.5} fill={iColor} />
              <circle cx={pF_incircle.x} cy={pF_incircle.y} r={2.5} fill={iColor} />
              <text x={pD_incircle.x - 4} y={pD_incircle.y + 14} fontSize={fontSize - 2} fontStyle="italic" fontWeight="bold" fill={iColor} fontFamily={fontFamily}>D</text>
              <text x={pE_incircle.x + 8} y={pE_incircle.y} fontSize={fontSize - 2} fontStyle="italic" fontWeight="bold" fill={iColor} fontFamily={fontFamily}>E</text>
              <text x={pF_incircle.x - 14} y={pF_incircle.y} fontSize={fontSize - 2} fontStyle="italic" fontWeight="bold" fill={iColor} fontFamily={fontFamily}>F</text>
            </g>
          )}
        </g>
      );
    }

    // ==========================================
    // 8. NHÓM 2 - CÔNG CỤ 1: ĐỊNH LÝ TA-LÉT (ĐƯỜNG THẲNG SONG SONG CẮT 2 CẠNH)
    // ==========================================
    let thalesSvg: React.ReactNode = null;
    let pM_thales: Point2D | undefined;
    let pN_thales: Point2D | undefined;

    if (t.thales?.enabled) {
      const thalesConfig = t.thales;
      const cutSide = thalesConfig.cutSide || 'AB-AC';
      const thalesResult = getThalesPoints(trianglePoints, thalesConfig.ratio ?? 0.4, cutSide, vNames);
      const { M, N, A: topV, B: leftV, C: rightV, ratio: thalesRatio, extensionM, extensionN } = thalesResult;
      pM_thales = M;
      pN_thales = N;
      const mName = thalesConfig.pointMName || 'M';
      const nName = thalesConfig.pointNName || 'N';

      const thalesLineColor = thalesConfig.lineStyle?.strokeColor || '#2563eb';
      const thalesLineWidth = thalesConfig.lineStyle?.strokeWidth || 1.6;
      const thalesDash = getDashArray(thalesConfig.lineStyle?.strokeStyle || 'solid');

      const mLabelPos = getSmartVertexLabelPosition(M, leftV, topV, 16);
      const nLabelPos = getSmartVertexLabelPosition(N, rightV, topV, 16);

      // Ký hiệu song song mũi tên trên MN và BC
      const arrowCount = thalesConfig.parallelMarkerType === 2 ? 2 : 1;
      const arrowsMN = getParallelArrowsPath(M, N, arrowCount, 8);
      const arrowsBC = getParallelArrowsPath(leftV, rightV, arrowCount, 8);

      thalesSvg = (
        <g id="thales-parallel-cut">
          {/* Highlight tam giác đồng dạng AMN */}
          {thalesConfig.showFillTriangle && (
            <polygon
              points={`${topV.x},${topV.y} ${M.x},${M.y} ${N.x},${N.y}`}
              fill={thalesConfig.fillColor || '#38bdf8'}
              fillOpacity={thalesConfig.fillOpacity ?? 0.25}
              stroke="none"
            />
          )}

          {/* Đường kéo dài nét đứt qua M và N */}
          {thalesConfig.showDashedExtensions && extensionM && extensionN && (
            <line
              x1={extensionM.x}
              y1={extensionM.y}
              x2={extensionN.x}
              y2={extensionN.y}
              stroke={thalesLineColor}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {/* Đoạn thẳng song song MN */}
          <line
            x1={M.x}
            y1={M.y}
            x2={N.x}
            y2={N.y}
            stroke={thalesLineColor}
            strokeWidth={thalesLineWidth}
            strokeDasharray={thalesDash}
            strokeLinecap="round"
          />

          {/* Ký hiệu mũi tên song song MN // BC */}
          {thalesConfig.showParallelMarkers !== false && (
            <g stroke={thalesLineColor} strokeWidth={1.3} fill="none">
              <path d={arrowsMN} />
              <path d={arrowsBC} />
            </g>
          )}

          {/* Điểm N (tính tự động theo tỉ lệ Ta-lét) */}
          {thalesConfig.showPoints !== false && (
            <circle cx={N.x} cy={N.y} r={3} fill={thalesLineColor} />
          )}

          {/* Điểm M (Có thể kéo trượt mượt mà trên cạnh) */}
          {thalesConfig.showPoints !== false && (
            <g className="cursor-grab active:cursor-grabbing" title="Kéo điểm M trượt trên cạnh tam giác">
              <circle
                cx={M.x}
                cy={M.y}
                r={14}
                fill="transparent"
                onPointerDown={(e) => handlePointerDown(10, e)}
              />
              <circle cx={M.x} cy={M.y} r={draggingVertex === 10 ? 4.5 : 3.5} fill={thalesLineColor} />
            </g>
          )}

          {/* Nhãn điểm M và N */}
          {thalesConfig.showLabels !== false && showLabels && (
            <g fontStyle="italic" fontWeight="bold" fontSize={fontSize - 1} fill={thalesLineColor} fontFamily={fontFamily}>
              <text x={mLabelPos.x} y={mLabelPos.y} textAnchor={mLabelPos.textAnchor} dominantBaseline={mLabelPos.dominantBaseline}>
                {mName}
              </text>
              <text x={nLabelPos.x} y={nLabelPos.y} textAnchor={nLabelPos.textAnchor} dominantBaseline={nLabelPos.dominantBaseline}>
                {nName}
              </text>
            </g>
          )}

          {/* Bảng tỉ lệ Ta-lét sư phạm (tùy chọn) */}
          {thalesConfig.showRatiosText && (
            <g id="thales-ratio-badge">
              <rect
                x={20}
                y={height - 48}
                width={270}
                height={34}
                rx={6}
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              <text
                x={155}
                y={height - 26}
                textAnchor="middle"
                fontSize={fontSize - 2}
                fontWeight="semibold"
                fill="#1e293b"
                fontFamily={fontFamily}
              >
                {`Ta-lét: ${mName}${nameA}/${nameA}${nameB} = ${nName}${nameA}/${nameA}${nameC} = ${mName}${nName}/${nameB}${nameC}`}
              </text>
            </g>
          )}
        </g>
      );
    }

    // Chân đường cao/trung tuyến/phân giác là gốc cho các phép dựng nhiều bước.
    const auxiliaryAnchors: Record<string, Point2D> = {};
    const opposite = (vertex: string): [Point2D, Point2D, Point2D] => {
      if (vertex === nameB || vertex === 'B') return [pB, pA, pC];
      if (vertex === nameC || vertex === 'C') return [pC, pA, pB];
      return [pA, pB, pC];
    };
    for (const alt of altitudes) {
      if (!alt.enabled) continue;
      const [from, side1, side2] = opposite(alt.fromVertex);
      const label = alt.label || (alt.fromVertex === 'B' ? 'K' : alt.fromVertex === 'C' ? 'L' : 'H');
      auxiliaryAnchors[label] = projectPointToLine(from, side1, side2).point;
    }
    for (const med of medians) {
      if (!med.enabled) continue;
      const [, side1, side2] = opposite(med.fromVertex);
      const label = med.label || (med.fromVertex === 'B' ? 'N' : med.fromVertex === 'C' ? 'P' : 'M');
      auxiliaryAnchors[label] = midpoint(side1, side2);
    }
    for (const bis of bisectors) {
      if (!bis.enabled) continue;
      const [from, side1, side2] = opposite(bis.fromVertex);
      const label = bis.label || (bis.fromVertex === 'B' ? 'E' : bis.fromVertex === 'C' ? 'F' : 'D');
      auxiliaryAnchors[label] = angleBisectorPoint(from, side1, side2);
    }
    if (!auxiliaryAnchors['G']) {
      auxiliaryAnchors['G'] = { x: (pA.x + pB.x + pC.x) / 3, y: (pA.y + pB.y + pC.y) / 3 };
    }
    if (!auxiliaryAnchors['H']) {
      const vBC = { x: pC.x - pB.x, y: pC.y - pB.y };
      const d1 = { x: -vBC.y, y: vBC.x };
      const vAC = { x: pC.x - pA.x, y: pC.y - pA.y };
      const d2 = { x: -vAC.y, y: vAC.x };
      const ortho = lineIntersection(pA, { x: pA.x + d1.x, y: pA.y + d1.y }, pB, { x: pB.x + d2.x, y: pB.y + d2.y });
      if (ortho) auxiliaryAnchors['H'] = ortho;
    }

    return (
      <g id="triangle-group">
        {/* 0. TÔ MIỀN BÊN TRONG TAM GIÁC (Tùy chỉnh độc lập) */}
        {t.fill?.enabled && (
          <polygon
            id="triangle-fill-region"
            points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
            fill={t.fill.color || '#3b82f6'}
            fillOpacity={t.fill.opacity !== undefined ? t.fill.opacity : 0.25}
            stroke="none"
          />
        )}

        {/* 1. Các đường phụ và đường tròn ngoại tiếp/nội tiếp (vẽ dưới cạnh chính) */}
        {circumcircleSvg}
        {incircleSvg}
        {thalesSvg}
        {renderedAltitudes}
        {renderedMedians}
        {renderedBisectors}
        {renderedPerpBisectors}

        {/* 2. BA CẠNH CHÍNH CỦA TAM GIÁC (Tùy chỉnh độc lập từng cạnh) */}
        <g id="triangle-edges">
          {/* Cạnh AB */}
          <line
            id="edge-AB"
            x1={pA.x}
            y1={pA.y}
            x2={pB.x}
            y2={pB.y}
            stroke={colorAB}
            strokeWidth={widthAB}
            strokeDasharray={dashAB}
            strokeLinecap="round"
          />
          {/* Cạnh BC */}
          <line
            id="edge-BC"
            x1={pB.x}
            y1={pB.y}
            x2={pC.x}
            y2={pC.y}
            stroke={colorBC}
            strokeWidth={widthBC}
            strokeDasharray={dashBC}
            strokeLinecap="round"
          />
          {/* Cạnh CA */}
          <line
            id="edge-CA"
            x1={pC.x}
            y1={pC.y}
            x2={pA.x}
            y2={pA.y}
            stroke={colorCA}
            strokeWidth={widthCA}
            strokeDasharray={dashCA}
            strokeLinecap="round"
          />
        </g>

        {/* 3. Ký hiệu góc vuông & cạnh bằng nhau & độ dài */}
        {rightAngleMarkerSvg}
        {equalSideMarksSvg}
        {sideLabelsSvg}

        {/* 4. Đỉnh và tương tác kéo thả (Tùy chỉnh màu/kích thước từng điểm) */}
        {showVertices && (
          <g id="vertices-group">
            {[
              { pt: pA, name: 'A', style: vStyleA },
              { pt: pB, name: 'B', style: vStyleB },
              { pt: pC, name: 'C', style: vStyleC },
            ].map(({ pt, name, style }, idx) => {
              if (style.show === false) return null;
              const ptColor = style.color || strokeColor;
              const ptSize = style.size || (draggingVertex === idx ? 4.5 : 3);

              return (
                <g key={`vertex-${name}`} className="cursor-grab active:cursor-grabbing">
                  {/* Vùng cảm ứng lớn hơn để dễ kéo bằng chuột/cảm ứng */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={14}
                    fill="transparent"
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                  />
                  {/* Điểm hiển thị */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={ptSize}
                    fill={ptColor}
                    className="transition-transform duration-75"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 5. Tên các đỉnh (A, B, C) (Tùy chỉnh màu/kích thước từng chữ) */}
        {showLabels && (
          <g id="vertex-labels" fontStyle="italic" fontWeight="bold">
            {lStyleA.show !== false && (
              <text
                x={labelA.x}
                y={labelA.y}
                textAnchor={labelA.textAnchor}
                dominantBaseline={labelA.dominantBaseline}
                fontSize={lStyleA.fontSize || fontSize}
                fill={lStyleA.color || strokeColor}
              >
                {nameA}
              </text>
            )}
            {lStyleB.show !== false && (
              <text
                x={labelB.x}
                y={labelB.y}
                textAnchor={labelB.textAnchor}
                dominantBaseline={labelB.dominantBaseline}
                fontSize={lStyleB.fontSize || fontSize}
                fill={lStyleB.color || strokeColor}
              >
                {nameB}
              </text>
            )}
            {lStyleC.show !== false && (
              <text
                x={labelC.x}
                y={labelC.y}
                textAnchor={labelC.textAnchor}
                dominantBaseline={labelC.dominantBaseline}
                fontSize={lStyleC.fontSize || fontSize}
                fill={lStyleC.color || strokeColor}
              >
                {nameC}
              </text>
            )}
          </g>
        )}

        {/* 6. Các đường phụ và ký hiệu hình học tự do (Giai đoạn 3.2) */}
        {renderAuxiliaryElements(
          {
            A: pA,
            B: pB,
            C: pC,
            [nameA]: pA,
            [nameB]: pB,
            [nameC]: pC,
            O: pCircumO,
            I: pIncenterI,
            D: pD_incircle,
            E: pE_incircle,
            F: pF_incircle,
            M: pM_thales || midpoint(pA, pB),
            N: pN_thales || midpoint(pA, pC),
            AB: midpoint(pA, pB),
            BC: midpoint(pB, pC),
            CA: midpoint(pC, pA),
            AC: midpoint(pA, pC),
            ...auxiliaryAnchors,
          },
          t
        )}
        {data && (data as any) !== t && (data.auxLines?.length || data.auxPoints?.length || data.rightAngleMarkers?.length || data.parallelMarkers?.length || data.equalSidesMarkers?.length || data.equalAnglesMarkers?.length) ? (
          renderAuxiliaryElements(
            {
              A: pA,
              B: pB,
              C: pC,
              [nameA]: pA,
              [nameB]: pB,
              [nameC]: pC,
              O: pCircumO,
              I: pIncenterI,
              D: pD_incircle,
              E: pE_incircle,
              F: pF_incircle,
              M: pM_thales || midpoint(pA, pB),
              N: pN_thales || midpoint(pA, pC),
              AB: midpoint(pA, pB),
              BC: midpoint(pB, pC),
              CA: midpoint(pC, pA),
              AC: midpoint(pA, pC),
              ...auxiliaryAnchors,
            },
            data
          )
        ) : null}
      </g>
    );
  };

  // Render Tứ giác SGK nâng cao
  const renderQuadrilateral = () => {
    const q: QuadData = quadrilateral || {
      type: 'rectangle',
      vertexNames: ['A', 'B', 'C', 'D'],
    };

    const [pA, pB, pC, pD] = quadPoints;
    const vNames = q.vertexNames || ['A', 'B', 'C', 'D'];
    const nameA = vNames[0] || 'A';
    const nameB = vNames[1] || 'B';
    const nameC = vNames[2] || 'C';
    const nameD = vNames[3] || 'D';

    const showLabels = q.showLabels !== false;
    const showVertices = q.showVertices !== false;

    // Style từng cạnh (nếu không có thì dùng strokeColor / strokeWidth mặc định)
    const styleAB = q.edgeStyles?.AB || {};
    const styleBC = q.edgeStyles?.BC || {};
    const styleCD = q.edgeStyles?.CD || {};
    const styleDA = q.edgeStyles?.DA || {};

    const colorAB = styleAB.strokeColor || strokeColor;
    const widthAB = styleAB.strokeWidth || strokeWidth;
    const dashAB = getDashArray(styleAB.strokeStyle);

    const colorBC = styleBC.strokeColor || strokeColor;
    const widthBC = styleBC.strokeWidth || strokeWidth;
    const dashBC = getDashArray(styleBC.strokeStyle);

    const colorCD = styleCD.strokeColor || strokeColor;
    const widthCD = styleCD.strokeWidth || strokeWidth;
    const dashCD = getDashArray(styleCD.strokeStyle);

    const colorDA = styleDA.strokeColor || strokeColor;
    const widthDA = styleDA.strokeWidth || strokeWidth;
    const dashDA = getDashArray(styleDA.strokeStyle);

    // Style từng đỉnh
    const vStyleA = q.vertexStyles?.A || {};
    const vStyleB = q.vertexStyles?.B || {};
    const vStyleC = q.vertexStyles?.C || {};
    const vStyleD = q.vertexStyles?.D || {};

    // Style từng nhãn chữ
    const lStyleA = q.labelStyles?.A || {};
    const lStyleB = q.labelStyles?.B || {};
    const lStyleC = q.labelStyles?.C || {};
    const lStyleD = q.labelStyles?.D || {};

    // Vị trí nhãn đỉnh thông minh (hướng ra ngoài tứ giác)
    const labelA = getSmartVertexLabelPosition(pA, pD, pB, 20);
    const labelB = getSmartVertexLabelPosition(pB, pA, pC, 20);
    const labelC = getSmartVertexLabelPosition(pC, pB, pD, 20);
    const labelD = getSmartVertexLabelPosition(pD, pC, pA, 20);

    // ==========================================
    // 1. TÔ MIỀN TỨ GIÁC (Fill)
    // ==========================================
    const fillConfig = q.fill;

    // ==========================================
    // 2. ĐƯỜNG CAO ĐÁY (Altitudes)
    // ==========================================
    const altitudes = q.altitudes || [];
    const renderedAltitudes = altitudes
      .filter((alt) => alt.enabled)
      .map((alt, idx) => {
        const fromP = alt.fromVertex === 'B' ? pB : pA;
        const fromName = alt.fromVertex === 'B' ? nameB : nameA;
        const proj = projectPointToLine(fromP, pD, pC);
        const footP = proj.point;
        const altLabel = alt.label || (alt.fromVertex === 'B' ? 'K' : 'H');
        const altColor = alt.color || strokeColor;
        const altWidth = alt.strokeWidth || 1.2;
        const altDash = getDashArray(alt.style || 'dashed');
        const showRA = alt.showRightAngle !== false;

        const rightAnglePath = showRA ? getRightAngleMarkerPath(footP, fromP, pC, 9) : null;
        const labelFootPos = getSmartVertexLabelPosition(footP, fromP, pC, 16);

        return (
          <g key={`quad-alt-${idx}`}>
            <line
              x1={fromP.x}
              y1={fromP.y}
              x2={footP.x}
              y2={footP.y}
              stroke={altColor}
              strokeWidth={altWidth}
              strokeDasharray={altDash}
              strokeLinecap="round"
            />
            {rightAnglePath && (
              <path d={rightAnglePath} fill="none" stroke={altColor} strokeWidth={1} />
            )}
            <circle cx={footP.x} cy={footP.y} r={2.5} fill={altColor} />
            <text
              x={labelFootPos.x}
              y={labelFootPos.y}
              textAnchor={labelFootPos.textAnchor}
              dominantBaseline={labelFootPos.dominantBaseline}
              fontSize={fontSize}
              fontStyle="italic"
              fontWeight="bold"
              fill={altColor}
              fontFamily={fontFamily}
            >
              {altLabel}
            </text>
          </g>
        );
      });

    // ==========================================
    // 3. ĐƯỜNG CHÉO & GIAO ĐIỂM (Diagonals AC, BD & O)
    // ==========================================
    const diagonals = q.diagonals;
    const diagAC = diagonals?.AC;
    const diagBD = diagonals?.BD;
    const showDiagAC = diagAC?.enabled || q.showDiagonals;
    const showDiagBD = diagBD?.enabled || q.showDiagonals;

    const intersectionP = lineIntersection(pA, pC, pB, pD);
    const showIntersection = diagonals?.showIntersection && intersectionP;
    const intersectionLabel = diagonals?.intersectionLabel || 'O';
    const labelIntersectionPos = intersectionP
      ? getSmartVertexLabelPosition(intersectionP, pA, pB, 15)
      : null;

    // ==========================================
    // 4. KÝ HIỆU GÓC VUÔNG (Right Angles)
    // ==========================================
    const showRightAngles = q.showRightAngleMarkers !== false;
    const isRect = q.type === 'rectangle';
    const isSquare = q.type === 'square';
    const isRightTrap = q.type === 'right-trapezoid';

    const rightAnglePaths: string[] = [];
    if (showRightAngles) {
      if (isRect || isSquare) {
        rightAnglePaths.push(getRightAngleMarkerPath(pA, pD, pB, 10));
        rightAnglePaths.push(getRightAngleMarkerPath(pB, pA, pC, 10));
        rightAnglePaths.push(getRightAngleMarkerPath(pC, pB, pD, 10));
        rightAnglePaths.push(getRightAngleMarkerPath(pD, pC, pA, 10));
      } else if (isRightTrap) {
        rightAnglePaths.push(getRightAngleMarkerPath(pA, pD, pB, 10));
        rightAnglePaths.push(getRightAngleMarkerPath(pD, pC, pA, 10));
      }
    }

    // ==========================================
    // 5. KÝ HIỆU CẠNH BẰNG NHAU (Tick Marks)
    // ==========================================
    const showEqualMarks = q.showEqualSidesMarkers !== false;
    const equalMarkElements: React.ReactNode[] = [];

    if (showEqualMarks) {
      if (q.type === 'square' || q.type === 'rhombus') {
        // 4 cạnh bằng nhau (1 gạch mỗi cạnh)
        [
          [pA, pB],
          [pB, pC],
          [pC, pD],
          [pD, pA],
        ].forEach(([p1, p2], i) => {
          const ticks = getSegmentTickMarks(p1, p2, 1, 9, 3);
          if (Array.isArray(ticks)) {
            ticks.forEach((line, j) => {
              equalMarkElements.push(
                <line
                  key={`eq-all-${i}-${j}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={strokeColor}
                  strokeWidth={1.2}
                />
              );
            });
          }
        });
      } else if (q.type === 'isosceles-trapezoid') {
        // 2 cạnh bên bằng nhau AD = BC (1 gạch)
        [
          [pD, pA],
          [pC, pB],
        ].forEach(([p1, p2], i) => {
          const ticks = getSegmentTickMarks(p1, p2, 1, 9, 3);
          if (Array.isArray(ticks)) {
            ticks.forEach((line, j) => {
              equalMarkElements.push(
                <line
                  key={`eq-trap-${i}-${j}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={strokeColor}
                  strokeWidth={1.2}
                />
              );
            });
          }
        });
      } else if (q.type === 'parallelogram' || q.type === 'rectangle') {
        // AB = CD (2 gạch), AD = BC (1 gạch)
        [
          [pA, pB],
          [pD, pC],
        ].forEach(([p1, p2], i) => {
          const ticks = getSegmentTickMarks(p1, p2, 2, 9, 3);
          if (Array.isArray(ticks)) {
            ticks.forEach((line, j) => {
              equalMarkElements.push(
                <line
                  key={`eq-opp1-${i}-${j}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={strokeColor}
                  strokeWidth={1.2}
                />
              );
            });
          }
        });
        [
          [pD, pA],
          [pC, pB],
        ].forEach(([p1, p2], i) => {
          const ticks = getSegmentTickMarks(p1, p2, 1, 9, 3);
          if (Array.isArray(ticks)) {
            ticks.forEach((line, j) => {
              equalMarkElements.push(
                <line
                  key={`eq-opp2-${i}-${j}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={strokeColor}
                  strokeWidth={1.2}
                />
              );
            });
          }
        });
      }
    }

    // ==========================================
    // 6. KÝ HIỆU SONG SONG (Parallel Arrows)
    // ==========================================
    const showParallel = q.showParallelMarkers !== false;
    const parallelArrowPaths: string[] = [];

    if (showParallel) {
      const isTrapezoidFamily =
        q.type === 'trapezoid' ||
        q.type === 'right-trapezoid' ||
        q.type === 'isosceles-trapezoid';
      const isParallelogramFamily =
        q.type === 'parallelogram' ||
        q.type === 'rectangle' ||
        q.type === 'rhombus' ||
        q.type === 'square';

      if (isTrapezoidFamily || isParallelogramFamily) {
        // Đáy trên AB và đáy dưới DC song song (1 mũi tên >)
        parallelArrowPaths.push(getParallelArrowsPath(pA, pB, 1, 7));
        parallelArrowPaths.push(getParallelArrowsPath(pD, pC, 1, 7));
      }

      if (isParallelogramFamily) {
        // Cạnh bên DA và CB song song (2 mũi tên >>)
        parallelArrowPaths.push(getParallelArrowsPath(pD, pA, 2, 7));
        parallelArrowPaths.push(getParallelArrowsPath(pC, pB, 2, 7));
      }
    }

    // ==========================================
    // 7. NHÃN ĐỘ DÀI CẠNH (Side Lengths)
    // ==========================================
    const sideLabels = q.sideLengthLabels || ['', '', '', ''];
    const showSideLengths = q.showSideLengths && sideLabels.some((l) => l.trim() !== '');

    // ==========================================
    // 8. ĐƯỜNG TRÒN NGOẠI TIẾP TỨ GIÁC NỘI TIẾP (TOOL 1)
    // ==========================================
    const isCyclic = q.type === 'cyclic';
    const showCircumcircle = isCyclic || q.showCircumcircle;
    let circumcircleNode: React.ReactNode = null;
    let circumCenterP: Point2D | null = null;

    if (showCircumcircle) {
      const circum = getTriangleCircumcircle(pA, pB, pC);
      circumCenterP = circum.center;
      const cR = circum.radius;
      const cColor = q.circumcircleColor || '#2563eb';
      const cDash = getDashArray(q.circumcircleStyle || 'dashed');
      const cWidth = q.circumcircleStrokeWidth || 1.3;
      const cName = q.circumcircleCenterName || 'O';
      const oLabelPos = getSmartVertexLabelPosition(circumCenterP, pA, pB, 15);

      circumcircleNode = (
        <g id="quad-circumcircle">
          <circle
            cx={circumCenterP.x}
            cy={circumCenterP.y}
            r={cR}
            fill="none"
            stroke={cColor}
            strokeWidth={cWidth}
            strokeDasharray={cDash}
          />
          {q.showCircumcircleCenter !== false && (
            <g>
              <circle cx={circumCenterP.x} cy={circumCenterP.y} r={3} fill={cColor} />
              {showLabels && (
                <text
                  x={oLabelPos.x}
                  y={oLabelPos.y}
                  textAnchor={oLabelPos.textAnchor}
                  dominantBaseline={oLabelPos.dominantBaseline}
                  fontSize={fontSize - 1}
                  fontStyle="italic"
                  fontWeight="bold"
                  fill={cColor}
                  fontFamily={fontFamily}
                >
                  {cName}
                </text>
              )}
            </g>
          )}
          {q.showCircumcircleRadii && (
            <g stroke={cColor} strokeWidth={1} strokeDasharray="3 3">
              <line x1={circumCenterP.x} y1={circumCenterP.y} x2={pA.x} y2={pA.y} />
              <line x1={circumCenterP.x} y1={circumCenterP.y} x2={pB.x} y2={pB.y} />
              <line x1={circumCenterP.x} y1={circumCenterP.y} x2={pC.x} y2={pC.y} />
              <line x1={circumCenterP.x} y1={circumCenterP.y} x2={pD.x} y2={pD.y} />
            </g>
          )}
        </g>
      );
    }

    return (
      <g id="quadrilateral-group">
        {/* A. Miền bên trong (Tô màu & Độ trong suốt) */}
        {fillConfig?.enabled && (
          <polygon
            points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`}
            fill={fillConfig.color || '#3b82f6'}
            fillOpacity={fillConfig.opacity ?? 0.25}
            stroke="none"
          />
        )}

        {/* B. Đường tròn ngoại tiếp tứ giác nội tiếp */}
        {circumcircleNode}

        {/* C. Đường cao đáy */}
        {renderedAltitudes}

        {/* C. Đường chéo AC, BD */}
        {showDiagAC && (
          <line
            x1={pA.x}
            y1={pA.y}
            x2={pC.x}
            y2={pC.y}
            stroke={diagAC?.color || '#64748b'}
            strokeWidth={diagAC?.strokeWidth || 1.2}
            strokeDasharray={getDashArray(diagAC?.style || 'dashed')}
            strokeLinecap="round"
          />
        )}
        {showDiagBD && (
          <line
            x1={pB.x}
            y1={pB.y}
            x2={pD.x}
            y2={pD.y}
            stroke={diagBD?.color || '#64748b'}
            strokeWidth={diagBD?.strokeWidth || 1.2}
            strokeDasharray={getDashArray(diagBD?.style || 'dashed')}
            strokeLinecap="round"
          />
        )}

        {/* Giao điểm 2 đường chéo O */}
        {showIntersection && labelIntersectionPos && (
          <g>
            <circle cx={intersectionP.x} cy={intersectionP.y} r={2.8} fill={strokeColor} />
            <text
              x={labelIntersectionPos.x}
              y={labelIntersectionPos.y}
              textAnchor={labelIntersectionPos.textAnchor}
              dominantBaseline={labelIntersectionPos.dominantBaseline}
              fontSize={fontSize}
              fontStyle="italic"
              fontWeight="bold"
              fill={strokeColor}
              fontFamily={fontFamily}
            >
              {intersectionLabel}
            </text>
          </g>
        )}

        {/* D. Ký hiệu góc vuông */}
        {rightAnglePaths.map((pathStr, i) => (
          <path key={`ra-path-${i}`} d={pathStr} fill="none" stroke={strokeColor} strokeWidth={1} />
        ))}

        {/* E. Ký hiệu cạnh bằng nhau */}
        {equalMarkElements}

        {/* F. Ký hiệu mũi tên song song */}
        {parallelArrowPaths.map((pStr, i) => (
          <path
            key={`par-path-${i}`}
            d={pStr}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* G. 4 CẠNH ĐỘC LẬP (AB, BC, CD, DA) */}
        {/* Cạnh AB */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pB.x}
          y2={pB.y}
          stroke={colorAB}
          strokeWidth={widthAB}
          strokeDasharray={dashAB}
          strokeLinecap="round"
        />
        {/* Cạnh BC */}
        <line
          x1={pB.x}
          y1={pB.y}
          x2={pC.x}
          y2={pC.y}
          stroke={colorBC}
          strokeWidth={widthBC}
          strokeDasharray={dashBC}
          strokeLinecap="round"
        />
        {/* Cạnh CD */}
        <line
          x1={pC.x}
          y1={pC.y}
          x2={pD.x}
          y2={pD.y}
          stroke={colorCD}
          strokeWidth={widthCD}
          strokeDasharray={dashCD}
          strokeLinecap="round"
        />
        {/* Cạnh DA */}
        <line
          x1={pD.x}
          y1={pD.y}
          x2={pA.x}
          y2={pA.y}
          stroke={colorDA}
          strokeWidth={widthDA}
          strokeDasharray={dashDA}
          strokeLinecap="round"
        />

        {/* H. Nhãn độ dài cạnh */}
        {showSideLengths && (
          <g>
            {sideLabels[0] && (
              <text
                x={(pA.x + pB.x) / 2}
                y={Math.min(pA.y, pB.y) - 8}
                textAnchor="middle"
                fontSize={fontSize - 1}
                fontStyle="italic"
                fill={strokeColor}
                fontFamily={fontFamily}
              >
                {sideLabels[0]}
              </text>
            )}
            {sideLabels[1] && (
              <text
                x={Math.max(pB.x, pC.x) + 10}
                y={(pB.y + pC.y) / 2}
                textAnchor="start"
                dominantBaseline="central"
                fontSize={fontSize - 1}
                fontStyle="italic"
                fill={strokeColor}
                fontFamily={fontFamily}
              >
                {sideLabels[1]}
              </text>
            )}
            {sideLabels[2] && (
              <text
                x={(pC.x + pD.x) / 2}
                y={Math.max(pC.y, pD.y) + 15}
                textAnchor="middle"
                fontSize={fontSize - 1}
                fontStyle="italic"
                fill={strokeColor}
                fontFamily={fontFamily}
              >
                {sideLabels[2]}
              </text>
            )}
            {sideLabels[3] && (
              <text
                x={Math.min(pD.x, pA.x) - 10}
                y={(pD.y + pA.y) / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={fontSize - 1}
                fontStyle="italic"
                fill={strokeColor}
                fontFamily={fontFamily}
              >
                {sideLabels[3]}
              </text>
            )}
          </g>
        )}

        {/* I. Đỉnh và Nhãn đỉnh (A, B, C, D) */}
        {/* Đỉnh A */}
        <g
          id="vertex-A-group"
          className="cursor-move group"
          onPointerDown={(e) => handlePointerDown(0, e)}
        >
          <circle cx={pA.x} cy={pA.y} r={14} fill="transparent" />
          {showVertices && vStyleA.show !== false && (
            <circle
              cx={pA.x}
              cy={pA.y}
              r={vStyleA.size || 2.8}
              fill={vStyleA.color || strokeColor}
              className="group-hover:stroke-blue-500 group-hover:stroke-2 transition"
            />
          )}
          {showLabels && lStyleA.show !== false && (
            <text
              x={labelA.x}
              y={labelA.y}
              textAnchor={labelA.textAnchor}
              dominantBaseline={labelA.dominantBaseline}
              fontSize={lStyleA.fontSize || fontSize}
              fontFamily={fontFamily}
              fontWeight={lStyleA.fontWeight || 'bold'}
              fontStyle={lStyleA.fontStyle || 'italic'}
              fill={lStyleA.color || strokeColor}
            >
              {nameA}
            </text>
          )}
        </g>

        {/* Đỉnh B */}
        <g
          id="vertex-B-group"
          className="cursor-move group"
          onPointerDown={(e) => handlePointerDown(1, e)}
        >
          <circle cx={pB.x} cy={pB.y} r={14} fill="transparent" />
          {showVertices && vStyleB.show !== false && (
            <circle
              cx={pB.x}
              cy={pB.y}
              r={vStyleB.size || 2.8}
              fill={vStyleB.color || strokeColor}
              className="group-hover:stroke-blue-500 group-hover:stroke-2 transition"
            />
          )}
          {showLabels && lStyleB.show !== false && (
            <text
              x={labelB.x}
              y={labelB.y}
              textAnchor={labelB.textAnchor}
              dominantBaseline={labelB.dominantBaseline}
              fontSize={lStyleB.fontSize || fontSize}
              fontFamily={fontFamily}
              fontWeight={lStyleB.fontWeight || 'bold'}
              fontStyle={lStyleB.fontStyle || 'italic'}
              fill={lStyleB.color || strokeColor}
            >
              {nameB}
            </text>
          )}
        </g>

        {/* Đỉnh C */}
        <g
          id="vertex-C-group"
          className="cursor-move group"
          onPointerDown={(e) => handlePointerDown(2, e)}
        >
          <circle cx={pC.x} cy={pC.y} r={14} fill="transparent" />
          {showVertices && vStyleC.show !== false && (
            <circle
              cx={pC.x}
              cy={pC.y}
              r={vStyleC.size || 2.8}
              fill={vStyleC.color || strokeColor}
              className="group-hover:stroke-blue-500 group-hover:stroke-2 transition"
            />
          )}
          {showLabels && lStyleC.show !== false && (
            <text
              x={labelC.x}
              y={labelC.y}
              textAnchor={labelC.textAnchor}
              dominantBaseline={labelC.dominantBaseline}
              fontSize={lStyleC.fontSize || fontSize}
              fontFamily={fontFamily}
              fontWeight={lStyleC.fontWeight || 'bold'}
              fontStyle={lStyleC.fontStyle || 'italic'}
              fill={lStyleC.color || strokeColor}
            >
              {nameC}
            </text>
          )}
        </g>

        {/* Đỉnh D */}
        <g
          id="vertex-D-group"
          className="cursor-move group"
          onPointerDown={(e) => handlePointerDown(3, e)}
        >
          <circle cx={pD.x} cy={pD.y} r={14} fill="transparent" />
          {showVertices && vStyleD.show !== false && (
            <circle
              cx={pD.x}
              cy={pD.y}
              r={vStyleD.size || 2.8}
              fill={vStyleD.color || strokeColor}
              className="group-hover:stroke-blue-500 group-hover:stroke-2 transition"
            />
          )}
          {showLabels && lStyleD.show !== false && (
            <text
              x={labelD.x}
              y={labelD.y}
              textAnchor={labelD.textAnchor}
              dominantBaseline={labelD.dominantBaseline}
              fontSize={lStyleD.fontSize || fontSize}
              fontFamily={fontFamily}
              fontWeight={lStyleD.fontWeight || 'bold'}
              fontStyle={lStyleD.fontStyle || 'italic'}
              fill={lStyleD.color || strokeColor}
            >
              {nameD}
            </text>
          )}
        </g>

        {/* 6. Các đường phụ và ký hiệu hình học tự do (Giai đoạn 3.2) */}
        {(() => {
          const diagInter = lineIntersection(pA, pC, pB, pD);
          const qPointsMap = {
            A: pA,
            B: pB,
            C: pC,
            D: pD,
            [nameA]: pA,
            [nameB]: pB,
            [nameC]: pC,
            [nameD]: pD,
            O: circumCenterP || diagInter || midpoint(pA, pC),
            [q.circumcircleCenterName || 'O']: circumCenterP || diagInter || midpoint(pA, pC),
            AB: midpoint(pA, pB),
            BC: midpoint(pB, pC),
            CD: midpoint(pC, pD),
            DA: midpoint(pD, pA),
            AC: midpoint(pA, pC),
            BD: midpoint(pB, pD),
          };
          return (
            <>
              {renderAuxiliaryElements(qPointsMap, q)}
              {renderAuxiliaryElements(qPointsMap, data)}
            </>
          );
        })()}
      </g>
    );
  };

  // ==========================================
  // RENDER ĐƯỜNG TRÒN & CÁC YẾU TỐ HÌNH HỌC (GIAI ĐOẠN 2.4)
  // ==========================================
  const renderCircle = () => {
    const c: CircleData = circle || {
      presetType: 'basic',
      centerName: 'O',
      radius: 110,
      showCenterPoint: true,
      showCenterLabel: true,
      showRadius: true,
      radiusPointName: 'A',
      radiusLabel: 'R',
    };

    const pts = circlePoints && circlePoints.length > 0 ? circlePoints : getCirclePresetPoints(c.presetType || 'basic');
    const pCenter = pts[0] || { x: 280, y: 220 };
    const pRadius = pts[1] || { x: 390, y: 220 };
    const r = c.radius || dist(pCenter, pRadius) || 110;

    const cStyle = c.circleStyle || {};
    const cStrokeColor = cStyle.strokeColor || '#000000';
    const cStrokeWidth = cStyle.strokeWidth || strokeWidth;
    const cDash = getDashArray(cStyle.strokeStyle);

    const radStyle = c.radiusStyle || {};
    const radStrokeColor = radStyle.strokeColor || '#000000';
    const radStrokeWidth = radStyle.strokeWidth || 1.5;
    const radDash = getDashArray(radStyle.strokeStyle);

    const diamStyle = c.diameterStyle || {};
    const diamStrokeColor = diamStyle.strokeColor || '#000000';
    const diamStrokeWidth = diamStyle.strokeWidth || 1.6;
    const diamDash = getDashArray(diamStyle.strokeStyle);

    const chStyle = c.chordStyle || {};
    const chStrokeColor = chStyle.strokeColor || '#000000';
    const chStrokeWidth = chStyle.strokeWidth || 1.6;
    const chDash = getDashArray(chStyle.strokeStyle);

    const aStyle = c.arcStyle || {};
    const arcStrokeColor = aStyle.strokeColor || '#ec4899';
    const arcStrokeWidth = aStyle.strokeWidth || 2.8;
    const arcDash = getDashArray(aStyle.strokeStyle);

    const tanStyle = c.tangentStyle || {};
    const tanStrokeColor = tanStyle.strokeColor || '#000000';
    const tanStrokeWidth = tanStyle.strokeWidth || 1.6;
    const tanDash = getDashArray(tanStyle.strokeStyle);

    // Tính toán các điểm phụ thuộc
    // 1. Đường kính AB
    const vRadius = vecNorm(vecSub(pRadius, pCenter));
    const pDiamA = pRadius;
    const pDiamB = { x: pCenter.x - vRadius.x * r, y: pCenter.y - vRadius.y * r };

    // 2. Dây cung CD
    const pChordC = pts[2] || {
      x: pCenter.x + r * Math.cos((5 * Math.PI) / 6),
      y: pCenter.y + r * Math.sin((5 * Math.PI) / 6),
    };
    const pChordD = pts[3] || {
      x: pCenter.x + r * Math.cos(Math.PI / 6),
      y: pCenter.y + r * Math.sin(Math.PI / 6),
    };
    const pChordH = midpoint(pChordC, pChordD); // Khoảng cách từ tâm đến dây cung

    // 3. Cung tròn AB
    const pArcA = pts[1] || pRadius;
    const pArcB = pts[2] || {
      x: pCenter.x + r * Math.cos((-5 * Math.PI) / 6),
      y: pCenter.y + r * Math.sin((-5 * Math.PI) / 6),
    };

    // 4. Tiếp tuyến
    const pExtP = pts[1] || { x: pCenter.x + 160, y: pCenter.y };
    const twoTangents = getTwoTangentContactPoints(pCenter, r, pExtP);

    // 5. Cát tuyến PCD
    const pSecP = pts[1] || { x: pCenter.x + 180, y: pCenter.y - 60 };
    const pSecDir = pts[2] || { x: pCenter.x - 180, y: pCenter.y + 40 };
    const secantIntersections = getLineCircleIntersections(pCenter, r, pSecP, pSecDir);

    // 6. Góc nội tiếp ∠APB & Góc ở tâm ∠AOB
    const pInscA = pts[1] || {
      x: pCenter.x + r * Math.cos(-Math.PI / 4),
      y: pCenter.y + r * Math.sin(-Math.PI / 4),
    };
    const pInscB = pts[2] || {
      x: pCenter.x + r * Math.cos((-3 * Math.PI) / 4),
      y: pCenter.y + r * Math.sin((-3 * Math.PI) / 4),
    };
    const pInscP = pts[3] || {
      x: pCenter.x + r * Math.cos((2 * Math.PI) / 3),
      y: pCenter.y + r * Math.sin((2 * Math.PI) / 3),
    };

    // 7. Hai đường tròn (O1, R1) và (O2, R2)
    const pCenter2 = pts[1] || { x: 350, y: 220 };
    const r2 = c.radius2 || (pts[3] ? dist(pCenter2, pts[3]) : 80);
    const twoCircleInters = getTwoCirclesIntersections(pCenter, r, pCenter2, r2);

    return (
      <g id="circle-group" className="select-none">
        {/* ========================================== */}
        {/* 1. TÔ MIỀN HÌNH HỌC (FILL) */}
        {/* ========================================== */}
        {c.fill?.enabled && (
          <g id="circle-fill-layer">
            {c.fillType === 'sector' ? (
              <path
                d={getCircleSectorSvgPath(pCenter, r, pArcA, pArcB, c.arcType === 'major')}
                fill={c.fill.color || '#3b82f6'}
                fillOpacity={c.fill.opacity ?? 0.25}
              />
            ) : c.fillType === 'segment' ? (
              <path
                d={getCircleSegmentSvgPath(pCenter, r, pArcA, pArcB, c.arcType === 'major')}
                fill={c.fill.color || '#3b82f6'}
                fillOpacity={c.fill.opacity ?? 0.25}
              />
            ) : (
              <circle
                cx={pCenter.x}
                cy={pCenter.y}
                r={r}
                fill={c.fill.color || '#3b82f6'}
                fillOpacity={c.fill.opacity ?? 0.25}
              />
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 2. ĐƯỜNG TRÒN CHÍNH (O, R) */}
        {/* ========================================== */}
        <circle
          cx={pCenter.x}
          cy={pCenter.y}
          r={r}
          fill="none"
          stroke={cStrokeColor}
          strokeWidth={cStrokeWidth}
          strokeDasharray={cDash}
        />

        {/* Đường tròn thứ 2 nếu có */}
        {c.showSecondCircle && (
          <g id="second-circle-group">
            <circle
              cx={pCenter2.x}
              cy={pCenter2.y}
              r={r2}
              fill="none"
              stroke="#2563eb"
              strokeWidth={cStrokeWidth}
              strokeDasharray={cDash}
            />
            {/* Tâm O2 */}
            <circle cx={pCenter2.x} cy={pCenter2.y} r={3} fill="#2563eb" />
            <text
              x={pCenter2.x - 14}
              y={pCenter2.y + 16}
              fontSize={fontSize}
              fontWeight="bold"
              fontStyle="italic"
              fontFamily={fontFamily}
              fill="#2563eb"
            >
              {c.center2Name || "O'"}
            </text>
            {/* Giao điểm 2 đường tròn */}
            {c.showIntersections !== false && twoCircleInters.length === 2 && (
              <g id="circle-intersections">
                <line
                  x1={twoCircleInters[0].x}
                  y1={twoCircleInters[0].y}
                  x2={twoCircleInters[1].x}
                  y2={twoCircleInters[1].y}
                  stroke="#64748b"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                />
                <circle cx={twoCircleInters[0].x} cy={twoCircleInters[0].y} r={3} fill="#dc2626" />
                <circle cx={twoCircleInters[1].x} cy={twoCircleInters[1].y} r={3} fill="#dc2626" />
                <text
                  x={twoCircleInters[0].x + 8}
                  y={twoCircleInters[0].y - 6}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#dc2626"
                >
                  {c.intersectionNames?.[0] || 'A'}
                </text>
                <text
                  x={twoCircleInters[1].x + 8}
                  y={twoCircleInters[1].y + 14}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#dc2626"
                >
                  {c.intersectionNames?.[1] || 'B'}
                </text>
              </g>
            )}
          </g>
        )}

        {/* Tâm O */}
        {c.showCenterPoint !== false && (
          <circle cx={pCenter.x} cy={pCenter.y} r={3} fill="#000000" />
        )}
        {c.showCenterLabel !== false && (
          <text
            x={pCenter.x - 14}
            y={pCenter.y + 16}
            fontSize={fontSize}
            fontWeight="bold"
            fontStyle="italic"
            fontFamily={fontFamily}
            fill="#000000"
          >
            {c.centerName || 'O'}
          </text>
        )}

        {/* ========================================== */}
        {/* 3. BÁN KÍNH OA */}
        {/* ========================================== */}
        {c.showRadius !== false && (
          <g id="circle-radius-group">
            <line
              x1={pCenter.x}
              y1={pCenter.y}
              x2={pRadius.x}
              y2={pRadius.y}
              stroke={radStrokeColor}
              strokeWidth={radStrokeWidth}
              strokeDasharray={radDash}
            />
            <circle cx={pRadius.x} cy={pRadius.y} r={2.8} fill="#000000" />
            {/* Tên điểm A trên đường tròn */}
            {c.radiusPointName && (
              <text
                x={pRadius.x + (pRadius.x >= pCenter.x ? 8 : -16)}
                y={pRadius.y + (pRadius.y >= pCenter.y ? 14 : -6)}
                fontSize={fontSize}
                fontWeight="bold"
                fontStyle="italic"
                fontFamily={fontFamily}
                fill="#000000"
              >
                {c.radiusPointName}
              </text>
            )}
            {/* Nhãn bán kính R / độ dài */}
            {c.showRadiusLabel !== false && c.radiusLabel && (
              <text
                x={(pCenter.x + pRadius.x) / 2 - 4}
                y={(pCenter.y + pRadius.y) / 2 - 8}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontFamily={fontFamily}
                fill={radStrokeColor}
                textAnchor="middle"
              >
                {c.radiusLabel}
              </text>
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 4. ĐƯỜNG KÍNH AB */}
        {/* ========================================== */}
        {c.showDiameter && (
          <g id="circle-diameter-group">
            <line
              x1={pDiamA.x}
              y1={pDiamA.y}
              x2={pDiamB.x}
              y2={pDiamB.y}
              stroke={diamStrokeColor}
              strokeWidth={diamStrokeWidth}
              strokeDasharray={diamDash}
            />
            <circle cx={pDiamA.x} cy={pDiamA.y} r={2.8} fill="#000000" />
            <circle cx={pDiamB.x} cy={pDiamB.y} r={2.8} fill="#000000" />
            <text
              x={pDiamA.x + (pDiamA.x >= pCenter.x ? 8 : -16)}
              y={pDiamA.y + (pDiamA.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.diameterPoints?.[0] || 'A'}
            </text>
            <text
              x={pDiamB.x + (pDiamB.x >= pCenter.x ? 8 : -16)}
              y={pDiamB.y + (pDiamB.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.diameterPoints?.[1] || 'B'}
            </text>
            {c.showDiameterLabel && c.diameterLabel && (
              <text
                x={(pCenter.x + pDiamA.x) / 2 + 10}
                y={(pCenter.y + pDiamA.y) / 2 - 6}
                fontSize={fontSize - 1}
                fontStyle="italic"
                fontFamily={fontFamily}
                fill={diamStrokeColor}
              >
                {c.diameterLabel}
              </text>
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 5. DÂY CUNG CD & KHOẢNG CÁCH TỪ TÂM OH ⊥ CD */}
        {/* ========================================== */}
        {c.showChord && (
          <g id="circle-chord-group">
            <line
              x1={pChordC.x}
              y1={pChordC.y}
              x2={pChordD.x}
              y2={pChordD.y}
              stroke={chStrokeColor}
              strokeWidth={chStrokeWidth}
              strokeDasharray={chDash}
            />
            <circle cx={pChordC.x} cy={pChordC.y} r={2.8} fill="#000000" />
            <circle cx={pChordD.x} cy={pChordD.y} r={2.8} fill="#000000" />
            <text
              x={pChordC.x + (pChordC.x >= pCenter.x ? 8 : -16)}
              y={pChordC.y + (pChordC.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.chordPoints?.[0] || 'C'}
            </text>
            <text
              x={pChordD.x + (pChordD.x >= pCenter.x ? 8 : -16)}
              y={pChordD.y + (pChordD.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.chordPoints?.[1] || 'D'}
            </text>

            {/* Khoảng cách từ tâm OH */}
            {c.showChordDistance !== false && (
              <g id="chord-distance-oh">
                <line
                  x1={pCenter.x}
                  y1={pCenter.y}
                  x2={pChordH.x}
                  y2={pChordH.y}
                  stroke="#475569"
                  strokeWidth={1.4}
                  strokeDasharray="4 3"
                />
                <circle cx={pChordH.x} cy={pChordH.y} r={2.6} fill="#475569" />
                <text
                  x={pChordH.x + (pChordH.x >= pCenter.x ? 6 : -14)}
                  y={pChordH.y + (pChordH.y >= pCenter.y ? 12 : -6)}
                  fontSize={fontSize - 1}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#475569"
                >
                  {c.chordDistanceLabel || 'H'}
                </text>

                {/* Ký hiệu vuông góc OH ⊥ CD */}
                {c.showChordRightAngle !== false && (
                  <path
                    d={getRightAngleMarkerPath(pCenter, pChordH, pChordD, 9)}
                    stroke="#475569"
                    strokeWidth={1.2}
                    fill="none"
                  />
                )}

                {/* Ký hiệu trung điểm HC = HD */}
                {c.showChordMidpoint !== false && (
                  <>
                    {Array.isArray(getSegmentTickMarks(pChordC, pChordH, 1, 8, 3)) &&
                      (getSegmentTickMarks(pChordC, pChordH, 1, 8, 3) as { x1: number; y1: number; x2: number; y2: number }[]).map((l, i) => (
                        <line key={`ch-tk1-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#475569" strokeWidth={1.2} />
                      ))}
                    {Array.isArray(getSegmentTickMarks(pChordH, pChordD, 1, 8, 3)) &&
                      (getSegmentTickMarks(pChordH, pChordD, 1, 8, 3) as { x1: number; y1: number; x2: number; y2: number }[]).map((l, i) => (
                        <line key={`ch-tk2-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#475569" strokeWidth={1.2} />
                      ))}
                  </>
                )}
              </g>
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 6. CUNG TRÒN (ARC) */}
        {/* ========================================== */}
        {c.showArc && (
          <g id="circle-arc-group">
            <path
              d={getCircleArcSvgPath(pCenter, r, pArcA, pArcB, c.arcType === 'major')}
              fill="none"
              stroke={arcStrokeColor}
              strokeWidth={arcStrokeWidth}
              strokeDasharray={arcDash}
              strokeLinecap="round"
            />
            <circle cx={pArcA.x} cy={pArcA.y} r={3.2} fill={arcStrokeColor} />
            <circle cx={pArcB.x} cy={pArcB.y} r={3.2} fill={arcStrokeColor} />
            <text
              x={pArcA.x + (pArcA.x >= pCenter.x ? 8 : -16)}
              y={pArcA.y + (pArcA.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.arcPoints?.[0] || 'A'}
            </text>
            <text
              x={pArcB.x + (pArcB.x >= pCenter.x ? 8 : -16)}
              y={pArcB.y + (pArcB.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              {c.arcPoints?.[1] || 'B'}
            </text>
            {/* Nhãn tên cung */}
            {c.showArcName !== false && c.arcName && (
              <text
                x={(pArcA.x + pArcB.x) / 2 + (c.arcType === 'major' ? -25 : 20)}
                y={(pArcA.y + pArcB.y) / 2 + (c.arcType === 'major' ? -25 : 20)}
                fontSize={fontSize}
                fontWeight="bold"
                fontFamily={fontFamily}
                fill={arcStrokeColor}
              >
                ⌒{c.arcName}
              </text>
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 7. TIẾP TUYẾN (TANGENT) */}
        {/* ========================================== */}
        {c.showTangent && (
          <g id="circle-tangent-group">
            {c.tangentType === 'two-tangents' ? (
              // Mô hình 2 tiếp tuyến cắt nhau từ điểm P
              <g id="two-tangents-subgroup">
                {/* Đoạn nối tâm OP (phân giác) */}
                {c.showCenterConnector !== false && (
                  <line
                    x1={pCenter.x}
                    y1={pCenter.y}
                    x2={pExtP.x}
                    y2={pExtP.y}
                    stroke="#64748b"
                    strokeWidth={1.3}
                    strokeDasharray="4 3"
                  />
                )}

                {/* Dây tiếp điểm AB */}
                {c.showChordAB && (
                  <line
                    x1={twoTangents.p1.x}
                    y1={twoTangents.p1.y}
                    x2={twoTangents.p2.x}
                    y2={twoTangents.p2.y}
                    stroke="#64748b"
                    strokeWidth={1.3}
                    strokeDasharray="4 3"
                  />
                )}

                {/* Bán kính OA, OB vuông góc tiếp tuyến */}
                <line
                  x1={pCenter.x}
                  y1={pCenter.y}
                  x2={twoTangents.p1.x}
                  y2={twoTangents.p1.y}
                  stroke="#475569"
                  strokeWidth={1.4}
                />
                <line
                  x1={pCenter.x}
                  y1={pCenter.y}
                  x2={twoTangents.p2.x}
                  y2={twoTangents.p2.y}
                  stroke="#475569"
                  strokeWidth={1.4}
                />

                {/* Hai tiếp tuyến PA, PB */}
                <line
                  x1={pExtP.x}
                  y1={pExtP.y}
                  x2={twoTangents.p1.x}
                  y2={twoTangents.p1.y}
                  stroke={tanStrokeColor}
                  strokeWidth={tanStrokeWidth}
                  strokeDasharray={tanDash}
                />
                <line
                  x1={pExtP.x}
                  y1={pExtP.y}
                  x2={twoTangents.p2.x}
                  y2={twoTangents.p2.y}
                  stroke={tanStrokeColor}
                  strokeWidth={tanStrokeWidth}
                  strokeDasharray={tanDash}
                />

                {/* Ký hiệu vuông góc OA ⊥ PA và OB ⊥ PB */}
                {c.showTangentRightAngle !== false && twoTangents.isValid && (
                  <>
                    <path
                      d={getRightAngleMarkerPath(pCenter, twoTangents.p1, pExtP, 9)}
                      stroke="#475569"
                      strokeWidth={1.2}
                      fill="none"
                    />
                    <path
                      d={getRightAngleMarkerPath(pCenter, twoTangents.p2, pExtP, 9)}
                      stroke="#475569"
                      strokeWidth={1.2}
                      fill="none"
                    />
                  </>
                )}

                {/* Ký hiệu bằng nhau PA = PB */}
                {c.showTangentEqualMarks !== false && twoTangents.isValid && (
                  <>
                    {Array.isArray(getSegmentTickMarks(twoTangents.p1, pExtP, 2, 8, 3)) &&
                      (getSegmentTickMarks(twoTangents.p1, pExtP, 2, 8, 3) as { x1: number; y1: number; x2: number; y2: number }[]).map((l, i) => (
                        <line key={`tg-tk1-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#7c3aed" strokeWidth={1.2} />
                      ))}
                    {Array.isArray(getSegmentTickMarks(twoTangents.p2, pExtP, 2, 8, 3)) &&
                      (getSegmentTickMarks(twoTangents.p2, pExtP, 2, 8, 3) as { x1: number; y1: number; x2: number; y2: number }[]).map((l, i) => (
                        <line key={`tg-tk2-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#7c3aed" strokeWidth={1.2} />
                      ))}
                  </>
                )}

                {/* Các điểm P, A, B */}
                <circle cx={pExtP.x} cy={pExtP.y} r={3.2} fill="#7c3aed" />
                <circle cx={twoTangents.p1.x} cy={twoTangents.p1.y} r={2.8} fill="#000000" />
                <circle cx={twoTangents.p2.x} cy={twoTangents.p2.y} r={2.8} fill="#000000" />

                <text
                  x={pExtP.x + 8}
                  y={pExtP.y + 4}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#7c3aed"
                >
                  {c.externalPointName || 'P'}
                </text>
                <text
                  x={twoTangents.p1.x + (twoTangents.p1.x >= pCenter.x ? 8 : -16)}
                  y={twoTangents.p1.y + (twoTangents.p1.y >= pCenter.y ? 14 : -6)}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#000000"
                >
                  {c.tangentPointsNames?.[0] || 'A'}
                </text>
                <text
                  x={twoTangents.p2.x + (twoTangents.p2.x >= pCenter.x ? 8 : -16)}
                  y={twoTangents.p2.y + (twoTangents.p2.y >= pCenter.y ? 14 : -6)}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#000000"
                >
                  {c.tangentPointsNames?.[1] || 'B'}
                </text>
              </g>
            ) : (
              // Tiếp tuyến tại điểm A trên đường tròn (Ax ⊥ OA)
              (() => {
                const u = vecNorm(vecSub(pRadius, pCenter));
                const perp = { x: -u.y, y: u.x };
                const tLineP1 = { x: pRadius.x - perp.x * 90, y: pRadius.y - perp.y * 90 };
                const tLineP2 = { x: pRadius.x + perp.x * 90, y: pRadius.y + perp.y * 90 };

                return (
                  <g id="tangent-at-point-subgroup">
                    {/* Bán kính OA */}
                    <line
                      x1={pCenter.x}
                      y1={pCenter.y}
                      x2={pRadius.x}
                      y2={pRadius.y}
                      stroke="#475569"
                      strokeWidth={1.4}
                    />
                    {/* Tiếp tuyến qua A */}
                    <line
                      x1={tLineP1.x}
                      y1={tLineP1.y}
                      x2={tLineP2.x}
                      y2={tLineP2.y}
                      stroke={tanStrokeColor}
                      strokeWidth={tanStrokeWidth}
                      strokeDasharray={tanDash}
                    />
                    {/* Góc vuông OA ⊥ Tangent */}
                    <path
                      d={getRightAngleMarkerPath(pCenter, pRadius, tLineP2, 9)}
                      stroke="#475569"
                      strokeWidth={1.2}
                      fill="none"
                    />
                    <circle cx={pRadius.x} cy={pRadius.y} r={3} fill="#000000" />
                    <text
                      x={pRadius.x + (pRadius.x >= pCenter.x ? 8 : -16)}
                      y={pRadius.y + (pRadius.y >= pCenter.y ? 14 : -6)}
                      fontSize={fontSize}
                      fontWeight="bold"
                      fontFamily={fontFamily}
                      fill="#000000"
                    >
                      {c.tangentPointName || 'A'}
                    </text>
                    {c.tangentLineName && (
                      <text
                        x={tLineP2.x + 4}
                        y={tLineP2.y + 4}
                        fontSize={fontSize - 1}
                        fontStyle="italic"
                        fontFamily={fontFamily}
                        fill={tanStrokeColor}
                      >
                        {c.tangentLineName}
                      </text>
                    )}
                  </g>
                );
              })()
            )}
          </g>
        )}

        {/* ========================================== */}
        {/* 8. CÁT TUYẾN (SECANT) */}
        {/* ========================================== */}
        {c.showSecant && (
          <g id="circle-secant-group">
            {/* Đường thẳng cát tuyến */}
            <line
              x1={pSecP.x}
              y1={pSecP.y}
              x2={pSecDir.x}
              y2={pSecDir.y}
              stroke="#0891b2"
              strokeWidth={1.6}
            />
            {/* Điểm P ngoài */}
            <circle cx={pSecP.x} cy={pSecP.y} r={3} fill="#0891b2" />
            <text
              x={pSecP.x + 8}
              y={pSecP.y + 4}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#0891b2"
            >
              P
            </text>

            {/* Giao điểm C, D */}
            {secantIntersections.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={2.8} fill="#0891b2" />
                <text
                  x={pt.x + 6}
                  y={pt.y - 6}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily={fontFamily}
                  fill="#0891b2"
                >
                  {c.secantPointsNames?.[i] || (i === 0 ? 'C' : 'D')}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* ========================================== */}
        {/* 9. GÓC NỘI TIẾP & GÓC Ở TÂM */}
        {/* ========================================== */}
        {c.showInscribedAngle && (
          <g id="inscribed-angle-group">
            {/* Các cạnh góc nội tiếp PA, PB */}
            <line x1={pInscP.x} y1={pInscP.y} x2={pInscA.x} y2={pInscA.y} stroke="#2563eb" strokeWidth={1.6} />
            <line x1={pInscP.x} y1={pInscP.y} x2={pInscB.x} y2={pInscB.y} stroke="#2563eb" strokeWidth={1.6} />
            {/* Các cạnh góc ở tâm OA, OB */}
            <line
              x1={pCenter.x}
              y1={pCenter.y}
              x2={pInscA.x}
              y2={pInscA.y}
              stroke="#dc2626"
              strokeWidth={1.4}
              strokeDasharray="4 3"
            />
            <line
              x1={pCenter.x}
              y1={pCenter.y}
              x2={pInscB.x}
              y2={pInscB.y}
              stroke="#dc2626"
              strokeWidth={1.4}
              strokeDasharray="4 3"
            />

            {/* Cung đánh dấu góc nội tiếp */}
            <path
              d={getEqualAngleArcPath(pInscP, pInscA, pInscB, 20).path}
              stroke="#2563eb"
              strokeWidth={1.4}
              fill="none"
            />
            {/* Cung đánh dấu góc ở tâm */}
            <path
              d={getEqualAngleArcPath(pCenter, pInscA, pInscB, 18).path}
              stroke="#dc2626"
              strokeWidth={1.4}
              fill="none"
            />

            {/* Điểm P, A, B */}
            <circle cx={pInscP.x} cy={pInscP.y} r={3.2} fill="#2563eb" />
            <circle cx={pInscA.x} cy={pInscA.y} r={2.8} fill="#000000" />
            <circle cx={pInscB.x} cy={pInscB.y} r={2.8} fill="#000000" />

            <text
              x={pInscP.x + (pInscP.x >= pCenter.x ? 8 : -16)}
              y={pInscP.y + (pInscP.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#2563eb"
            >
              {c.inscribedVertexName || 'P'}
            </text>
            <text
              x={pInscA.x + (pInscA.x >= pCenter.x ? 8 : -16)}
              y={pInscA.y + (pInscA.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              A
            </text>
            <text
              x={pInscB.x + (pInscB.x >= pCenter.x ? 8 : -16)}
              y={pInscB.y + (pInscB.y >= pCenter.y ? 14 : -6)}
              fontSize={fontSize}
              fontWeight="bold"
              fontFamily={fontFamily}
              fill="#000000"
            >
              B
            </text>
          </g>
        )}

        {/* ========================================== */}
        {/* 10. GÓC TẠO BỞI TIẾP TUYẾN VÀ DÂY CUNG (TOOL 3.1) */}
        {/* ========================================== */}
        {(c.presetType === 'tangent-chord-angle' || c.showTangentChordAngle) && (() => {
          const pTanA = pts[1] || { x: pCenter.x, y: pCenter.y + r };
          const pChordB = pts[2] || { x: pCenter.x + r * Math.cos(-Math.PI / 4), y: pCenter.y + r * Math.sin(-Math.PI / 4) };
          const pInscC = pts[3] || { x: pCenter.x + r * Math.cos((3 * Math.PI) / 4), y: pCenter.y + r * Math.sin((3 * Math.PI) / 4) };

          const u = vecNorm(vecSub(pTanA, pCenter));
          const perp = { x: -u.y, y: u.x };
          const tRayX = { x: pTanA.x + perp.x * 120, y: pTanA.y + perp.y * 120 };
          const tRayY = { x: pTanA.x - perp.x * 70, y: pTanA.y - perp.y * 70 };

          const arcTangentChord = getAngleArcAndFill(pTanA, tRayX, pChordB, 28, false);
          const arcInscribed = getAngleArcAndFill(pInscC, pTanA, pChordB, 24, false);

          return (
            <g id="tangent-chord-angle-group">
              {/* Tiếp tuyến xy qua A */}
              <line x1={tRayY.x} y1={tRayY.y} x2={tRayX.x} y2={tRayX.y} stroke="#059669" strokeWidth={1.8} strokeLinecap="round" />
              {/* Dây cung AB */}
              <line x1={pTanA.x} y1={pTanA.y} x2={pChordB.x} y2={pChordB.y} stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" />
              {/* Bán kính OA hạ vuông góc với tiếp tuyến */}
              <line x1={pCenter.x} y1={pCenter.y} x2={pTanA.x} y2={pTanA.y} stroke="#64748b" strokeWidth={1.2} strokeDasharray="3 3" />
              <path d={getRightAngleMarkerPath(pCenter, pTanA, tRayX, 9)} stroke="#64748b" strokeWidth={1} fill="none" />

              {/* Cung góc tạo bởi tiếp tuyến và dây cung BAx */}
              <path d={arcTangentChord.arcPath} stroke="#059669" strokeWidth={1.5} fill="none" />

              {/* Góc nội tiếp so sánh ACB (cùng chắn cung AB) */}
              {c.showInscribedCompareAngle !== false && (
                <g id="inscribed-compare-angle">
                  <line x1={pInscC.x} y1={pInscC.y} x2={pTanA.x} y2={pTanA.y} stroke="#7c3aed" strokeWidth={1.4} strokeDasharray="4 3" />
                  <line x1={pInscC.x} y1={pInscC.y} x2={pChordB.x} y2={pChordB.y} stroke="#7c3aed" strokeWidth={1.4} strokeDasharray="4 3" />
                  <path d={arcInscribed.arcPath} stroke="#7c3aed" strokeWidth={1.5} fill="none" />
                  <circle cx={pInscC.x} cy={pInscC.y} r={2.8} fill="#7c3aed" />
                  <text x={pInscC.x - 14} y={pInscC.y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#7c3aed">
                    {c.compareVertexName || 'C'}
                  </text>
                </g>
              )}

              {/* Điểm A, B và nhãn */}
              <circle cx={pTanA.x} cy={pTanA.y} r={3} fill="#059669" />
              <circle cx={pChordB.x} cy={pChordB.y} r={3} fill="#2563eb" />
              <text x={pTanA.x + 8} y={pTanA.y + 16} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#059669">
                {c.tangentChordPointName || c.tangentPointName || 'A'}
              </text>
              <text x={pChordB.x + 8} y={pChordB.y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#2563eb">
                {c.chordTargetPointName || 'B'}
              </text>
              <text x={tRayX.x + 6} y={tRayX.y + 4} fontSize={fontSize} fontStyle="italic" fill="#059669">
                {c.tangentRayName || 'x'}
              </text>
            </g>
          );
        })()}

        {/* ========================================== */}
        {/* 11. GÓC CÓ ĐỈNH Ở BÊN TRONG ĐƯỜNG TRÒN (TOOL 3.2) */}
        {/* ========================================== */}
        {(c.presetType === 'interior-angle' || c.showInteriorAngle) && (() => {
          const pA_in = pts[1] || { x: pCenter.x + r * Math.cos((5 * Math.PI) / 6), y: pCenter.y + r * Math.sin((5 * Math.PI) / 6) };
          const pB_in = pts[2] || { x: pCenter.x + r * Math.cos(-Math.PI / 6), y: pCenter.y + r * Math.sin(-Math.PI / 6) };
          const pC_in = pts[3] || { x: pCenter.x + r * Math.cos((2 * Math.PI) / 3), y: pCenter.y + r * Math.sin((2 * Math.PI) / 3) };
          const pD_in = pts[4] || { x: pCenter.x + r * Math.cos(-Math.PI / 2), y: pCenter.y + r * Math.sin(-Math.PI / 2) };

          const pE_in = lineIntersection(pA_in, pB_in, pC_in, pD_in) || midpoint(pA_in, pB_in);
          const arcBEC = getAngleArcAndFill(pE_in, pB_in, pC_in, 22, false);
          const arcAED = getAngleArcAndFill(pE_in, pA_in, pD_in, 22, false);

          return (
            <g id="interior-angle-group">
              {/* Dây AB và CD cắt nhau tại E */}
              <line x1={pA_in.x} y1={pA_in.y} x2={pB_in.x} y2={pB_in.y} stroke="#2563eb" strokeWidth={1.8} />
              <line x1={pC_in.x} y1={pC_in.y} x2={pD_in.x} y2={pD_in.y} stroke="#059669" strokeWidth={1.8} />

              {/* Ký hiệu 2 góc đối đỉnh tại E */}
              <path d={arcBEC.arcPath} stroke="#dc2626" strokeWidth={1.6} fill="none" />
              <path d={arcAED.arcPath} stroke="#dc2626" strokeWidth={1.6} fill="none" />

              {/* Các điểm A, B, C, D, E */}
              <circle cx={pE_in.x} cy={pE_in.y} r={3.2} fill="#dc2626" />
              <circle cx={pA_in.x} cy={pA_in.y} r={2.8} fill="#000000" />
              <circle cx={pB_in.x} cy={pB_in.y} r={2.8} fill="#000000" />
              <circle cx={pC_in.x} cy={pC_in.y} r={2.8} fill="#000000" />
              <circle cx={pD_in.x} cy={pD_in.y} r={2.8} fill="#000000" />

              <text x={pE_in.x + 6} y={pE_in.y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#dc2626">
                {c.interiorIntersectionName || 'E'}
              </text>
              <text x={pA_in.x - 14} y={pA_in.y + 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic">A</text>
              <text x={pB_in.x + 8} y={pB_in.y + 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic">B</text>
              <text x={pC_in.x - 14} y={pC_in.y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic">C</text>
              <text x={pD_in.x + 6} y={pD_in.y + 14} fontSize={fontSize} fontWeight="bold" fontStyle="italic">D</text>
            </g>
          );
        })()}

        {/* ========================================== */}
        {/* 12. GÓC CÓ ĐỈNH Ở BÊN NGOÀI ĐƯỜNG TRÒN (TOOL 3.3) */}
        {/* ========================================== */}
        {(c.presetType === 'exterior-angle' || c.showExteriorAngle) && (() => {
          const pExtVertex = pts[1] || { x: pCenter.x + 180, y: pCenter.y };
          const pSecA = pts[2] || { x: pCenter.x + r * Math.cos(-Math.PI / 3), y: pCenter.y + r * Math.sin(-Math.PI / 3) };
          const pSecC = pts[3] || { x: pCenter.x + r * Math.cos(Math.PI / 3), y: pCenter.y + r * Math.sin(Math.PI / 3) };

          const inter1 = getLineCircleIntersections(pCenter, r, pExtVertex, pSecA);
          const inter2 = getLineCircleIntersections(pCenter, r, pExtVertex, pSecC);

          const pA_out = inter1[0] || pSecA;
          const pB_out = inter1[1] || pSecA;
          const pC_out = inter2[0] || pSecC;
          const pD_out = inter2[1] || pSecC;

          const arcExt = getAngleArcAndFill(pExtVertex, pSecA, pSecC, 30, false);

          return (
            <g id="exterior-angle-group">
              {/* 2 cát tuyến xuất phát từ đỉnh ngoài P */}
              <line x1={pExtVertex.x} y1={pExtVertex.y} x2={pB_out.x - 30} y2={pB_out.y - 15} stroke="#2563eb" strokeWidth={1.6} />
              <line x1={pExtVertex.x} y1={pExtVertex.y} x2={pD_out.x - 30} y2={pD_out.y + 15} stroke="#2563eb" strokeWidth={1.6} />

              {/* Cung góc tại đỉnh ngoài P */}
              <path d={arcExt.arcPath} stroke="#dc2626" strokeWidth={1.6} fill="none" />

              {/* Các điểm P, A, B, C, D */}
              <circle cx={pExtVertex.x} cy={pExtVertex.y} r={3.2} fill="#dc2626" />
              <circle cx={pA_out.x} cy={pA_out.y} r={2.8} fill="#000000" />
              <circle cx={pB_out.x} cy={pB_out.y} r={2.8} fill="#000000" />
              <circle cx={pC_out.x} cy={pC_out.y} r={2.8} fill="#000000" />
              <circle cx={pD_out.x} cy={pD_out.y} r={2.8} fill="#000000" />

              <text x={pExtVertex.x + 8} y={pExtVertex.y + 4} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#dc2626">
                {c.exteriorVertexName || 'P'}
              </text>
              <text x={pA_out.x + 6} y={pA_out.y - 8} fontSize={fontSize} fontWeight="bold" fontStyle="italic">A</text>
              <text x={pB_out.x - 14} y={pB_out.y - 8} fontSize={fontSize} fontWeight="bold" fontStyle="italic">B</text>
              <text x={pC_out.x + 6} y={pC_out.y + 14} fontSize={fontSize} fontWeight="bold" fontStyle="italic">C</text>
              <text x={pD_out.x - 14} y={pD_out.y + 14} fontSize={fontSize} fontWeight="bold" fontStyle="italic">D</text>
            </g>
          );
        })()}

        {/* ========================================== */}
        {/* 13. HAI ĐƯỜNG TRÒN VÀ TIẾP TUYẾN CHUNG (TOOL 4) */}
        {/* ========================================== */}
        {(c.presetType === 'two-circles' || c.showSecondCircle) && (() => {
          const c2Center = pCenter2;
          const c2Radius = r2;
          const distCenters = dist(pCenter, c2Center);
          const tangents = getCommonTangents(pCenter, r, c2Center, c2Radius, 45);

          // Xác định vị trí tương đối
          let relationText = '';
          if (distCenters > r + c2Radius) relationText = 'Ngoài nhau';
          else if (Math.abs(distCenters - (r + c2Radius)) < 1.5) relationText = 'Tiếp xúc ngoài';
          else if (distCenters > Math.abs(r - c2Radius) && distCenters < r + c2Radius) relationText = 'Cắt nhau';
          else if (Math.abs(distCenters - Math.abs(r - c2Radius)) < 1.5) relationText = 'Tiếp xúc trong';
          else relationText = 'Đựng nhau';

          const showCommonTan = c.showCommonTangents !== false;
          const showExtTan = c.commonTangentsType === 'both' || c.commonTangentsType === 'external' || !c.commonTangentsType;
          const showIntTan = c.commonTangentsType === 'both' || c.commonTangentsType === 'internal';

          return (
            <g id="two-circles-full-group">
              {/* Đường tròn thứ hai (O2, R2) */}
              <circle
                cx={c2Center.x}
                cy={c2Center.y}
                r={c2Radius}
                fill="none"
                stroke={cStrokeColor}
                strokeWidth={cStrokeWidth}
                strokeDasharray={cDash}
              />
              <circle cx={c2Center.x} cy={c2Center.y} r={3} fill="#000000" />
              <text x={c2Center.x + 8} y={c2Center.y + 14} fontSize={fontSize} fontWeight="bold" fontStyle="italic">
                {c.center2Name || "O'"}
              </text>

              {/* Đường nối tâm O1O2 */}
              {c.showLineOfCenters !== false && (
                <line
                  x1={pCenter.x}
                  y1={pCenter.y}
                  x2={c2Center.x}
                  y2={c2Center.y}
                  stroke="#475569"
                  strokeWidth={1.3}
                  strokeDasharray="4 3"
                />
              )}

              {/* Giao điểm 2 đường tròn và dây chung */}
              {twoCircleInters.length === 2 && (
                <g id="common-chord-group">
                  <line
                    x1={twoCircleInters[0].x}
                    y1={twoCircleInters[0].y}
                    x2={twoCircleInters[1].x}
                    y2={twoCircleInters[1].y}
                    stroke="#dc2626"
                    strokeWidth={1.5}
                  />
                  <circle cx={twoCircleInters[0].x} cy={twoCircleInters[0].y} r={2.8} fill="#dc2626" />
                  <circle cx={twoCircleInters[1].x} cy={twoCircleInters[1].y} r={2.8} fill="#dc2626" />
                  <text x={twoCircleInters[0].x + 6} y={twoCircleInters[0].y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#dc2626">A</text>
                  <text x={twoCircleInters[1].x + 6} y={twoCircleInters[1].y + 14} fontSize={fontSize} fontWeight="bold" fontStyle="italic" fill="#dc2626">B</text>
                </g>
              )}

              {/* Tiếp tuyến chung ngoài và trong */}
              {showCommonTan && (
                <g id="common-tangents-layer">
                  {showExtTan &&
                    tangents.external.map((tan, i) => (
                      <g key={`ext-tan-${i}`}>
                        <line x1={tan.start.x} y1={tan.start.y} x2={tan.end.x} y2={tan.end.y} stroke="#059669" strokeWidth={1.6} />
                        <circle cx={tan.contact1.x} cy={tan.contact1.y} r={2.5} fill="#059669" />
                        <circle cx={tan.contact2.x} cy={tan.contact2.y} r={2.5} fill="#059669" />
                        {/* Bán kính vuông góc tại tiếp điểm */}
                        <line x1={pCenter.x} y1={pCenter.y} x2={tan.contact1.x} y2={tan.contact1.y} stroke="#059669" strokeWidth={1} strokeDasharray="3 3" />
                        <line x1={c2Center.x} y1={c2Center.y} x2={tan.contact2.x} y2={tan.contact2.y} stroke="#059669" strokeWidth={1} strokeDasharray="3 3" />
                      </g>
                    ))}
                  {showIntTan &&
                    tangents.internal.map((tan, i) => (
                      <g key={`int-tan-${i}`}>
                        <line x1={tan.start.x} y1={tan.start.y} x2={tan.end.x} y2={tan.end.y} stroke="#ea580c" strokeWidth={1.6} />
                        <circle cx={tan.contact1.x} cy={tan.contact1.y} r={2.5} fill="#ea580c" />
                        <circle cx={tan.contact2.x} cy={tan.contact2.y} r={2.5} fill="#ea580c" />
                        {/* Bán kính vuông góc tại tiếp điểm */}
                        <line x1={pCenter.x} y1={pCenter.y} x2={tan.contact1.x} y2={tan.contact1.y} stroke="#ea580c" strokeWidth={1} strokeDasharray="3 3" />
                        <line x1={c2Center.x} y1={c2Center.y} x2={tan.contact2.x} y2={tan.contact2.y} stroke="#ea580c" strokeWidth={1} strokeDasharray="3 3" />
                      </g>
                    ))}
                </g>
              )}

              {/* Nhãn vị trí tương đối nếu được bật */}
              {((c as any).showRelationLabel || c.twoCirclesRelation) && (
                <text x={(pCenter.x + c2Center.x) / 2} y={Math.max(pCenter.y, c2Center.y) + Math.max(r, c2Radius) + 24} textAnchor="middle" fontSize={fontSize} fontStyle="italic" fill="#475569">
                  {relationText}
                </text>
              )}
            </g>
          );
        })()}

        {/* ========================================== */}
        {/* 14. ĐIỂM ĐIỀU KHIỂN KÉO THẢ (DRAG HANDLERS) */}
        {/* ========================================== */}
        {!examMode && (
          <g id="circle-drag-handles">
            {pts.map((pt, idx) => {
              const isDragging = draggingVertex === idx;
              return (
                <g key={idx} className="cursor-move">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isDragging ? 10 : 8}
                    fill={isDragging ? '#2563eb' : '#3b82f6'}
                    fillOpacity={isDragging ? 0.45 : 0.25}
                    stroke="#2563eb"
                    strokeWidth={1.5}
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={3}
                    fill="#1d4ed8"
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Các đường phụ và ký hiệu hình học tự do (Giai đoạn 3.2) */}
        {(() => {
          const tanPoint1Name = c.tangentPointsNames?.[0] || 'A';
          const tanPoint2Name = c.tangentPointsNames?.[1] || 'B';
          const circleMap: Record<string, Point2D> = {
            O: pCenter,
            [c.centerName || 'O']: pCenter,
            "O'": pCenter2,
            [c.center2Name || "O'"]: pCenter2,
            A: twoTangents?.isValid ? twoTangents.p1 : pRadius,
            B: twoTangents?.isValid ? twoTangents.p2 : pDiamB,
            C: pChordC,
            D: pChordD,
            H: pChordH,
            P: pExtP,
            [c.externalPointName || 'P']: pExtP,
            ...(twoTangents?.isValid ? {
              [tanPoint1Name]: twoTangents.p1,
              [tanPoint2Name]: twoTangents.p2,
            } : {}),
            E: pts[4] ? (lineIntersection(pts[1], pts[2], pts[3], pts[4]) || midpoint(pts[1], pts[2])) : midpoint(pChordC, pChordD),
          };
          return (
            <>
              {renderAuxiliaryElements(circleMap, c)}
              {renderAuxiliaryElements(circleMap, data)}
            </>
          );
        })()}
      </g>
    );
  };

  // ==========================================
  // RENDER ĐƯỜNG THẲNG / TIA / ĐOẠN THẲNG (GIAI ĐOẠN 2.3)
  // ==========================================
  const renderLineRay = () => {
    const lr = lineRay || {
      type: 'segment',
      pointNames: ['A', 'B', 'C', 'D'],
      points: getLineRayPresetPoints('segment'),
      showPoints: true,
      showLabels: true,
      showMidpoint: false,
      midpointName: 'M',
      showEqualSegmentMarks: true,
      showLength: false,
      lengthValue: '6 cm',
      showArrows: true,
      showParallelMarkers: true,
      parallelLineLabel1: 'a',
      parallelLineLabel2: 'b',
      showRightAngleMarker: true,
      perpLineLabel1: 'd',
      perpLineLabel2: "d'",
      intersectionName: 'O',
      showIntersectionPoint: true,
      line1Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' },
      line2Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    };

    const type = lr.type || 'segment';
    const pts = lineRayPoints;
    const pNames = lr.pointNames || ['A', 'B', 'C', 'D'];

    const p1 = pts[0] || { x: 120, y: 220 };
    const p2 = pts[1] || { x: 440, y: 220 };
    const p3 = pts[2] || { x: 120, y: 140 };
    const p4 = pts[3] || { x: 440, y: 300 };

    const l1Style = lr.line1Style || { color: strokeColor, strokeWidth: 1.8, style: 'solid' };
    const l1Color = l1Style.color || strokeColor;
    const l1Width = l1Style.strokeWidth || 1.8;
    const l1Dash = getDashArray(l1Style.style);

    const l2Style = lr.line2Style || { color: strokeColor, strokeWidth: 1.8, style: 'solid' };
    const l2Color = l2Style.color || strokeColor;
    const l2Width = l2Style.strokeWidth || 1.8;
    const l2Dash = getDashArray(l2Style.style);

    return (
      <g id="line-ray-group">
        {/* 1. ĐOẠN THẲNG AB */}
        {type === 'segment' && (
          <g id="segment-subgroup">
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={l1Color}
              strokeWidth={l1Width}
              strokeDasharray={l1Dash}
            />

            {/* Trung điểm M */}
            {lr.showMidpoint && (() => {
              const mid = midpoint(p1, p2);
              const labelPos = getSmartVertexLabelPosition(mid, p1, p2, 18);
              const tickMarks1 = getSegmentTickMarks(p1, mid, 1);
              const tickMarks2 = getSegmentTickMarks(mid, p2, 1);

              return (
                <g id="midpoint-group">
                  <circle cx={mid.x} cy={mid.y} r={3} fill="#000000" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor={labelPos.textAnchor}
                    dominantBaseline={labelPos.dominantBaseline}
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontStyle="italic"
                    fill="#000000"
                  >
                    {lr.midpointName || 'M'}
                  </text>
                  {lr.showEqualSegmentMarks !== false && (
                    <>
                      {Array.isArray(tickMarks1) &&
                        tickMarks1.map((tk, i) => (
                          <line
                            key={`tk1-${i}`}
                            x1={tk.x1}
                            y1={tk.y1}
                            x2={tk.x2}
                            y2={tk.y2}
                            stroke={strokeColor}
                            strokeWidth={1.2}
                          />
                        ))}
                      {Array.isArray(tickMarks2) &&
                        tickMarks2.map((tk, i) => (
                          <line
                            key={`tk2-${i}`}
                            x1={tk.x1}
                            y1={tk.y1}
                            x2={tk.x2}
                            y2={tk.y2}
                            stroke={strokeColor}
                            strokeWidth={1.2}
                          />
                        ))}
                    </>
                  )}
                </g>
              );
            })()}

            {/* Hiển thị độ dài */}
            {lr.showLength && (() => {
              const mid = midpoint(p1, p2);
              const normal = vecNorm(vecSub(p2, p1));
              const perp = { x: -normal.y, y: normal.x };
              const offsetPos = vecAdd(mid, vecScale(perp, 16));
              return (
                <text
                  x={offsetPos.x}
                  y={offsetPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize - 2}
                  fontWeight="bold"
                  fill="#2563eb"
                >
                  {lr.lengthValue || '6 cm'}
                </text>
              );
            })()}
          </g>
        )}

        {/* 2. TIA AX / AB */}
        {type === 'ray' && (() => {
          const normal = vecNorm(vecSub(p2, p1));
          const rayEnd = vecAdd(p1, vecScale(normal, dist(p1, p2) + 50));
          return (
            <g id="ray-subgroup">
              <line
                x1={p1.x}
                y1={p1.y}
                x2={rayEnd.x}
                y2={rayEnd.y}
                stroke={l1Color}
                strokeWidth={l1Width}
                strokeDasharray={l1Dash}
                markerEnd={lr.showArrows !== false ? 'url(#math-arrow-sm)' : undefined}
              />
            </g>
          );
        })()}

        {/* 3. ĐƯỜNG THẲNG XY */}
        {type === 'line' && (() => {
          const { start, end } = extendLine(p1, p2, 60, 60);
          return (
            <g id="line-subgroup">
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={l1Color}
                strokeWidth={l1Width}
                strokeDasharray={l1Dash}
              />
            </g>
          );
        })()}

        {/* 4. HAI ĐƯỜNG SONG SONG */}
        {type === 'parallel' && (() => {
          const line1Ext = extendLine(p1, p2, 50, 50);
          const line2Ext = getParallelLineThroughPoint(p1, p2, p3, 300);

          const arrow1 = getParallelArrowsPath(line1Ext.start, line1Ext.end, 1);
          const arrow2 = getParallelArrowsPath(line2Ext.start, line2Ext.end, 1);

          return (
            <g id="parallel-subgroup">
              {/* Đường 1 */}
              <line
                x1={line1Ext.start.x}
                y1={line1Ext.start.y}
                x2={line1Ext.end.x}
                y2={line1Ext.end.y}
                stroke={l1Color}
                strokeWidth={l1Width}
                strokeDasharray={l1Dash}
              />
              <text
                x={line1Ext.end.x + 10}
                y={line1Ext.end.y + 4}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {lr.parallelLineLabel1 || 'a'}
              </text>

              {/* Đường 2 */}
              <line
                x1={line2Ext.start.x}
                y1={line2Ext.start.y}
                x2={line2Ext.end.x}
                y2={line2Ext.end.y}
                stroke={l2Color}
                strokeWidth={l2Width}
                strokeDasharray={l2Dash}
              />
              <text
                x={line2Ext.end.x + 10}
                y={line2Ext.end.y + 4}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {lr.parallelLineLabel2 || 'b'}
              </text>

              {/* Ký hiệu mũi tên song song SGK */}
              {lr.showParallelMarkers !== false && (
                <>
                  <path d={arrow1} stroke={strokeColor} strokeWidth={1.4} fill="none" />
                  <path d={arrow2} stroke={strokeColor} strokeWidth={1.4} fill="none" />
                </>
              )}
            </g>
          );
        })()}

        {/* 5. HAI ĐƯỜNG VUÔNG GÓC */}
        {type === 'perpendicular' && (() => {
          const line1Ext = extendLine(p1, p2, 50, 50);
          const perpResult = getPerpendicularLineThroughPoint(p1, p2, p3, 200);
          const footH = perpResult.foot;
          const rightAnglePath = getRightAngleMarkerPath(footH, p2, p3, 12);

          return (
            <g id="perpendicular-subgroup">
              {/* Đường d */}
              <line
                x1={line1Ext.start.x}
                y1={line1Ext.start.y}
                x2={line1Ext.end.x}
                y2={line1Ext.end.y}
                stroke={l1Color}
                strokeWidth={l1Width}
                strokeDasharray={l1Dash}
              />
              <text
                x={line1Ext.end.x + 8}
                y={line1Ext.end.y + 4}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {lr.perpLineLabel1 || 'd'}
              </text>

              {/* Đường d' vuông góc */}
              <line
                x1={perpResult.start.x}
                y1={perpResult.start.y}
                x2={perpResult.end.x}
                y2={perpResult.end.y}
                stroke={l2Color}
                strokeWidth={l2Width}
                strokeDasharray={l2Dash}
              />
              <text
                x={perpResult.start.x + 8}
                y={perpResult.start.y - 8}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {lr.perpLineLabel2 || "d'"}
              </text>

              {/* Ký hiệu góc vuông */}
              {lr.showRightAngleMarker !== false && (
                <path d={rightAnglePath} stroke={strokeColor} strokeWidth={1.2} fill="none" />
              )}
            </g>
          );
        })()}

        {/* 6. HAI ĐƯỜNG / TIA / ĐOẠN CẮT NHAU (TOOL 5) */}
        {type === 'intersection' && (() => {
          const l1Kind = lr.line1Kind || 'line';
          const l2Kind = lr.line2Kind || 'line';

          // Tính đường vẽ chính
          let l1DrawStart = p1;
          let l1DrawEnd = p2;
          if (l1Kind === 'line') {
            const ext = extendLine(p1, p2, 40, 40);
            l1DrawStart = ext.start;
            l1DrawEnd = ext.end;
          } else if (l1Kind === 'ray') {
            const norm = vecNorm(vecSub(p2, p1));
            l1DrawEnd = vecAdd(p1, vecScale(norm, dist(p1, p2) + 50));
          }

          let l2DrawStart = p3;
          let l2DrawEnd = p4;
          if (l2Kind === 'line') {
            const ext = extendLine(p3, p4, 40, 40);
            l2DrawStart = ext.start;
            l2DrawEnd = ext.end;
          } else if (l2Kind === 'ray') {
            const norm = vecNorm(vecSub(p4, p3));
            l2DrawEnd = vecAdd(p3, vecScale(norm, dist(p3, p4) + 50));
          }

          const interResult = findLineRaySegmentIntersection(p1, p2, l1Kind, p3, p4, l2Kind);
          const interPt = interResult.point;
          const showExt = lr.showExtensionLines !== false;

          return (
            <g id="intersection-subgroup">
              {/* Đường/Tia/Đoạn 1 */}
              <line
                x1={l1DrawStart.x}
                y1={l1DrawStart.y}
                x2={l1DrawEnd.x}
                y2={l1DrawEnd.y}
                stroke={l1Color}
                strokeWidth={l1Width}
                strokeDasharray={l1Dash}
                markerEnd={l1Kind === 'ray' && lr.showArrows !== false ? 'url(#math-arrow-sm)' : undefined}
              />
              {/* Đường/Tia/Đoạn 2 */}
              <line
                x1={l2DrawStart.x}
                y1={l2DrawStart.y}
                x2={l2DrawEnd.x}
                y2={l2DrawEnd.y}
                stroke={l2Color}
                strokeWidth={l2Width}
                strokeDasharray={l2Dash}
                markerEnd={l2Kind === 'ray' && lr.showArrows !== false ? 'url(#math-arrow-sm)' : undefined}
              />

              {/* Đường nét đứt kéo dài nếu giao điểm nằm ngoài đoạn/tia */}
              {interPt && showExt && (
                <g id="extension-lines-group">
                  {interResult.extension1 && (
                    <line
                      x1={interResult.extension1.from.x}
                      y1={interResult.extension1.from.y}
                      x2={interResult.extension1.to.x}
                      y2={interResult.extension1.to.y}
                      stroke={l1Color}
                      strokeWidth={1.2}
                      strokeDasharray="4 3"
                    />
                  )}
                  {interResult.extension2 && (
                    <line
                      x1={interResult.extension2.from.x}
                      y1={interResult.extension2.from.y}
                      x2={interResult.extension2.to.x}
                      y2={interResult.extension2.to.y}
                      stroke={l2Color}
                      strokeWidth={1.2}
                      strokeDasharray="4 3"
                    />
                  )}
                </g>
              )}

              {/* Giao điểm O và nhãn giao điểm */}
              {interPt && lr.showIntersectionPoint !== false && (
                <g id="intersection-point">
                  <circle cx={interPt.x} cy={interPt.y} r={3.2} fill="#dc2626" />
                  <text
                    x={interPt.x + 8}
                    y={interPt.y - 8}
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontStyle="italic"
                    fill="#dc2626"
                  >
                    {lr.intersectionName || 'O'}
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* VẼ ĐIỂM VÀ NHÃN ĐIỂM ĐẦU MÚT KÈM DRAG HANDLES */}
        {pts.map((pt, idx) => {
          // Bỏ qua các điểm không cần vẽ theo type
          if (type === 'segment' && idx > 1) return null;
          if (type === 'ray' && idx > 1) return null;
          if (type === 'line' && idx > 1) return null;
          if (type === 'parallel' && idx > 2) return null;
          if (type === 'perpendicular' && idx > 2) return null;

          const pName = pNames[idx] || String.fromCharCode(65 + idx);
          const anchorVal: 'start' | 'middle' | 'end' = idx === 0 ? 'end' : 'start';
          const labelPos = {
            x: pt.x + (idx === 0 ? -14 : 12),
            y: pt.y - 12,
            textAnchor: anchorVal,
            dominantBaseline: 'central' as const,
          };

          return (
            <g key={`point-${idx}`} id={`point-${idx}-group`}>
              {/* Điểm tròn */}
              {lr.showPoints !== false && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={3.2}
                  fill="#000000"
                />
              )}

              {/* Chữ cái tên điểm */}
              {lr.showLabels !== false && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor={labelPos.textAnchor}
                  dominantBaseline={labelPos.dominantBaseline}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontStyle="italic"
                  fill="#000000"
                >
                  {pName}
                </text>
              )}

              {/* Drag Handle trong suốt để người dùng kéo thả trực tiếp */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={14}
                fill="transparent"
                stroke={draggingVertex === idx ? '#3b82f6' : 'transparent'}
                strokeWidth={2}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => handlePointerDown(idx, e)}
              />
            </g>
          );
        })}

        {/* Các đường phụ và ký hiệu hình học tự do (Giai đoạn 3.2) */}
        {renderAuxiliaryElements(
          {
            A: p1,
            B: p2,
            C: p3,
            D: p4,
            [pNames[0] || 'A']: p1,
            [pNames[1] || 'B']: p2,
            [pNames[2] || 'C']: p3,
            [pNames[3] || 'D']: p4,
            M: midpoint(p1, p2),
            AB: midpoint(p1, p2),
            CD: midpoint(p3, p4),
          },
          lr
        )}
        {renderAuxiliaryElements(
          {
            A: p1,
            B: p2,
            C: p3,
            D: p4,
            [pNames[0] || 'A']: p1,
            [pNames[1] || 'B']: p2,
            [pNames[2] || 'C']: p3,
            [pNames[3] || 'D']: p4,
            M: midpoint(p1, p2),
            AB: midpoint(p1, p2),
            CD: midpoint(p3, p4),
          },
          data
        )}
      </g>
    );
  };

  // ==========================================
  // RENDER GÓC & CHUYÊN ĐỀ GÓC SGK (GIAI ĐOẠN 2.3)
  // ==========================================
  const renderAngle = () => {
    const ang = angle || {
      type: 'single',
      vertexName: 'O',
      ray1Name: 'x',
      ray2Name: 'y',
      degrees: 60,
      autoCalculateDegrees: true,
      showDegreeValue: true,
      arcRadius: 34,
      showArc: true,
      showBisector: false,
      bisectorName: 'z',
      showEqualAngleMarks: false,
      fill: { enabled: false, color: '#fef08a', opacity: 0.35 },
      points: getAnglePresetPoints('single'),
      parallelCutConfig: {
        line1Name: 'a',
        line2Name: 'b',
        transversalName: 'c',
        vertex1Name: 'A',
        vertex2Name: 'B',
        highlightType: 'alternate-interior',
        showParallelMarkers: true,
        showAngleNumbers: true,
      },
      ray1Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' },
      ray2Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' },
    };

    const type = ang.type || 'single';
    const pts = anglePoints;
    const r1Style = ang.ray1Style || { color: strokeColor, strokeWidth: 1.8, style: 'solid' };
    const r2Style = ang.ray2Style || { color: strokeColor, strokeWidth: 1.8, style: 'solid' };

    const color1 = r1Style.color || strokeColor;
    const width1 = r1Style.strokeWidth || 1.8;
    const dash1 = getDashArray(r1Style.style);

    const arcR = ang.arcRadius || 34;

    return (
      <g id="angle-master-group">
        {/* 1. GÓC ĐƠN HOẶC TIA PHÂN GIÁC CƠ BẢN (single / bisector) */}
        {(type === 'single' || type === 'bisector') && (() => {
          const v = pts[0] || { x: 180, y: 290 };
          const pA = pts[1] || { x: 420, y: 290 };
          const pB = pts[2] || { x: 340, y: 130 };

          const currentDeg = ang.autoCalculateDegrees !== false ? calculateAngle(pA, v, pB) : (ang.degrees || 60);
          const arcGeom = getAngleArcAndFill(v, pA, pB, arcR, false);

          // Vector kéo dài tia
          const normA = vecNorm(vecSub(pA, v));
          const normB = vecNorm(vecSub(pB, v));
          const endA = vecAdd(v, vecScale(normA, dist(v, pA) + 30));
          const endB = vecAdd(v, vecScale(normB, dist(v, pB) + 30));

          // Tia phân giác
          const bisectNorm = vecNorm(vecAdd(normA, normB));
          const bisectLen = (dist(v, pA) + dist(v, pB)) / 2 + 20;
          const bisectEnd = vecAdd(v, vecScale(bisectNorm, bisectLen));

          return (
            <g id="single-angle-group">
              {/* Tô miền góc */}
              {ang.fill?.enabled && arcGeom.sectorPath && (
                <path
                  d={arcGeom.sectorPath}
                  fill={ang.fill.color || '#fef08a'}
                  fillOpacity={ang.fill.opacity ?? 0.35}
                />
              )}

              {/* 2 Tia Ox và Oy */}
              <line
                x1={v.x}
                y1={v.y}
                x2={endA.x}
                y2={endA.y}
                stroke={color1}
                strokeWidth={width1}
                strokeDasharray={dash1}
                markerEnd="url(#math-arrow-sm)"
              />
              <line
                x1={v.x}
                y1={v.y}
                x2={endB.x}
                y2={endB.y}
                stroke={color1}
                strokeWidth={width1}
                strokeDasharray={dash1}
                markerEnd="url(#math-arrow-sm)"
              />

              {/* Cung góc */}
              {ang.showArc !== false && arcGeom.arcPath && (
                <path
                  d={arcGeom.arcPath}
                  fill="none"
                  stroke={color1}
                  strokeWidth={1.3}
                />
              )}

              {/* Số đo góc */}
              {ang.showDegreeValue !== false && arcGeom.labelPos && (
                <text
                  x={arcGeom.labelPos.x}
                  y={arcGeom.labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize - 2}
                  fontWeight="bold"
                  fill="#000000"
                >
                  {currentDeg}°
                </text>
              )}

              {/* Tia phân giác Oz */}
              {(ang.showBisector || type === 'bisector') && (
                <g id="bisector-ray">
                  <line
                    x1={v.x}
                    y1={v.y}
                    x2={bisectEnd.x}
                    y2={bisectEnd.y}
                    stroke={strokeColor}
                    strokeWidth={1.4}
                    strokeDasharray="5 3"
                    markerEnd="url(#math-arrow-sm)"
                  />
                  <text
                    x={bisectEnd.x + 8}
                    y={bisectEnd.y + 4}
                    fontSize={fontSize}
                    fontStyle="italic"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    {ang.bisectorName || 'z'}
                  </text>

                  {/* Ký hiệu 2 góc bằng nhau */}
                  {ang.showEqualAngleMarks !== false && (() => {
                    const bisectPt = vecAdd(v, vecScale(bisectNorm, 100));
                    const arc1 = getAngleArcAndFill(v, pA, bisectPt, arcR - 4, false);
                    const arc2 = getAngleArcAndFill(v, bisectPt, pB, arcR + 4, false);
                    return (
                      <>
                        <path d={arc1.arcPath} fill="none" stroke={strokeColor} strokeWidth={1} />
                        <path d={arc2.arcPath} fill="none" stroke={strokeColor} strokeWidth={1} />
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Nhãn đỉnh O và 2 tia */}
              <circle cx={v.x} cy={v.y} r={3.2} fill="#000000" />
              <text
                x={v.x - 16}
                y={v.y + 16}
                fontSize={fontSize}
                fontWeight="bold"
                fontStyle="italic"
                fill="#000000"
              >
                {ang.vertexName || 'O'}
              </text>

              <text
                x={endA.x + 8}
                y={endA.y + 5}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {ang.ray1Name || 'x'}
              </text>
              <text
                x={endB.x + 5}
                y={endB.y - 8}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {ang.ray2Name || 'y'}
              </text>
            </g>
          );
        })()}

        {/* 2. HAI GÓC ĐỐI ĐỈNH (vertical-angles) */}
        {type === 'vertical-angles' && (() => {
          const v = pts[0] || { x: 280, y: 220 };
          const p1 = pts[1] || { x: 440, y: 220 };
          const p2 = pts[2] || { x: 380, y: 110 };

          // 2 đường thẳng đối đỉnh
          const p1Opp = vecAdd(v, vecScale(vecSub(v, p1), 1));
          const p2Opp = vecAdd(v, vecScale(vecSub(v, p2), 1));

          const extLine1 = extendLine(p1Opp, p1, 30, 30);
          const extLine2 = extendLine(p2Opp, p2, 30, 30);

          const arc1 = getAngleArcAndFill(v, p1, p2, 30, false);
          const arc3 = getAngleArcAndFill(v, p1Opp, p2Opp, 30, false);
          const arc2 = getAngleArcAndFill(v, p2, p1Opp, 38, false);
          const arc4 = getAngleArcAndFill(v, p2Opp, p1, 38, false);

          return (
            <g id="vertical-angles-group">
              <line
                x1={extLine1.start.x}
                y1={extLine1.start.y}
                x2={extLine1.end.x}
                y2={extLine1.end.y}
                stroke={color1}
                strokeWidth={width1}
              />
              <line
                x1={extLine2.start.x}
                y1={extLine2.start.y}
                x2={extLine2.end.x}
                y2={extLine2.end.y}
                stroke={color1}
                strokeWidth={width1}
              />

              {/* Ký hiệu vòng cung đối đỉnh 1 gạch và 2 gạch */}
              <path d={arc1.arcPath} fill="none" stroke="#2563eb" strokeWidth={1.5} />
              <path d={arc3.arcPath} fill="none" stroke="#2563eb" strokeWidth={1.5} />
              <path d={arc2.arcPath} fill="none" stroke="#dc2626" strokeWidth={1.5} />
              <path d={arc4.arcPath} fill="none" stroke="#dc2626" strokeWidth={1.5} />

              {/* Đỉnh O và số thứ tự góc */}
              <circle cx={v.x} cy={v.y} r={3} fill="#000000" />
              <text x={v.x - 12} y={v.y - 12} fontSize={fontSize} fontWeight="bold" fontStyle="italic">
                {ang.vertexName || 'O'}
              </text>

              {arc1.labelPos && (
                <text x={arc1.labelPos.x} y={arc1.labelPos.y} fontSize={12} fontWeight="bold" fill="#2563eb">
                  1
                </text>
              )}
              {arc2.labelPos && (
                <text x={arc2.labelPos.x} y={arc2.labelPos.y} fontSize={12} fontWeight="bold" fill="#dc2626">
                  2
                </text>
              )}
              {arc3.labelPos && (
                <text x={arc3.labelPos.x} y={arc3.labelPos.y} fontSize={12} fontWeight="bold" fill="#2563eb">
                  3
                </text>
              )}
              {arc4.labelPos && (
                <text x={arc4.labelPos.x} y={arc4.labelPos.y} fontSize={12} fontWeight="bold" fill="#dc2626">
                  4
                </text>
              )}

              {/* Tên đường x, x', y, y' */}
              <text x={extLine1.end.x + 8} y={extLine1.end.y + 4} fontSize={fontSize} fontStyle="italic">x</text>
              <text x={extLine1.start.x - 16} y={extLine1.start.y + 4} fontSize={fontSize} fontStyle="italic">x'</text>
              <text x={extLine2.end.x + 8} y={extLine2.end.y - 4} fontSize={fontSize} fontStyle="italic">y</text>
              <text x={extLine2.start.x - 16} y={extLine2.start.y + 12} fontSize={fontSize} fontStyle="italic">y'</text>
            </g>
          );
        })()}

        {/* 3. HAI GÓC KỀ BÙ (supplementary) */}
        {type === 'supplementary' && (() => {
          const v = pts[0] || { x: 280, y: 260 };
          const pA = pts[1] || { x: 440, y: 260 };
          const pB = pts[2] || { x: 330, y: 130 };
          const pOpp = vecAdd(v, vecScale(vecSub(v, pA), 1));

          const deg1 = calculateAngle(pA, v, pB);
          const deg2 = 180 - deg1;

          const arc1 = getAngleArcAndFill(v, pA, pB, 34, false);
          const arc2 = getAngleArcAndFill(v, pB, pOpp, 42, false);

          return (
            <g id="supplementary-group">
              {/* Đường thẳng qua v */}
              <line x1={pOpp.x - 30} y1={v.y} x2={pA.x + 30} y2={v.y} stroke={color1} strokeWidth={width1} />
              <line x1={v.x} y1={v.y} x2={pB.x} y2={pB.y} stroke={color1} strokeWidth={width1} markerEnd="url(#math-arrow-sm)" />

              {/* Cung góc 1 và 2 */}
              <path d={arc1.arcPath} fill="none" stroke="#2563eb" strokeWidth={1.4} />
              <path d={arc2.arcPath} fill="none" stroke="#ea580c" strokeWidth={1.4} />

              {/* Số đo 2 góc */}
              {ang.showDegreeValue !== false && (
                <>
                  {arc1.labelPos && (
                    <text x={arc1.labelPos.x} y={arc1.labelPos.y} fontSize={11} fontWeight="bold" fill="#2563eb">
                      {deg1}°
                    </text>
                  )}
                  {arc2.labelPos && (
                    <text x={arc2.labelPos.x} y={arc2.labelPos.y} fontSize={11} fontWeight="bold" fill="#ea580c">
                      {deg2}°
                    </text>
                  )}
                </>
              )}

              {/* Nhãn */}
              <circle cx={v.x} cy={v.y} r={3} fill="#000000" />
              <text x={v.x - 6} y={v.y + 18} fontSize={fontSize} fontWeight="bold" fontStyle="italic">{ang.vertexName || 'O'}</text>
              <text x={pA.x + 35} y={v.y + 4} fontSize={fontSize} fontStyle="italic">x</text>
              <text x={pOpp.x - 45} y={v.y + 4} fontSize={fontSize} fontStyle="italic">z</text>
              <text x={pB.x + 6} y={pB.y - 6} fontSize={fontSize} fontStyle="italic">y</text>
            </g>
          );
        })()}

        {/* 4. CÁT TUYẾN CẮT 2 ĐƯỜNG SONG SONG (parallel-transversal) */}
        {type === 'parallel-transversal' && (() => {
          const pA1 = pts[0] || { x: 100, y: 150 };
          const pA2 = pts[1] || { x: 460, y: 150 };
          const pB1 = pts[2] || { x: 100, y: 290 };
          const pB2 = pts[3] || { x: 460, y: 290 };

          // Điểm cắt A trên đường 1, B trên đường 2
          const ptA = { x: 260, y: 150 };
          const ptB = { x: 300, y: 290 };

          const transExt = extendLine(ptA, ptB, 50, 50);
          const arrow1 = getParallelArrowsPath(pA1, pA2, 1);
          const arrow2 = getParallelArrowsPath(pB1, pB2, 1);

          const hlType = ang.parallelCutConfig?.highlightType || 'alternate-interior';

          return (
            <g id="parallel-transversal-group">
              {/* Đường a và b */}
              <line x1={pA1.x} y1={pA1.y} x2={pA2.x} y2={pA2.y} stroke={color1} strokeWidth={width1} />
              <line x1={pB1.x} y1={pB1.y} x2={pB2.x} y2={pB2.y} stroke={color1} strokeWidth={width1} />

              {/* Cát tuyến c */}
              <line
                x1={transExt.start.x}
                y1={transExt.start.y}
                x2={transExt.end.x}
                y2={transExt.end.y}
                stroke="#475569"
                strokeWidth={width1}
              />

              {/* Mũi tên song song */}
              <path d={arrow1} stroke={strokeColor} strokeWidth={1.4} fill="none" />
              <path d={arrow2} stroke={strokeColor} strokeWidth={1.4} fill="none" />

              {/* Tên đường */}
              <text x={pA2.x + 8} y={pA2.y + 4} fontSize={fontSize} fontStyle="italic" fontWeight="bold">a</text>
              <text x={pB2.x + 8} y={pB2.y + 4} fontSize={fontSize} fontStyle="italic" fontWeight="bold">b</text>
              <text x={transExt.start.x + 8} y={transExt.start.y} fontSize={fontSize} fontStyle="italic" fontWeight="bold">c</text>

              {/* Điểm A và B */}
              <circle cx={ptA.x} cy={ptA.y} r={3} fill="#000000" />
              <circle cx={ptB.x} cy={ptB.y} r={3} fill="#000000" />
              <text x={ptA.x - 18} y={ptA.y - 6} fontSize={fontSize} fontWeight="bold" fontStyle="italic">A</text>
              <text x={ptB.x - 18} y={ptB.y + 16} fontSize={fontSize} fontWeight="bold" fontStyle="italic">B</text>

              {/* Đánh dấu góc So le trong / Đồng vị / Trong cùng phía */}
              {hlType === 'alternate-interior' && (
                <g id="alternate-interior-arcs">
                  {/* A4 và B2 */}
                  <path d={`M ${ptA.x + 20} ${ptA.y} A 20 20 0 0 1 ${ptA.x + 8} ${ptA.y + 18}`} fill="none" stroke="#2563eb" strokeWidth={1.6} />
                  <path d={`M ${ptB.x - 20} ${ptB.y} A 20 20 0 0 1 ${ptB.x - 8} ${ptB.y - 18}`} fill="none" stroke="#2563eb" strokeWidth={1.6} />
                  <text x={ptA.x + 18} y={ptA.y + 16} fontSize={11} fontWeight="bold" fill="#2563eb">4</text>
                  <text x={ptB.x - 22} y={ptB.y - 12} fontSize={11} fontWeight="bold" fill="#2563eb">2</text>
                </g>
              )}
              {hlType === 'corresponding' && (
                <g id="corresponding-arcs">
                  {/* A1 và B1 */}
                  <path d={`M ${ptA.x + 22} ${ptA.y} A 22 22 0 0 0 ${ptA.x - 6} ${ptA.y - 20}`} fill="none" stroke="#16a34a" strokeWidth={1.6} />
                  <path d={`M ${ptB.x + 22} ${ptB.y} A 22 22 0 0 0 ${ptB.x - 6} ${ptB.y - 20}`} fill="none" stroke="#16a34a" strokeWidth={1.6} />
                  <text x={ptA.x + 14} y={ptA.y - 12} fontSize={11} fontWeight="bold" fill="#16a34a">1</text>
                  <text x={ptB.x + 14} y={ptB.y - 12} fontSize={11} fontWeight="bold" fill="#16a34a">1</text>
                </g>
              )}
            </g>
          );
        })()}

        {/* DRAG HANDLES CHO GÓC */}
        {pts.map((pt, idx) => {
          if (type === 'supplementary' && idx > 2) return null;
          if (type === 'single' && idx > 2) return null;
          if (type === 'bisector' && idx > 2) return null;

          return (
            <circle
              key={`angle-drag-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={14}
              fill="transparent"
              stroke={draggingVertex === idx ? '#ec4899' : 'transparent'}
              strokeWidth={2}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => handlePointerDown(idx, e)}
            />
          );
        })}

        {/* Các đường phụ và ký hiệu hình học tự do (Giai đoạn 3.2) */}
        {renderAuxiliaryElements(
          {
            O: pts[0] || { x: 180, y: 290 },
            A: pts[1] || { x: 420, y: 290 },
            B: pts[2] || { x: 340, y: 130 },
            C: pts[3] || { x: 460, y: 290 },
            [ang.vertexName || 'O']: pts[0] || { x: 180, y: 290 },
          },
          ang
        )}
        {renderAuxiliaryElements(
          {
            O: pts[0] || { x: 180, y: 290 },
            A: pts[1] || { x: 420, y: 290 },
            B: pts[2] || { x: 340, y: 130 },
            C: pts[3] || { x: 460, y: 290 },
            [ang.vertexName || 'O']: pts[0] || { x: 180, y: 290 },
          },
          data
        )}
      </g>
    );
  };

  // =========================================================================
  // RENDER ĐA GIÁC ĐỀU (NHÓM 2 - CÔNG CỤ 3)
  // =========================================================================
  const renderRegularPolygon = () => {
    const defaultSides = getPolygonPresetSides(polygon?.type || 'pentagon');
    const sidesCount = polygon?.sidesCount || defaultSides;
    const center = polygon?.center || { x: width / 2, y: height / 2 };
    const radius = polygon?.radius || 120;
    const rotDeg = polygon?.rotationAngle ?? -90;

    const points =
      polygon?.points && polygon.points.length === sidesCount
        ? polygon.points
        : getRegularPolygonPresetPoints(polygon?.type || 'pentagon', center, radius, rotDeg, sidesCount);

    const defaultNames = getDefaultPolygonVertexNames(sidesCount);
    const vertexNames =
      polygon?.vertexNames && polygon.vertexNames.length === sidesCount
        ? polygon.vertexNames
        : defaultNames;

    const showVertices = polygon?.showVertices !== false;
    const showLabels = polygon?.showLabels !== false;
    const showCenter = polygon?.showCenter !== false;
    const centerName = polygon?.centerName || 'O';

    const pFill = polygon?.fill || { enabled: false, color: '#3b82f6', opacity: 0.2 };
    const pStroke = polygon?.strokeColor || strokeColor;
    const pWidth = polygon?.strokeWidth || strokeWidth;
    const pDash = getDashArray(polygon?.strokeStyle);

    const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');

    // 1. Đường tròn ngoại tiếp (Circumcircle)
    let circumcircleSvg: React.ReactNode = null;
    if (polygon?.showCircumcircle) {
      const cDash = getDashArray(polygon.circumcircleStyle || 'dashed');
      const cColor = polygon.circumcircleColor || '#2563eb';
      circumcircleSvg = (
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke={cColor}
          strokeWidth={1.3}
          strokeDasharray={cDash}
        />
      );
    }

    // 2. Đường tròn nội tiếp (Incircle) - Bán kính r = R * cos(pi / n)
    let incircleSvg: React.ReactNode = null;
    const inRadius = radius * Math.cos(Math.PI / sidesCount);
    if (polygon?.showIncircle) {
      const iDash = getDashArray(polygon.incircleStyle || 'dashed');
      const iColor = polygon.incircleColor || '#16a34a';
      incircleSvg = (
        <circle
          cx={center.x}
          cy={center.y}
          r={inRadius}
          fill="none"
          stroke={iColor}
          strokeWidth={1.3}
          strokeDasharray={iDash}
        />
      );
    }

    // 3. Trung đoạn (Apothem OH ⊥ AB)
    let apothemSvg: React.ReactNode = null;
    if (polygon?.showApothem && points.length >= 2) {
      const p0 = points[0];
      const p1 = points[1];
      const midEdge = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const apName = polygon.apothemName || 'H';
      const raPath = getRightAngleMarkerPath(midEdge, center, p0, 9);
      const apColor = polygon.apothemStyle?.strokeColor || '#dc2626';
      const apDash = getDashArray(polygon.apothemStyle?.strokeStyle || 'dashed');
      const hPos = getSmartVertexLabelPosition(midEdge, p0, center, 14);

      apothemSvg = (
        <g id="polygon-apothem">
          <line
            x1={center.x}
            y1={center.y}
            x2={midEdge.x}
            y2={midEdge.y}
            stroke={apColor}
            strokeWidth={1.4}
            strokeDasharray={apDash}
          />
          {polygon.showApothemRightAngle !== false && (
            <path d={raPath} fill="none" stroke={apColor} strokeWidth={1} />
          )}
          <circle cx={midEdge.x} cy={midEdge.y} r={2.5} fill={apColor} />
          {showLabels && (
            <text
              x={hPos.x}
              y={hPos.y}
              textAnchor={hPos.textAnchor}
              dominantBaseline={hPos.dominantBaseline}
              fontSize={fontSize - 2}
              fontStyle="italic"
              fontWeight="bold"
              fill={apColor}
              fontFamily={fontFamily}
            >
              {apName}
            </text>
          )}
        </g>
      );
    }

    // 4. Bán kính OA, OB, OC...
    let radiiSvg: React.ReactNode = null;
    if (polygon?.showRadii) {
      const rColor = polygon.radiiStyle?.strokeColor || '#64748b';
      const rDash = getDashArray(polygon.radiiStyle?.strokeStyle || 'dashed');
      radiiSvg = (
        <g id="polygon-radii">
          {points.map((p, i) => (
            <line
              key={`rad-${i}`}
              x1={center.x}
              y1={center.y}
              x2={p.x}
              y2={p.y}
              stroke={rColor}
              strokeWidth={1.1}
              strokeDasharray={rDash}
            />
          ))}
        </g>
      );
    }

    // 5. Đường chéo (Diagonals)
    let diagonalsSvg: React.ReactNode = null;
    if (polygon?.showDiagonals) {
      const dColor = polygon.diagonalsStyle?.strokeColor || '#94a3b8';
      const dDash = getDashArray(polygon.diagonalsStyle?.strokeStyle || 'dashed');
      const diagLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

      if (polygon.diagonalsType === 'all') {
        for (let i = 0; i < points.length; i++) {
          for (let j = i + 2; j < points.length; j++) {
            if (i === 0 && j === points.length - 1) continue;
            diagLines.push({
              x1: points[i].x,
              y1: points[i].y,
              x2: points[j].x,
              y2: points[j].y,
            });
          }
        }
      } else {
        if (sidesCount % 2 === 0) {
          const half = sidesCount / 2;
          for (let i = 0; i < half; i++) {
            diagLines.push({
              x1: points[i].x,
              y1: points[i].y,
              x2: points[i + half].x,
              y2: points[i + half].y,
            });
          }
        } else {
          for (let i = 0; i < points.length; i++) {
            const opp1 = (i + Math.floor(sidesCount / 2)) % sidesCount;
            diagLines.push({
              x1: points[i].x,
              y1: points[i].y,
              x2: points[opp1].x,
              y2: points[opp1].y,
            });
          }
        }
      }

      diagonalsSvg = (
        <g id="polygon-diagonals">
          {diagLines.map((d, i) => (
            <line
              key={`diag-${i}`}
              x1={d.x1}
              y1={d.y1}
              x2={d.x2}
              y2={d.y2}
              stroke={dColor}
              strokeWidth={1.1}
              strokeDasharray={dDash}
            />
          ))}
        </g>
      );
    }

    // 6. Ký hiệu các cạnh bằng nhau
    let equalSidesSvg: React.ReactNode = null;
    if (polygon?.showEqualSidesMarkers) {
      equalSidesSvg = (
        <g id="polygon-equal-sides" stroke={pStroke} strokeWidth={1.2}>
          {points.map((p, i) => {
            const nextP = points[(i + 1) % points.length];
            const ticks = getSegmentTickMarks(p, nextP, 1, 8, 3);
            return (
              <React.Fragment key={`eq-side-${i}`}>
                {Array.isArray(ticks) &&
                  ticks.map((t, ti) => (
                    <line key={`t-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
                  ))}
              </React.Fragment>
            );
          })}
        </g>
      );
    }

    // 7. Ký hiệu các góc bằng nhau
    let equalAnglesSvg: React.ReactNode = null;
    if (polygon?.showEqualAnglesMarkers) {
      equalAnglesSvg = (
        <g id="polygon-equal-angles" stroke={pStroke} strokeWidth={1.1} fill="none">
          {points.map((p, i) => {
            const prevP = points[(i - 1 + points.length) % points.length];
            const nextP = points[(i + 1) % points.length];
            const arc = getEqualAngleArcPath(p, prevP, nextP, 18);
            return <path key={`eq-ang-${i}`} d={arc.path} />;
          })}
        </g>
      );
    }

    // 8. Nhãn độ dài cạnh (e.g. "a")
    let sideLengthSvg: React.ReactNode = null;
    if (polygon?.showSideLengths && points.length >= 2) {
      const p0 = points[0];
      const p1 = points[1];
      const midEdge = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const labelPos = getSmartVertexLabelPosition(midEdge, center, p0, 16);
      sideLengthSvg = (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor={labelPos.textAnchor}
          dominantBaseline={labelPos.dominantBaseline}
          fontSize={fontSize - 2}
          fontStyle="italic"
          fill="#334155"
          fontFamily={fontFamily}
        >
          {polygon.sideLengthLabel || 'a'}
        </text>
      );
    }

    const namedPolyPoints: Record<string, Point2D> = {
      [centerName]: center,
      O: center,
    };
    points.forEach((p, idx) => {
      const name = vertexNames[idx] || `A${idx + 1}`;
      namedPolyPoints[name] = p;
    });

    return (
      <g id="regular-polygon-group">
        {/* Tô miền */}
        {pFill.enabled && (
          <polygon
            points={pointsString}
            fill={pFill.color || '#3b82f6'}
            fillOpacity={pFill.opacity ?? 0.25}
            stroke="none"
          />
        )}

        {/* Các yếu tố hình học bên trong */}
        {circumcircleSvg}
        {incircleSvg}
        {diagonalsSvg}
        {radiiSvg}
        {apothemSvg}
        {equalAnglesSvg}

        {/* Các cạnh của đa giác */}
        <polygon
          points={pointsString}
          fill="none"
          stroke={pStroke}
          strokeWidth={pWidth}
          strokeDasharray={pDash}
          strokeLinejoin="round"
        />

        {equalSidesSvg}
        {sideLengthSvg}

        {/* Tâm O */}
        {showCenter && (
          <g id="polygon-center" className="cursor-grab active:cursor-grabbing">
            <circle
              cx={center.x}
              cy={center.y}
              r={14}
              fill="transparent"
              onPointerDown={(e) => handlePointerDown(0, e)}
            />
            <circle cx={center.x} cy={center.y} r={3.5} fill={pStroke} />
            {showLabels && (
              <text
                x={center.x + 8}
                y={center.y - 8}
                fontSize={fontSize}
                fontStyle="italic"
                fontWeight="bold"
                fill={pStroke}
                fontFamily={fontFamily}
              >
                {centerName}
              </text>
            )}
          </g>
        )}

        {/* Đỉnh và nhãn đỉnh */}
        {showVertices && (
          <g id="polygon-vertices">
            {points.map((p, i) => {
              const vName = vertexNames[i] || `A_{${i + 1}}`;
              const labelPos = getSmartVertexLabelPosition(p, center, points[(i + 1) % points.length], 18);
              return (
                <g key={`poly-v-${i}`} className="cursor-grab active:cursor-grabbing">
                  {/* Vùng cảm ứng kéo đỉnh */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="transparent"
                    onPointerDown={(e) => handlePointerDown(i + 1, e)}
                  />
                  <circle cx={p.x} cy={p.y} r={draggingVertex === i + 1 ? 4.5 : 3} fill={pStroke} />
                  {showLabels && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor={labelPos.textAnchor}
                      dominantBaseline={labelPos.dominantBaseline}
                      fontSize={fontSize}
                      fontStyle="italic"
                      fontWeight="bold"
                      fill={pStroke}
                      fontFamily={fontFamily}
                    >
                      {vName}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Các đường phụ tự do */}
        {renderAuxiliaryElements(namedPolyPoints, polygon || {})}
        {renderAuxiliaryElements(namedPolyPoints, data)}
      </g>
    );
  };

  // =========================================================================
  // RENDER PHÉP ĐỐI XỨNG TRỤC & ĐỐI XỨNG TÂM (NHÓM 2 - CÔNG CỤ 2)
  // =========================================================================
  const renderSymmetry = () => {
    const sym: SymmetryData = symmetry || {
      type: 'axial',
      targetShape: 'triangle',
      ...getSymmetryPresetPoints('axial', 'triangle'),
    };

    const symType = sym.type || 'axial';
    const targetShape = sym.targetShape || 'triangle';
    const origPoints =
      sym.originalPoints && sym.originalPoints.length > 0
        ? sym.originalPoints
        : getSymmetryPresetPoints(symType, targetShape).originalPoints;

    const axisPoints: [Point2D, Point2D] =
      sym.axisPoints && sym.axisPoints.length === 2
        ? sym.axisPoints
        : [
            { x: width / 2, y: 50 },
            { x: width / 2, y: height - 50 },
          ];

    const centerPoint = sym.centerPoint || { x: width / 2, y: height / 2 };
    const centerName = sym.centerName || 'I';

    const origNames = sym.originalNames || ['A', 'B', 'C', 'D'];
    const reflNames = sym.reflectedNames || ["A'", "B'", "C'", "D'"];

    // Tính các điểm đối xứng chính xác
    const reflPoints = computeReflectedPoints(symType, origPoints, axisPoints, centerPoint);

    const origColor = sym.originalStyle?.strokeColor || '#2563eb';
    const origWidth = sym.originalStyle?.strokeWidth || strokeWidth;
    const origDash = getDashArray(sym.originalStyle?.strokeStyle || 'solid');

    const reflColor = sym.reflectedStyle?.strokeColor || '#dc2626';
    const reflWidth = sym.reflectedStyle?.strokeWidth || strokeWidth;
    const reflDash = getDashArray(sym.reflectedStyle?.strokeStyle || 'solid');

    const axisColor = sym.axisStyle?.strokeColor || '#475569';
    const axisDash = getDashArray(sym.axisStyle?.strokeStyle || 'dashed');

    const showOrigLabels = sym.showOriginalLabels !== false;
    const showReflLabels = sym.showReflectedLabels !== false;
    const showConnecting = sym.showConnectingDashedLines !== false;
    const showRightAngles = sym.showRightAngleMarkers !== false && symType === 'axial';
    const showEqualDist = sym.showEqualDistanceMarkers !== false;

    // Helper render shape geometry
    const renderShapeGeometry = (pts: Point2D[], color: string, width: number, dash?: string, fill?: any) => {
      if (targetShape === 'point' && pts.length >= 1) {
        return <circle cx={pts[0].x} cy={pts[0].y} r={3.5} fill={color} />;
      } else if (targetShape === 'segment' && pts.length >= 2) {
        return (
          <line
            x1={pts[0].x}
            y1={pts[0].y}
            x2={pts[1].x}
            y2={pts[1].y}
            stroke={color}
            strokeWidth={width}
            strokeDasharray={dash}
            strokeLinecap="round"
          />
        );
      } else if (targetShape === 'circle' && pts.length >= 2) {
        const r = sym.circleRadius || dist(pts[0], pts[1]);
        return (
          <g>
            {fill?.enabled && (
              <circle cx={pts[0].x} cy={pts[0].y} r={r} fill={fill.color || color} fillOpacity={fill.opacity ?? 0.2} />
            )}
            <circle cx={pts[0].x} cy={pts[0].y} r={r} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} />
            <circle cx={pts[0].x} cy={pts[0].y} r={2.8} fill={color} />
          </g>
        );
      } else if ((targetShape === 'triangle' || targetShape === 'quadrilateral') && pts.length >= 3) {
        const ptsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <g>
            {fill?.enabled && (
              <polygon points={ptsStr} fill={fill.color || color} fillOpacity={fill.opacity ?? 0.2} stroke="none" />
            )}
            <polygon points={ptsStr} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinejoin="round" />
          </g>
        );
      }
      return null;
    };

    // 1. Render Trục đối xứng d (nếu symType === 'axial')
    let axisSvg: React.ReactNode = null;
    if (symType === 'axial') {
      const [ax1, ax2] = axisPoints;
      const ext = extendLine(ax1, ax2, 80, 80);
      const axisLabel = sym.axisLabel || 'd';
      axisSvg = (
        <g id="symmetry-axis">
          <line
            x1={ext.start.x}
            y1={ext.start.y}
            x2={ext.end.x}
            y2={ext.end.y}
            stroke={axisColor}
            strokeWidth={1.5}
            strokeDasharray={axisDash}
          />
          <text
            x={ext.end.x + 8}
            y={ext.end.y}
            fontSize={fontSize}
            fontStyle="italic"
            fontWeight="bold"
            fill={axisColor}
            fontFamily={fontFamily}
          >
            {axisLabel}
          </text>
          {/* Draggable control handles cho trục */}
          <g className="cursor-grab active:cursor-grabbing">
            <circle
              cx={ax1.x}
              cy={ax1.y}
              r={14}
              fill="transparent"
              onPointerDown={(e) => handlePointerDown(100, e)}
            />
            <circle cx={ax1.x} cy={ax1.y} r={3} fill={axisColor} opacity={0.6} />
          </g>
          <g className="cursor-grab active:cursor-grabbing">
            <circle
              cx={ax2.x}
              cy={ax2.y}
              r={14}
              fill="transparent"
              onPointerDown={(e) => handlePointerDown(101, e)}
            />
            <circle cx={ax2.x} cy={ax2.y} r={3} fill={axisColor} opacity={0.6} />
          </g>
        </g>
      );
    }

    // 2. Render Tâm đối xứng I (nếu symType === 'central')
    let centerSvg: React.ReactNode = null;
    if (symType === 'central') {
      centerSvg = (
        <g id="symmetry-center" className="cursor-grab active:cursor-grabbing">
          <circle
            cx={centerPoint.x}
            cy={centerPoint.y}
            r={14}
            fill="transparent"
            onPointerDown={(e) => handlePointerDown(200, e)}
          />
          <circle cx={centerPoint.x} cy={centerPoint.y} r={3.8} fill="#0f172a" />
          <text
            x={centerPoint.x + 8}
            y={centerPoint.y - 8}
            fontSize={fontSize}
            fontStyle="italic"
            fontWeight="bold"
            fill="#0f172a"
            fontFamily={fontFamily}
          >
            {centerName}
          </text>
        </g>
      );
    }

    // 3. Render các đường dóng đối xứng (Connecting lines AA', BB'...)
    const connectingElementsSvg = origPoints.map((pOrig, idx) => {
      const pRefl = reflPoints[idx];
      if (!pRefl) return null;

      if (symType === 'axial') {
        const [ax1, ax2] = axisPoints;
        const proj = projectPointToLine(pOrig, ax1, ax2);
        const foot = proj.point;
        const raPath = getRightAngleMarkerPath(foot, pOrig, ax1, 9);
        const tick1 = getSegmentTickMarks(pOrig, foot, 1, 7, 2.5);
        const tick2 = getSegmentTickMarks(foot, pRefl, 1, 7, 2.5);

        return (
          <g key={`sym-conn-${idx}`} id={`connecting-line-${idx}`}>
            {showConnecting && (
              <line
                x1={pOrig.x}
                y1={pOrig.y}
                x2={pRefl.x}
                y2={pRefl.y}
                stroke="#64748b"
                strokeWidth={1.1}
                strokeDasharray="4 3"
              />
            )}
            {showRightAngles && (
              <path d={raPath} fill="none" stroke="#64748b" strokeWidth={1} />
            )}
            {showEqualDist && (
              <g stroke="#64748b" strokeWidth={1.1}>
                {Array.isArray(tick1) &&
                  tick1.map((t, ti) => <line key={`t1-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />)}
                {Array.isArray(tick2) &&
                  tick2.map((t, ti) => <line key={`t2-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />)}
              </g>
            )}
            <circle cx={foot.x} cy={foot.y} r={2} fill="#64748b" />
          </g>
        );
      } else {
        const tick1 = getSegmentTickMarks(pOrig, centerPoint, 1, 7, 2.5);
        const tick2 = getSegmentTickMarks(centerPoint, pRefl, 1, 7, 2.5);
        return (
          <g key={`sym-conn-c-${idx}`} id={`connecting-center-line-${idx}`}>
            {showConnecting && (
              <line
                x1={pOrig.x}
                y1={pOrig.y}
                x2={pRefl.x}
                y2={pRefl.y}
                stroke="#64748b"
                strokeWidth={1.1}
                strokeDasharray="4 3"
              />
            )}
            {showEqualDist && (
              <g stroke="#64748b" strokeWidth={1.1}>
                {Array.isArray(tick1) &&
                  tick1.map((t, ti) => <line key={`tc1-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />)}
                {Array.isArray(tick2) &&
                  tick2.map((t, ti) => <line key={`tc2-${ti}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />)}
              </g>
            )}
          </g>
        );
      }
    });

    const namedSymPoints: Record<string, Point2D> = {
      [centerName]: centerPoint,
      I: centerPoint,
    };
    origPoints.forEach((p, idx) => {
      namedSymPoints[origNames[idx] || `A${idx + 1}`] = p;
    });
    reflPoints.forEach((p, idx) => {
      namedSymPoints[reflNames[idx] || `A'${idx + 1}`] = p;
    });

    return (
      <g id="symmetry-group">
        {/* Đường nối và ký hiệu vuông góc/bằng nhau */}
        {connectingElementsSvg}

        {/* Trục / Tâm */}
        {axisSvg}
        {centerSvg}

        {/* Hình gốc */}
        <g id="symmetry-original-shape">
          {renderShapeGeometry(origPoints, origColor, origWidth, origDash, sym.originalFill)}
        </g>

        {/* Hình đối xứng */}
        <g id="symmetry-reflected-shape">
          {renderShapeGeometry(reflPoints, reflColor, reflWidth, reflDash, sym.reflectedFill)}
        </g>

        {/* Điểm & Nhãn hình gốc (Draggable) */}
        <g id="original-vertices">
          {origPoints.map((p, idx) => {
            const name = origNames[idx] || `A${idx + 1}`;
            return (
              <g key={`orig-v-${idx}`} className="cursor-grab active:cursor-grabbing">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="transparent"
                  onPointerDown={(e) => handlePointerDown(idx, e)}
                />
                <circle cx={p.x} cy={p.y} r={draggingVertex === idx ? 4.5 : 3} fill={origColor} />
                {showOrigLabels && (
                  <text
                    x={p.x - 10}
                    y={p.y - 10}
                    fontSize={fontSize}
                    fontStyle="italic"
                    fontWeight="bold"
                    fill={origColor}
                    fontFamily={fontFamily}
                  >
                    {name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Điểm & Nhãn hình đối xứng */}
        <g id="reflected-vertices">
          {reflPoints.map((p, idx) => {
            const name = reflNames[idx] || `A'${idx + 1}`;
            return (
              <g key={`refl-v-${idx}`}>
                <circle cx={p.x} cy={p.y} r={3} fill={reflColor} />
                {showReflLabels && (
                  <text
                    x={p.x + 10}
                    y={p.y - 10}
                    fontSize={fontSize}
                    fontStyle="italic"
                    fontWeight="bold"
                    fill={reflColor}
                    fontFamily={fontFamily}
                  >
                    {name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Các đường phụ tự do */}
        {renderAuxiliaryElements(namedSymPoints, sym || {})}
        {renderAuxiliaryElements(namedSymPoints, data)}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      id="svg-math-canvas"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
      width={width}
      height={height}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        fontFamily,
        backgroundColor: settings.backgroundColor || '#ffffff',
        touchAction: 'none',
      }}
      className="select-none mx-auto block max-w-full h-auto"
    >
      <SvgPatternDefs />

      <rect x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height} fill={settings.backgroundColor || '#ffffff'} />


      {subType === 'triangle' && renderTriangle()}
      {subType === 'quadrilateral' && renderQuadrilateral()}
      {subType === 'line-ray' && renderLineRay()}
      {subType === 'circle' && renderCircle()}
      {subType === 'angle' && renderAngle()}
      {subType === 'polygon' && renderRegularPolygon()}
      {subType === 'symmetry' && renderSymmetry()}
    </svg>
  );
};
