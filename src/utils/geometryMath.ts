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
export const vecDot = dotProd;

export const crossProd = (v1: Vector2D, v2: Vector2D): number => v1.x * v2.y - v1.y * v2.x;
export const vecCross = crossProd;

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

// 4.1. Đường tròn ngoại tiếp tam giác (Tâm O là giao 3 đường trung trực)
export const getTriangleCircumcircle = (
  a: Point2D,
  b: Point2D,
  c: Point2D
): { center: Point2D; radius: number } => {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) {
    const mid = midpoint(a, b);
    return { center: mid, radius: Math.max(10, dist(a, mid)) };
  }
  const aSq = a.x * a.x + a.y * a.y;
  const bSq = b.x * b.x + b.y * b.y;
  const cSq = c.x * c.x + c.y * c.y;
  const ox = (aSq * (b.y - c.y) + bSq * (c.y - a.y) + cSq * (a.y - b.y)) / d;
  const oy = (aSq * (c.x - b.x) + bSq * (a.x - c.x) + cSq * (b.x - a.x)) / d;
  const center = { x: ox, y: oy };
  const radius = dist(center, a);
  return { center, radius };
};

// 4.2. Đường tròn nội tiếp tam giác (Tâm I là giao 3 đường phân giác)
export const getTriangleIncircle = (
  a: Point2D,
  b: Point2D,
  c: Point2D
): {
  center: Point2D;
  radius: number;
  contactPoints: { onBC: Point2D; onCA: Point2D; onAB: Point2D };
} => {
  const aLen = dist(b, c); // Cạnh BC
  const bLen = dist(a, c); // Cạnh CA
  const cLen = dist(a, b); // Cạnh AB
  const p = aLen + bLen + cLen;

  if (p < 1e-6) {
    const fallback = midpoint(a, b);
    return {
      center: fallback,
      radius: 20,
      contactPoints: { onBC: fallback, onCA: fallback, onAB: fallback },
    };
  }

  // Tọa độ tâm I = (a*A + b*B + c*C) / (a+b+c)
  const inCenter: Point2D = {
    x: (aLen * a.x + bLen * b.x + cLen * c.x) / p,
    y: (aLen * a.y + bLen * b.y + cLen * c.y) / p,
  };

  // Nửa chu vi s và diện tích theo công thức Heron
  const s = p / 2;
  const areaSq = Math.max(0, s * (s - aLen) * (s - bLen) * (s - cLen));
  const area = Math.sqrt(areaSq);
  const radius = s > 0 ? area / s : 20;

  // Tiếp điểm trên 3 cạnh hạ vuông góc từ I
  const pOnBC = projectPointToLine(inCenter, b, c).point;
  const pOnCA = projectPointToLine(inCenter, c, a).point;
  const pOnAB = projectPointToLine(inCenter, a, b).point;

  return {
    center: inCenter,
    radius,
    contactPoints: {
      onBC: pOnBC,
      onCA: pOnCA,
      onAB: pOnAB,
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
    case 'cyclic': { // Tứ giác nội tiếp đường tròn (4 đỉnh nằm trên 1 đường tròn)
      const cx = 280, cy = 220, r = 125;
      const degToPt = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return {
          x: Math.round(cx + r * Math.cos(rad)),
          y: Math.round(cy - r * Math.sin(rad)),
        };
      };
      return [
        degToPt(125), // Đỉnh A (góc trên bên trái)
        degToPt(45),  // Đỉnh B (góc trên bên phải)
        degToPt(325), // Đỉnh C (góc dưới bên phải)
        degToPt(215), // Đỉnh D (góc dưới bên trái)
      ];
    }
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

/**
 * 11b. Ràng buộc hình học thông minh khi kéo đỉnh tam giác (bảo toàn cấu trúc hình)
 * Áp dụng cho: tam giác vuông, vuông cân, cân, đều
 */
export const constrainTrianglePointDrag = (
  type: string,
  pts: [Point2D, Point2D, Point2D],
  dragIdx: number,
  newPoint: Point2D,
  specialVertex?: string,
  vertexNames: string[] = ['A', 'B', 'C']
): [Point2D, Point2D, Point2D] => {
  const result: [Point2D, Point2D, Point2D] = [
    { ...pts[0] },
    { ...pts[1] },
    { ...pts[2] },
  ];

  if (type === 'general') {
    result[dragIdx] = newPoint;
    return result;
  }

  if (type === 'obtuse') {
    // Chỉ cho kéo trong miền giữ đúng đỉnh tù và chiều tam giác.
    const dotAt = (a: [Point2D, Point2D, Point2D], i: number) => {
      const v = a[i], p = a[(i + 1) % 3], q = a[(i + 2) % 3];
      return (p.x - v.x) * (q.x - v.x) + (p.y - v.y) * (q.y - v.y);
    };
    const namedIdx = specialVertex ? vertexNames.indexOf(specialVertex) : -1;
    const apex = namedIdx >= 0 ? namedIdx : ([0, 1, 2].find(i => dotAt(pts, i) < 0) ?? 0);
    const signedArea = (a: [Point2D, Point2D, Point2D]) =>
      (a[1].x - a[0].x) * (a[2].y - a[0].y) - (a[1].y - a[0].y) * (a[2].x - a[0].x);
    const orientation = Math.sign(signedArea(pts));
    const valid = (a: [Point2D, Point2D, Point2D]) => {
      const v = a[apex], p = a[(apex + 1) % 3], q = a[(apex + 2) % 3];
      const ux = p.x - v.x, uy = p.y - v.y, wx = q.x - v.x, wy = q.y - v.y;
      const lengthProduct = Math.hypot(ux, uy) * Math.hypot(wx, wy);
      return lengthProduct > 400 && dotAt(a, apex) < -0.01 * lengthProduct
        && Math.abs(signedArea(a)) > 0.02 * lengthProduct
        && Math.sign(signedArea(a)) === orientation;
    };
    if (!valid(pts)) return result;
    result[dragIdx] = newPoint;
    if (valid(result)) return result;
    const old = pts[dragIdx];
    let low = 0, high = 1, accepted: Point2D = { ...old };
    for (let i = 0; i < 32; i++) {
      const t = (low + high) / 2;
      const candidate = {
        x: old.x + (newPoint.x - old.x) * t,
        y: old.y + (newPoint.y - old.y) * t,
      };
      result[dragIdx] = candidate;
      if (valid(result)) { accepted = candidate; low = t; } else { high = t; }
    }
    result[dragIdx] = accepted;
    return result;
  }

  // Xác định đỉnh đặc biệt (đỉnh vuông hoặc đỉnh cân)
  let specialIdx = 0;
  if (specialVertex) {
    const idx = vertexNames.indexOf(specialVertex);
    if (idx >= 0) specialIdx = idx;
  } else {
    const d01 = dist(pts[0], pts[1]);
    const d12 = dist(pts[1], pts[2]);
    const d20 = dist(pts[2], pts[0]);
    if (d12 >= d01 && d12 >= d20) specialIdx = 0;
    else if (d20 >= d01 && d20 >= d12) specialIdx = 1;
    else specialIdx = 2;
  }

  // 1. TAM GIÁC VUÔNG & VUÔNG CÂN: Luôn duy trì góc 90 độ tại đỉnh vuông
  if (type === 'right' || type === 'right-isosceles') {
    const rIdx = specialIdx;
    const leg1Idx = (rIdx + 1) % 3;
    const leg2Idx = (rIdx + 2) % 3;

    // Kéo đỉnh góc vuông: di chuyển cả tam giác để bảo toàn góc vuông và hình dạng
    if (dragIdx === rIdx) {
      const dx = newPoint.x - pts[rIdx].x;
      const dy = newPoint.y - pts[rIdx].y;
      return [
        { x: pts[0].x + dx, y: pts[0].y + dy },
        { x: pts[1].x + dx, y: pts[1].y + dy },
        { x: pts[2].x + dx, y: pts[2].y + dy },
      ];
    }

    const otherLegIdx = dragIdx === leg1Idx ? leg2Idx : leg1Idx;
    const rPoint = pts[rIdx];
    const otherPoint = pts[otherLegIdx];

    // Cạnh góc vuông còn lại xác định phương chuẩn
    const baseVec = { x: otherPoint.x - rPoint.x, y: otherPoint.y - rPoint.y };
    const baseLen = Math.hypot(baseVec.x, baseVec.y);
    if (baseLen < 1e-4) {
      result[dragIdx] = newPoint;
      return result;
    }

    // Vector đơn vị vuông góc với cạnh kia
    const norm = { x: -baseVec.y / baseLen, y: baseVec.x / baseLen };

    // Chiếu vector kéo (newPoint - rPoint) lên phương vuông góc
    const dragVec = { x: newPoint.x - rPoint.x, y: newPoint.y - rPoint.y };
    let proj = dragVec.x * norm.x + dragVec.y * norm.y;

    // Giữ cùng chiều nửa mặt phẳng để tam giác không bị lật ngược
    const origVec = { x: pts[dragIdx].x - rPoint.x, y: pts[dragIdx].y - rPoint.y };
    const origProj = origVec.x * norm.x + origVec.y * norm.y;
    if (origProj !== 0 && Math.sign(proj) !== Math.sign(origProj)) {
      proj = Math.sign(origProj) * Math.max(25, Math.abs(proj));
    }
    if (Math.abs(proj) < 25) {
      proj = (origProj >= 0 ? 1 : -1) * 25;
    }

    result[dragIdx] = {
      x: rPoint.x + proj * norm.x,
      y: rPoint.y + proj * norm.y,
    };

    // Nếu là vuông cân: ép cạnh kia bằng đúng độ dài cạnh đang kéo
    if (type === 'right-isosceles') {
      const targetLen = Math.abs(proj);
      const otherDir = { x: baseVec.x / baseLen, y: baseVec.y / baseLen };
      result[otherLegIdx] = {
        x: rPoint.x + targetLen * otherDir.x,
        y: rPoint.y + targetLen * otherDir.y,
      };
    }
    return result;
  }

  // 2. TAM GIÁC ĐỀU: Cả 3 cạnh bằng nhau, 3 góc 60 độ
  if (type === 'equilateral') {
    const center = {
      x: (pts[0].x + pts[1].x + pts[2].x) / 3,
      y: (pts[0].y + pts[1].y + pts[2].y) / 3,
    };
    const dragVec = { x: newPoint.x - center.x, y: newPoint.y - center.y };
    const radius = Math.max(35, Math.hypot(dragVec.x, dragVec.y));
    const startAngle = Math.atan2(dragVec.y, dragVec.x);

    // Xác định chiều quay (cw / ccw)
    const cross = (pts[1].x - pts[0].x) * (pts[2].y - pts[0].y) - (pts[1].y - pts[0].y) * (pts[2].x - pts[0].x);
    const sign = cross >= 0 ? 1 : -1;

    for (let i = 0; i < 3; i++) {
      const offset = (i - dragIdx) * sign * (2 * Math.PI / 3);
      result[i] = {
        x: Math.round(center.x + radius * Math.cos(startAngle + offset)),
        y: Math.round(center.y + radius * Math.sin(startAngle + offset)),
      };
    }
    return result;
  }

  // 3. TAM GIÁC CÂN: Hai cạnh bên luôn bằng nhau
  if (type === 'isosceles') {
    const apex = specialIdx;
    const b1 = (apex + 1) % 3;
    const b2 = (apex + 2) % 3;

    if (dragIdx === apex) {
      // Đỉnh cân luôn nằm trên đường trung trực của đáy (b1, b2)
      const midBase = { x: (pts[b1].x + pts[b2].x) / 2, y: (pts[b1].y + pts[b2].y) / 2 };
      const baseVec = { x: pts[b2].x - pts[b1].x, y: pts[b2].y - pts[b1].y };
      const baseLen = Math.hypot(baseVec.x, baseVec.y);
      if (baseLen < 1e-4) return result;
      const norm = { x: -baseVec.y / baseLen, y: baseVec.x / baseLen };

      const v = { x: newPoint.x - midBase.x, y: newPoint.y - midBase.y };
      let proj = v.x * norm.x + v.y * norm.y;
      if (Math.abs(proj) < 25) proj = 25;

      result[apex] = {
        x: midBase.x + proj * norm.x,
        y: midBase.y + proj * norm.y,
      };
      return result;
    } else {
      // Kéo một trong hai đỉnh đáy: giữ tính đối xứng qua trục đi qua đỉnh apex
      const otherBase = dragIdx === b1 ? b2 : b1;
      const midBaseOrig = { x: (pts[b1].x + pts[b2].x) / 2, y: (pts[b1].y + pts[b2].y) / 2 };
      const axis = { x: midBaseOrig.x - pts[apex].x, y: midBaseOrig.y - pts[apex].y };
      const axisLen = Math.hypot(axis.x, axis.y);
      if (axisLen < 1e-4) {
        result[dragIdx] = newPoint;
        return result;
      }
      const uAxis = { x: axis.x / axisLen, y: axis.y / axisLen };
      const nAxis = { x: -uAxis.y, y: uAxis.x };

      result[dragIdx] = newPoint;
      // Điểm đối diện phản xạ đối xứng qua trục
      const rel = { x: newPoint.x - pts[apex].x, y: newPoint.y - pts[apex].y };
      const compU = rel.x * uAxis.x + rel.y * uAxis.y;
      const compN = rel.x * nAxis.x + rel.y * nAxis.y;

      result[otherBase] = {
        x: pts[apex].x + compU * uAxis.x - compN * nAxis.x,
        y: pts[apex].y + compU * uAxis.y - compN * nAxis.y,
      };
      return result;
    }
  }

  return result;
};

// 12. Ràng buộc hình học thông minh khi kéo đỉnh tứ giác (Bảo toàn hình học cho mọi góc xoay)
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
    // AB // CD và AD // BC => D = A + C - B hay A + C = B + D
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
    // Luôn có 4 góc vuông và 2 cặp cạnh đối song song & bằng nhau (bảo toàn cho mọi góc xoay)
    // Đỉnh đối diện đóng vai trò điểm neo cố định. Trục chữ nhật theo 2 cạnh xuất phát từ điểm neo.
    if (dragIdx === 0) { // Kéo A (đối diện C)
      const anchor = pts[2]; // C
      const uDir = vecNorm(vecSub(pts[3], anchor)); // Hướng CD
      const vDir = vecNorm(vecSub(pts[1], anchor)); // Hướng CB
      const w = vecSub(newPoint, anchor);
      let wu = w.x * uDir.x + w.y * uDir.y;
      let wv = w.x * vDir.x + w.y * vDir.y;
      if (Math.abs(wu) < 20) wu = (wu >= 0 ? 1 : -1) * 20;
      if (Math.abs(wv) < 20) wv = (wv >= 0 ? 1 : -1) * 20;
      result[2] = anchor;
      result[3] = { x: anchor.x + wu * uDir.x, y: anchor.y + wu * uDir.y };
      result[1] = { x: anchor.x + wv * vDir.x, y: anchor.y + wv * vDir.y };
      result[0] = { x: anchor.x + wu * uDir.x + wv * vDir.x, y: anchor.y + wu * uDir.y + wv * vDir.y };
    } else if (dragIdx === 1) { // Kéo B (đối diện D)
      const anchor = pts[3]; // D
      const uDir = vecNorm(vecSub(pts[2], anchor)); // Hướng DC
      const vDir = vecNorm(vecSub(pts[0], anchor)); // Hướng DA
      const w = vecSub(newPoint, anchor);
      let wu = w.x * uDir.x + w.y * uDir.y;
      let wv = w.x * vDir.x + w.y * vDir.y;
      if (Math.abs(wu) < 20) wu = (wu >= 0 ? 1 : -1) * 20;
      if (Math.abs(wv) < 20) wv = (wv >= 0 ? 1 : -1) * 20;
      result[3] = anchor;
      result[2] = { x: anchor.x + wu * uDir.x, y: anchor.y + wu * uDir.y };
      result[0] = { x: anchor.x + wv * vDir.x, y: anchor.y + wv * vDir.y };
      result[1] = { x: anchor.x + wu * uDir.x + wv * vDir.x, y: anchor.y + wu * uDir.y + wv * vDir.y };
    } else if (dragIdx === 2) { // Kéo C (đối diện A)
      const anchor = pts[0]; // A
      const uDir = vecNorm(vecSub(pts[1], anchor)); // Hướng AB
      const vDir = vecNorm(vecSub(pts[3], anchor)); // Hướng AD
      const w = vecSub(newPoint, anchor);
      let wu = w.x * uDir.x + w.y * uDir.y;
      let wv = w.x * vDir.x + w.y * vDir.y;
      if (Math.abs(wu) < 20) wu = (wu >= 0 ? 1 : -1) * 20;
      if (Math.abs(wv) < 20) wv = (wv >= 0 ? 1 : -1) * 20;
      result[0] = anchor;
      result[1] = { x: anchor.x + wu * uDir.x, y: anchor.y + wu * uDir.y };
      result[3] = { x: anchor.x + wv * vDir.x, y: anchor.y + wv * vDir.y };
      result[2] = { x: anchor.x + wu * uDir.x + wv * vDir.x, y: anchor.y + wu * uDir.y + wv * vDir.y };
    } else if (dragIdx === 3) { // Kéo D (đối diện B)
      const anchor = pts[1]; // B
      const uDir = vecNorm(vecSub(pts[0], anchor)); // Hướng BA
      const vDir = vecNorm(vecSub(pts[2], anchor)); // Hướng BC
      const w = vecSub(newPoint, anchor);
      let wu = w.x * uDir.x + w.y * uDir.y;
      let wv = w.x * vDir.x + w.y * vDir.y;
      if (Math.abs(wu) < 20) wu = (wu >= 0 ? 1 : -1) * 20;
      if (Math.abs(wv) < 20) wv = (wv >= 0 ? 1 : -1) * 20;
      result[1] = anchor;
      result[0] = { x: anchor.x + wu * uDir.x, y: anchor.y + wu * uDir.y };
      result[2] = { x: anchor.x + wv * vDir.x, y: anchor.y + wv * vDir.y };
      result[3] = { x: anchor.x + wu * uDir.x + wv * vDir.x, y: anchor.y + wu * uDir.y + wv * vDir.y };
    }
    return result;
  }

  if (type === 'square') {
    // Luôn có 4 cạnh bằng nhau và 4 góc vuông (bảo toàn cho mọi góc xoay)
    const oppIdx = (dragIdx + 2) % 4;
    const anchor = pts[oppIdx];
    let dVec = vecSub(newPoint, anchor);
    if (vecLen(dVec) < 25) {
      const u = vecLen(dVec) > 1e-4 ? vecNorm(dVec) : { x: 1, y: 0 };
      dVec = { x: u.x * 25, y: u.y * 25 };
    }
    const center = { x: anchor.x + dVec.x / 2, y: anchor.y + dVec.y / 2 };
    const hVec = { x: dVec.x / 2, y: dVec.y / 2 };
    const hPerp = { x: -hVec.y, y: hVec.x };

    // Giữ chiều quay (orientation) không bị lật
    const prevCenter = { x: (pts[dragIdx].x + pts[oppIdx].x) / 2, y: (pts[dragIdx].y + pts[oppIdx].y) / 2 };
    const prevPerpPt = pts[(dragIdx + 1) % 4];
    const prevSideVec = vecSub(prevPerpPt, prevCenter);
    const sign = (prevSideVec.x * hPerp.x + prevSideVec.y * hPerp.y) >= 0 ? 1 : -1;

    result[oppIdx] = anchor;
    result[dragIdx] = { x: anchor.x + dVec.x, y: anchor.y + dVec.y };
    result[(dragIdx + 1) % 4] = { x: center.x + sign * hPerp.x, y: center.y + sign * hPerp.y };
    result[(dragIdx + 3) % 4] = { x: center.x - sign * hPerp.x, y: center.y - sign * hPerp.y };
    return result;
  }

  if (type === 'rhombus') {
    // 4 cạnh luôn bằng nhau, 2 đường chéo AC và BD vuông góc tại trung điểm O (cho mọi góc xoay)
    if (dragIdx === 0 || dragIdx === 2) {
      // Kéo A hoặc C: đường chéo BD cố định tâm O và hướng
      const center = { x: (pts[1].x + pts[3].x) / 2, y: (pts[1].y + pts[3].y) / 2 };
      const bdVec = vecSub(pts[3], pts[1]);
      const bdLen = vecLen(bdVec);
      if (bdLen < 1e-4) return result;
      const bdUnit = { x: bdVec.x / bdLen, y: bdVec.y / bdLen };
      const nUnit = { x: -bdUnit.y, y: bdUnit.x }; // Vuông góc BD

      const w = vecSub(newPoint, center);
      let h = w.x * nUnit.x + w.y * nUnit.y;
      const origH = vecDot(vecSub(pts[dragIdx], center), nUnit);
      if (origH !== 0 && Math.sign(h) !== Math.sign(origH)) {
        h = Math.sign(origH) * Math.max(20, Math.abs(h));
      }
      if (Math.abs(h) < 20) h = (origH >= 0 ? 1 : -1) * 20;

      if (dragIdx === 0) {
        result[0] = { x: center.x + h * nUnit.x, y: center.y + h * nUnit.y };
        result[2] = { x: center.x - h * nUnit.x, y: center.y - h * nUnit.y };
      } else {
        result[2] = { x: center.x + h * nUnit.x, y: center.y + h * nUnit.y };
        result[0] = { x: center.x - h * nUnit.x, y: center.y - h * nUnit.y };
      }
    } else {
      // Kéo B hoặc D: đường chéo AC cố định tâm O và hướng
      const center = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2 };
      const acVec = vecSub(pts[2], pts[0]);
      const acLen = vecLen(acVec);
      if (acLen < 1e-4) return result;
      const acUnit = { x: acVec.x / acLen, y: acVec.y / acLen };
      const nUnit = { x: -acUnit.y, y: acUnit.x }; // Vuông góc AC

      const w = vecSub(newPoint, center);
      let h = w.x * nUnit.x + w.y * nUnit.y;
      const origH = vecDot(vecSub(pts[dragIdx], center), nUnit);
      if (origH !== 0 && Math.sign(h) !== Math.sign(origH)) {
        h = Math.sign(origH) * Math.max(20, Math.abs(h));
      }
      if (Math.abs(h) < 20) h = (origH >= 0 ? 1 : -1) * 20;

      if (dragIdx === 1) {
        result[1] = { x: center.x + h * nUnit.x, y: center.y + h * nUnit.y };
        result[3] = { x: center.x - h * nUnit.x, y: center.y - h * nUnit.y };
      } else {
        result[3] = { x: center.x + h * nUnit.x, y: center.y + h * nUnit.y };
        result[1] = { x: center.x - h * nUnit.x, y: center.y - h * nUnit.y };
      }
    }
    return result;
  }

  if (type === 'trapezoid') {
    // Hai đáy luôn song song: AB // CD (bảo toàn cho mọi góc xoay)
    if (dragIdx === 0) {
      // Kéo A: B di chuyển cùng phương song song với đáy CD
      const uCD = vecNorm(vecSub(pts[2], pts[3])); // Phương CD (D -> C)
      const abOrig = vecSub(pts[1], pts[0]);
      const abLen = Math.max(20, vecDot(abOrig, uCD));
      result[0] = newPoint;
      result[1] = { x: newPoint.x + abLen * uCD.x, y: newPoint.y + abLen * uCD.y };
    } else if (dragIdx === 1) {
      // Kéo B: chiếu B lên đường thẳng qua A song song với CD
      const uCD = vecNorm(vecSub(pts[2], pts[3]));
      const w = vecSub(newPoint, pts[0]);
      let len = vecDot(w, uCD);
      if (len < 20) len = 20;
      result[1] = { x: pts[0].x + len * uCD.x, y: pts[0].y + len * uCD.y };
    } else if (dragIdx === 2) {
      // Kéo C: chiếu C lên đường thẳng qua D song song với AB
      const uAB = vecNorm(vecSub(pts[1], pts[0]));
      const w = vecSub(newPoint, pts[3]);
      let len = vecDot(w, uAB);
      if (len < 20) len = 20;
      result[2] = { x: pts[3].x + len * uAB.x, y: pts[3].y + len * uAB.y };
    } else if (dragIdx === 3) {
      // Kéo D: C di chuyển cùng phương song song với AB
      const uAB = vecNorm(vecSub(pts[1], pts[0]));
      const cdOrig = vecSub(pts[2], pts[3]);
      const cdLen = Math.max(20, vecDot(cdOrig, uAB));
      result[3] = newPoint;
      result[2] = { x: newPoint.x + cdLen * uAB.x, y: newPoint.y + cdLen * uAB.y };
    }
    return result;
  }

  if (type === 'right-trapezoid') {
    // AB // CD, góc A = D = 90 độ (AD ⊥ AB và AD ⊥ CD cho mọi góc xoay)
    const baseDir = vecNorm(vecSub(pts[2], pts[3])); // Hướng CD (D -> C)
    const legDir = { x: -baseDir.y, y: baseDir.x }; // Hướng vuông góc (D -> A)

    if (dragIdx === 0) { // Kéo A: A phải nằm trên đường vuông góc xuất phát từ D
      const w = vecSub(newPoint, pts[3]);
      let h = vecDot(w, legDir);
      if (Math.abs(h) < 20) h = (h >= 0 ? 1 : -1) * 20;
      const abLen = Math.max(20, vecDot(vecSub(pts[1], pts[0]), baseDir));
      result[0] = { x: pts[3].x + h * legDir.x, y: pts[3].y + h * legDir.y };
      result[1] = { x: result[0].x + abLen * baseDir.x, y: result[0].y + abLen * baseDir.y };
    } else if (dragIdx === 1) { // Kéo B: chiếu B lên đường thẳng qua A song song với CD
      const w = vecSub(newPoint, pts[0]);
      let len = vecDot(w, baseDir);
      if (len < 20) len = 20;
      result[1] = { x: pts[0].x + len * baseDir.x, y: pts[0].y + len * baseDir.y };
    } else if (dragIdx === 2) { // Kéo C: chiếu C lên đường thẳng qua D song song với AB
      const w = vecSub(newPoint, pts[3]);
      let len = vecDot(w, baseDir);
      if (len < 20) len = 20;
      result[2] = { x: pts[3].x + len * baseDir.x, y: pts[3].y + len * baseDir.y };
    } else if (dragIdx === 3) { // Kéo D: dời cả hình để bảo toàn góc vuông tại A và D
      const h = vecDot(vecSub(pts[0], pts[3]), legDir);
      const abLen = Math.max(20, vecDot(vecSub(pts[1], pts[0]), baseDir));
      const cdLen = Math.max(20, vecDot(vecSub(pts[2], pts[3]), baseDir));
      result[3] = newPoint;
      result[2] = { x: newPoint.x + cdLen * baseDir.x, y: newPoint.y + cdLen * baseDir.y };
      result[0] = { x: newPoint.x + h * legDir.x, y: newPoint.y + h * legDir.y };
      result[1] = { x: result[0].x + abLen * baseDir.x, y: result[0].y + abLen * baseDir.y };
    }
    return result;
  }

  if (type === 'isosceles-trapezoid') {
    // AB // CD và AD = BC (đối xứng qua trục trung trực của 2 đáy cho mọi góc xoay)
    if (dragIdx === 0 || dragIdx === 1) {
      // Đáy CD cố định trục đối xứng
      const midCD = { x: (pts[3].x + pts[2].x) / 2, y: (pts[3].y + pts[2].y) / 2 };
      const uBase = vecNorm(vecSub(pts[2], pts[3])); // D -> C
      const nAxis = { x: -uBase.y, y: uBase.x }; // Trục đối xứng vuông góc đáy

      const w = vecSub(newPoint, midCD);
      let h = vecDot(w, nAxis); // Chiều cao
      if (Math.abs(h) < 20) h = (h >= 0 ? 1 : -1) * 20;
      let halfW = vecDot(w, uBase); // Bán kính đáy AB
      if (Math.abs(halfW) < 15) halfW = (halfW >= 0 ? 1 : -1) * 15;

      const midAB = { x: midCD.x + h * nAxis.x, y: midCD.y + h * nAxis.y };
      if (dragIdx === 0) {
        const wDist = Math.abs(halfW);
        result[0] = { x: midAB.x - wDist * uBase.x, y: midAB.y - wDist * uBase.y };
        result[1] = { x: midAB.x + wDist * uBase.x, y: midAB.y + wDist * uBase.y };
      } else {
        const wDist = Math.abs(halfW);
        result[1] = { x: midAB.x + wDist * uBase.x, y: midAB.y + wDist * uBase.y };
        result[0] = { x: midAB.x - wDist * uBase.x, y: midAB.y - wDist * uBase.y };
      }
    } else {
      // Đáy AB cố định trục đối xứng
      const midAB = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const uBase = vecNorm(vecSub(pts[1], pts[0])); // A -> B
      const nAxis = { x: -uBase.y, y: uBase.x };

      const w = vecSub(newPoint, midAB);
      let h = vecDot(w, nAxis);
      if (Math.abs(h) < 20) h = (h >= 0 ? 1 : -1) * 20;
      let halfW = vecDot(w, uBase);
      if (Math.abs(halfW) < 15) halfW = (halfW >= 0 ? 1 : -1) * 15;

      const midCD = { x: midAB.x + h * nAxis.x, y: midAB.y + h * nAxis.y };
      if (dragIdx === 2) {
        const wDist = Math.abs(halfW);
        result[2] = { x: midCD.x + wDist * uBase.x, y: midCD.y + wDist * uBase.y };
        result[3] = { x: midCD.x - wDist * uBase.x, y: midCD.y - wDist * uBase.y };
      } else {
        const wDist = Math.abs(halfW);
        result[3] = { x: midCD.x - wDist * uBase.x, y: midCD.y - wDist * uBase.y };
        result[2] = { x: midCD.x + wDist * uBase.x, y: midCD.y + wDist * uBase.y };
      }
    }
    return result;
  }

  if (type === 'cyclic') {
    // 4 đỉnh cùng nằm trên 1 đường tròn: lấy 3 đỉnh còn lại để tính tâm O và bán kính R, chiếu đỉnh đang kéo lên đường tròn đó
    const otherIdxs = [0, 1, 2, 3].filter((i) => i !== dragIdx);
    const p1 = pts[otherIdxs[0]];
    const p2 = pts[otherIdxs[1]];
    const p3 = pts[otherIdxs[2]];
    const circle = getTriangleCircumcircle(p1, p2, p3);
    if (circle && circle.radius > 5 && Number.isFinite(circle.radius)) {
      const vec = vecSub(newPoint, circle.center);
      const len = vecLen(vec);
      if (len > 1e-4) {
        result[dragIdx] = {
          x: circle.center.x + (vec.x / len) * circle.radius,
          y: circle.center.y + (vec.y / len) * circle.radius,
        };
      }
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

    case 'sector': // Hình quạt tròn AOB
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(-Math.PI / 6), y: cy + r * Math.sin(-Math.PI / 6) }, // 1: Điểm A (bán kính OA)
        { x: cx + r * Math.cos((-2 * Math.PI) / 3), y: cy + r * Math.sin((-2 * Math.PI) / 3) }, // 2: Điểm B (bán kính OB)
      ];

    case 'segment': // Hình viên phân (giới hạn bởi dây AB và cung AB)
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(-Math.PI / 6), y: cy + r * Math.sin(-Math.PI / 6) }, // 1: Điểm A
        { x: cx + r * Math.cos((-5 * Math.PI) / 6), y: cy + r * Math.sin((-5 * Math.PI) / 6) }, // 2: Điểm B
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

    case 'tangent-chord-angle': // Góc tạo bởi tiếp tuyến và dây cung (Tool 3.1)
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos(Math.PI / 2), y: cy + r * Math.sin(Math.PI / 2) }, // 1: Tiếp điểm A (đáy)
        { x: cx + r * Math.cos((-Math.PI) / 4), y: cy + r * Math.sin((-Math.PI) / 4) }, // 2: Điểm B (mút dây cung)
        { x: cx + r * Math.cos((3 * Math.PI) / 4), y: cy + r * Math.sin((3 * Math.PI) / 4) }, // 3: Đỉnh C góc nội tiếp so sánh
      ];

    case 'interior-angle': // Góc có đỉnh bên trong đường tròn (Tool 3.2)
      return [
        { x: cx, y: cy }, // 0: Tâm O
        { x: cx + r * Math.cos((5 * Math.PI) / 6), y: cy + r * Math.sin((5 * Math.PI) / 6) }, // 1: A (Dây AB)
        { x: cx + r * Math.cos(-Math.PI / 6), y: cy + r * Math.sin(-Math.PI / 6) }, // 2: B (Dây AB)
        { x: cx + r * Math.cos((2 * Math.PI) / 3), y: cy + r * Math.sin((2 * Math.PI) / 3) }, // 3: C (Dây CD)
        { x: cx + r * Math.cos(-Math.PI / 2), y: cy + r * Math.sin(-Math.PI / 2) }, // 4: D (Dây CD)
      ];

    case 'exterior-angle': // Góc có đỉnh bên ngoài đường tròn (Tool 3.3)
      return [
        { x: cx - 40, y: cy }, // 0: Tâm O
        { x: cx + 180, y: cy }, // 1: Đỉnh ngoài P
        { x: (cx - 40) + r * Math.cos(-Math.PI / 3), y: cy + r * Math.sin(-Math.PI / 3) }, // 2: Điểm A trên cát tuyến 1
        { x: (cx - 40) + r * Math.cos(Math.PI / 3), y: cy + r * Math.sin(Math.PI / 3) }, // 3: Điểm C trên cát tuyến 2
      ];

    case 'two-circles':
      return [
        { x: 200, y: cy }, // 0: Tâm O1
        { x: 360, y: cy }, // 1: Tâm O2
        { x: 200 + 100, y: cy }, // 2: Điểm bán kính R1
        { x: 360 + 75, y: cy },  // 3: Điểm bán kính R2
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

  // Không kéo điểm bán kính về tâm: bán kính < 15 làm hình suy biến.
  if (dragIdx === 1 && dist(center, newPoint) < 15 &&
      type !== 'two-tangents' && type !== 'two-circles' && type !== 'exterior-angle') {
    return result;
  }

  // 2. Kéo điểm A (Bán kính) (dragIdx = 1) trong basic, diameter-chord, tangent-point
  if (dragIdx === 1) {
    if (type === 'basic' || type === 'diameter-chord' || type === 'tangent-point') {
      const newRadius = Math.max(15, dist(center, newPoint));
      const u = dist(center, newPoint) > 1e-4 ? vecNorm(vecSub(newPoint, center)) : { x: 1, y: 0 };
      result[1] = { x: center.x + u.x * newRadius, y: center.y + u.y * newRadius };
      
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

    if (type === 'arc' || type === 'sector' || type === 'segment') {
      // Kéo điểm A: thay đổi bán kính r và góc của A, tự động giữ bán kính cho B
      const newRadius = Math.max(15, dist(center, newPoint));
      const u = dist(center, newPoint) > 1e-4 ? vecNorm(vecSub(newPoint, center)) : { x: 1, y: 0 };
      result[1] = { x: center.x + u.x * newRadius, y: center.y + u.y * newRadius };
      if (points.length >= 3 && newRadius > 5) {
        const vB = vecNorm(vecSub(points[2], center));
        result[2] = {
          x: center.x + vB.x * newRadius,
          y: center.y + vB.y * newRadius,
        };
      }
      return result;
    }

    if (type === 'inscribed-angle' || type === 'tangent-chord-angle' || type === 'interior-angle') {
      // Khóa điểm trên đường tròn
      const r = dist(center, points[1]) || 110;
      if (dist(center, newPoint) < 1e-4) return result;
      const v = vecNorm(vecSub(newPoint, center));
      result[1] = {
        x: center.x + v.x * r,
        y: center.y + v.y * r,
      };
      return result;
    }

    if (type === 'two-tangents') {
      // Kéo điểm ngoài P: P luôn phải nằm ngoài đường tròn (d >= r + 15) để 2 tiếp tuyến luôn tiếp xúc đúng
      const r = (points[2] ? dist(center, points[2]) : null) || 110;
      const d = dist(center, newPoint);
      if (d <= r + 15) {
        const u = d > 1e-4 ? vecNorm(vecSub(newPoint, center)) : { x: 1, y: 0 };
        result[1] = { x: center.x + u.x * (r + 15), y: center.y + u.y * (r + 15) };
      } else {
        result[1] = newPoint;
      }
      return result;
    }

    if (type === 'exterior-angle') {
      // Kéo điểm ngoài P
      result[1] = newPoint;
      return result;
    }

    if (type === 'two-circles') {
      // Kéo tâm O2
      result[1] = newPoint;
      return result;
    }
  }

  // 3. Kéo các điểm dây cung C, D hoặc điểm cung B, hoặc điểm góc nội tiếp P, tiếp tuyến...
  if (dragIdx >= 2) {
    if (
      type === 'diameter-chord' ||
      type === 'arc' ||
      type === 'inscribed-angle' ||
      type === 'tangent-chord-angle' ||
      type === 'interior-angle' ||
      type === 'exterior-angle'
    ) {
      // Khóa điểm nằm trên đường tròn (O, R)
      const r = dist(center, points[1]) || 110;
      if (dist(center, newPoint) < 1e-4) return result;
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

// ==========================================
// TIẾP TUYẾN CHUNG CỦA HAI ĐƯỜNG TRÒN (TOOL 4)
// ==========================================

export interface CommonTangentLine {
  type: 'external' | 'internal';
  start: Point2D;
  end: Point2D;
  contact1: Point2D;
  contact2: Point2D;
}

export const getCommonTangents = (
  c1: Point2D,
  r1: number,
  c2: Point2D,
  r2: number,
  extendLength: number = 40
): { external: CommonTangentLine[]; internal: CommonTangentLine[] } => {
  const d = dist(c1, c2);
  const result: { external: CommonTangentLine[]; internal: CommonTangentLine[] } = {
    external: [],
    internal: [],
  };

  if (d < 1e-4) return result;

  const theta = Math.atan2(c2.y - c1.y, c2.x - c1.x);

  // 1. Tiếp tuyến chung ngoài (External tangents)
  // Tồn tại khi d >= |r1 - r2|
  const diffR = r1 - r2;
  if (d >= Math.abs(diffR)) {
    const ratio = Math.max(-1, Math.min(1, diffR / d));
    const alpha = Math.asin(ratio);

    // Tiếp tuyến 1
    const beta1 = theta + Math.PI / 2 - alpha;
    const p1 = { x: c1.x + r1 * Math.cos(beta1), y: c1.y + r1 * Math.sin(beta1) };
    const q1 = { x: c2.x + r2 * Math.cos(beta1), y: c2.y + r2 * Math.sin(beta1) };
    const dir1 = vecNorm(vecSub(q1, p1));
    result.external.push({
      type: 'external',
      contact1: p1,
      contact2: q1,
      start: { x: p1.x - dir1.x * extendLength, y: p1.y - dir1.y * extendLength },
      end: { x: q1.x + dir1.x * extendLength, y: q1.y + dir1.y * extendLength },
    });

    // Tiếp tuyến 2 (nếu r1 != r2 hoặc d > 0)
    const beta2 = theta - Math.PI / 2 + alpha;
    const p2 = { x: c1.x + r1 * Math.cos(beta2), y: c1.y + r1 * Math.sin(beta2) };
    const q2 = { x: c2.x + r2 * Math.cos(beta2), y: c2.y + r2 * Math.sin(beta2) };
    const dir2 = vecNorm(vecSub(q2, p2));
    result.external.push({
      type: 'external',
      contact1: p2,
      contact2: q2,
      start: { x: p2.x - dir2.x * extendLength, y: p2.y - dir2.y * extendLength },
      end: { x: q2.x + dir2.x * extendLength, y: q2.y + dir2.y * extendLength },
    });
  }

  // 2. Tiếp tuyến chung trong (Internal tangents)
  // Tồn tại khi d >= r1 + r2
  const sumR = r1 + r2;
  if (d >= sumR) {
    const ratio = Math.max(-1, Math.min(1, sumR / d));
    const alpha = Math.asin(ratio);

    // Tiếp tuyến 1
    const gamma1 = theta + Math.PI / 2 - alpha;
    const p1 = { x: c1.x + r1 * Math.cos(gamma1), y: c1.y + r1 * Math.sin(gamma1) };
    const q1 = { x: c2.x - r2 * Math.cos(gamma1), y: c2.y - r2 * Math.sin(gamma1) };
    const dir1 = vecNorm(vecSub(q1, p1));
    result.internal.push({
      type: 'internal',
      contact1: p1,
      contact2: q1,
      start: { x: p1.x - dir1.x * extendLength, y: p1.y - dir1.y * extendLength },
      end: { x: q1.x + dir1.x * extendLength, y: q1.y + dir1.y * extendLength },
    });

    // Tiếp tuyến 2 (nếu d > sumR)
    if (d > sumR + 1e-4) {
      const gamma2 = theta - Math.PI / 2 + alpha;
      const p2 = { x: c1.x + r1 * Math.cos(gamma2), y: c1.y + r1 * Math.sin(gamma2) };
      const q2 = { x: c2.x - r2 * Math.cos(gamma2), y: c2.y - r2 * Math.sin(gamma2) };
      const dir2 = vecNorm(vecSub(q2, p2));
      result.internal.push({
        type: 'internal',
        contact1: p2,
        contact2: q2,
        start: { x: p2.x - dir2.x * extendLength, y: p2.y - dir2.y * extendLength },
        end: { x: q2.x + dir2.x * extendLength, y: q2.y + dir2.y * extendLength },
      });
    }
  }

  return result;
};

// ==========================================
// TỰ ĐỘNG BẮT GIAO ĐIỂM ĐƯỜNG THẲNG, TIA, ĐOẠN THẲNG (TOOL 5)
// ==========================================

export interface IntersectionResult {
  point: Point2D | null;
  isValidOnElem1: boolean;
  isValidOnElem2: boolean;
  isDirectIntersection: boolean; // Đúng cả 2 miền thực
  t1: number;
  t2: number;
  extension1?: { from: Point2D; to: Point2D };
  extension2?: { from: Point2D; to: Point2D };
}

export const findLineRaySegmentIntersection = (
  p1: Point2D,
  p2: Point2D,
  type1: 'line' | 'ray' | 'segment' = 'segment',
  p3: Point2D,
  p4: Point2D,
  type2: 'line' | 'ray' | 'segment' = 'segment'
): IntersectionResult => {
  const d1 = vecSub(p2, p1);
  const d2 = vecSub(p4, p3);
  const cross = d1.x * d2.y - d1.y * d2.x;

  if (Math.abs(cross) < 1e-6) {
    return {
      point: null,
      isValidOnElem1: false,
      isValidOnElem2: false,
      isDirectIntersection: false,
      t1: 0,
      t2: 0,
    };
  }

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t1 = (dx * d2.y - dy * d2.x) / cross;
  const t2 = (dx * d1.y - dy * d1.x) / cross;

  const interPoint: Point2D = {
    x: p1.x + t1 * d1.x,
    y: p1.y + t1 * d1.y,
  };

  const isTValid = (t: number, type: 'line' | 'ray' | 'segment') => {
    if (type === 'line') return true;
    if (type === 'ray') return t >= -1e-4;
    return t >= -1e-4 && t <= 1 + 1e-4;
  };

  const valid1 = isTValid(t1, type1);
  const valid2 = isTValid(t2, type2);

  // Tính đường nét đứt kéo dài nếu điểm giao nằm ngoài miền thật của đoạn/tia
  let ext1: { from: Point2D; to: Point2D } | undefined;
  if (!valid1) {
    const base = t1 < 0 ? p1 : p2;
    ext1 = { from: base, to: interPoint };
  }

  let ext2: { from: Point2D; to: Point2D } | undefined;
  if (!valid2) {
    const base = t2 < 0 ? p3 : p4;
    ext2 = { from: base, to: interPoint };
  }

  return {
    point: interPoint,
    isValidOnElem1: valid1,
    isValidOnElem2: valid2,
    isDirectIntersection: valid1 && valid2,
    t1,
    t2,
    extension1: ext1,
    extension2: ext2,
  };
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
 * Tính toán bounding box có padding bao bọc danh sách điểm
 */
export const calculatePointsBoundingBox = (points: Point2D[], padding: number = 0): BoundingBox => {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  minX = Math.round((minX - padding) * 10) / 10;
  maxX = Math.round((maxX + padding) * 10) / 10;
  minY = Math.round((minY - padding) * 10) / 10;
  maxY = Math.round((maxY + padding) * 10) / 10;

  const width = Math.round((maxX - minX) * 10) / 10;
  const height = Math.round((maxY - minY) * 10) / 10;

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
 * Tính viewBox SVG mở rộng an toàn, bao bọc toàn bộ canvas và các phần tử tràn biên
 */
export const getExpandedSvgViewBox = (
  sceneBox: BoundingBox,
  canvasWidth: number = 560,
  canvasHeight: number = 440
): { minX: number; minY: number; width: number; height: number; viewBox: string } => {
  const overflowLeft = sceneBox.minX < 0;
  const overflowTop = sceneBox.minY < 0;
  const overflowRight = sceneBox.maxX > canvasWidth;
  const overflowBottom = sceneBox.maxY > canvasHeight;

  if (!overflowLeft && !overflowTop && !overflowRight && !overflowBottom) {
    return {
      minX: 0,
      minY: 0,
      width: canvasWidth,
      height: canvasHeight,
      viewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
    };
  }

  const minX = Math.min(0, sceneBox.minX);
  const minY = Math.min(0, sceneBox.minY);
  const maxX = Math.max(canvasWidth, sceneBox.maxX);
  const maxY = Math.max(canvasHeight, sceneBox.maxY);
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    minX,
    minY,
    width,
    height,
    viewBox: `${minX} ${minY} ${width} ${height}`,
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

// =========================================================================
// NHÓM 2 - CÔNG CỤ 1: ĐỊNH LÝ TA-LÉT (ĐƯỜNG THẲNG SONG SONG CẮT 2 CẠNH TAM GIÁC)
// =========================================================================

export interface ThalesPointsResult {
  M: Point2D;
  N: Point2D;
  A: Point2D; // Đỉnh đối diện cạnh song song (Đỉnh chóp của tỉ lệ)
  B: Point2D; // Đỉnh bên trái
  C: Point2D; // Đỉnh bên phải
  topName: string;
  leftName: string;
  rightName: string;
  AM: number;
  MB: number;
  AN: number;
  NC: number;
  MN: number;
  BC: number;
  ratio: number;
  extensionM?: Point2D;
  extensionN?: Point2D;
}

export const getThalesCutVertices = (
  trianglePoints: [Point2D, Point2D, Point2D],
  cutSide: 'AB-AC' | 'BA-BC' | 'CA-CB' = 'AB-AC',
  vertexNames: string[] = ['A', 'B', 'C']
): { top: Point2D; left: Point2D; right: Point2D; topName: string; leftName: string; rightName: string } => {
  const [A, B, C] = trianglePoints;
  const [nA, nB, nC] = [vertexNames[0] || 'A', vertexNames[1] || 'B', vertexNames[2] || 'C'];
  if (cutSide === 'BA-BC') {
    return { top: B, left: A, right: C, topName: nB, leftName: nA, rightName: nC };
  } else if (cutSide === 'CA-CB') {
    return { top: C, left: A, right: B, topName: nC, leftName: nA, rightName: nB };
  }
  return { top: A, left: B, right: C, topName: nA, leftName: nB, rightName: nC };
};

export const getThalesPoints = (
  trianglePoints: [Point2D, Point2D, Point2D],
  ratio: number = 0.4,
  cutSide: 'AB-AC' | 'BA-BC' | 'CA-CB' = 'AB-AC',
  vertexNames: string[] = ['A', 'B', 'C']
): ThalesPointsResult => {
  const { top, left, right, topName, leftName, rightName } = getThalesCutVertices(trianglePoints, cutSide, vertexNames);
  const clampedRatio = Math.max(0.05, Math.min(0.95, ratio));
  const M: Point2D = {
    x: Math.round(top.x + (left.x - top.x) * clampedRatio),
    y: Math.round(top.y + (left.y - top.y) * clampedRatio),
  };
  const N: Point2D = {
    x: Math.round(top.x + (right.x - top.x) * clampedRatio),
    y: Math.round(top.y + (right.y - top.y) * clampedRatio),
  };

  // Kéo dài đường thẳng MN ra ngoài cạnh tam giác nếu cần
  const dirMN = vecNorm(vecSub(N, M));
  const extLen = 35;
  const extensionM: Point2D = {
    x: Math.round(M.x - dirMN.x * extLen),
    y: Math.round(M.y - dirMN.y * extLen),
  };
  const extensionN: Point2D = {
    x: Math.round(N.x + dirMN.x * extLen),
    y: Math.round(N.y + dirMN.y * extLen),
  };

  return {
    M,
    N,
    A: top,
    B: left,
    C: right,
    topName,
    leftName,
    rightName,
    AM: dist(top, M),
    MB: dist(M, left),
    AN: dist(top, N),
    NC: dist(N, right),
    MN: dist(M, N),
    BC: dist(left, right),
    ratio: clampedRatio,
    extensionM,
    extensionN,
  };
};

export const projectPointOntoSegmentRatio = (
  p: Point2D,
  segA: Point2D,
  segB: Point2D
): number => {
  const v = vecSub(segB, segA);
  const lenSq = v.x * v.x + v.y * v.y;
  if (lenSq < 1e-4) return 0.4;
  const u = vecSub(p, segA);
  const t = (u.x * v.x + u.y * v.y) / lenSq;
  return Math.max(0.05, Math.min(0.95, Math.round(t * 100) / 100));
};

// =========================================================================
// NHÓM 2 - CÔNG CỤ 3: ĐA GIÁC ĐỀU (REGULAR POLYGON)
// =========================================================================

export const getPolygonPresetSides = (type: string): number => {
  switch (type) {
    case 'triangle': return 3;
    case 'square': return 4;
    case 'pentagon': return 5;
    case 'hexagon': return 6;
    case 'heptagon': return 7;
    case 'octagon': return 8;
    case 'nonagon': return 9;
    case 'decagon': return 10;
    case 'dodecagon': return 12;
    default: return 5;
  }
};

export const getRegularPolygonPresetPoints = (
  type: string = 'pentagon',
  center: Point2D = { x: 280, y: 230 },
  radius: number = 120,
  rotationAngleDeg: number = -90,
  customSidesCount?: number
): Point2D[] => {
  const n = customSidesCount || getPolygonPresetSides(type);
  const points: Point2D[] = [];
  const startRad = (rotationAngleDeg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const angle = startRad + (2 * Math.PI * i) / n;
    points.push({
      x: Math.round(center.x + radius * Math.cos(angle)),
      y: Math.round(center.y + radius * Math.sin(angle)),
    });
  }
  return points;
};

export const getDefaultPolygonVertexNames = (sidesCount: number): string[] => {
  const defaultAlphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q'];
  if (sidesCount <= 8) {
    return defaultAlphabet.slice(0, sidesCount);
  }
  // Cho đa giác nhiều cạnh > 8: A1, A2, A3...
  return Array.from({ length: sidesCount }, (_, i) => `A_{${i + 1}}`);
};

export const constrainRegularPolygonDrag = (
  polygon: {
    type: string;
    sidesCount: number;
    center: Point2D;
    radius: number;
    rotationAngle?: number;
    points?: Point2D[];
  },
  dragIndex: number, // 0: Tâm O, 1..n: Đỉnh thứ (dragIndex - 1)
  newPoint: Point2D
): { center: Point2D; radius: number; rotationAngle: number; points: Point2D[] } => {
  const n = polygon.sidesCount || getPolygonPresetSides(polygon.type);
  let center = { ...polygon.center };
  let radius = polygon.radius || 120;
  let rotationAngle = polygon.rotationAngle ?? -90;

  if (dragIndex === 0) {
    // Kéo tâm O -> dịch chuyển toàn bộ đa giác
    center = newPoint;
  } else {
    // Kéo đỉnh P_k (với k = dragIndex - 1)
    const k = dragIndex - 1;
    const d = dist(center, newPoint);
    radius = Math.max(30, Math.min(260, Math.round(d)));
    // Tính góc của con trỏ so với tâm
    const currentAngleRad = Math.atan2(newPoint.y - center.y, newPoint.x - center.x);
    // rotationRad = currentAngleRad - 2*PI*k / n
    const baseRotationRad = currentAngleRad - (2 * Math.PI * k) / n;
    rotationAngle = Math.round((baseRotationRad * 180) / Math.PI);
  }

  const points = getRegularPolygonPresetPoints(polygon.type, center, radius, rotationAngle, n);
  return { center, radius, rotationAngle, points };
};

// =========================================================================
// NHÓM 2 - CÔNG CỤ 2: PHÉP ĐỐI XỨNG TRỤC & ĐỐI XỨNG TÂM (SYMMETRY)
// =========================================================================

export const reflectPointAxial = (p: Point2D, p1: Point2D, p2: Point2D): Point2D => {
  const proj = projectPointToLine(p, p1, p2);
  return {
    x: Math.round(2 * proj.point.x - p.x),
    y: Math.round(2 * proj.point.y - p.y),
  };
};

export const reflectPointCentral = (p: Point2D, center: Point2D): Point2D => {
  return {
    x: Math.round(2 * center.x - p.x),
    y: Math.round(2 * center.y - p.y),
  };
};

export const computeReflectedPoints = (
  type: 'axial' | 'central',
  originalPoints: Point2D[],
  axisPoints?: [Point2D, Point2D],
  centerPoint?: Point2D
): Point2D[] => {
  if (type === 'axial') {
    const p1 = axisPoints?.[0] || { x: 280, y: 70 };
    const p2 = axisPoints?.[1] || { x: 280, y: 410 };
    return originalPoints.map((pt) => reflectPointAxial(pt, p1, p2));
  } else {
    const c = centerPoint || { x: 280, y: 240 };
    return originalPoints.map((pt) => reflectPointCentral(pt, c));
  }
};

export const getSymmetryPresetPoints = (
  type: 'axial' | 'central' = 'axial',
  targetShape: 'point' | 'segment' | 'triangle' | 'quadrilateral' | 'circle' = 'triangle'
): {
  originalPoints: Point2D[];
  originalNames: string[];
  reflectedNames: string[];
  axisPoints: [Point2D, Point2D];
  centerPoint: Point2D;
  circleRadius?: number;
} => {
  const axisPoints: [Point2D, Point2D] = [
    { x: 280, y: 70 },
    { x: 280, y: 410 },
  ];
  const centerPoint: Point2D = { x: 280, y: 240 };

  if (type === 'axial') {
    if (targetShape === 'point') {
      return {
        originalPoints: [{ x: 170, y: 220 }],
        originalNames: ['A'],
        reflectedNames: ["A'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'segment') {
      return {
        originalPoints: [
          { x: 160, y: 150 },
          { x: 220, y: 310 },
        ],
        originalNames: ['A', 'B'],
        reflectedNames: ["A'", "B'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'triangle') {
      return {
        originalPoints: [
          { x: 170, y: 130 },
          { x: 110, y: 310 },
          { x: 230, y: 280 },
        ],
        originalNames: ['A', 'B', 'C'],
        reflectedNames: ["A'", "B'", "C'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'quadrilateral') {
      return {
        originalPoints: [
          { x: 170, y: 130 },
          { x: 230, y: 160 },
          { x: 210, y: 310 },
          { x: 120, y: 270 },
        ],
        originalNames: ['A', 'B', 'C', 'D'],
        reflectedNames: ["A'", "B'", "C'", "D'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'circle') {
      return {
        originalPoints: [
          { x: 160, y: 240 }, // Tâm O
          { x: 220, y: 240 }, // Điểm trên đường tròn A
        ],
        originalNames: ['O', 'A'],
        reflectedNames: ["O'", "A'"],
        axisPoints,
        centerPoint,
        circleRadius: 60,
      };
    }
  } else {
    // Đối xứng tâm
    if (targetShape === 'point') {
      return {
        originalPoints: [{ x: 170, y: 150 }],
        originalNames: ['A'],
        reflectedNames: ["A'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'segment') {
      return {
        originalPoints: [
          { x: 160, y: 140 },
          { x: 220, y: 190 },
        ],
        originalNames: ['A', 'B'],
        reflectedNames: ["A'", "B'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'triangle') {
      return {
        originalPoints: [
          { x: 180, y: 120 },
          { x: 130, y: 210 },
          { x: 230, y: 220 },
        ],
        originalNames: ['A', 'B', 'C'],
        reflectedNames: ["A'", "B'", "C'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'quadrilateral') {
      return {
        originalPoints: [
          { x: 170, y: 120 },
          { x: 230, y: 140 },
          { x: 210, y: 210 },
          { x: 140, y: 190 },
        ],
        originalNames: ['A', 'B', 'C', 'D'],
        reflectedNames: ["A'", "B'", "C'", "D'"],
        axisPoints,
        centerPoint,
      };
    } else if (targetShape === 'circle') {
      return {
        originalPoints: [
          { x: 170, y: 160 }, // Tâm O
          { x: 220, y: 160 }, // Điểm trên đường tròn A
        ],
        originalNames: ['O', 'A'],
        reflectedNames: ["O'", "A'"],
        axisPoints,
        centerPoint,
        circleRadius: 50,
      };
    }
  }

  return {
    originalPoints: [{ x: 170, y: 220 }],
    originalNames: ['A'],
    reflectedNames: ["A'"],
    axisPoints,
    centerPoint,
  };
};

export const constrainSymmetryDrag = (
  symmetry: {
    type: 'axial' | 'central';
    originalPoints: Point2D[];
    axisPoints?: [Point2D, Point2D];
    centerPoint?: Point2D;
  },
  dragTarget: 'original' | 'axis' | 'center',
  dragIndex: number,
  newPoint: Point2D
): {
  originalPoints: Point2D[];
  axisPoints: [Point2D, Point2D];
  centerPoint: Point2D;
  reflectedPoints: Point2D[];
} => {
  const orig = [...symmetry.originalPoints];
  const axis: [Point2D, Point2D] = symmetry.axisPoints ? [...symmetry.axisPoints] : [{ x: 280, y: 70 }, { x: 280, y: 410 }];
  let center = symmetry.centerPoint ? { ...symmetry.centerPoint } : { x: 280, y: 240 };

  if (dragTarget === 'original' && orig[dragIndex]) {
    orig[dragIndex] = newPoint;
  } else if (dragTarget === 'axis' && (dragIndex === 0 || dragIndex === 1)) {
    axis[dragIndex] = newPoint;
  } else if (dragTarget === 'center') {
    center = newPoint;
  }

  const reflectedPoints = computeReflectedPoints(symmetry.type, orig, axis, center);

  return {
    originalPoints: orig,
    axisPoints: axis,
    centerPoint: center,
    reflectedPoints,
  };
};


