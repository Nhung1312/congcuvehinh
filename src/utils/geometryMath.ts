/**
 * geometryMath.ts - Thư viện toán hình học phẳng SGK Toán THCS
 * Cung cấp các thuật toán vector, hình chiếu, giao điểm, phân giác, trung trực và định vị nhãn
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

// 1. Phép toán vector cơ bản
export const dist = (p1: Point2D, p2: Point2D): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const midpoint = (p1: Point2D, p2: Point2D): Point2D => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
});

export const vecSub = (p2: Point2D, p1: Point2D): Vector2D => ({
  x: p2.x - p1.x,
  y: p2.y - p1.y,
});

export const vecAdd = (p: Point2D, v: Vector2D): Point2D => ({
  x: p.x + v.x,
  y: p.y + v.y,
});

export const vecScale = (v: Vector2D, s: number): Vector2D => ({
  x: v.x * s,
  y: v.y * s,
});

export const vecLen = (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y);

export const vecNorm = (v: Vector2D): Vector2D => {
  const len = vecLen(v);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const dotProd = (v1: Vector2D, v2: Vector2D): number => v1.x * v2.x + v1.y * v2.y;

export const crossProd = (v1: Vector2D, v2: Vector2D): number => v1.x * v2.y - v1.y * v2.x;

// Vector vuông góc với v (xoay 90 độ ngược chiều kim đồng hồ)
export const vecPerp = (v: Vector2D): Vector2D => ({
  x: -v.y,
  y: v.x,
});

// 2. Hình chiếu vuông góc của điểm P lên đường thẳng AB
// Trả về toạ độ điểm H, tham số t (H = A + t * (B - A)), và boolean xem H có nằm trong đoạn AB không
export const projectPointToLine = (
  p: Point2D,
  a: Point2D,
  b: Point2D
): { point: Point2D; t: number; isInsideSegment: boolean } => {
  const ab = vecSub(b, a);
  const abLenSq = dotProd(ab, ab);
  if (abLenSq < 1e-6) {
    return { point: a, t: 0, isInsideSegment: true };
  }
  const ap = vecSub(p, a);
  const t = dotProd(ap, ab) / abLenSq;
  const point: Point2D = {
    x: a.x + t * ab.x,
    y: a.y + t * ab.y,
  };
  return {
    point,
    t,
    isInsideSegment: t >= -0.01 && t <= 1.01,
  };
};

// 3. Điểm chân đường phân giác trong của góc A (cắt BC tại D)
// Theo định lý phân giác: BD / DC = AB / AC => D = (AC * B + AB * C) / (AB + AC)
export const angleBisectorPoint = (a: Point2D, b: Point2D, c: Point2D): Point2D => {
  const lenAB = dist(a, b);
  const lenAC = dist(a, c);
  const sum = lenAB + lenAC;
  if (sum < 1e-6) return midpoint(b, c);
  return {
    x: (lenAC * b.x + lenAB * c.x) / sum,
    y: (lenAC * b.y + lenAB * c.y) / sum,
  };
};

// 4. Đoạn đường trung trực của đoạn AB
export const perpendicularBisectorSegment = (
  a: Point2D,
  b: Point2D,
  extendLength: number = 60
): { start: Point2D; mid: Point2D; end: Point2D } => {
  const mid = midpoint(a, b);
  const ab = vecSub(b, a);
  const perpNorm = vecNorm(vecPerp(ab));
  return {
    start: {
      x: mid.x - perpNorm.x * extendLength,
      y: mid.y - perpNorm.y * extendLength,
    },
    mid,
    end: {
      x: mid.x + perpNorm.x * extendLength,
      y: mid.y + perpNorm.y * extendLength,
    },
  };
};

// 5. Tính toán vị trí nhãn đỉnh thông minh (không bị cạnh đè lên)
// Bằng cách lấy vector phân giác ngoài của đỉnh (hướng ra ngoài đa giác)
export const getSmartVertexLabelPosition = (
  current: Point2D,
  prev: Point2D,
  next: Point2D,
  distance: number = 18
): { x: number; y: number; textAnchor: 'start' | 'middle' | 'end'; dominantBaseline: 'central' | 'hanging' | 'alphabetic' } => {
  const v1 = vecNorm(vecSub(prev, current));
  const v2 = vecNorm(vecSub(next, current));
  
  // Vector hướng vào trong góc = v1 + v2
  const inDir = vecAdd({ x: 0, y: 0 }, vecScale(vecAdd({ x: 0, y: 0 }, vecAdd(v1, v2)), 0.5));
  let outDir: Vector2D;

  if (vecLen(inDir) < 1e-4) {
    // 2 cạnh thẳng hàng => lấy vector vuông góc
    outDir = vecNorm(vecPerp(v1));
  } else {
    // Vector hướng ra ngoài = ngược chiều inDir
    outDir = vecNorm(vecScale(inDir, -1));
  }

  const labelPos: Point2D = {
    x: current.x + outDir.x * distance,
    y: current.y + outDir.y * distance,
  };

  // Xác định textAnchor & baseline dựa trên hướng của outDir
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  if (outDir.x > 0.4) textAnchor = 'start';
  else if (outDir.x < -0.4) textAnchor = 'end';

  let dominantBaseline: 'central' | 'hanging' | 'alphabetic' = 'central';
  if (outDir.y > 0.4) dominantBaseline = 'hanging';
  else if (outDir.y < -0.4) dominantBaseline = 'alphabetic';

  return {
    x: labelPos.x,
    y: labelPos.y,
    textAnchor,
    dominantBaseline,
  };
};

// 6. Tạo path ký hiệu góc vuông chuẩn hình học (xoay theo hướng thực tế 2 cạnh)
export const getRightAngleMarkerPath = (
  vertex: Point2D,
  target1: Point2D,
  target2: Point2D,
  size: number = 10
): string => {
  const u = vecNorm(vecSub(target1, vertex));
  const v = vecNorm(vecSub(target2, vertex));

  const p1: Point2D = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
  const pCorner: Point2D = {
    x: vertex.x + u.x * size + v.x * size,
    y: vertex.y + u.y * size + v.y * size,
  };
  const p2: Point2D = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };

  return `M ${p1.x} ${p1.y} L ${pCorner.x} ${pCorner.y} L ${p2.x} ${p2.y}`;
};

// 7. Tạo ký hiệu đoạn bằng nhau (1 gạch, 2 gạch, 3 gạch, chấm tròn)
export const getSegmentTickMarks = (
  p1: Point2D,
  p2: Point2D,
  tickCount: 1 | 2 | 3 | 'o' = 1,
  tickLength: number = 9,
  tickGap: number = 4
): { x1: number; y1: number; x2: number; y2: number }[] | { cx: number; cy: number; r: number } => {
  const mid = midpoint(p1, p2);
  if (tickCount === 'o') {
    return { cx: mid.x, cy: mid.y, r: 3 };
  }

  const v = vecNorm(vecSub(p2, p1));
  const n = vecNorm(vecPerp(v)); // vector pháp tuyến

  const halfLen = tickLength / 2;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (tickCount === 1) {
    lines.push({
      x1: mid.x - n.x * halfLen,
      y1: mid.y - n.y * halfLen,
      x2: mid.x + n.x * halfLen,
      y2: mid.y + n.y * halfLen,
    });
  } else if (tickCount === 2) {
    const offsets = [-tickGap / 2, tickGap / 2];
    offsets.forEach((off) => {
      const center = { x: mid.x + v.x * off, y: mid.y + v.y * off };
      lines.push({
        x1: center.x - n.x * halfLen,
        y1: center.y - n.y * halfLen,
        x2: center.x + n.x * halfLen,
        y2: center.y + n.y * halfLen,
      });
    });
  } else if (tickCount === 3) {
    const offsets = [-tickGap, 0, tickGap];
    offsets.forEach((off) => {
      const center = { x: mid.x + v.x * off, y: mid.y + v.y * off };
      lines.push({
        x1: center.x - n.x * halfLen,
        y1: center.y - n.y * halfLen,
        x2: center.x + n.x * halfLen,
        y2: center.y + n.y * halfLen,
      });
    });
  }

  return lines;
};

// 8. Tạo cung tròn ký hiệu góc bằng nhau
export const getEqualAngleArcPath = (
  vertex: Point2D,
  target1: Point2D,
  target2: Point2D,
  radius: number = 24
): { path: string; midAnglePos: Point2D } => {
  const u = vecNorm(vecSub(target1, vertex));
  const v = vecNorm(vecSub(target2, vertex));

  const startPoint: Point2D = { x: vertex.x + u.x * radius, y: vertex.y + u.y * radius };
  const endPoint: Point2D = { x: vertex.x + v.x * radius, y: vertex.y + v.y * radius };

  // Xác định hướng cung theo tích có hướng
  const cross = crossProd(u, v);
  const sweepFlag = cross > 0 ? 1 : 0;

  const bisectNorm = vecNorm(vecAdd(u, v));
  const midAnglePos: Point2D = {
    x: vertex.x + bisectNorm.x * (radius + 8),
    y: vertex.y + bisectNorm.y * (radius + 8),
  };

  const path = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
  return { path, midAnglePos };
};

// 9. Tìm giao điểm của 2 đoạn thẳng/đường thẳng P1P2 và P3P4
export const lineIntersection = (
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D | null => {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-6) return null; // 2 đường thẳng song song hoặc trùng nhau

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
};

// 10. Tạo ký hiệu mũi tên song song trên đoạn thẳng (Parallel Markers)
export const getParallelArrowsPath = (
  p1: Point2D,
  p2: Point2D,
  arrowCount: 1 | 2 = 1,
  arrowSize: number = 7
): string => {
  const mid = midpoint(p1, p2);
  const v = vecNorm(vecSub(p2, p1)); // Hướng đoạn thẳng
  const n = vecNorm(vecPerp(v)); // Vector pháp tuyến

  const buildArrow = (center: Point2D) => {
    const tip: Point2D = {
      x: center.x + v.x * (arrowSize * 0.7),
      y: center.y + v.y * (arrowSize * 0.7),
    };
    const wing1: Point2D = {
      x: center.x - v.x * (arrowSize * 0.7) + n.x * (arrowSize * 0.6),
      y: center.y - v.y * (arrowSize * 0.7) + n.y * (arrowSize * 0.6),
    };
    const wing2: Point2D = {
      x: center.x - v.x * (arrowSize * 0.7) - n.x * (arrowSize * 0.6),
      y: center.y - v.y * (arrowSize * 0.7) - n.y * (arrowSize * 0.6),
    };
    return `M ${wing1.x} ${wing1.y} L ${tip.x} ${tip.y} L ${wing2.x} ${wing2.y}`;
  };

  if (arrowCount === 1) {
    return buildArrow(mid);
  } else {
    const offset = arrowSize * 0.8;
    const c1: Point2D = { x: mid.x - v.x * (offset / 2), y: mid.y - v.y * (offset / 2) };
    const c2: Point2D = { x: mid.x + v.x * (offset / 2), y: mid.y + v.y * (offset / 2) };
    return `${buildArrow(c1)} ${buildArrow(c2)}`;
  }
};

// 11. Toạ độ chuẩn SGK cho các loại Tứ giác
export const getQuadPresetPoints = (
  type: string
): [Point2D, Point2D, Point2D, Point2D] => {
  switch (type) {
    case 'trapezoid': // Hình thang thường (AB // CD)
      return [
        { x: 210, y: 130 },
        { x: 360, y: 130 },
        { x: 440, y: 310 },
        { x: 130, y: 310 },
      ];
    case 'right-trapezoid': // Hình thang vuông tại A và D (AB // CD, góc A = D = 90)
      return [
        { x: 160, y: 130 },
        { x: 380, y: 130 },
        { x: 440, y: 310 },
        { x: 160, y: 310 },
      ];
    case 'isosceles-trapezoid': // Hình thang cân (AB // CD, AD = BC)
      return [
        { x: 200, y: 130 },
        { x: 360, y: 130 },
        { x: 430, y: 310 },
        { x: 130, y: 310 },
      ];
    case 'parallelogram': // Hình bình hành (AB // CD, AD // BC)
      return [
        { x: 190, y: 130 },
        { x: 430, y: 130 },
        { x: 370, y: 310 },
        { x: 130, y: 310 },
      ];
    case 'rectangle': // Hình chữ nhật (4 góc vuông)
      return [
        { x: 150, y: 130 },
        { x: 410, y: 130 },
        { x: 410, y: 310 },
        { x: 150, y: 310 },
      ];
    case 'rhombus': // Hình thoi (4 cạnh bằng nhau)
      return [
        { x: 280, y: 90 },
        { x: 420, y: 220 },
        { x: 280, y: 350 },
        { x: 140, y: 220 },
      ];
    case 'square': // Hình vuông (4 cạnh =, 4 góc vuông)
      return [
        { x: 180, y: 120 },
        { x: 380, y: 120 },
        { x: 380, y: 320 },
        { x: 180, y: 320 },
      ];
    case 'general': // Tứ giác thường ABCD lồi
    default:
      return [
        { x: 180, y: 110 },
        { x: 390, y: 130 },
        { x: 430, y: 320 },
        { x: 140, y: 310 },
      ];
  }
};

// 12. Ràng buộc hình học thông minh khi kéo đỉnh tứ giác
export const constrainQuadPointDrag = (
  type: string,
  pts: [Point2D, Point2D, Point2D, Point2D],
  dragIdx: number,
  newPoint: Point2D
): [Point2D, Point2D, Point2D, Point2D] => {
  const result: [Point2D, Point2D, Point2D, Point2D] = [
    { ...pts[0] },
    { ...pts[1] },
    { ...pts[2] },
    { ...pts[3] },
  ];

  if (type === 'general') {
    result[dragIdx] = newPoint;
    return result;
  }

  if (type === 'parallelogram') {
    // AB // CD và AD // BC => D = A + C - B
    if (dragIdx === 0) {
      result[0] = newPoint;
      result[3] = {
        x: newPoint.x + (result[2].x - result[1].x),
        y: newPoint.y + (result[2].y - result[1].y),
      };
    } else if (dragIdx === 1) {
      result[1] = newPoint;
      result[3] = {
        x: result[0].x + (result[2].x - newPoint.x),
        y: result[0].y + (result[2].y - newPoint.y),
      };
    } else if (dragIdx === 2) {
      result[2] = newPoint;
      result[3] = {
        x: result[0].x + (newPoint.x - result[1].x),
        y: result[0].y + (newPoint.y - result[1].y),
      };
    } else if (dragIdx === 3) {
      result[3] = newPoint;
      result[2] = {
        x: result[1].x + (newPoint.x - result[0].x),
        y: result[1].y + (newPoint.y - result[0].y),
      };
    }
    return result;
  }

  if (type === 'rectangle') {
    // Giữ hình chữ nhật dạng cạnh song song với các trục tọa độ
    if (dragIdx === 0) { // Đỉnh A (top-left)
      result[0] = newPoint;
      result[1].y = newPoint.y;
      result[3].x = newPoint.x;
    } else if (dragIdx === 1) { // Đỉnh B (top-right)
      result[1] = newPoint;
      result[0].y = newPoint.y;
      result[2].x = newPoint.x;
    } else if (dragIdx === 2) { // Đỉnh C (bottom-right)
      result[2] = newPoint;
      result[1].x = newPoint.x;
      result[3].y = newPoint.y;
    } else if (dragIdx === 3) { // Đỉnh D (bottom-left)
      result[3] = newPoint;
      result[0].x = newPoint.x;
      result[2].y = newPoint.y;
    }
    return result;
  }

  if (type === 'square') {
    // Giữ hình vuông đều
    const a = result[0];
    if (dragIdx === 2) { // Kéo góc đối C
      const size = Math.max(30, Math.min(newPoint.x - a.x, newPoint.y - a.y));
      result[1] = { x: a.x + size, y: a.y };
      result[2] = { x: a.x + size, y: a.y + size };
      result[3] = { x: a.x, y: a.y + size };
    } else if (dragIdx === 1) { // Kéo đỉnh B
      const size = Math.max(30, newPoint.x - a.x);
      result[1] = { x: a.x + size, y: a.y };
      result[2] = { x: a.x + size, y: a.y + size };
      result[3] = { x: a.x, y: a.y + size };
    } else if (dragIdx === 3) { // Kéo đỉnh D
      const size = Math.max(30, newPoint.y - a.y);
      result[1] = { x: a.x + size, y: a.y };
      result[2] = { x: a.x + size, y: a.y + size };
      result[3] = { x: a.x, y: a.y + size };
    } else { // Kéo đỉnh A
      const dx = newPoint.x - pts[0].x;
      const dy = newPoint.y - pts[0].y;
      return [
        { x: pts[0].x + dx, y: pts[0].y + dy },
        { x: pts[1].x + dx, y: pts[1].y + dy },
        { x: pts[2].x + dx, y: pts[2].y + dy },
        { x: pts[3].x + dx, y: pts[3].y + dy },
      ];
    }
    return result;
  }

  if (type === 'rhombus') {
    // 2 đường chéo AC và BD cắt nhau tại trung điểm O và vuông góc
    const center = {
      x: (pts[0].x + pts[2].x) / 2,
      y: (pts[1].y + pts[3].y) / 2,
    };
    if (dragIdx === 0) {
      result[0] = { x: center.x, y: newPoint.y };
      result[2] = { x: center.x, y: 2 * center.y - newPoint.y };
    } else if (dragIdx === 2) {
      result[2] = { x: center.x, y: newPoint.y };
      result[0] = { x: center.x, y: 2 * center.y - newPoint.y };
    } else if (dragIdx === 1) {
      result[1] = { x: newPoint.x, y: center.y };
      result[3] = { x: 2 * center.x - newPoint.x, y: center.y };
    } else if (dragIdx === 3) {
      result[3] = { x: newPoint.x, y: center.y };
      result[1] = { x: 2 * center.x - newPoint.x, y: center.y };
    }
    return result;
  }

  if (type === 'trapezoid') {
    // AB // CD (giữ y của A = y của B và y của C = y của D)
    if (dragIdx === 0) {
      result[0] = newPoint;
      result[1].y = newPoint.y;
    } else if (dragIdx === 1) {
      result[1] = newPoint;
      result[0].y = newPoint.y;
    } else if (dragIdx === 2) {
      result[2] = newPoint;
      result[3].y = newPoint.y;
    } else if (dragIdx === 3) {
      result[3] = newPoint;
      result[2].y = newPoint.y;
    }
    return result;
  }

  if (type === 'right-trapezoid') {
    // AB // CD, góc A = D = 90 độ (A.x = D.x)
    if (dragIdx === 0) {
      result[0] = newPoint;
      result[1].y = newPoint.y;
      result[3].x = newPoint.x;
    } else if (dragIdx === 1) {
      result[1] = newPoint;
      result[0].y = newPoint.y;
    } else if (dragIdx === 2) {
      result[2] = newPoint;
      result[3].y = newPoint.y;
    } else if (dragIdx === 3) {
      result[3] = newPoint;
      result[0].x = newPoint.x;
      result[2].y = newPoint.y;
    }
    return result;
  }

  if (type === 'isosceles-trapezoid') {
    // AB // CD, AD = BC (đối xứng qua trục đứng xMid của CD)
    if (dragIdx === 0) {
      const xMid = (result[3].x + result[2].x) / 2;
      result[0] = newPoint;
      result[1] = { x: 2 * xMid - newPoint.x, y: newPoint.y };
    } else if (dragIdx === 1) {
      const xMid = (result[3].x + result[2].x) / 2;
      result[1] = newPoint;
      result[0] = { x: 2 * xMid - newPoint.x, y: newPoint.y };
    } else if (dragIdx === 2) {
      const xMid = (result[0].x + result[1].x) / 2;
      result[2] = newPoint;
      result[3] = { x: 2 * xMid - newPoint.x, y: newPoint.y };
    } else if (dragIdx === 3) {
      const xMid = (result[0].x + result[1].x) / 2;
      result[3] = newPoint;
      result[2] = { x: 2 * xMid - newPoint.x, y: newPoint.y };
    }
    return result;
  }

  result[dragIdx] = newPoint;
  return result;
};

// ==========================================
// 12. HÀM TOÁN HỌC CHO GÓC & ĐƯỜNG THẲNG (GIAI ĐOẠN 2.3)
// ==========================================

// Tính số đo góc đỉnh vertex giữa 2 điểm p1 và p2 (trả về độ từ 0 đến 180)
export const calculateAngle = (p1: Point2D, vertex: Point2D, p2: Point2D): number => {
  const u = vecNorm(vecSub(p1, vertex));
  const v = vecNorm(vecSub(p2, vertex));
  const dot = Math.max(-1, Math.min(1, dotProd(u, v)));
  const rad = Math.acos(dot);
  return Math.round((rad * 180) / Math.PI);
};

// Tạo cung góc và vùng tô miền góc (Sector fill)
export const getAngleArcAndFill = (
  vertex: Point2D,
  p1: Point2D,
  p2: Point2D,
  radius: number = 32,
  isRightAngle: boolean = false
): {
  arcPath: string;
  sectorPath: string;
  labelPos: Point2D;
  degrees: number;
  isRight: boolean;
  midVector: Vector2D;
} => {
  const u = vecNorm(vecSub(p1, vertex));
  const v = vecNorm(vecSub(p2, vertex));
  const dot = Math.max(-1, Math.min(1, dotProd(u, v)));
  const rad = Math.acos(dot);
  const degrees = Math.round((rad * 180) / Math.PI);
  const isRight = isRightAngle || Math.abs(degrees - 90) < 1.5;

  const cross = crossProd(u, v);
  const sweepFlag = cross > 0 ? 1 : 0;

  // Vector phân giác hướng vào trong góc
  let bisect = vecNorm(vecAdd(u, v));
  if (vecLen(bisect) < 1e-4) {
    bisect = vecNorm(vecPerp(u));
  }

  const labelPos: Point2D = {
    x: vertex.x + bisect.x * (radius + 16),
    y: vertex.y + bisect.y * (radius + 16),
  };

  if (isRight) {
    const size = Math.min(radius, 14);
    const pStart = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const pCorner = {
      x: vertex.x + u.x * size + v.x * size,
      y: vertex.y + u.y * size + v.y * size,
    };
    const pEnd = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };
    const arcPath = `M ${pStart.x} ${pStart.y} L ${pCorner.x} ${pCorner.y} L ${pEnd.x} ${pEnd.y}`;
    const sectorPath = `M ${vertex.x} ${vertex.y} L ${pStart.x} ${pStart.y} L ${pCorner.x} ${pCorner.y} L ${pEnd.x} ${pEnd.y} Z`;

    return { arcPath, sectorPath, labelPos, degrees, isRight, midVector: bisect };
  }

  const startPt: Point2D = { x: vertex.x + u.x * radius, y: vertex.y + u.y * radius };
  const endPt: Point2D = { x: vertex.x + v.x * radius, y: vertex.y + v.y * radius };

  const arcPath = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${endPt.x} ${endPt.y}`;
  const sectorPath = `M ${vertex.x} ${vertex.y} L ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${endPt.x} ${endPt.y} Z`;

  return { arcPath, sectorPath, labelPos, degrees, isRight, midVector: bisect };
};

// Kéo dài đường thẳng qua 2 điểm p1, p2 về hai phía
export const extendLine = (
  p1: Point2D,
  p2: Point2D,
  extendStart: number = 60,
  extendEnd: number = 60
): { start: Point2D; end: Point2D } => {
  const v = vecNorm(vecSub(p2, p1));
  return {
    start: {
      x: p1.x - v.x * extendStart,
      y: p1.y - v.y * extendStart,
    },
    end: {
      x: p2.x + v.x * extendEnd,
      y: p2.y + v.y * extendEnd,
    },
  };
};

// Dựng đường thẳng song song với p1p2 đi qua điểm throughP
export const getParallelLineThroughPoint = (
  p1: Point2D,
  p2: Point2D,
  throughP: Point2D,
  length: number = 280
): { start: Point2D; end: Point2D } => {
  const v = vecNorm(vecSub(p2, p1));
  return {
    start: {
      x: throughP.x - v.x * (length / 2),
      y: throughP.y - v.y * (length / 2),
    },
    end: {
      x: throughP.x + v.x * (length / 2),
      y: throughP.y + v.y * (length / 2),
    },
  };
};

// Dựng đường thẳng vuông góc với p1p2 đi qua điểm throughP
export const getPerpendicularLineThroughPoint = (
  p1: Point2D,
  p2: Point2D,
  throughP: Point2D,
  length: number = 200
): { start: Point2D; end: Point2D; foot: Point2D } => {
  const proj = projectPointToLine(throughP, p1, p2);
  const foot = proj.point;
  const n = vecNorm(vecPerp(vecSub(p2, p1)));

  return {
    start: {
      x: throughP.x - n.x * (length / 2),
      y: throughP.y - n.y * (length / 2),
    },
    end: {
      x: throughP.x + n.x * (length / 2),
      y: throughP.y + n.y * (length / 2),
    },
    foot,
  };
};

// Tọa độ khởi tạo mặc định cho LineRay
export const getLineRayPresetPoints = (type: string): Point2D[] => {
  switch (type) {
    case 'segment':
      return [
        { x: 150, y: 220 }, // A
        { x: 410, y: 220 }, // B
      ];
    case 'ray':
      return [
        { x: 150, y: 250 }, // Gốc A
        { x: 390, y: 150 }, // Hướng B
      ];
    case 'line':
      return [
        { x: 140, y: 250 }, // A
        { x: 420, y: 170 }, // B
      ];
    case 'parallel':
      return [
        { x: 130, y: 160 }, // Line 1: A
        { x: 430, y: 160 }, // Line 1: B
        { x: 280, y: 270 }, // Line 2 Điểm P qua
      ];
    case 'perpendicular':
      return [
        { x: 130, y: 270 }, // Base: A
        { x: 430, y: 270 }, // Base: B
        { x: 280, y: 140 }, // Điểm P
      ];
    case 'intersection':
      return [
        { x: 130, y: 150 }, // Line 1: A
        { x: 430, y: 290 }, // Line 1: B
        { x: 150, y: 300 }, // Line 2: C
        { x: 410, y: 140 }, // Line 2: D
      ];
    default:
      return [
        { x: 150, y: 220 },
        { x: 410, y: 220 },
      ];
  }
};

// Ràng buộc kéo thả cho LineRay
export const constrainLineRayDrag = (
  type: string,
  points: Point2D[],
  dragIdx: number,
  newPoint: Point2D
): Point2D[] => {
  const result = points.map((p) => ({ ...p }));
  result[dragIdx] = newPoint;
  return result;
};

// Tọa độ khởi tạo mặc định cho Angle
export const getAnglePresetPoints = (type: string): Point2D[] => {
  switch (type) {
    case 'single':
    case 'bisector':
      return [
        { x: 180, y: 280 }, // Đỉnh O
        { x: 420, y: 280 }, // Điểm A (Tia Ox)
        { x: 340, y: 120 }, // Điểm B (Tia Oy)
      ];
    case 'vertical-angles':
      return [
        { x: 280, y: 220 }, // Đỉnh O (Giao điểm)
        { x: 130, y: 140 }, // x
        { x: 430, y: 300 }, // x'
        { x: 150, y: 310 }, // y
        { x: 410, y: 130 }, // y'
      ];
    case 'supplementary':
      return [
        { x: 280, y: 270 }, // Đỉnh O
        { x: 120, y: 270 }, // x (bên trái)
        { x: 440, y: 270 }, // z (bên phải, thẳng hàng với x)
        { x: 200, y: 130 }, // y (ở giữa)
      ];
    case 'parallel-transversal':
      return [
        { x: 110, y: 160 }, // Đường thẳng a: A1
        { x: 450, y: 160 }, // Đường thẳng a: A2
        { x: 110, y: 280 }, // Đường thẳng b: B1
        { x: 450, y: 280 }, // Đường thẳng b: B2
        { x: 210, y: 90 },  // Cát tuyến c: C1
        { x: 350, y: 350 }, // Cát tuyến c: C2
      ];
    default:
      return [
        { x: 180, y: 280 },
        { x: 420, y: 280 },
        { x: 340, y: 120 },
      ];
  }
};

// Ràng buộc kéo thả cho Angle
export const constrainAngleDrag = (
  type: string,
  points: Point2D[],
  dragIdx: number,
  newPoint: Point2D
): Point2D[] => {
  const result = points.map((p) => ({ ...p }));

  if (type === 'supplementary') {
    // x, O, z phải thẳng hàng
    if (dragIdx === 0) {
      // Kéo đỉnh O
      const dy = newPoint.y - points[0].y;
      result[0] = newPoint;
      result[1].y += dy;
      result[2].y += dy;
    } else if (dragIdx === 1) {
      // Kéo x => z đối xứng qua O trên cùng đường thẳng
      result[1] = newPoint;
      const v = vecSub(newPoint, points[0]);
      const len = dist(points[0], points[2]);
      const unit = vecNorm(v);
      result[2] = {
        x: points[0].x - unit.x * len,
        y: points[0].y - unit.y * len,
      };
    } else if (dragIdx === 2) {
      // Kéo z => x đối xứng qua O
      result[2] = newPoint;
      const v = vecSub(newPoint, points[0]);
      const len = dist(points[0], points[1]);
      const unit = vecNorm(v);
      result[1] = {
        x: points[0].x - unit.x * len,
        y: points[0].y - unit.y * len,
      };
    } else if (dragIdx === 3) {
      result[3] = newPoint;
    }
    return result;
  }

  if (type === 'vertical-angles') {
    // 2 đường thẳng qua O: x-O-x' và y-O-y'
    if (dragIdx === 0) {
      // Kéo O
      const dx = newPoint.x - points[0].x;
      const dy = newPoint.y - points[0].y;
      result[0] = newPoint;
      result[1].x += dx;
      result[1].y += dy;
      result[2].x += dx;
      result[2].y += dy;
      result[3].x += dx;
      result[3].y += dy;
      result[4].x += dx;
      result[4].y += dy;
    } else if (dragIdx === 1) {
      // Kéo x => x' thẳng hàng
      result[1] = newPoint;
      const v = vecNorm(vecSub(newPoint, points[0]));
      const len = dist(points[0], points[2]);
      result[2] = {
        x: points[0].x - v.x * len,
        y: points[0].y - v.y * len,
      };
    } else if (dragIdx === 2) {
      // Kéo x' => x thẳng hàng
      result[2] = newPoint;
      const v = vecNorm(vecSub(newPoint, points[0]));
      const len = dist(points[0], points[1]);
      result[1] = {
        x: points[0].x - v.x * len,
        y: points[0].y - v.y * len,
      };
    } else if (dragIdx === 3) {
      // Kéo y => y' thẳng hàng
      result[3] = newPoint;
      const v = vecNorm(vecSub(newPoint, points[0]));
      const len = dist(points[0], points[4]);
      result[4] = {
        x: points[0].x - v.x * len,
        y: points[0].y - v.y * len,
      };
    } else if (dragIdx === 4) {
      // Kéo y' => y thẳng hàng
      result[4] = newPoint;
      const v = vecNorm(vecSub(newPoint, points[0]));
      const len = dist(points[0], points[3]);
      result[3] = {
        x: points[0].x - v.x * len,
        y: points[0].y - v.y * len,
      };
    }
    return result;
  }

  result[dragIdx] = newPoint;
  return result;
};

// ==========================================
// TOÁN HỌC & RÀNG BUỘC HÌNH HỌC ĐƯỜNG TRÒN (GIAI ĐOẠN 2.4)
// ==========================================

export const getCirclePresetPoints = (type: string): Point2D[] => {
  const cx = 280;
  const cy = 220;
  const r = 110;

  switch (type) {
    case 'basic':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r, y: cy }, // 1: Điểm A trên đường tròn (Bán kính OA)
      ];

    case 'diameter-chord':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r, y: cy }, // 1: Điểm A (Đường kính AB)
        { x: cx + r * Math.cos((5 * Math.PI) / 6), y: cy + r * Math.sin((5 * Math.PI) / 6) }, // 2: Điểm C (Dây cung CD)
        { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) }, // 3: Điểm D (Dây cung CD)
      ];

    case 'arc':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(-Math.PI / 6), y: cy + r * Math.sin(-Math.PI / 6) }, // 1: Điểm A (đầu cung)
        { x: cx + r * Math.cos((-5 * Math.PI) / 6), y: cy + r * Math.sin((-5 * Math.PI) / 6) }, // 2: Điểm B (cuối cung)
      ];

    case 'tangent-point':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(-Math.PI / 4), y: cy + r * Math.sin(-Math.PI / 4) }, // 1: Tiếp điểm A
      ];

    case 'two-tangents':
      return [
        { x: cx - 40, y: cy }, // 0: Tâm O
        { x: cx + 160, y: cy }, // 1: Điểm ngoài P
      ];

    case 'secant':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + 180, y: cy - 60 }, // 1: Điểm ngoài P
        { x: cx - 180, y: cy + 40 }, // 2: Hướng cát tuyến
      ];

    case 'inscribed-angle':
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(-Math.PI / 4), y: cy + r * Math.sin(-Math.PI / 4) }, // 1: Điểm A
        { x: cx + r * Math.cos((-3 * Math.PI) / 4), y: cy + r * Math.sin((-3 * Math.PI) / 4) }, // 2: Điểm B
        { x: cx + r * Math.cos((2 * Math.PI) / 3), y: cy + r * Math.sin((2 * Math.PI) / 3) }, // 3: Điểm P đỉnh góc nội tiếp
      ];

    case 'two-circles':
      return [
        { x: 210, y: cy }, // 0: Tâm O1
        { x: 350, y: cy }, // 1: Tâm O2
        { x: 210 + 105, y: cy }, // 2: Điểm bán kính R1
        { x: 350 + 80, y: cy },  // 3: Điểm bán kính R2
      ];

    default:
      return [
        { x: cx, y: cy },
        { x: cx + r, y: cy },
      ];
  }
};

// Ràng buộc kéo thả hình học cho Đường tròn
export const constrainCircleDrag = (
  type: string,
  points: Point2D[],
  dragIdx: number,
  newPoint: Point2D
): Point2D[] => {
  const result = points.map((p) => ({ ...p }));
  if (!points || points.length === 0) return result;

  const center = points[0];

  // 1. Kéo Tâm O (dragIdx = 0) -> Tịnh tiến toàn bộ hệ thống điểm
  if (dragIdx === 0) {
    const dx = newPoint.x - center.x;
    const dy = newPoint.y - center.y;
    return points.map((p, i) => (i === 0 ? newPoint : { x: p.x + dx, y: p.y + dy }));
  }

  // 2. Kéo điểm A (Bán kính) (dragIdx = 1) trong basic, diameter-chord, tangent-point
  if (dragIdx === 1) {
    if (type === 'basic' || type === 'diameter-chord' || type === 'tangent-point') {
      result[1] = newPoint;
      const newRadius = dist(center, newPoint);
      
      // Nếu có dây cung C, D trong diameter-chord, cập nhật khoảng cách tới tâm theo tỉ lệ hoặc giữ góc
      if (type === 'diameter-chord' && points.length >= 4) {
        for (let i = 2; i <= 3; i++) {
          const v = vecNorm(vecSub(points[i], center));
          result[i] = {
            x: center.x + v.x * newRadius,
            y: center.y + v.y * newRadius,
          };
        }
      }
      return result;
    }

    if (type === 'arc' || type === 'inscribed-angle') {
      // Khóa điểm trên đường tròn
      const r = dist(center, points[1]);
      const v = vecNorm(vecSub(newPoint, center));
      result[1] = {
        x: center.x + v.x * r,
        y: center.y + v.y * r,
      };
      return result;
    }

    if (type === 'two-tangents') {
      // Kéo điểm ngoài P (đảm bảo d > r + 15)
      result[1] = newPoint;
      return result;
    }

    if (type === 'two-circles') {
      // Kéo tâm O2
      result[1] = newPoint;
      return result;
    }
  }

  // 3. Kéo các điểm dây cung C, D hoặc điểm cung B, hoặc điểm góc nội tiếp P
  if (dragIdx >= 2) {
    if (type === 'diameter-chord' || type === 'arc' || type === 'inscribed-angle') {
      // Khóa điểm nằm trên đường tròn (O, R)
      const r = dist(center, points[1]);
      const v = vecNorm(vecSub(newPoint, center));
      result[dragIdx] = {
        x: center.x + v.x * r,
        y: center.y + v.y * r,
      };
      return result;
    }

    if (type === 'two-circles') {
      if (dragIdx === 2) {
        // Đổi R1
        result[2] = newPoint;
      } else if (dragIdx === 3) {
        // Đổi R2
        result[3] = newPoint;
      }
      return result;
    }
  }

  result[dragIdx] = newPoint;
  return result;
};

// Tính 2 tiếp điểm A, B từ điểm ngoài P tới đường tròn (O, R)
export const getTwoTangentContactPoints = (
  center: Point2D,
  r: number,
  extP: Point2D
): { p1: Point2D; p2: Point2D; isValid: boolean } => {
  const d = dist(center, extP);
  if (d <= r + 1) {
    // Điểm P nằm trong hoặc trên đường tròn, trả về 2 điểm vuông góc tạm thời
    const perp = vecNorm({ x: -(extP.y - center.y), y: extP.x - center.x });
    return {
      p1: { x: center.x + perp.x * r, y: center.y + perp.y * r },
      p2: { x: center.x - perp.x * r, y: center.y - perp.y * r },
      isValid: false,
    };
  }

  const alpha = Math.acos(r / d);
  const theta = Math.atan2(extP.y - center.y, extP.x - center.x);

  const angle1 = theta - alpha;
  const angle2 = theta + alpha;

  return {
    p1: { x: center.x + r * Math.cos(angle1), y: center.y + r * Math.sin(angle1) },
    p2: { x: center.x + r * Math.cos(angle2), y: center.y + r * Math.sin(angle2) },
    isValid: true,
  };
};

// Tìm giao điểm của đường thẳng qua p1, p2 với đường tròn (center, r)
export const getLineCircleIntersections = (
  center: Point2D,
  r: number,
  p1: Point2D,
  p2: Point2D
): Point2D[] => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  if (a === 0) return [];

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  const pt1 = { x: p1.x + t1 * dx, y: p1.y + t1 * dy };
  if (Math.abs(discriminant) < 1e-6) {
    return [pt1];
  }

  const pt2 = { x: p1.x + t2 * dx, y: p1.y + t2 * dy };
  return [pt1, pt2];
};

// Tìm giao điểm của 2 đường tròn (c1, r1) và (c2, r2)
export const getTwoCirclesIntersections = (
  c1: Point2D,
  r1: number,
  c2: Point2D,
  r2: number
): Point2D[] => {
  const d = dist(c1, c2);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const p2x = c1.x + (a * (c2.x - c1.x)) / d;
  const p2y = c1.y + (a * (c2.y - c1.y)) / d;

  const rx = -(c2.y - c1.y) * (h / d);
  const ry = (c2.x - c1.x) * (h / d);

  return [
    { x: p2x + rx, y: p2y + ry },
    { x: p2x - rx, y: p2y - ry },
  ];
};

// Đường dẫn SVG cho Cung tròn (Arc path)
export const getCircleArcSvgPath = (
  center: Point2D,
  r: number,
  p1: Point2D,
  p2: Point2D,
  isMajor: boolean = false
): string => {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);

  let diff = a2 - a1;
  while (diff < 0) diff += 2 * Math.PI;
  while (diff > 2 * Math.PI) diff -= 2 * Math.PI;

  const sweep = 1;
  const largeArc = isMajor ? (diff < Math.PI ? 1 : 0) : (diff > Math.PI ? 1 : 0);

  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
};

// Đường dẫn SVG cho Hình quạt tròn (Sector fill)
export const getCircleSectorSvgPath = (
  center: Point2D,
  r: number,
  p1: Point2D,
  p2: Point2D,
  isMajor: boolean = false
): string => {
  const arcPath = getCircleArcSvgPath(center, r, p1, p2, isMajor);
  return `${arcPath} L ${center.x} ${center.y} Z`;
};

// Đường dẫn SVG cho Hình viên phân (Segment fill)
export const getCircleSegmentSvgPath = (
  center: Point2D,
  r: number,
  p1: Point2D,
  p2: Point2D,
  isMajor: boolean = false
): string => {
  const arcPath = getCircleArcSvgPath(center, r, p1, p2, isMajor);
  return `${arcPath} Z`;
};

// ==========================================
// KÝ HIỆU HÌNH HỌC MỞ RỘNG (GIAI ĐOẠN 3.2)
// ==========================================

// 1. Tạo ký hiệu mũi tên (Arrowhead) tại điểm tip theo hướng vector dir
export const getArrowHeadSvg = (
  tip: Point2D,
  dir: Vector2D,
  size: number = 8
): { path: string } => {
  const v = vecNorm(dir);
  const n = vecNorm(vecPerp(v));
  const back: Point2D = {
    x: tip.x - v.x * size,
    y: tip.y - v.y * size,
  };
  const wing1: Point2D = {
    x: back.x + n.x * (size * 0.55),
    y: back.y + n.y * (size * 0.55),
  };
  const wing2: Point2D = {
    x: back.x - n.x * (size * 0.55),
    y: back.y - n.y * (size * 0.55),
  };
  return {
    path: `M ${wing1.x} ${wing1.y} L ${tip.x} ${tip.y} L ${wing2.x} ${wing2.y}`,
  };
};

// 2. Ký hiệu góc bằng nhau đa dạng (1 cung, 2 cung, 3 cung, cung gạch, cung chấm)
export const getAdvancedEqualAngleArcSvg = (
  vertex: Point2D,
  target1: Point2D,
  target2: Point2D,
  arcType: 1 | 2 | 3 | 'arc-tick' | 'arc-dot' | 'double-arc' = 1,
  baseRadius: number = 22
): {
  arcs: string[];
  ticks?: { x1: number; y1: number; x2: number; y2: number }[];
  dots?: { cx: number; cy: number; r: number }[];
  midAnglePos: Point2D;
} => {
  const u = vecNorm(vecSub(target1, vertex));
  const v = vecNorm(vecSub(target2, vertex));

  const cross = crossProd(u, v);
  const sweepFlag = cross > 0 ? 1 : 0;
  const bisectNorm = vecNorm(vecAdd(u, v));

  const buildArcPath = (r: number) => {
    const pStart: Point2D = { x: vertex.x + u.x * r, y: vertex.y + u.y * r };
    const pEnd: Point2D = { x: vertex.x + v.x * r, y: vertex.y + v.y * r };
    return `M ${pStart.x} ${pStart.y} A ${r} ${r} 0 0 ${sweepFlag} ${pEnd.x} ${pEnd.y}`;
  };

  const midAnglePos: Point2D = {
    x: vertex.x + bisectNorm.x * (baseRadius + 8),
    y: vertex.y + bisectNorm.y * (baseRadius + 8),
  };

  if (arcType === 2 || arcType === 'double-arc') {
    return {
      arcs: [buildArcPath(baseRadius - 3), buildArcPath(baseRadius + 2)],
      midAnglePos,
    };
  } else if (arcType === 3) {
    return {
      arcs: [buildArcPath(baseRadius - 5), buildArcPath(baseRadius), buildArcPath(baseRadius + 5)],
      midAnglePos,
    };
  } else if (arcType === 'arc-tick') {
    const midPoint: Point2D = {
      x: vertex.x + bisectNorm.x * baseRadius,
      y: vertex.y + bisectNorm.y * baseRadius,
    };
    const tickLen = 6;
    const t1: Point2D = {
      x: midPoint.x - bisectNorm.x * (tickLen / 2),
      y: midPoint.y - bisectNorm.y * (tickLen / 2),
    };
    const t2: Point2D = {
      x: midPoint.x + bisectNorm.x * (tickLen / 2),
      y: midPoint.y + bisectNorm.y * (tickLen / 2),
    };
    return {
      arcs: [buildArcPath(baseRadius)],
      ticks: [{ x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y }],
      midAnglePos,
    };
  } else if (arcType === 'arc-dot') {
    const dotCenter: Point2D = {
      x: vertex.x + bisectNorm.x * (baseRadius - 7),
      y: vertex.y + bisectNorm.y * (baseRadius - 7),
    };
    return {
      arcs: [buildArcPath(baseRadius)],
      dots: [{ cx: dotCenter.x, cy: dotCenter.y, r: 2 }],
      midAnglePos,
    };
  }

  // 1 cung mặc định
  return {
    arcs: [buildArcPath(baseRadius)],
    midAnglePos,
  };
};

// 3. Ký hiệu đoạn bằng nhau nâng cao (1 gạch, 2 gạch, 3 gạch, chấm tròn, dấu chéo x)
export const getAdvancedSegmentTicks = (
  p1: Point2D,
  p2: Point2D,
  tickType: 1 | 2 | 3 | 'o' | 'x' = 1,
  tickLength: number = 9,
  tickGap: number = 4
): {
  lines?: { x1: number; y1: number; x2: number; y2: number }[];
  circle?: { cx: number; cy: number; r: number };
} => {
  const mid = midpoint(p1, p2);
  if (tickType === 'o') {
    return { circle: { cx: mid.x, cy: mid.y, r: 3 } };
  }

  const v = vecNorm(vecSub(p2, p1)); // Hướng dọc đoạn thẳng
  const n = vecNorm(vecPerp(v));     // Pháp tuyến vuông góc đoạn thẳng

  const halfLen = tickLength / 2;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (tickType === 'x') {
    // Dấu chéo x xoay 45 độ so với đoạn thẳng
    const d1 = vecNorm(vecAdd(v, n));
    const d2 = vecNorm(vecSub(v, n));
    lines.push({
      x1: mid.x - d1.x * halfLen,
      y1: mid.y - d1.y * halfLen,
      x2: mid.x + d1.x * halfLen,
      y2: mid.y + d1.y * halfLen,
    });
    lines.push({
      x1: mid.x - d2.x * halfLen,
      y1: mid.y - d2.y * halfLen,
      x2: mid.x + d2.x * halfLen,
      y2: mid.y + d2.y * halfLen,
    });
    return { lines };
  }

  if (tickType === 1) {
    lines.push({
      x1: mid.x - n.x * halfLen,
      y1: mid.y - n.y * halfLen,
      x2: mid.x + n.x * halfLen,
      y2: mid.y + n.y * halfLen,
    });
  } else if (tickType === 2) {
    const offsets = [-tickGap / 2, tickGap / 2];
    offsets.forEach((off) => {
      const center = { x: mid.x + v.x * off, y: mid.y + v.y * off };
      lines.push({
        x1: center.x - n.x * halfLen,
        y1: center.y - n.y * halfLen,
        x2: center.x + n.x * halfLen,
        y2: center.y + n.y * halfLen,
      });
    });
  } else if (tickType === 3) {
    const offsets = [-tickGap, 0, tickGap];
    offsets.forEach((off) => {
      const center = { x: mid.x + v.x * off, y: mid.y + v.y * off };
      lines.push({
        x1: center.x - n.x * halfLen,
        y1: center.y - n.y * halfLen,
        x2: center.x + n.x * halfLen,
        y2: center.y + n.y * halfLen,
      });
    });
  }

  return { lines };
};

// 4. Phân giải tên điểm hình học thông minh sang toạ độ Point2D
export const resolvePointCoordinate = (
  name: string,
  namedMap: Record<string, Point2D>
): Point2D | null => {
  if (!name) return null;
  const trimmed = name.trim();
  if (namedMap[trimmed]) return namedMap[trimmed];

  // Kiểm tra nếu là dạng Mid(AB) hoặc M_AB
  const midMatch = trimmed.match(/^Mid\(([A-Za-z0-9]+)\)$/i) || trimmed.match(/^M_([A-Za-z0-9]{2})$/i);
  if (midMatch) {
    const pair = midMatch[1];
    if (pair.length >= 2) {
      const p1 = namedMap[pair[0]];
      const p2 = namedMap[pair[1]];
      if (p1 && p2) return midpoint(p1, p2);
    }
  }

  // Tự động phân giải nối 2 chữ cái như 'AB' (trung điểm)
  if (trimmed.length === 2 && namedMap[trimmed[0]] && namedMap[trimmed[1]]) {
    return midpoint(namedMap[trimmed[0]], namedMap[trimmed[1]]);
  }

  return null;
};

// ==========================================
// CÁC HÀM CĂN CHỈNH, TỰ ĐỘNG FIT & DỊCH CHUYỂN HÌNH HỌC (GIAI ĐOẠN 3.3)
// ==========================================

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export const getGeometryBoundingBox = (points: Point2D[]): BoundingBox => {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

/**
 * Dịch chuyển toàn bộ tập điểm của hình
 */
export const translateGeometryPoints = (points: Point2D[], dx: number, dy: number): Point2D[] => {
  return points.map((p) => ({
    x: Math.round((p.x + dx) * 10) / 10,
    y: Math.round((p.y + dy) * 10) / 10,
  }));
};

/**
 * Căn giữa hình học vào tâm của Canvas (width/2, height/2)
 */
export const centerGeometryPoints = (
  points: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
  axis: 'both' | 'horizontal' | 'vertical' = 'both'
): Point2D[] => {
  if (points.length === 0) return points;
  const bbox = getGeometryBoundingBox(points);
  const targetX = canvasWidth / 2;
  const targetY = canvasHeight / 2;

  const dx = axis === 'vertical' ? 0 : targetX - bbox.centerX;
  const dy = axis === 'horizontal' ? 0 : targetY - bbox.centerY;

  return translateGeometryPoints(points, dx, dy);
};

/**
 * Phóng to / Thu nhỏ hình học quanh tâm của hình
 */
export const scaleGeometryPoints = (
  points: Point2D[],
  factor: number,
  customCenter?: Point2D
): Point2D[] => {
  if (points.length === 0 || factor <= 0) return points;
  const center = customCenter || {
    x: getGeometryBoundingBox(points).centerX,
    y: getGeometryBoundingBox(points).centerY,
  };

  return points.map((p) => ({
    x: Math.round((center.x + (p.x - center.x) * factor) * 10) / 10,
    y: Math.round((center.y + (p.y - center.y) * factor) * 10) / 10,
  }));
};

/**
 * Tự động căn chỉnh kích thước & căn giữa (Fit to Canvas) với lề an toàn
 */
export const fitGeometryPoints = (
  points: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50
): Point2D[] => {
  if (points.length === 0) return points;
  const bbox = getGeometryBoundingBox(points);
  if (bbox.width < 10 || bbox.height < 10) return points;

  const availableWidth = Math.max(canvasWidth - padding * 2, 100);
  const availableHeight = Math.max(canvasHeight - padding * 2, 100);

  const scaleX = availableWidth / bbox.width;
  const scaleY = availableHeight / bbox.height;
  const scale = Math.min(scaleX, scaleY);

  const scaled = scaleGeometryPoints(points, scale, { x: bbox.centerX, y: bbox.centerY });
  return centerGeometryPoints(scaled, canvasWidth, canvasHeight, 'both');
};


