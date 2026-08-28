import { Point2D, SpatialGeometryData, SpatialShapeType } from '../types';

export interface Spatial3DPoint extends Point2D {
  name: string;
  isFront?: boolean;
}

export interface Spatial3DEdge {
  from: string;
  to: string;
  fromPt: Point2D;
  toPt: Point2D;
  isHidden: boolean; // Nét đứt (dashed) vs Nét liền (solid)
  label?: string;
  isAltitude?: boolean;
  isDiagonal?: boolean;
  color?: string;
}

export interface Spatial3DFace {
  points: Point2D[];
  name: string;
  isFront: boolean;
}

export interface SpatialCalculationResult {
  vertices: { [name: string]: Spatial3DPoint };
  vertexList: Spatial3DPoint[];
  edges: Spatial3DEdge[];
  faces: Spatial3DFace[];
  altitudeLine?: Spatial3DEdge;
  altitudeRightAngle?: {
    vertex: Point2D;
    arm1: Point2D;
    arm2: Point2D;
  };
  dimensionLines: {
    from: Point2D;
    to: Point2D;
    label: string;
    offset: { x: number; y: number };
  }[];
  curvedArcs?: {
    type: 'cylinder' | 'cone';
    topEllipse?: { cx: number; cy: number; rx: number; ry: number };
    bottomEllipse?: { cx: number; cy: number; rx: number; ry: number };
  };
}

export function calculateSpatialGeometry(
  data: SpatialGeometryData,
  canvasWidth: number,
  canvasHeight: number
): SpatialCalculationResult {
  const shapeType = data.shapeType || 'box';
  const customNames = data.vertexNames || [];

  const L = data.length || 180;
  const W = data.width || 120;
  const H = data.height || 160;
  const angleDeg = data.slantAngle !== undefined ? data.slantAngle : 35;
  const angleRad = (angleDeg * Math.PI) / 180;
  const ratio = data.slantRatio !== undefined ? data.slantRatio : 0.5;

  // Vector dóng xiên phối cảnh
  const dx = W * Math.cos(angleRad) * ratio;
  const dy = -W * Math.sin(angleRad) * ratio;

  const vertices: { [name: string]: Spatial3DPoint } = {};
  const edges: Spatial3DEdge[] = [];
  const faces: Spatial3DFace[] = [];
  let altitudeLine: Spatial3DEdge | undefined;
  let altitudeRightAngle: SpatialCalculationResult['altitudeRightAngle'] | undefined;
  const dimensionLines: SpatialCalculationResult['dimensionLines'] = [];
  let curvedArcs: SpatialCalculationResult['curvedArcs'] | undefined;

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2 + (shapeType.includes('pyramid') ? 20 : 10);

  if (shapeType === 'box' || shapeType === 'cube') {
    const side = shapeType === 'cube' ? Math.min(L, H) : L;
    const actualL = shapeType === 'cube' ? side : L;
    const actualW = shapeType === 'cube' ? side : W;
    const actualH = shapeType === 'cube' ? side : H;
    const actualDx = actualW * Math.cos(angleRad) * ratio;
    const actualDy = -actualW * Math.sin(angleRad) * ratio;

    const names = [
      customNames[0] || 'A',
      customNames[1] || 'B',
      customNames[2] || 'C',
      customNames[3] || 'D',
      customNames[4] || "A'",
      customNames[5] || "B'",
      customNames[6] || "C'",
      customNames[7] || "D'",
    ];

    // Căn giữa hình hộp
    const minX = -actualL / 2;
    const minY = actualH / 2;
    const baseX = cx + minX - actualDx / 2;
    const baseY = cy + minY - actualDy / 2;

    const A: Spatial3DPoint = { x: baseX, y: baseY, name: names[0], isFront: true };
    const B: Spatial3DPoint = { x: baseX + actualL, y: baseY, name: names[1], isFront: true };
    const C: Spatial3DPoint = { x: B.x + actualDx, y: B.y + actualDy, name: names[2], isFront: true };
    const D: Spatial3DPoint = { x: A.x + actualDx, y: A.y + actualDy, name: names[3], isFront: false };

    const A1: Spatial3DPoint = { x: A.x, y: A.y - actualH, name: names[4], isFront: true };
    const B1: Spatial3DPoint = { x: B.x, y: B.y - actualH, name: names[5], isFront: true };
    const C1: Spatial3DPoint = { x: C.x, y: C.y - actualH, name: names[6], isFront: true };
    const D1: Spatial3DPoint = { x: D.x, y: D.y - actualH, name: names[7], isFront: true };

    vertices[names[0]] = A;
    vertices[names[1]] = B;
    vertices[names[2]] = C;
    vertices[names[3]] = D;
    vertices[names[4]] = A1;
    vertices[names[5]] = B1;
    vertices[names[6]] = C1;
    vertices[names[7]] = D1;

    // Nét thấy (Solid) & Nét khuất (Dashed)
    // Cạnh khuất: AD, CD, DD'
    edges.push({ from: names[0], to: names[3], fromPt: A, toPt: D, isHidden: true });
    edges.push({ from: names[2], to: names[3], fromPt: C, toPt: D, isHidden: true });
    edges.push({ from: names[7], to: names[3], fromPt: D1, toPt: D, isHidden: true });

    // Nét thấy:
    edges.push({ from: names[0], to: names[1], fromPt: A, toPt: B, isHidden: false });
    edges.push({ from: names[1], to: names[2], fromPt: B, toPt: C, isHidden: false });
    edges.push({ from: names[4], to: names[5], fromPt: A1, toPt: B1, isHidden: false });
    edges.push({ from: names[5], to: names[6], fromPt: B1, toPt: C1, isHidden: false });
    edges.push({ from: names[6], to: names[7], fromPt: C1, toPt: D1, isHidden: false });
    edges.push({ from: names[7], to: names[4], fromPt: D1, toPt: A1, isHidden: false });
    edges.push({ from: names[0], to: names[4], fromPt: A, toPt: A1, isHidden: false });
    edges.push({ from: names[1], to: names[5], fromPt: B, toPt: B1, isHidden: false });
    edges.push({ from: names[2], to: names[6], fromPt: C, toPt: C1, isHidden: false });

    // Đường chéo khối AC' (tùy chọn)
    if (data.showSolidDiagonals) {
      edges.push({
        from: names[0],
        to: names[6],
        fromPt: A,
        toPt: C1,
        isHidden: true,
        isDiagonal: true,
        color: '#dc2626',
      });
    }

    // Các mặt phẳng để đổ bóng
    faces.push({ points: [A, B, B1, A1], name: 'Front', isFront: true });
    faces.push({ points: [B, C, C1, B1], name: 'Right', isFront: true });
    faces.push({ points: [A1, B1, C1, D1], name: 'Top', isFront: true });

    // Kích thước đo đạc
    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: A.x, y: A.y + 16 },
        to: { x: B.x, y: B.y + 16 },
        label: data.dimensions.length || (shapeType === 'cube' ? 'a' : 'a'),
        offset: { x: 0, y: 16 },
      });
      dimensionLines.push({
        from: { x: B.x + 12, y: B.y },
        to: { x: C.x + 12, y: C.y },
        label: data.dimensions.width || (shapeType === 'cube' ? 'a' : 'b'),
        offset: { x: 12, y: 0 },
      });
      dimensionLines.push({
        from: { x: A.x - 16, y: A.y },
        to: { x: A1.x - 16, y: A1.y },
        label: data.dimensions.height || (shapeType === 'cube' ? 'a' : 'h'),
        offset: { x: -16, y: 0 },
      });
    }
  } else if (shapeType === 'triangular-prism') {
    // Lăng trụ đứng tam giác ABC.A'B'C'
    const names = [
      customNames[0] || 'A',
      customNames[1] || 'B',
      customNames[2] || 'C',
      customNames[3] || "A'",
      customNames[4] || "B'",
      customNames[5] || "C'",
    ];

    const startX = cx - L / 2 - dx / 3;
    const startY = cy + H / 2 - dy / 3;

    const A: Spatial3DPoint = { x: startX, y: startY, name: names[0], isFront: true };
    const B: Spatial3DPoint = { x: startX + L, y: startY, name: names[1], isFront: true };
    const C: Spatial3DPoint = { x: startX + L * 0.4 + dx, y: startY + dy, name: names[2], isFront: false };

    const A1: Spatial3DPoint = { x: A.x, y: A.y - H, name: names[3], isFront: true };
    const B1: Spatial3DPoint = { x: B.x, y: B.y - H, name: names[4], isFront: true };
    const C1: Spatial3DPoint = { x: C.x, y: C.y - H, name: names[5], isFront: true };

    vertices[names[0]] = A;
    vertices[names[1]] = B;
    vertices[names[2]] = C;
    vertices[names[3]] = A1;
    vertices[names[4]] = B1;
    vertices[names[5]] = C1;

    // Nét khuất: AC, BC, CC' (hoặc AC nét khuất)
    edges.push({ from: names[0], to: names[2], fromPt: A, toPt: C, isHidden: true });
    edges.push({ from: names[1], to: names[2], fromPt: B, toPt: C, isHidden: false });
    edges.push({ from: names[2], to: names[5], fromPt: C, toPt: C1, isHidden: true });

    // Nét thấy:
    edges.push({ from: names[0], to: names[1], fromPt: A, toPt: B, isHidden: false });
    edges.push({ from: names[3], to: names[4], fromPt: A1, toPt: B1, isHidden: false });
    edges.push({ from: names[4], to: names[5], fromPt: B1, toPt: C1, isHidden: false });
    edges.push({ from: names[5], to: names[3], fromPt: C1, toPt: A1, isHidden: false });
    edges.push({ from: names[0], to: names[3], fromPt: A, toPt: A1, isHidden: false });
    edges.push({ from: names[1], to: names[4], fromPt: B, toPt: B1, isHidden: false });

    faces.push({ points: [A, B, B1, A1], name: 'Front', isFront: true });
    faces.push({ points: [A1, B1, C1], name: 'Top', isFront: true });

    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: A.x, y: A.y + 16 },
        to: { x: B.x, y: B.y + 16 },
        label: data.dimensions.length || 'a',
        offset: { x: 0, y: 16 },
      });
      dimensionLines.push({
        from: { x: A.x - 16, y: A.y },
        to: { x: A1.x - 16, y: A1.y },
        label: data.dimensions.height || 'h',
        offset: { x: -16, y: 0 },
      });
    }
  } else if (shapeType === 'quad-pyramid') {
    // Hình chóp tứ giác đều S.ABCD
    const names = [
      customNames[0] || 'S',
      customNames[1] || 'A',
      customNames[2] || 'B',
      customNames[3] || 'C',
      customNames[4] || 'D',
      customNames[5] || 'O',
    ];

    const baseX = cx - L / 2 - dx / 2;
    const baseY = cy + H / 3 - dy / 2;

    const A: Spatial3DPoint = { x: baseX, y: baseY, name: names[1], isFront: true };
    const B: Spatial3DPoint = { x: baseX + L, y: baseY, name: names[2], isFront: true };
    const C: Spatial3DPoint = { x: B.x + dx, y: B.y + dy, name: names[3], isFront: true };
    const D: Spatial3DPoint = { x: A.x + dx, y: A.y + dy, name: names[4], isFront: false };

    // Tâm đáy O
    const Ox = (A.x + C.x) / 2;
    const Oy = (A.y + C.y) / 2;
    const O: Spatial3DPoint = { x: Ox, y: Oy, name: names[5], isFront: false };

    // Đỉnh S
    const S: Spatial3DPoint = { x: Ox, y: Oy - H, name: names[0], isFront: true };

    vertices[names[0]] = S;
    vertices[names[1]] = A;
    vertices[names[2]] = B;
    vertices[names[3]] = C;
    vertices[names[4]] = D;
    if (data.showBaseCenter || data.showAltitude) {
      vertices[names[5]] = O;
    }

    // Nét khuất: AD, CD, SD, AC, BD, SO
    edges.push({ from: names[1], to: names[4], fromPt: A, toPt: D, isHidden: true });
    edges.push({ from: names[3], to: names[4], fromPt: C, toPt: D, isHidden: true });
    edges.push({ from: names[0], to: names[4], fromPt: S, toPt: D, isHidden: true });

    // Nét thấy:
    edges.push({ from: names[1], to: names[2], fromPt: A, toPt: B, isHidden: false });
    edges.push({ from: names[2], to: names[3], fromPt: B, toPt: C, isHidden: false });
    edges.push({ from: names[0], to: names[1], fromPt: S, toPt: A, isHidden: false });
    edges.push({ from: names[0], to: names[2], fromPt: S, toPt: B, isHidden: false });
    edges.push({ from: names[0], to: names[3], fromPt: S, toPt: C, isHidden: false });

    // Đường chéo đáy & Đường cao SO
    if (data.showBaseDiagonals || data.showAltitude) {
      edges.push({ from: names[1], to: names[3], fromPt: A, toPt: C, isHidden: true, isDiagonal: true });
      edges.push({ from: names[2], to: names[4], fromPt: B, toPt: D, isHidden: true, isDiagonal: true });
    }

    if (data.showAltitude) {
      altitudeLine = {
        from: names[0],
        to: names[5],
        fromPt: S,
        toPt: O,
        isHidden: true,
        isAltitude: true,
        color: '#dc2626',
      };
      edges.push(altitudeLine);

      if (data.showRightAngleMarkers) {
        // Góc vuông tại O
        const u = { x: (A.x - Ox) / 10, y: (A.y - Oy) / 10 };
        const v = { x: 0, y: -10 };
        altitudeRightAngle = {
          vertex: O,
          arm1: { x: Ox + u.x, y: Oy + u.y },
          arm2: { x: Ox + v.x, y: Oy + v.y },
        };
      }
    }

    faces.push({ points: [S, A, B], name: 'SAB', isFront: true });
    faces.push({ points: [S, B, C], name: 'SBC', isFront: true });

    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: A.x, y: A.y + 16 },
        to: { x: B.x, y: B.y + 16 },
        label: data.dimensions.length || 'a',
        offset: { x: 0, y: 16 },
      });
      if (data.showAltitude) {
        dimensionLines.push({
          from: { x: O.x - 14, y: O.y },
          to: { x: S.x - 14, y: S.y },
          label: data.dimensions.height || 'h',
          offset: { x: -14, y: 0 },
        });
      }
    }
  } else if (shapeType === 'triangular-pyramid') {
    // Hình chóp tam giác đều S.ABC
    const names = [
      customNames[0] || 'S',
      customNames[1] || 'A',
      customNames[2] || 'B',
      customNames[3] || 'C',
      customNames[4] || 'H',
    ];

    const startX = cx - L / 2 - dx / 3;
    const startY = cy + H / 3 - dy / 3;

    const A: Spatial3DPoint = { x: startX, y: startY, name: names[1], isFront: true };
    const B: Spatial3DPoint = { x: startX + L, y: startY, name: names[2], isFront: true };
    const C: Spatial3DPoint = { x: startX + L * 0.45 + dx, y: startY + dy, name: names[3], isFront: false };

    // Trọng tâm H
    const Hx = (A.x + B.x + C.x) / 3;
    const Hy = (A.y + B.y + C.y) / 3;
    const H_pt: Spatial3DPoint = { x: Hx, y: Hy, name: names[4], isFront: false };

    // Đỉnh S
    const S: Spatial3DPoint = { x: Hx, y: Hy - H, name: names[0], isFront: true };

    vertices[names[0]] = S;
    vertices[names[1]] = A;
    vertices[names[2]] = B;
    vertices[names[3]] = C;
    if (data.showAltitude) {
      vertices[names[4]] = H_pt;
    }

    // Nét khuất: AC, BC (hoặc AC), SH
    edges.push({ from: names[1], to: names[3], fromPt: A, toPt: C, isHidden: true });
    edges.push({ from: names[2], to: names[3], fromPt: B, toPt: C, isHidden: false });

    // Nét thấy:
    edges.push({ from: names[1], to: names[2], fromPt: A, toPt: B, isHidden: false });
    edges.push({ from: names[0], to: names[1], fromPt: S, toPt: A, isHidden: false });
    edges.push({ from: names[0], to: names[2], fromPt: S, toPt: B, isHidden: false });
    edges.push({ from: names[0], to: names[3], fromPt: S, toPt: C, isHidden: false });

    if (data.showAltitude) {
      altitudeLine = {
        from: names[0],
        to: names[4],
        fromPt: S,
        toPt: H_pt,
        isHidden: true,
        isAltitude: true,
        color: '#dc2626',
      };
      edges.push(altitudeLine);
    }

    faces.push({ points: [S, A, B], name: 'SAB', isFront: true });

    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: A.x, y: A.y + 16 },
        to: { x: B.x, y: B.y + 16 },
        label: data.dimensions.length || 'a',
        offset: { x: 0, y: 16 },
      });
    }
  } else if (shapeType === 'pyramid-altitude') {
    // Chóp có cạnh bên vuông góc đáy: S.ABCD với SA ⊥ (ABCD)
    const names = [
      customNames[0] || 'S',
      customNames[1] || 'A',
      customNames[2] || 'B',
      customNames[3] || 'C',
      customNames[4] || 'D',
    ];

    const baseX = cx - L / 2 - dx / 2;
    const baseY = cy + H / 3 - dy / 2;

    const A: Spatial3DPoint = { x: baseX, y: baseY, name: names[1], isFront: false };
    const B: Spatial3DPoint = { x: baseX + L, y: baseY, name: names[2], isFront: true };
    const C: Spatial3DPoint = { x: B.x + dx, y: B.y + dy, name: names[3], isFront: true };
    const D: Spatial3DPoint = { x: A.x + dx, y: A.y + dy, name: names[4], isFront: false };

    // S thẳng đứng trên A
    const S: Spatial3DPoint = { x: A.x, y: A.y - H, name: names[0], isFront: true };

    vertices[names[0]] = S;
    vertices[names[1]] = A;
    vertices[names[2]] = B;
    vertices[names[3]] = C;
    vertices[names[4]] = D;

    // Nét khuất: SA, AD, AB (A nằm ở góc trong)
    edges.push({ from: names[0], to: names[1], fromPt: S, toPt: A, isHidden: true, isAltitude: true });
    edges.push({ from: names[1], to: names[2], fromPt: A, toPt: B, isHidden: true });
    edges.push({ from: names[1], to: names[4], fromPt: A, toPt: D, isHidden: true });
    edges.push({ from: names[3], to: names[4], fromPt: C, toPt: D, isHidden: false });
    edges.push({ from: names[2], to: names[3], fromPt: B, toPt: C, isHidden: false });

    // Nét thấy:
    edges.push({ from: names[0], to: names[2], fromPt: S, toPt: B, isHidden: false });
    edges.push({ from: names[0], to: names[3], fromPt: S, toPt: C, isHidden: false });
    edges.push({ from: names[0], to: names[4], fromPt: S, toPt: D, isHidden: false });

    faces.push({ points: [S, B, C], name: 'SBC', isFront: true });
    faces.push({ points: [S, C, D], name: 'SCD', isFront: true });
  } else if (shapeType === 'cylinder') {
    // Hình trụ
    const rx = L / 2;
    const ry = rx * 0.35;
    const topCy = cy - H / 2;
    const bottomCy = cy + H / 2;

    const names = [customNames[0] || "O'", customNames[1] || 'O'];

    const O1: Spatial3DPoint = { x: cx, y: topCy, name: names[0], isFront: true };
    const O: Spatial3DPoint = { x: cx, y: bottomCy, name: names[1], isFront: true };

    vertices[names[0]] = O1;
    vertices[names[1]] = O;

    // Trục OO'
    edges.push({ from: names[0], to: names[1], fromPt: O1, toPt: O, isHidden: true, isAltitude: true });

    // Hai đường sinh ngoài
    edges.push({
      from: 'L1',
      to: 'L2',
      fromPt: { x: cx - rx, y: topCy },
      toPt: { x: cx - rx, y: bottomCy },
      isHidden: false,
    });
    edges.push({
      from: 'R1',
      to: 'R2',
      fromPt: { x: cx + rx, y: topCy },
      toPt: { x: cx + rx, y: bottomCy },
      isHidden: false,
    });

    curvedArcs = {
      type: 'cylinder',
      topEllipse: { cx, cy: topCy, rx, ry },
      bottomEllipse: { cx, cy: bottomCy, rx, ry },
    };

    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: cx - rx - 16, y: topCy },
        to: { x: cx - rx - 16, y: bottomCy },
        label: data.dimensions.height || 'h',
        offset: { x: -16, y: 0 },
      });
      dimensionLines.push({
        from: { x: cx, y: topCy },
        to: { x: cx + rx, y: topCy },
        label: data.dimensions.radius || 'r',
        offset: { x: 0, y: -10 },
      });
    }
  } else if (shapeType === 'cone') {
    // Hình nón
    const rx = L / 2;
    const ry = rx * 0.35;
    const topY = cy - H / 2;
    const bottomCy = cy + H / 2;

    const names = [customNames[0] || 'S', customNames[1] || 'O', customNames[2] || 'A'];

    const S: Spatial3DPoint = { x: cx, y: topY, name: names[0], isFront: true };
    const O: Spatial3DPoint = { x: cx, y: bottomCy, name: names[1], isFront: true };
    const A: Spatial3DPoint = { x: cx + rx, y: bottomCy, name: names[2], isFront: true };

    vertices[names[0]] = S;
    vertices[names[1]] = O;
    vertices[names[2]] = A;

    // Trục SO (đường cao) và bán kính OA
    edges.push({ from: names[0], to: names[1], fromPt: S, toPt: O, isHidden: true, isAltitude: true });
    edges.push({ from: names[1], to: names[2], fromPt: O, toPt: A, isHidden: true });

    // Đường sinh
    edges.push({ from: names[0], to: 'L', fromPt: S, toPt: { x: cx - rx, y: bottomCy }, isHidden: false });
    edges.push({ from: names[0], to: names[2], fromPt: S, toPt: A, isHidden: false });

    curvedArcs = {
      type: 'cone',
      bottomEllipse: { cx, cy: bottomCy, rx, ry },
    };

    if (data.dimensions?.showDimensions) {
      dimensionLines.push({
        from: { x: cx - rx - 16, y: topY },
        to: { x: cx - rx - 16, y: bottomCy },
        label: data.dimensions.height || 'h',
        offset: { x: -16, y: 0 },
      });
      dimensionLines.push({
        from: { x: cx, y: bottomCy + 14 },
        to: { x: cx + rx, y: bottomCy + 14 },
        label: data.dimensions.radius || 'r',
        offset: { x: 0, y: 14 },
      });
    }
  }

  return {
    vertices,
    vertexList: Object.values(vertices),
    edges,
    faces,
    altitudeLine,
    altitudeRightAngle,
    dimensionLines,
    curvedArcs,
  };
}
