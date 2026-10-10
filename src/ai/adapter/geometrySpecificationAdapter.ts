/**
 * geometrySpecificationAdapter.ts
 * Chuyển đổi GeometrySpecification (lớp dữ liệu trung gian từ AI) sang ChartDocument của Geometry Engine hiện tại
 */
import { GeometrySpecification } from '../types';
import {
  ChartDocument,
  Point2D,
  TriangleData,
  QuadData,
  CircleData,
  LineRayData,
  AngleData,
  PolygonData,
  SymmetryData,
  ToolType,
  BaseChartSettings,
} from '../../types';
import {
  getQuadPresetPoints,
  getLineRayPresetPoints,
  getAnglePresetPoints,
  getCirclePresetPoints,
  getRegularPolygonPresetPoints,
  getSymmetryPresetPoints,
  getDefaultPolygonVertexNames,
} from '../../utils/geometryMath';

export class GeometrySpecificationAdapter {
  /**
   * Chuyển GeometrySpecification thành ChartDocument hoàn chỉnh
   */
  public static specToChartDocument(
    spec: GeometrySpecification,
    currentSettings?: BaseChartSettings
  ): ChartDocument {
    const baseSettings: BaseChartSettings = currentSettings || {
      title: spec.title || 'HÌNH VẼ TOÁN HỌC THCS',
      fontFamily: 'Times New Roman',
      titleFontSize: 18,
      labelFontSize: 14,
      strokeWidth: 1.4,
      examMode: false,
      width: 600,
      height: 450,
      showLegend: false,
      legendPosition: 'none',
      backgroundColor: '#ffffff',
    };

    baseSettings.title = spec.title || baseSettings.title;

    let docType: ToolType = 'GEOMETRY_TRIANGLE';
    const data: ChartDocument['data'] = {};

    switch (spec.shapeCategory) {
      case 'triangle': {
        docType = 'GEOMETRY_TRIANGLE';
        data.geometry = {
          subType: 'triangle',
          triangle: this.buildTriangleData(spec),
        };
        break;
      }
      case 'quadrilateral': {
        docType = 'GEOMETRY_QUADRILATERAL';
        data.geometry = {
          subType: 'quadrilateral',
          quadrilateral: this.buildQuadData(spec),
        };
        break;
      }
      case 'circle': {
        docType = 'GEOMETRY_CIRCLE';
        data.geometry = {
          subType: 'circle',
          circle: this.buildCircleData(spec),
        };
        break;
      }
      case 'line-ray': {
        docType = 'GEOMETRY_LINE_RAY';
        data.geometry = {
          subType: 'line-ray',
          lineRay: this.buildLineRayData(spec),
        };
        break;
      }
      case 'angle': {
        docType = 'GEOMETRY_ANGLE';
        data.geometry = {
          subType: 'angle',
          angle: this.buildAngleData(spec),
        };
        break;
      }
      case 'polygon': {
        docType = 'GEOMETRY_POLYGON';
        data.geometry = {
          subType: 'polygon',
          polygon: this.buildPolygonData(spec, baseSettings),
        };
        break;
      }
      case 'symmetry': {
        docType = 'GEOMETRY_SYMMETRY';
        data.geometry = {
          subType: 'symmetry',
          symmetry: this.buildSymmetryData(spec),
        };
        break;
      }
      default: {
        docType = 'GEOMETRY_TRIANGLE';
        data.geometry = {
          subType: 'triangle',
          triangle: this.buildTriangleData(spec),
        };
      }
    }

    return {
      id: 'doc_' + Date.now(),
      type: docType,
      title: spec.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: baseSettings,
      data,
    };
  }

  /**
   * Chuyển các phép dựng phụ của Gemini sang cấu trúc đã được SVG hỗ trợ.
   * Không suy đoán tọa độ; các điểm được tính lại theo vị trí đỉnh lúc render.
   */
  private static buildAuxiliaryData(spec: GeometrySpecification) {
    const namedSpecialPoints = new Set([
      ...(spec.altitudes || []).map(item => item.foot),
      ...(spec.medians || []).map(item => item.midpoint),
      ...(spec.bisectors || []).map(item => item.foot),
    ]);
    const segmentKey = (from: string, to: string) => [from, to].sort().join(':');
    const specialSegments = new Set([
      ...(spec.altitudes || []).map(item => segmentKey(item.from, item.foot)),
      ...(spec.medians || []).map(item => segmentKey(item.from, item.midpoint)),
      ...(spec.bisectors || []).map(item => segmentKey(item.from, item.foot)),
    ]);

    // Đường cao/trung tuyến đã có renderer và ký hiệu riêng; không vẽ đè lần hai.
    const auxPoints: NonNullable<TriangleData['auxPoints']> = (spec.auxPoints || [])
      .filter(point => Boolean(point.name) && !namedSpecialPoints.has(point.name))
      .map((point, index) => ({
        ...point,
        id: `ai-point-${index}`,
        showPoint: true,
        showLabel: true,
      }));

    // Một điểm hình chiếu D của H phải có cả đoạn HD ngay cả khi AI quên auxLines.
    const projectionSegments = auxPoints
      .filter(point => point.type === 'projection' && Boolean(point.fromPoint))
      .map(point => ({ from: point.fromPoint!, to: point.name, style: 'solid' as const }));
    const usedSegments = new Set(specialSegments);
    const auxLines: NonNullable<TriangleData['auxLines']> = [];
    for (const line of [...(spec.auxLines || []), ...projectionSegments]) {
      if (!line.from || !line.to || line.from === line.to) continue;
      const key = segmentKey(line.from, line.to);
      if (usedSegments.has(key)) continue;
      usedSegments.add(key);
      auxLines.push({
        id: `ai-line-${auxLines.length}`,
        from: line.from,
        to: line.to,
        style: line.style || 'solid',
        label: line.label,
        enabled: true,
      });
    }

    const rightAngleMarkers: NonNullable<TriangleData['rightAngleMarkers']> = [];
    const markerKeys = new Set<string>();
    const candidates = [
      ...(spec.rightAngles || []),
      ...auxPoints
        .filter(point => point.type === 'projection' && point.fromPoint && point.targetLine)
        .map(point => ({
          vertex: point.name,
          ray1: point.fromPoint!,
          ray2: Array.isArray(point.targetLine) ? point.targetLine[0] : point.targetLine![0],
        })),
    ];
    for (const marker of candidates) {
      if (!marker.vertex || !marker.ray1 || !marker.ray2) continue;
      const key = [marker.vertex, ...[marker.ray1, marker.ray2].sort()].join(':');
      if (markerKeys.has(key)) continue;
      markerKeys.add(key);
      rightAngleMarkers.push({ id: `ai-right-${rightAngleMarkers.length}`, ...marker, enabled: true });
    }

    const equalSidesMarkers: NonNullable<TriangleData['equalSidesMarkers']> =
      (spec.equalSegments || []).map((item, index) => ({
        id: `ai-equal-${index}`,
        segments: item.segments,
        tickType: item.tickType || 1,
        enabled: true,
      }));
    const equalAnglesMarkers: NonNullable<TriangleData['equalAnglesMarkers']> =
      (spec.equalAngles || []).map((item, index) => ({
        id: `ai-angle-${index}`,
        angles: item.angles,
        enabled: true,
      }));
    const parallelMarkers: NonNullable<TriangleData['parallelMarkers']> =
      (spec.parallels || []).map((item, index) => ({
        id: `ai-parallel-${index}`,
        segment1: item.line1,
        segment2: item.line2,
        arrowCount: item.arrowCount || 1,
        enabled: true,
      }));

    return { auxPoints, auxLines, rightAngleMarkers, equalSidesMarkers, equalAnglesMarkers, parallelMarkers };
  }

  /**
   * Tạo dữ liệu TriangleData từ spec
   */
  private static buildTriangleData(spec: GeometrySpecification): TriangleData {
    const triSpec = spec.triangle || {
      type: 'general',
      vertices: ['A', 'B', 'C'],
    };

    const triType = triSpec.type || 'general';
    const specialRole = triSpec.specialVertex
      ? triSpec.vertices.indexOf(triSpec.specialVertex)
      : 0;
    let points: [Point2D, Point2D, Point2D] = [
      { x: 215, y: 110 },
      { x: 130, y: 340 },
      { x: 430, y: 340 },
    ];

    if (triType === 'right' || triType === 'right-isosceles') {
      const leg = triType === 'right-isosceles' ? 210 : 270;
      // Đảm bảo góc vuông nằm đúng tại specialVertex, không mặc định B.
      if (specialRole === 0) {
        points = [
          { x: 170, y: 340 },
          { x: 170, y: 340 - leg },
          { x: 170 + leg, y: 340 },
        ];
      } else if (specialRole === 2) {
        points = [
          { x: 170, y: 340 },
          { x: 170 + leg, y: 340 },
          { x: 170 + leg, y: 340 - leg },
        ];
      } else {
        points = [
          { x: 170, y: 340 - leg },
          { x: 170, y: 340 },
          { x: 170 + leg, y: 340 },
        ];
      }
    } else if (triType === 'equilateral') {
      const side = 280;
      const height = side * Math.sqrt(3) / 2;
      points = [
        { x: 300, y: 110 },
        { x: 160, y: 110 + height },
        { x: 440, y: 110 + height },
      ];
    } else if (triType === 'isosceles') {
      const top = { x: 285, y: 110 };
      const left = { x: 145, y: 340 };
      const right = { x: 425, y: 340 };
      points = specialRole === 1 ? [left, top, right]
        : specialRole === 2 ? [left, right, top]
        : [top, left, right];
    }

    const roleOf = (name: string): 'A' | 'B' | 'C' => {
      const index = triSpec.vertices.indexOf(name);
      return index === 1 ? 'B' : index === 2 ? 'C' : 'A';
    };

    // Altitudes
    const altitudes = (spec.altitudes || []).map((alt) => ({
      fromVertex: roleOf(alt.from),
      enabled: true,
      label: alt.foot || 'H',
      style: (alt.style || 'dashed') as any,
      showRightAngle: alt.showRightAngle !== false,
    }));

    // Medians
    const medians = (spec.medians || []).map((med) => ({
      fromVertex: roleOf(med.from),
      enabled: true,
      label: med.midpoint || 'M',
      style: (med.style || 'dashed') as any,
      showEqualMarks: med.showTicks !== false,
    }));

    // Bisectors
    const bisectors = (spec.bisectors || []).map((bis) => ({
      fromVertex: roleOf(bis.from),
      enabled: true,
      label: bis.foot || 'D',
      style: (bis.style || 'solid') as any,
      showEqualAngles: bis.showEqualAngleArcs !== false,
    }));

    // Perpendicular Bisectors
    const perpBisectors: NonNullable<TriangleData['perpBisectors']> = (spec.perpBisectors || [])
      .map(item => {
        const names = Array.isArray(item.segment) ? item.segment.join('') : item.segment;
        const sorted = names.split('').sort().join('');
        const side = sorted === 'AB' ? 'AB' : sorted === 'AC' ? 'AC' : sorted === 'BC' ? 'BC' : null;
        return side ? {
          side,
          enabled: true,
          label: item.label || 'd',
          style: 'dashed' as const,
          showRightAngle: item.showRightAngle !== false,
          showTickMarks: item.showTicks !== false,
        } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const vA = triSpec.vertices?.[0] || 'A';
    const vB = triSpec.vertices?.[1] || 'B';
    const vC = triSpec.vertices?.[2] || 'C';
    const sideLengths = triSpec.sideLengths || {};
    const valBC = sideLengths[`${vB}${vC}`] ?? sideLengths[`${vC}${vB}`] ?? sideLengths['a'] ?? '';
    const valAC = sideLengths[`${vA}${vC}`] ?? sideLengths[`${vC}${vA}`] ?? sideLengths['b'] ?? '';
    const valAB = sideLengths[`${vA}${vB}`] ?? sideLengths[`${vB}${vA}`] ?? sideLengths['c'] ?? '';
    const sideLengthLabels: [string, string, string] = [
      String(valBC),
      String(valAC),
      String(valAB),
    ];

    const hasSideLengths = Boolean(triSpec.sideLengths && Object.keys(triSpec.sideLengths).length > 0);

    // Thales Theorem Detection
    const isThales = Boolean(
      spec.parallels && spec.parallels.length > 0 ||
      (spec.title && (spec.title.toLowerCase().includes('ta-lét') || spec.title.toLowerCase().includes('thales') || spec.title.toLowerCase().includes('song song'))) ||
      (spec.explanation && (spec.explanation.toLowerCase().includes('ta-lét') || spec.explanation.toLowerCase().includes('thales')))
    );

    return {
      ...this.buildAuxiliaryData(spec),
      type: triType,
      vertexNames: triSpec.vertices,
      points,
      showVertices: true,
      showLabels: true,
      altitudes,
      medians,
      bisectors,
      perpBisectors,
      thales: isThales
        ? {
            enabled: true,
            cutSide: 'AB-AC',
            ratio: 0.45,
            pointMName: 'M',
            pointNName: 'N',
            showParallelMarkers: true,
          }
        : undefined,
      showRightAngleMarker: triType === 'right' || triType === 'right-isosceles',
      showEqualSidesMarker: !hasSideLengths && (triType === 'isosceles' || triType === 'equilateral' || triType === 'right-isosceles'),
      showEqualAnglesMarker: triType === 'equilateral' || triType === 'isosceles',
      showSideLengths: hasSideLengths,
      sideLengthLabels,
      circumscribedCircle: Boolean(triSpec.circumscribedCircle)
        ? { enabled: true, centerName: 'O' }
        : undefined,
      inscribedCircle: Boolean(triSpec.inscribedCircle)
        ? { enabled: true, centerName: 'I' }
        : undefined,
    };
  }

  /**
   * Tạo dữ liệu QuadData từ spec
   */
  private static buildQuadData(spec: GeometrySpecification): QuadData {
    const quadSpec = spec.quadrilateral || {
      type: 'rectangle',
      vertices: ['A', 'B', 'C', 'D'],
    };

    const quadType = quadSpec.type || 'rectangle';
    const points = getQuadPresetPoints(quadType);
    const showDiagonals = Boolean(quadSpec.showDiagonals);
    const showCircumcircle = Boolean(quadSpec.showCircumcircle) || quadType === 'cyclic';

    return {
      ...this.buildAuxiliaryData(spec),
      type: quadType,
      vertexNames: quadSpec.vertices,
      points,
      showVertices: true,
      showLabels: true,
      diagonals: {
        AC: { enabled: showDiagonals, style: 'dashed', color: '#64748b' },
        BD: { enabled: showDiagonals, style: 'dashed', color: '#64748b' },
        showIntersection: showDiagonals,
        intersectionLabel: quadSpec.diagonalIntersection || 'O',
      },
      showRightAngleMarkers: quadType === 'rectangle' || quadType === 'square' || quadType === 'right-trapezoid',
      showEqualSidesMarkers: quadType === 'square' || quadType === 'rhombus' || quadType === 'isosceles-trapezoid',
      showParallelMarkers: quadType.includes('trapezoid') || quadType === 'parallelogram' || quadType === 'rectangle' || quadType === 'square' || quadType === 'rhombus',
      showCircumcircle,
      circumcircleCenterName: 'O',
    };
  }

  /**
   * Tạo dữ liệu CircleData từ spec
   */
  private static buildCircleData(spec: GeometrySpecification): CircleData {
    const circleSpec = spec.circle || {
      presetType: 'basic',
      center: 'O',
    };

    const presetType = circleSpec.presetType || 'basic';
    const points = getCirclePresetPoints(presetType);
    const radius = 110;

    return {
      ...this.buildAuxiliaryData(spec),
      presetType,
      points,
      radius,
      centerName: circleSpec.center || 'O',
      showCenterPoint: true,
      showCenterLabel: true,
      showRadius: presetType === 'basic',
      radiusPointName: circleSpec.radiusPoint || 'A',
      radiusLabel: 'R',
      showRadiusLabel: true,
      showDiameter: Boolean(circleSpec.diameterPoints),
      diameterPoints: circleSpec.diameterPoints || ['A', 'B'],
      showChord: Boolean(circleSpec.chordPoints) || presetType === 'diameter-chord' || presetType === 'tangent-chord-angle' || presetType === 'interior-angle',
      chordPoints: circleSpec.chordPoints || ['C', 'D'],
      showChordDistance: presetType === 'diameter-chord',
      chordDistanceLabel: circleSpec.chordFoot || 'H',
      showChordMidpoint: true,
      showChordRightAngle: true,
      showTangent: presetType === 'tangent-point' || presetType === 'two-tangents' || presetType === 'tangent-chord-angle',
      tangentType: presetType === 'two-tangents' ? 'two-tangents' : 'at-point',
      tangentPointName: circleSpec.tangentPoint || 'A',
      tangentLineName: circleSpec.tangentLineName || 'Ax',
      externalPointName: circleSpec.externalPoint || 'P',
      tangentPointsNames: circleSpec.twoTangentPoints || ['A', 'B'],
      showTangentRightAngle: true,
      showTangentEqualMarks: presetType === 'two-tangents',
      showCenterConnector: presetType === 'two-tangents',
      showChordAB: presetType === 'two-tangents',
      showSecant: presetType === 'secant' || presetType === 'exterior-angle',
      secantPointsNames: circleSpec.secantPoints || ['C', 'D'],
      showInscribedAngle: presetType === 'inscribed-angle',
      showSecondCircle: presetType === 'two-circles' || Boolean(circleSpec.twoCirclesRelativePos),
      twoCirclesRelation: (circleSpec.twoCirclesRelativePos as any) || (presetType === 'two-circles' ? 'intersecting' : undefined),
      commonTangentsType: (circleSpec.commonTangentType as any) || (presetType === 'two-circles' ? 'external' : undefined),
      center2Name: circleSpec.secondCenterName || "O'",
      radius2: circleSpec.secondRadius || 65,
    };
  }

  /**
   * Tạo dữ liệu LineRayData từ spec
   */
  private static buildLineRayData(spec: GeometrySpecification): LineRayData {
    const lineSpec = spec.lineRay || {
      type: 'segment',
      pointNames: ['A', 'B'],
    };

    const lineType = lineSpec.type || 'segment';
    const points = getLineRayPresetPoints(lineType);

    return {
      ...this.buildAuxiliaryData(spec),
      type: lineType,
      pointNames: lineSpec.pointNames,
      points,
      showPoints: true,
      showLabels: true,
      showMidpoint: Boolean(lineSpec.hasMidpoint),
      midpointName: lineSpec.midpointName || 'M',
      showEqualSegmentMarks: Boolean(lineSpec.hasMidpoint),
      showLength: Boolean(lineSpec.length),
      lengthValue: lineSpec.length || '6 cm',
      showArrows: lineType === 'ray' || lineType === 'line' || lineType === 'parallel',
      showParallelMarkers: lineType === 'parallel',
      parallelLineLabel1: lineSpec.pointNames[0] || 'a',
      parallelLineLabel2: lineSpec.pointNames[1] || 'b',
      showRightAngleMarker: lineType === 'perpendicular',
      perpLineLabel1: lineSpec.pointNames[0] || 'd',
      perpLineLabel2: lineSpec.pointNames[1] || "d'",
      intersectionName: lineSpec.intersectionName || 'O',
      showIntersectionPoint: lineType === 'intersection',
      intersectionElem1Type: lineSpec.line1Kind || 'line',
      intersectionElem2Type: lineSpec.line2Kind || 'line',
      showDashedExtensions: lineSpec.showExtensionLines !== false,
    };
  }

  /**
   * Tạo dữ liệu AngleData từ spec
   */
  private static buildAngleData(spec: GeometrySpecification): AngleData {
    const angleSpec = spec.angle || {
      type: 'single',
      vertex: 'O',
      ray1: 'x',
      ray2: 'y',
    };

    const angleType = angleSpec.type || 'single';
    const points = getAnglePresetPoints(angleType);

    return {
      ...this.buildAuxiliaryData(spec),
      type: angleType,
      points,
      vertexName: angleSpec.vertex || 'O',
      ray1Name: angleSpec.ray1 || 'x',
      ray2Name: angleSpec.ray2 || 'y',
      degrees: angleSpec.degrees || 60,
      autoCalculateDegrees: true,
      showDegreeValue: true,
      arcRadius: 34,
      showArc: true,
      showBisector: Boolean(angleSpec.hasBisector),
      bisectorName: angleSpec.bisectorName || 'Oz',
      showEqualAngleMarks: Boolean(angleSpec.hasBisector),
      parallelCutConfig: angleSpec.parallelCutConfig
        ? {
            line1Name: angleSpec.parallelCutConfig.line1,
            line2Name: angleSpec.parallelCutConfig.line2,
            transversalName: angleSpec.parallelCutConfig.transversal,
            vertex1Name: angleSpec.parallelCutConfig.vertex1,
            vertex2Name: angleSpec.parallelCutConfig.vertex2,
            highlightType: angleSpec.parallelCutConfig.highlightType,
            showParallelMarkers: true,
            showAngleNumbers: true,
          }
        : undefined,
    };
  }

  /**
   * Tạo dữ liệu PolygonData từ spec
   */
  private static buildPolygonData(
    spec: GeometrySpecification,
    settings: BaseChartSettings
  ): PolygonData {
    const polySpec = spec.polygon || {
      type: 'pentagon',
      sidesCount: 5,
    };
    const sidesCount = polySpec.sidesCount || 5;
    const polyType = polySpec.type || 'pentagon';
    const center = { x: (settings.width || 600) / 2, y: (settings.height || 450) / 2 };
    const radius = 120;
    const rotationAngle = -90;
    const points = getRegularPolygonPresetPoints(
      polyType,
      center,
      radius,
      rotationAngle,
      sidesCount
    );

    return {
      ...this.buildAuxiliaryData(spec),
      type: polyType,
      sidesCount,
      center,
      radius,
      rotationAngle,
      points,
      vertexNames: polySpec.vertexNames || getDefaultPolygonVertexNames(sidesCount),
      centerName: polySpec.centerName || 'O',
      showVertices: true,
      showLabels: true,
      showCenter: true,
      showCircumcircle: Boolean(polySpec.showCircumcircle),
      showIncircle: Boolean(polySpec.showIncircle),
      showApothem: Boolean(polySpec.showApothem),
      apothemName: 'H',
      showRadii: Boolean(polySpec.showRadii),
      showDiagonals: false,
      showEqualSidesMarkers: true,
      showEqualAnglesMarkers: true,
      fill: { enabled: false, color: '#3b82f6', opacity: 0.2 },
      strokeColor: '#000000',
      strokeWidth: 1.8,
      strokeStyle: 'solid',
    };
  }

  /**
   * Tạo dữ liệu SymmetryData từ spec
   */
  private static buildSymmetryData(spec: GeometrySpecification): SymmetryData {
    const symSpec = spec.symmetry || {
      type: 'axial',
      targetShape: 'triangle',
    };
    const symType = symSpec.type || 'axial';
    const shape = symSpec.targetShape || 'triangle';
    const presets = getSymmetryPresetPoints(symType, shape);

    return {
      ...this.buildAuxiliaryData(spec),
      type: symType,
      targetShape: shape,
      axisLabel: symSpec.axisLabel || 'd',
      centerName: symSpec.centerName || 'I',
      circleRadius: 50,
      showConnectingDashedLines: symSpec.showConnectingDashedLines !== false,
      showRightAngleMarkers: symSpec.showRightAngleMarkers !== false,
      showEqualDistanceMarkers: symSpec.showEqualDistanceMarkers !== false,
      showOriginalLabels: true,
      showReflectedLabels: true,
      ...presets,
      originalNames: symSpec.originalNames || presets.originalNames,
      reflectedNames: symSpec.reflectedNames || presets.reflectedNames,
    };
  }
}
