import React from 'react';
import { BaseChartSettings, CoordinatePlaneData } from '../types';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface CoordinatePlaneSvgProps {
  data: CoordinatePlaneData;
  settings: BaseChartSettings;
}

export const CoordinatePlaneSvg: React.FC<CoordinatePlaneSvgProps> = ({ data, settings }) => {
  const {
    xMin = -5,
    xMax = 5,
    xStep = 1,
    yMin = -4,
    yMax = 4,
    yStep = 1,
    points = [],
    segments = [],
    showGrid = true,
    showSubGrid = false,
    showAxisNumbers = true,
    originLabel = 'O',
    xAxisLabel = 'x',
    yAxisLabel = 'y',
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

  // Chuyển đổi từ tọa độ Descartes (x, y) sang SVG pixel
  const toScreenX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toScreenY = (y: number) => margin.top + ((yMax - y) / (yMax - yMin)) * plotHeight;

  const originX = toScreenX(0);
  const originY = toScreenY(0);

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.axis;

  // Sinh các mốc tọa độ x, y
  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    xTicks.push(Math.round(x * 100) / 100);
  }

  const yTicks: number[] = [];
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    yTicks.push(Math.round(y * 100) / 100);
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

      {/* Lưới tọa độ ô vuông chuẩn SGK */}
      {showGrid && (
        <g id="grid-lines" stroke="#e2e8f0" strokeWidth={0.8}>
          {xTicks.map((xVal) => {
            const sx = toScreenX(xVal);
            return <line key={`gx-${xVal}`} x1={sx} y1={margin.top} x2={sx} y2={margin.top + plotHeight} />;
          })}
          {yTicks.map((yVal) => {
            const sy = toScreenY(yVal);
            return <line key={`gy-${yVal}`} x1={margin.left} y1={sy} x2={margin.left + plotWidth} y2={sy} />;
          })}
        </g>
      )}

      {/* Trục Ox và Oy */}
      <g id="axes">
        {/* Trục hoành Ox */}
        <line
          x1={margin.left - 10}
          y1={originY}
          x2={margin.left + plotWidth + 15}
          y2={originY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#math-arrow-sm)"
        />
        <text
          x={margin.left + plotWidth + 24}
          y={originY + 4}
          fontSize={16}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          {xAxisLabel}
        </text>

        {/* Trục tung Oy */}
        <line
          x1={originX}
          y1={margin.top + plotHeight + 10}
          x2={originX}
          y2={margin.top - 15}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#math-arrow-sm)"
        />
        <text
          x={originX - 14}
          y={margin.top - 14}
          fontSize={16}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          {yAxisLabel}
        </text>

        {/* Gốc tọa độ O */}
        <text
          x={originX - 12}
          y={originY + 16}
          fontSize={15}
          fontStyle="italic"
          fontWeight="bold"
          fill="#000000"
        >
          {originLabel}
        </text>

        {/* Các vạch chia và số trục Ox */}
        {showAxisNumbers &&
          xTicks.map((xVal) => {
            if (xVal === 0) return null;
            const sx = toScreenX(xVal);
            return (
              <g key={`tx-${xVal}`}>
                <line x1={sx} y1={originY - 3} x2={sx} y2={originY + 3} stroke={strokeColor} strokeWidth={1} />
                <text
                  x={sx}
                  y={originY + 15}
                  textAnchor="middle"
                  fontSize={settings.labelFontSize ? settings.labelFontSize - 2 : 12}
                  fill="#000000"
                >
                  {xVal}
                </text>
              </g>
            );
          })}

        {/* Các vạch chia và số trục Oy */}
        {showAxisNumbers &&
          yTicks.map((yVal) => {
            if (yVal === 0) return null;
            const sy = toScreenY(yVal);
            return (
              <g key={`ty-${yVal}`}>
                <line x1={originX - 3} y1={sy} x2={originX + 3} y2={sy} stroke={strokeColor} strokeWidth={1} />
                <text
                  x={originX - 7}
                  y={sy + 4}
                  textAnchor="end"
                  fontSize={settings.labelFontSize ? settings.labelFontSize - 2 : 12}
                  fill="#000000"
                >
                  {yVal}
                </text>
              </g>
            );
          })}
      </g>

      {/* Các đoạn thẳng nối điểm */}
      <g id="segments">
        {segments.map((seg) => {
          const pt1 = points.find((p) => p.id === seg.fromPointId);
          const pt2 = points.find((p) => p.id === seg.toPointId);
          if (!pt1 || !pt2) return null;

          const sx1 = toScreenX(pt1.x);
          const sy1 = toScreenY(pt1.y);
          const sx2 = toScreenX(pt2.x);
          const sy2 = toScreenY(pt2.y);

          return (
            <line
              key={seg.id}
              x1={sx1}
              y1={sy1}
              x2={sx2}
              y2={sy2}
              stroke={examMode ? '#000000' : (seg.color || '#000000')}
              strokeWidth={seg.width || 1.5}
              strokeDasharray={seg.style === 'dashed' ? '4 3' : undefined}
            />
          );
        })}
      </g>

      {/* Các điểm tọa độ (Points) & đường dóng nét đứt */}
      <g id="points">
        {points.map((p) => {
          const sx = toScreenX(p.x);
          const sy = toScreenY(p.y);
          const ptColor = examMode ? '#000000' : (p.color || '#000000');

          return (
            <g key={p.id}>
              {/* Đường dóng nét đứt vuông góc tới Ox và Oy */}
              {p.showProjections && (
                <g stroke="#64748b" strokeWidth={1} strokeDasharray="3 3">
                  <line x1={sx} y1={sy} x2={sx} y2={originY} />
                  <line x1={sx} y1={sy} x2={originX} y2={sy} />
                </g>
              )}

              {/* Vòng tròn điểm */}
              <circle cx={sx} cy={sy} r={3.8} fill={ptColor} stroke="#000000" strokeWidth={0.6} />

              {/* Tên điểm và tọa độ: A(2; 3) */}
              <text
                x={sx + 8}
                y={sy - 6}
                fontSize={settings.labelFontSize || 14}
                fontWeight="bold"
                fill="#000000"
              >
                {p.name}
                {p.showCoordinates && (
                  <tspan fontWeight="normal">({p.x}; {p.y})</tspan>
                )}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
