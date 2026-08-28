import { PieSlice } from '../types';

/**
 * Tính toán hình học cho Biểu đồ Quạt Tròn (Pie / Sector Chart)
 */
export interface ComputedSlice extends PieSlice {
  startAngleDeg: number;
  endAngleDeg: number;
  middleAngleDeg: number;
  pathD: string;
  labelX: number;
  labelY: number;
  percentStr: string;
  valueStr: string;
}

export function calculatePieSlices(
  slices: PieSlice[],
  radius: number,
  centerX: number,
  centerY: number,
  startOffsetDeg: number = 0,
  decimalPlaces: number = 0,
  unit: string = ''
): { computedSlices: ComputedSlice[]; total: number } {
  const total = slices.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0);
  if (total <= 0) {
    return { computedSlices: [], total: 0 };
  }

  let currentAngle = startOffsetDeg;
  const computedSlices: ComputedSlice[] = [];

  slices.forEach((slice) => {
    const rawVal = Math.max(0, Number(slice.value) || 0);
    const fraction = rawVal / total;
    const sliceAngle = fraction * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const middleAngle = startAngle + sliceAngle / 2;

    const startRad = (Math.PI / 180) * (startAngle - 90);
    const endRad = (Math.PI / 180) * (endAngle - 90);
    const midRad = (Math.PI / 180) * (middleAngle - 90);

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    let pathD = '';
    if (sliceAngle >= 359.99) {
      // Trọn vẹn 100% hình tròn
      pathD = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 0 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 0 ${centerX - radius} ${centerY} Z`;
    } else {
      pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    // Vị trí đặt nhãn (khoảng 60% bán kính để dễ nhìn)
    const labelRadius = radius * 0.62;
    const labelX = centerX + labelRadius * Math.cos(midRad);
    const labelY = centerY + labelRadius * Math.sin(midRad);

    const pct = fraction * 100;
    const percentStr = decimalPlaces === 0 ? `${Math.round(pct)}%` : `${pct.toFixed(decimalPlaces)}%`;
    const valueStr = `${rawVal}${unit ? ` ${unit}` : ''}`;

    computedSlices.push({
      ...slice,
      percentage: pct,
      angle: sliceAngle,
      startAngleDeg: startAngle,
      endAngleDeg: endAngle,
      middleAngleDeg: middleAngle,
      pathD,
      labelX,
      labelY,
      percentStr,
      valueStr,
    });

    currentAngle = endAngle;
  });

  return { computedSlices, total };
}

/**
 * Phân bổ lại phần trăm khi người dùng thay đổi giá trị của một nhóm có khóa/không khóa (giống trong video người dùng cung cấp)
 */
export function redistributePiePercentages(
  slices: PieSlice[],
  changedId: string,
  newPercentage: number
): PieSlice[] {
  const targetSlice = slices.find((s) => s.id === changedId);
  if (!targetSlice) return slices;

  const clampedNew = Math.max(0, Math.min(100, newPercentage));
  const otherSlices = slices.filter((s) => s.id !== changedId);
  const otherLockedSum = otherSlices
    .filter((s) => s.isLocked)
    .reduce((sum, s) => sum + s.value, 0);

  const remainingForUnlocked = Math.max(0, 100 - clampedNew - otherLockedSum);
  const unlockedSlices = otherSlices.filter((s) => !s.isLocked);

  if (unlockedSlices.length === 0) {
    return slices.map((s) => (s.id === changedId ? { ...s, value: clampedNew } : s));
  }

  const currentUnlockedSum = unlockedSlices.reduce((sum, s) => sum + s.value, 0);

  return slices.map((s) => {
    if (s.id === changedId) {
      return { ...s, value: clampedNew };
    }
    if (s.isLocked) {
      return s;
    }
    if (currentUnlockedSum <= 0) {
      return { ...s, value: remainingForUnlocked / unlockedSlices.length };
    }
    const ratio = s.value / currentUnlockedSum;
    return { ...s, value: Math.round(ratio * remainingForUnlocked * 10) / 10 };
  });
}

/**
 * Tính toán phân vạch trục (Tick Division) chuẩn mực Toán học THCS
 */
export function calculateAxisTicks(
  minVal: number,
  maxVal: number,
  targetTickCount: number = 5
): { min: number; max: number; step: number; ticks: number[] } {
  if (maxVal <= minVal) {
    maxVal = minVal + 10;
  }
  const rawRange = maxVal - minVal;
  const rawStep = rawRange / targetTickCount;

  // Làm tròn bước nhảy theo thang (1, 2, 5, 10, 20, 25, 50, 100...)
  const power = Math.floor(Math.log10(rawStep));
  const magnitude = Math.pow(10, power);
  const normalizedStep = rawStep / magnitude;

  let step = magnitude;
  if (normalizedStep <= 1.2) step = 1 * magnitude;
  else if (normalizedStep <= 2.5) step = 2 * magnitude;
  else if (normalizedStep <= 6) step = 5 * magnitude;
  else step = 10 * magnitude;

  const min = Math.floor(minVal / step) * step;
  const max = Math.ceil(maxVal / step) * step;

  const ticks: number[] = [];
  for (let v = min; v <= max + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }

  return { min, max, step, ticks };
}

/**
 * Đánh giá hàm số THCS để vẽ đồ thị chính xác
 */
export function evaluateFunction(
  type: 'linear' | 'quadratic' | 'inverse',
  a: number,
  b: number,
  x: number
): number | null {
  if (type === 'linear') {
    return a * x + b;
  } else if (type === 'quadratic') {
    return a * x * x + b;
  } else if (type === 'inverse') {
    if (Math.abs(x) < 0.0001) return null;
    return a / x;
  }
  return 0;
}
