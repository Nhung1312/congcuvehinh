import React from 'react';
import { BaseChartSettings, FunctionGraphData } from '../types';
import { evaluateFunction } from '../calculations/mathCalculations';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, getMathFontFamily } from '../constants/style';

interface FunctionGraphSvgProps {
  data: FunctionGraphData;
  settings: BaseChartSettings;
}

export const FunctionGraphSvg: React.FC<FunctionGraphSvgProps> = ({ data, settings }) => {
  const {
    functionType = 'linear',
    a = 1,
    b = 0,
    xMin = -5,
    xMax = 5,
    yMin = -5,
    yMax = 5,
    xStep = 1,
    yStep = 1,
    showEquation = true,
    curveColor = '#2563eb',
    curveWidth = SGK_STYLE.strokeWidth.curve,
    showSpecialPoints = true,
    showGrid = true,
    secondFunction,
    showIntersections = true,
    showIntersectionProjections = true,
    intersectionPointNames = ['A', 'B'],
  } = data;

  const width = settings.width || 600;
  const height = settings.height || 500;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const margin = {
    top: showTitle ? SGK_STYLE.margin.topWithTitle : SGK_STYLE.margin.topNoTitle,
    right: 35,
    bottom: 35,
    left: 35,
  };

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const toScreenX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toScreenY = (y: number) => margin.top + ((yMax - y) / (yMax - yMin)) * plotHeight;

  const originX = toScreenX(0);
  const originY = toScreenY(0);

  const strokeColor = '#000000';
  const activeCurveColor = examMode ? '#000000' : curveColor || '#2563eb';
  const activeSecondColor = examMode ? '#000000' : secondFunction?.lineColor || '#dc2626';

  // 1. Tạo path cho hàm số thứ nhất
  const samples = 200;
  const step = (xMax - xMin) / samples;

  const generatePath = (type: 'linear' | 'quadratic' | 'inverse', coeffA: number, coeffB: number) => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * step;
      const y = evaluateFunction(type, coeffA, coeffB, x);
      if (y !== null && y >= yMin - 1 && y <= yMax + 1) {
        points.push({ x: toScreenX(x), y: toScreenY(y) });
      }
    }
    return points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';
  };

  const pathD1 = generatePath(functionType, a, b);

  // 2. Tạo path cho hàm số thứ hai (nếu bật)
  const isSecondEnabled = Boolean(secondFunction?.enabled);
  const pathD2 = isSecondEnabled
    ? generatePath(secondFunction!.functionType, secondFunction!.a, secondFunction!.b)
    : '';

  // Xây dựng công thức hiển thị
  const formatEquation = (type: 'linear' | 'quadratic' | 'inverse', coeffA: number, coeffB: number) => {
    if (type === 'linear') {
      if (coeffA === 1) return coeffB === 0 ? 'y = x' : coeffB > 0 ? `y = x + ${coeffB}` : `y = x - ${Math.abs(coeffB)}`;
      if (coeffA === -1) return coeffB === 0 ? 'y = -x' : coeffB > 0 ? `y = -x + ${coeffB}` : `y = -x - ${Math.abs(coeffB)}`;
      if (coeffA === 0) return `y = ${coeffB}`;
      return coeffB === 0 ? `y = ${coeffA}x` : coeffB > 0 ? `y = ${coeffA}x + ${coeffB}` : `y = ${coeffA}x - ${Math.abs(coeffB)}`;
    }
    if (type === 'quadratic') {
      if (coeffA === 1) return coeffB === 0 ? 'y = x²' : coeffB > 0 ? `y = x² + ${coeffB}` : `y = x² - ${Math.abs(coeffB)}`;
      if (coeffA === -1) return coeffB === 0 ? 'y = -x²' : coeffB > 0 ? `y = -x² + ${coeffB}` : `y = -x² - ${Math.abs(coeffB)}`;
      return coeffB === 0 ? `y = ${coeffA}x²` : coeffB > 0 ? `y = ${coeffA}x² + ${coeffB}` : `y = ${coeffA}x² - ${Math.abs(coeffB)}`;
    }
    return `y = ${coeffA}/x`;
  };

  const equationStr1 = formatEquation(functionType, a, b);
  const equationStr2 = isSecondEnabled
    ? formatEquation(secondFunction!.functionType, secondFunction!.a, secondFunction!.b)
    : '';

  // 3. Tính toán các điểm giao nhau (Intersections)
  interface InterPoint {
    name: string;
    x: number;
    y: number;
  }

  const intersections: InterPoint[] = [];

  if (isSecondEnabled && showIntersections) {
    const f1Type = functionType;
    const f2Type = secondFunction!.functionType;
    const a1 = a;
    const b1 = b;
    const a2 = secondFunction!.a;
    const b2 = secondFunction!.b;

    if (f1Type === 'linear' && f2Type === 'linear') {
      // a1*x + b1 = a2*x + b2 => (a1 - a2)x = b2 - b1
      if (Math.abs(a1 - a2) > 1e-6) {
        const ix = (b2 - b1) / (a1 - a2);
        const iy = a1 * ix + b1;
        if (ix >= xMin && ix <= xMax && iy >= yMin && iy <= yMax) {
          intersections.push({
            name: intersectionPointNames[0] || 'A',
            x: Number(ix.toFixed(2)),
            y: Number(iy.toFixed(2)),
          });
        }
      }
    } else if (
      (f1Type === 'quadratic' && f2Type === 'linear') ||
      (f1Type === 'linear' && f2Type === 'quadratic')
    ) {
      // Parabol y = a_q*x^2 + b_q và đường thẳng y = a_l*x + b_l
      const aq = f1Type === 'quadratic' ? a1 : a2;
      const bq = f1Type === 'quadratic' ? b1 : b2;
      const al = f1Type === 'linear' ? a1 : a2;
      const bl = f1Type === 'linear' ? b1 : b2;

      // Phương trình hoành độ giao điểm: aq*x^2 - al*x + (bq - bl) = 0
      const A_quad = aq;
      const B_quad = -al;
      const C_quad = bq - bl;

      const delta = B_quad * B_quad - 4 * A_quad * C_quad;
      if (delta >= 0 && Math.abs(A_quad) > 1e-6) {
        const x1 = (-B_quad + Math.sqrt(delta)) / (2 * A_quad);
        const x2 = (-B_quad - Math.sqrt(delta)) / (2 * A_quad);

        const pts = [x1, x2].sort((p1, p2) => p1 - p2);
        const uniqueX = pts.filter((val, idx, arr) => idx === 0 || Math.abs(val - arr[idx - 1]) > 0.05);

        uniqueX.forEach((ix, i) => {
          const iy = al * ix + bl;
          if (ix >= xMin && ix <= xMax && iy >= yMin && iy <= yMax) {
            intersections.push({
              name: intersectionPointNames[i] || (i === 0 ? 'A' : 'B'),
              x: Number(ix.toFixed(2)),
              y: Number(iy.toFixed(2)),
            });
          }
        });
      }
    }
  }

  // 4. Các điểm đặc biệt khác (Đỉnh parabol, Giao Ox, Oy)
  const specialPoints: { x: number; y: number; label: string }[] = [];
  if (showSpecialPoints && !isSecondEnabled) {
    if (functionType === 'linear' && a !== 0) {
      const xIntercept = -b / a;
      if (xIntercept >= xMin && xIntercept <= xMax) {
        specialPoints.push({ x: Number(xIntercept.toFixed(2)), y: 0, label: `(${xIntercept}; 0)` });
      }
      if (b >= yMin && b <= yMax && b !== 0) {
        specialPoints.push({ x: 0, y: b, label: `(0; ${b})` });
      }
    } else if (functionType === 'quadratic') {
      specialPoints.push({ x: 0, y: b, label: `Đỉnh (0; ${b})` });
    }
  }

  return (
    <svg
      id="svg-math-canvas"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        fontFamily,
        backgroundColor: settings.backgroundColor || '#ffffff',
      }}
      className="select-none mx-auto block max-w-full h-auto"
    >
      <SvgPatternDefs />

      <rect width={width} height={height} fill={settings.backgroundColor || '#ffffff'} />

      {showTitle && (
        <text
          x={width / 2}
          y={SGK_STYLE.margin.titleY}
          textAnchor="middle"
          fontSize={settings.fontSize ? settings.fontSize + 2 : SGK_STYLE.fontSize.title}
          fontWeight="bold"
          fill="#000000"
        >
          {title}
        </text>
      )}

      {/* 1. Lưới ô vuông */}
      {showGrid && (
        <g id="func-grid" stroke={SGK_STYLE.grid.color} strokeWidth={SGK_STYLE.strokeWidth.grid}>
          {Array.from(
            { length: Math.floor((xMax - xMin) / xStep) + 1 },
            (_, i) => xMin + i * xStep
          ).map((xVal) => {
            const sx = toScreenX(xVal);
            return <line key={`gx-${xVal}`} x1={sx} y1={margin.top} x2={sx} y2={margin.top + plotHeight} />;
          })}
          {Array.from(
            { length: Math.floor((yMax - yMin) / yStep) + 1 },
            (_, i) => yMin + i * yStep
          ).map((yVal) => {
            const sy = toScreenY(yVal);
            return <line key={`gy-${yVal}`} x1={margin.left} y1={sy} x2={margin.left + plotWidth} y2={sy} />;
          })}
        </g>
      )}

      {/* 2. Đường dóng nét đứt từ giao điểm xuống 2 trục tọa độ Ox, Oy */}
      {showIntersectionProjections && (
        <g id="intersection-projections">
          {intersections.map((pt, idx) => {
            const sx = toScreenX(pt.x);
            const sy = toScreenY(pt.y);
            return (
              <g key={'proj_' + idx}>
                {/* Dóng xuống Ox */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={sx}
                  y2={originY}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="4,3"
                />
                {/* Dóng sang Oy */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={originX}
                  y2={sy}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="4,3"
                />

                {/* Số tọa độ trên trục Ox */}
                {Math.abs(pt.x) > 0.05 && (
                  <text
                    x={sx}
                    y={originY + 14}
                    textAnchor="middle"
                    fontSize={SGK_STYLE.fontSize.axisTitle - 1}
                    fontWeight="bold"
                    fill="#1e293b"
                    style={{
                      paintOrder: 'stroke fill',
                      stroke: '#ffffff',
                      strokeWidth: 3,
                    }}
                  >
                    {pt.x}
                  </text>
                )}

                {/* Số tọa độ trên trục Oy */}
                {Math.abs(pt.y) > 0.05 && (
                  <text
                    x={originX - 6}
                    y={sy + 4}
                    textAnchor="end"
                    fontSize={SGK_STYLE.fontSize.axisTitle - 1}
                    fontWeight="bold"
                    fill="#1e293b"
                    style={{
                      paintOrder: 'stroke fill',
                      stroke: '#ffffff',
                      strokeWidth: 3,
                    }}
                  >
                    {pt.y}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 3. Trục tọa độ Ox & Oy */}
      <g id="func-axes">
        <line
          x1={margin.left - 10}
          y1={originY}
          x2={margin.left + plotWidth + 18}
          y2={originY}
          stroke={strokeColor}
          strokeWidth={SGK_STYLE.strokeWidth.axis}
          markerEnd="url(#math-arrow-sm)"
        />
        <text
          x={margin.left + plotWidth + 24}
          y={originY + 4}
          fontSize={SGK_STYLE.fontSize.axisTitle}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          x
        </text>

        <line
          x1={originX}
          y1={margin.top + plotHeight + 10}
          x2={originX}
          y2={margin.top - 18}
          stroke={strokeColor}
          strokeWidth={SGK_STYLE.strokeWidth.axis}
          markerEnd="url(#math-arrow-sm)"
        />
        <text
          x={originX - 14}
          y={margin.top - 16}
          fontSize={SGK_STYLE.fontSize.axisTitle}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          y
        </text>

        {/* Gốc tọa độ O */}
        <text
          x={originX - 12}
          y={originY + 16}
          fontSize={SGK_STYLE.fontSize.axisTitle}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          O
        </text>
      </g>

      {/* 4. Đồ thị hàm số 1 */}
      {pathD1 && (
        <path
          d={pathD1}
          fill="none"
          stroke={activeCurveColor}
          strokeWidth={curveWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* 5. Đồ thị hàm số 2 (nếu có) */}
      {isSecondEnabled && pathD2 && (
        <path
          d={pathD2}
          fill="none"
          stroke={activeSecondColor}
          strokeWidth={curveWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* 6. Hộp hiển thị phương trình hàm số */}
      {showEquation && (
        <g transform={`translate(${margin.left + 15}, ${margin.top + 24})`}>
          <rect
            x={-6}
            y={-16}
            width={Math.max(equationStr1.length, equationStr2.length) * 9 + 30}
            height={isSecondEnabled ? 48 : 28}
            fill="#ffffff"
            fillOpacity={0.92}
            stroke="#cbd5e1"
            strokeWidth={0.8}
            rx={4}
          />
          <text
            x={4}
            y={2}
            fontSize={SGK_STYLE.fontSize.axisTitle}
            fontWeight="bold"
            fontStyle="italic"
            fill={activeCurveColor}
          >
            {equationStr1}
          </text>
          {isSecondEnabled && (
            <text
              x={4}
              y={22}
              fontSize={SGK_STYLE.fontSize.axisTitle}
              fontWeight="bold"
              fontStyle="italic"
              fill={activeSecondColor}
            >
              {equationStr2}
            </text>
          )}
        </g>
      )}

      {/* 7. Các điểm giao nhau (Intersections) */}
      {intersections.map((pt, idx) => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);
        return (
          <g key={'inter_' + idx}>
            <circle cx={sx} cy={sy} r={4} fill="#dc2626" stroke="#ffffff" strokeWidth={1.5} />
            <text
              x={sx + 8}
              y={sy - 8}
              fontSize={SGK_STYLE.fontSize.axisTitle}
              fontWeight="bold"
              fill="#000000"
              style={{
                paintOrder: 'stroke fill',
                stroke: '#ffffff',
                strokeWidth: 3.5,
              }}
            >
              {pt.name}({pt.x}; {pt.y})
            </text>
          </g>
        );
      })}

      {/* 8. Các điểm đặc biệt lẻ */}
      {specialPoints.map((pt, idx) => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);
        return (
          <g key={`sp-${idx}`}>
            <circle cx={sx} cy={sy} r={3.5} fill="#ef4444" stroke="#000000" strokeWidth={0.6} />
            <text
              x={sx + 6}
              y={sy - 6}
              fontSize={SGK_STYLE.fontSize.small}
              fill="#000000"
              style={{
                paintOrder: 'stroke fill',
                stroke: '#ffffff',
                strokeWidth: 3,
              }}
            >
              {pt.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
