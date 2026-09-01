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
   * Tạo dữ liệu TriangleData từ spec
   */
  private static buildTriangleData(spec: GeometrySpecification): TriangleData {
    const triSpec = spec.triangle || {
      type: 'general',
      vertices: ['A', 'B', 'C'],
    };

    const triType = triSpec.type || 'general';
    let points: [Point2D, Point2D, Point2D] = [
      { x: 260, y: 110 },
      { x: 130, y: 340 },
      { x: 430, y: 340 },
    ];

    if (triType === 'right') {
      points = [
        { x: 170, y: 120 },
        { x: 170, y: 340 },
        { x: 440, y: 340 },
      ];
    } else if (triType === 'right-isosceles') {
      points = [
        { x: 180, y: 130 },
        { x: 180, y: 340 },
        { x: 390, y: 340 },
      ];
    } else if (triType === 'equilateral') {
      points = [
        { x: 300, y: 115 },
        { x: 155, y: 345 },
        { x: 445, y: 345 },
      ];
    } else if (triType === 'isosceles') {
      points = [
        { x: 285, y: 110 },
        { x: 145, y: 340 },
        { x: 425, y: 340 },
      ];
    }

    // Altitudes
    const altitudes = (spec.altitudes || []).map((alt) => ({
      fromVertex: (alt.from as 'A' | 'B' | 'C') || 'A',
      enabled: true,
      label: alt.foot || 'H',
      style: (alt.style || 'dashed') as any,
      showRightAngle: alt.showRightAngle !== false,
    }));

    // Medians
    const medians = (spec.medians || []).map((med) => ({
      fromVertex: (med.from as 'A' | 'B' | 'C') || 'A',
      enabled: true,
      label: med.midpoint || 'M',
      style: (med.style || 'dashed') as any,
      showEqualMarks: med.showTicks !== false,
    }));

    // Bisectors
    const bisectors = (spec.bisectors || []).map((bis) => ({
      fromVertex: (bis.from as 'A' | 'B' | 'C') || 'A',
      enabled: true,
      label: bis.foot || 'D',
      style: (bis.style || 'solid') as any,
      showEqualAngles: bis.showEqualAngleArcs !== false,
    }));

    // Perpendicular Bisectors
    const perpBisectors = (spec.perpBisectors || []).map(() => ({
      side: 'BC' as const,
      enabled: true,
      label: 'd',
      style: 'dashed' as const,
      showRightAngle: true,
      showEqualMarks: true,
    }));

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
