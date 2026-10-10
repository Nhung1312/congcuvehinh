/**
 * Types & Schema cho hệ thống AI Dựng Hình Hình Học THCS
 */
import { Point2D, StrokeDashType, TriangleType, QuadType, CirclePresetType, LineRayType, AngleType } from '../types';

export type ShapeCategory = 'triangle' | 'quadrilateral' | 'circle' | 'line-ray' | 'angle' | 'polygon' | 'symmetry' | 'spatial' | 'coordinate-plane';

export interface GeometricPointSpec {
  name: string;
  role?: 'vertex' | 'center' | 'midpoint' | 'foot' | 'intersection' | 'on-circle' | 'free';
  fixedCoords?: Point2D;
  description?: string;
}

export interface GeometricAltitudeSpec {
  from: string; // Đỉnh hạ đường cao, ví dụ 'A'
  toLine: string | [string, string]; // Cạnh đáy hoặc đường thẳng, ví dụ 'BC'
  foot: string; // Tên chân đường vuông góc, ví dụ 'H'
  showRightAngle?: boolean;
  style?: StrokeDashType;
}

export interface GeometricMedianSpec {
  from: string; // Đỉnh, ví dụ 'A'
  toSegment: string | [string, string]; // Đoạn thẳng, ví dụ 'BC'
  midpoint: string; // Tên trung điểm, ví dụ 'M'
  showTicks?: boolean;
  style?: StrokeDashType;
}

export interface GeometricBisectorSpec {
  from: string; // Đỉnh góc, ví dụ 'A'
  toSegment: string | [string, string]; // Đoạn cắt, ví dụ 'BC'
  foot: string; // Chân đường phân giác, ví dụ 'D'
  showEqualAngleArcs?: boolean;
  style?: StrokeDashType;
}

export interface GeometricPerpBisectorSpec {
  segment: string | [string, string]; // Đoạn thẳng, ví dụ 'BC'
  label?: string; // Tên đường trung trực, ví dụ 'd'
  showRightAngle?: boolean;
  showTicks?: boolean;
}

export interface GeometricAuxPointSpec {
  name: string;
  type: 'midpoint' | 'ratio' | 'projection' | 'free' | 'intersection' | 'on-circle';
  segment?: string | [string, string];
  ratio?: number; // 0..1
  fromPoint?: string;
  targetLine?: string | [string, string];
  line1?: string | [string, string];
  line2?: string | [string, string];
  angle?: number; // degree on circle
  centerPoint?: string;
  radius?: number;
  freeX?: number;
  freeY?: number;
}

export interface GeometricAuxLineSpec {
  from: string;
  to: string;
  style?: StrokeDashType;
  color?: string;
  label?: string;
}

export interface GeometricRightAngleSpec {
  vertex: string;
  ray1: string;
  ray2: string;
}

export interface GeometricParallelSpec {
  line1: string | [string, string];
  line2: string | [string, string];
  label1?: string;
  label2?: string;
  arrowCount?: 1 | 2 | 3;
}

export interface GeometricEqualSegmentsSpec {
  segments: (string | [string, string])[];
  tickType?: 1 | 2 | 3 | 'o' | 'x';
}

export interface GeometricEqualAnglesSpec {
  angles: { vertex: string; ray1: string; ray2: string }[];
}

export interface GeometrySpecification {
  title: string;
  shapeCategory: ShapeCategory;
  
  // Chi tiết theo từng loại hình
  triangle?: {
    type: TriangleType;
    vertices: [string, string, string]; // e.g. ['A', 'B', 'C']
    specialVertex?: string; // Đỉnh góc vuông hoặc đỉnh cân
    equalSides?: [string, string]; // e.g. ['AB', 'AC']
    sideLengths?: { [side: string]: string | number };
    angles?: { [vertex: string]: number };
    circumscribedCircle?: boolean; // Đường tròn ngoại tiếp
    inscribedCircle?: boolean; // Đường tròn nội tiếp
  };

  quadrilateral?: {
    type: QuadType;
    vertices: [string, string, string, string]; // e.g. ['A', 'B', 'C', 'D']
    parallelSides?: [string, string]; // e.g. ['AB', 'CD']
    showDiagonals?: boolean;
    diagonalIntersection?: string; // 'O'
    showCircumcircle?: boolean; // Tứ giác nội tiếp đường tròn
  };

  circle?: {
    presetType: CirclePresetType;
    center: string; // 'O'
    radiusValue?: number | string;
    radiusPoint?: string; // 'A'
    diameterPoints?: [string, string]; // ['A', 'B']
    chordPoints?: [string, string]; // ['C', 'D']
    chordFoot?: string; // 'H'
    tangentPoint?: string; // 'A'
    tangentLineName?: string; // 'Ax'
    externalPoint?: string; // 'P'
    twoTangentPoints?: [string, string]; // ['A', 'B']
    secantPoints?: [string, string]; // ['C', 'D']
    twoCirclesRelativePos?: 'intersecting' | 'tangent-external' | 'tangent-internal' | 'external' | 'concentric' | 'internal';
    commonTangentType?: 'none' | 'outer' | 'inner' | 'both';
    secondCenterName?: string;
    secondRadius?: number;
  };

  lineRay?: {
    type: LineRayType;
    pointNames: string[];
    isParallel?: boolean;
    isPerpendicular?: boolean;
    hasMidpoint?: boolean;
    midpointName?: string;
    length?: string;
    line1Kind?: 'line' | 'ray' | 'segment';
    line2Kind?: 'line' | 'ray' | 'segment';
    showExtensionLines?: boolean;
    intersectionName?: string;
  };

  angle?: {
    type: AngleType;
    vertex: string;
    ray1: string;
    ray2: string;
    degrees?: number;
    hasBisector?: boolean;
    bisectorName?: string;
    parallelCutConfig?: {
      line1: string;
      line2: string;
      transversal: string;
      vertex1: string;
      vertex2: string;
      highlightType: 'alternate-interior' | 'corresponding' | 'consecutive-interior';
    };
  };

  polygon?: {
    type: 'equilateral-triangle' | 'square' | 'pentagon' | 'hexagon' | 'octagon' | 'custom';
    sidesCount: number;
    vertexNames?: string[];
    centerName?: string;
    showCircumcircle?: boolean;
    showIncircle?: boolean;
    showApothem?: boolean;
    showRadii?: boolean;
  };

  symmetry?: {
    type: 'axial' | 'central';
    targetShape: 'point' | 'segment' | 'triangle' | 'quadrilateral' | 'circle';
    axisLabel?: string;
    centerName?: string;
    originalNames?: string[];
    reflectedNames?: string[];
    showConnectingDashedLines?: boolean;
    showRightAngleMarkers?: boolean;
    showEqualDistanceMarkers?: boolean;
  };

  // Các đường phụ và quan hệ hình học
  altitudes?: GeometricAltitudeSpec[];
  medians?: GeometricMedianSpec[];
  bisectors?: GeometricBisectorSpec[];
  perpBisectors?: GeometricPerpBisectorSpec[];
  auxPoints?: GeometricAuxPointSpec[];
  auxLines?: GeometricAuxLineSpec[];
  rightAngles?: GeometricRightAngleSpec[];
  parallels?: GeometricParallelSpec[];
  equalSegments?: GeometricEqualSegmentsSpec[];
  equalAngles?: GeometricEqualAnglesSpec[];

  // Ghi chú và giải thích hình học từ AI
  detectedEntities: string[];
  explanation: string;
  /** Nguồn thực sự được dùng để dựng hình; không chứa API key. */
  generationInfo?: { source: 'gemini' | 'rules'; model?: string; message?: string };
}
