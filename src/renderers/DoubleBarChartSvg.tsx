import React from 'react';
import { BaseChartSettings, DoubleBarChartData } from '../types';
import { calculateAxisTicks } from '../calculations/mathCalculations';
import { SvgPatternDefs, getPatternFillUrl } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface DoubleBarChartSvgProps {
  data: DoubleBarChartData;
  settings: BaseChartSettings;
}

export const DoubleBarChartSvg: React.FC<DoubleBarChartSvgProps> = ({ data, settings }) => {
  const {
    items,
    group1Name = 'Nhóm 1',
    group2Name = 'Nhóm 2',
    group1Color = '#3b82f6',
    group1Pattern = 'solid',
    group2Color = '#f59e0b',
    group2Pattern = 'hatch-right',
    xAxisTitle,
    yAxisTitle,
    unit,
    minValue: customMin,
    maxValue: customMax,
    stepSize: customStep,
    barWidth = 28,
    groupGap = 24,
    showValueOnBar = true,
    showGridLines = true,
  } = data;

  const width = settings.width || 680;
  const height = settings.height || 500;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const showLegend = settings.showLegend !== false;
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const margin = {
    top: showTitle ? SGK_STYLE.margin.topWithTitle : SGK_STYLE.margin.topNoTitle,
    right: 40,
    bottom: showLegend ? 85 : 55,
    left: 70,
  };

  const chartAreaWidth = width - margin.left - margin.right;
  const chartAreaHeight = height - margin.top - margin.bottom;

  const allVals = items.flatMap((it) => [Number(it.value1) || 0, Number(it.value2) || 0]);
  const dataMax = allVals.length ? Math.max(...allVals, 0) : 10;
  const dataMin = allVals.length ? Math.min(...allVals, 0) : 0;

  const computedTicks = calculateAxisTicks(
    customMin !== undefined ? customMin : Math.min(0, dataMin),
    customMax !== undefined ? customMax : Math.max(10, dataMax * 1.18),
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

  const dynamicPatterns = [
    {
      pattern: group1Pattern,
      patternColor: examMode ? '#000000' : '#000000',
      patternBg: examMode ? '#ffffff' : '#ffffff',
    },
    {
      pattern: group2Pattern,
      patternColor: examMode ? '#000000' : '#000000',
      patternBg: examMode ? '#ffffff' : '#ffffff',
    },
  ];

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.axis;

  const fillUrl1 = getPatternFillUrl(group1Pattern, group1Color, '#000000', '#ffffff', examMode);
  const fillUrl2 = getPatternFillUrl(group2Pattern, group2Color, '#000000', '#ffffff', examMode);

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

        {/* Các cặp cột kép */}
        {items.map((item, index) => {
          const totalGroups = items.length;
          const slotWidth = chartAreaWidth / Math.max(1, totalGroups);
          const groupPairWidth = barWidth * 2;
          const groupX = index * slotWidth + (slotWidth - groupPairWidth) / 2;

          const val1 = Number(item.value1) || 0;
          const val2 = Number(item.value2) || 0;

          const h1 = Math.max(0, ((val1 - axisMin) / valueRange) * chartAreaHeight);
          const h2 = Math.max(0, ((val2 - axisMin) / valueRange) * chartAreaHeight);

          const y1 = chartAreaHeight - h1;
          const y2 = chartAreaHeight - h2;

          return (
            <g key={item.id}>
              {/* Cột 1 */}
              <rect
                x={groupX}
                y={y1}
                width={barWidth}
                height={h1}
                fill={fillUrl1}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {showValueOnBar && (
                <text
                  x={groupX + barWidth / 2}
                  y={y1 - 5}
                  textAnchor="middle"
                  fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
                  fontWeight="bold"
                  fill="#000000"
                >
                  {val1}
                </text>
              )}

              {/* Cột 2 */}
              <rect
                x={groupX + barWidth}
                y={y2}
                width={barWidth}
                height={h2}
                fill={fillUrl2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {showValueOnBar && (
                <text
                  x={groupX + barWidth + barWidth / 2}
                  y={y2 - 5}
                  textAnchor="middle"
                  fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 13}
                  fontWeight="bold"
                  fill="#000000"
                >
                  {val2}
                </text>
              )}

              {/* Tên danh mục */}
              <text
                x={groupX + barWidth}
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
      </g>

      {/* Chú giải 2 nhóm (Legend) */}
      {showLegend && (
        <g transform={`translate(${width / 2 - 120}, ${height - 25})`}>
          {/* Nhóm 1 */}
          <g>
            <rect
              x={0}
              y={-12}
              width={24}
              height={16}
              fill={fillUrl1}
              stroke="#000000"
              strokeWidth={1.2}
            />
            <text x={32} y={0} fontSize={14} fill="#000000" dominantBaseline="middle">
              {group1Name}
            </text>
          </g>

          {/* Nhóm 2 */}
          <g transform="translate(140, 0)">
            <rect
              x={0}
              y={-12}
              width={24}
              height={16}
              fill={fillUrl2}
              stroke="#000000"
              strokeWidth={1.2}
            />
            <text x={32} y={0} fontSize={14} fill="#000000" dominantBaseline="middle">
              {group2Name}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};
