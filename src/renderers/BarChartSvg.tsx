import React from 'react';
import { BarChartData, BaseChartSettings } from '../types';
import { calculateAxisTicks } from '../calculations/mathCalculations';
import { SvgPatternDefs, getPatternFillUrl } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface BarChartSvgProps {
  data: BarChartData;
  settings: BaseChartSettings;
}

export const BarChartSvg: React.FC<BarChartSvgProps> = ({ data, settings }) => {
  const {
    orientation = 'vertical',
    items,
    xAxisTitle,
    yAxisTitle,
    unit,
    minValue: customMin,
    maxValue: customMax,
    stepSize: customStep,
    barWidth = 36,
    barGap = 28,
    showValueOnBar = true,
    showAxisArrows = true,
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
    left: orientation === 'vertical' ? 70 : 100,
  };

  const chartAreaWidth = width - margin.left - margin.right;
  const chartAreaHeight = height - margin.top - margin.bottom;

  // Tính min, max thực tế
  const values = items.map((it) => Number(it.value) || 0);
  const dataMax = values.length ? Math.max(...values, 0) : 10;
  const dataMin = values.length ? Math.min(...values, 0) : 0;

  const computedTicks = calculateAxisTicks(
    customMin !== undefined ? customMin : Math.min(0, dataMin),
    customMax !== undefined ? customMax : Math.max(10, dataMax * 1.15),
    5
  );

  const axisMin = customMin !== undefined ? customMin : computedTicks.min;
  const axisMax = customMax !== undefined ? customMax : computedTicks.max;
  const axisTicks = customStep
    ? Array.from(
        { length: Math.floor((axisMax - axisMin) / customStep) + 1 },
        (_, i) => axisMin + i * customStep
      )
    : computedTicks.ticks;

  const valueRange = axisMax - axisMin || 1;

  // Thu thập các dynamic pattern
  const dynamicPatterns = items.map((item) => ({
    pattern: item.pattern || 'solid',
    patternColor: examMode ? '#000000' : (item.patternColor || '#000000'),
    patternBg: examMode ? '#ffffff' : '#ffffff',
  }));

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.axis;

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
      <SvgPatternDefs dynamicPatterns={dynamicPatterns} />

      {/* Background */}
      <rect width={width} height={height} fill={settings.backgroundColor || '#ffffff'} />

      {/* Tiêu đề */}
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
        {orientation === 'vertical' ? (
          // ==================== CỘT ĐỨNG ====================
          <>
            {/* Lưới ngang (Grid lines) */}
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
              markerEnd={showAxisArrows ? 'url(#math-arrow-sm)' : undefined}
            />
            <line
              x1={0}
              y1={chartAreaHeight}
              x2={0}
              y2={-15}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd={showAxisArrows ? 'url(#math-arrow-sm)' : undefined}
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

            {/* Vạch chia và số trên trục Oy */}
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

            {/* Tên trục Oy & đơn vị */}
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

            {/* Vẽ các cột */}
            {items.map((item, index) => {
              const totalItems = items.length;
              const slotWidth = chartAreaWidth / Math.max(1, totalItems);
              const barX = index * slotWidth + (slotWidth - barWidth) / 2;
              const val = Number(item.value) || 0;
              const barHeight = Math.max(0, ((val - axisMin) / valueRange) * chartAreaHeight);
              const barY = chartAreaHeight - barHeight;

              const fillUrl = getPatternFillUrl(
                item.pattern,
                item.color,
                item.patternColor,
                '#ffffff',
                examMode
              );

              return (
                <g key={item.id}>
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={fillUrl}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />

                  {/* Giá trị trên đầu cột */}
                  {showValueOnBar && (
                    <text
                      x={barX + barWidth / 2}
                      y={barY - 6}
                      textAnchor="middle"
                      fontSize={settings.labelFontSize || 14}
                      fontWeight="bold"
                      fill="#000000"
                    >
                      {val}
                    </text>
                  )}

                  {/* Tên danh mục trục Ox */}
                  <text
                    x={barX + barWidth / 2}
                    y={chartAreaHeight + 20}
                    textAnchor="middle"
                    fontSize={settings.labelFontSize || 14}
                    fill="#000000"
                  >
                    {item.category || `Mục ${index + 1}`}
                  </text>
                </g>
              );
            })}

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
          </>
        ) : (
          // ==================== CỘT NGANG ====================
          <>
            {/* Lưới dọc */}
            {showGridLines &&
              axisTicks.map((tickVal) => {
                const x = ((tickVal - axisMin) / valueRange) * chartAreaWidth;
                if (tickVal === axisMin) return null;
                return (
                  <line
                    key={`grid-x-${tickVal}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartAreaHeight}
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
              markerEnd={showAxisArrows ? 'url(#math-arrow-sm)' : undefined}
            />
            <line
              x1={0}
              y1={chartAreaHeight}
              x2={0}
              y2={-15}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd={showAxisArrows ? 'url(#math-arrow-sm)' : undefined}
            />

            {/* Vạch chia trên trục Ox */}
            {axisTicks.map((tickVal) => {
              const x = ((tickVal - axisMin) / valueRange) * chartAreaWidth;
              return (
                <g key={`tick-x-${tickVal}`}>
                  <line
                    x1={x}
                    y1={chartAreaHeight}
                    x2={x}
                    y2={chartAreaHeight + 5}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                  <text
                    x={x}
                    y={chartAreaHeight + 20}
                    textAnchor="middle"
                    fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
                    fill="#000000"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

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
                {xAxisTitle} {unit ? `(${unit})` : ''}
              </text>
            )}

            {/* Vẽ các cột ngang */}
            {items.map((item, index) => {
              const totalItems = items.length;
              const slotHeight = chartAreaHeight / Math.max(1, totalItems);
              const barY = index * slotHeight + (slotHeight - barWidth) / 2;
              const val = Number(item.value) || 0;
              const barLen = Math.max(0, ((val - axisMin) / valueRange) * chartAreaWidth);

              const fillUrl = getPatternFillUrl(
                item.pattern,
                item.color,
                item.patternColor,
                '#ffffff',
                examMode
              );

              return (
                <g key={item.id}>
                  <rect
                    x={0}
                    y={barY}
                    width={barLen}
                    height={barWidth}
                    fill={fillUrl}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />

                  {/* Giá trị cuối cột */}
                  {showValueOnBar && (
                    <text
                      x={barLen + 6}
                      y={barY + barWidth / 2 + 5}
                      fontSize={settings.labelFontSize || 14}
                      fontWeight="bold"
                      fill="#000000"
                    >
                      {val}
                    </text>
                  )}

                  {/* Tên danh mục bên trái */}
                  <text
                    x={-8}
                    y={barY + barWidth / 2 + 5}
                    textAnchor="end"
                    fontSize={settings.labelFontSize || 14}
                    fill="#000000"
                  >
                    {item.category || `Mục ${index + 1}`}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>
    </svg>
  );
};
