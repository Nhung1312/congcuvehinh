import React from 'react';
import { BaseChartSettings, LineChartData } from '../types';
import { calculateAxisTicks } from '../calculations/mathCalculations';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface LineChartSvgProps {
  data: LineChartData;
  settings: BaseChartSettings;
}

export const LineChartSvg: React.FC<LineChartSvgProps> = ({ data, settings }) => {
  const {
    points,
    xAxisTitle,
    yAxisTitle,
    unit,
    yStart: customYMin,
    yEnd: customYMax,
    yStep: customYStep,
    lineColor = '#000000',
    lineWidth = SGK_STYLE.strokeWidth.curve,
    lineStyle = 'solid',
    pointRadius = 4,
    pointStyle = 'circle',
    showPoints = true,
    showValues = true,
    showDashedProjections = true,
    showGridLines = true,
  } = data;

  const width = settings.width || 640;
  const height = settings.height || 480;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const margin = {
    top: showTitle ? SGK_STYLE.margin.topWithTitle : SGK_STYLE.margin.topNoTitle,
    right: 40,
    bottom: 65,
    left: 70,
  };

  const chartAreaWidth = width - margin.left - margin.right;
  const chartAreaHeight = height - margin.top - margin.bottom;

  const yVals = points.map((p) => Number(p.yValue) || 0);
  const dataMax = yVals.length ? Math.max(...yVals, 0) : 10;
  const dataMin = yVals.length ? Math.min(...yVals, 0) : 0;

  const computedTicks = calculateAxisTicks(
    customYMin !== undefined ? customYMin : Math.min(0, dataMin),
    customYMax !== undefined ? customYMax : Math.max(10, dataMax * 1.15),
    5
  );

  const axisMin = customYMin !== undefined ? customYMin : computedTicks.min;
  const axisMax = customYMax !== undefined ? customYMax : computedTicks.max;
  const axisTicks = customYStep
    ? Array.from(
        { length: Math.floor((axisMax - axisMin) / customYStep) + 1 },
        (_, i) => axisMin + i * customYStep
      )
    : computedTicks.ticks;

  const valueRange = axisMax - axisMin || 1;

  // Tính tọa độ màn hình cho từng điểm
  const totalPoints = points.length;
  const plottedPoints = points.map((p, index) => {
    // Phân bố đều các mốc x trên trục ngang
    const x = totalPoints > 1 
      ? (index / (totalPoints - 1)) * (chartAreaWidth - 40) + 20
      : chartAreaWidth / 2;
    
    const yVal = Number(p.yValue) || 0;
    const y = chartAreaHeight - ((yVal - axisMin) / valueRange) * chartAreaHeight;

    return { ...p, screenX: x, screenY: y, yVal };
  });

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.axis;
  const activeLineColor = examMode ? '#000000' : (lineColor || '#000000');

  // Tạo chuỗi tọa độ cho polyline
  const pointsString = plottedPoints.map((p) => `${p.screenX},${p.screenY}`).join(' ');

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

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Lưới ngang */}
        {showGridLines &&
          axisTicks.map((tickVal) => {
            const y = chartAreaHeight - ((tickVal - axisMin) / valueRange) * chartAreaHeight;
            if (tickVal === axisMin) return null;
            return (
              <line
                key={`grid-y-${tickVal}`}
                x1={0}
                y1={y}
                x2={chartAreaWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}

        {/* Trục Ox và Oy */}
        <line
          x1={0}
          y1={chartAreaHeight}
          x2={chartAreaWidth + 15}
          y2={chartAreaHeight}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#math-arrow-sm)"
        />
        <line
          x1={0}
          y1={chartAreaHeight}
          x2={0}
          y2={-15}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#math-arrow-sm)"
        />

        {/* Gốc O */}
        <text
          x={-8}
          y={chartAreaHeight + 15}
          textAnchor="end"
          fontSize={settings.labelFontSize || 14}
          fill="#000000"
        >
          {axisMin}
        </text>

        {/* Vạch chia trục Oy */}
        {axisTicks.map((tickVal) => {
          if (tickVal === axisMin) return null;
          const y = chartAreaHeight - ((tickVal - axisMin) / valueRange) * chartAreaHeight;
          return (
            <g key={`tick-y-${tickVal}`}>
              <line x1={-5} y1={y} x2={0} y2={y} stroke={strokeColor} strokeWidth={strokeWidth} />
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
                fill="#000000"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Tên trục Oy */}
        {yAxisTitle && (
          <text
            x={-15}
            y={-18}
            textAnchor="middle"
            fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
            fontStyle="italic"
            fill="#000000"
          >
            {yAxisTitle} {unit ? `(${unit})` : ''}
          </text>
        )}

        {/* Đường dóng nét đứt (Dashed projections) xuống trục Ox và sang Oy */}
        {showDashedProjections &&
          plottedPoints.map((p) => (
            <g key={`proj-${p.id}`}>
              {/* Dóng xuống Ox */}
              <line
                x1={p.screenX}
                y1={p.screenY}
                x2={p.screenX}
                y2={chartAreaHeight}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {/* Dóng sang Oy */}
              <line
                x1={0}
                y1={p.screenY}
                x2={p.screenX}
                y2={p.screenY}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            </g>
          ))}

        {/* Đường gấp khúc nối các điểm */}
        {plottedPoints.length > 1 && (
          <polyline
            points={pointsString}
            fill="none"
            stroke={activeLineColor}
            strokeWidth={lineWidth}
            strokeDasharray={lineStyle === 'dashed' ? '5 4' : lineStyle === 'dotted' ? '2 3' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Các điểm (Point markers) & nhãn giá trị */}
        {plottedPoints.map((p, index) => (
          <g key={`pt-${p.id}`}>
            {/* Vạch chia trên trục Ox */}
            <line
              x1={p.screenX}
              y1={chartAreaHeight}
              x2={p.screenX}
              y2={chartAreaHeight + 5}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Tên mốc x trên trục Ox */}
            <text
              x={p.screenX}
              y={chartAreaHeight + 20}
              textAnchor="middle"
              fontSize={settings.labelFontSize || 14}
              fill="#000000"
            >
              {p.xLabel || `${index + 1}`}
            </text>

            {/* Vẽ điểm */}
            {showPoints && (
              <>
                {pointStyle === 'circle' && (
                  <circle
                    cx={p.screenX}
                    cy={p.screenY}
                    r={pointRadius}
                    fill={activeLineColor}
                  />
                )}
                {pointStyle === 'hollow-circle' && (
                  <circle
                    cx={p.screenX}
                    cy={p.screenY}
                    r={pointRadius}
                    fill="#ffffff"
                    stroke={activeLineColor}
                    strokeWidth={1.5}
                  />
                )}
                {pointStyle === 'square' && (
                  <rect
                    x={p.screenX - pointRadius}
                    y={p.screenY - pointRadius}
                    width={pointRadius * 2}
                    height={pointRadius * 2}
                    fill={activeLineColor}
                  />
                )}
              </>
            )}

            {/* Giá trị trên đầu điểm */}
            {showValues && (
              <text
                x={p.screenX}
                y={p.screenY - 8}
                textAnchor="middle"
                fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
                fontWeight="bold"
                fill="#000000"
              >
                {p.yVal}
              </text>
            )}

            {/* Tên điểm nếu có (ví dụ A, B, C) */}
            {p.pointName && (
              <text
                x={p.screenX + 8}
                y={p.screenY - 4}
                fontSize={settings.labelFontSize || 14}
                fontStyle="italic"
                fontWeight="bold"
                fill="#000000"
              >
                {p.pointName}
              </text>
            )}
          </g>
        ))}

        {/* Tên trục Ox */}
        {xAxisTitle && (
          <text
            x={chartAreaWidth + 10}
            y={chartAreaHeight + 35}
            textAnchor="end"
            fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
            fontStyle="italic"
            fill="#000000"
          >
            {xAxisTitle}
          </text>
        )}
      </g>
    </svg>
  );
};
