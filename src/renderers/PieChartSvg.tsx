import React from 'react';
import { BaseChartSettings, PieChartData } from '../types';
import { calculatePieSlices } from '../calculations/mathCalculations';
import { SvgPatternDefs, getPatternFillUrl } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface PieChartSvgProps {
  data: PieChartData;
  settings: BaseChartSettings;
}

export const PieChartSvg: React.FC<PieChartSvgProps> = ({ data, settings }) => {
  const {
    slices,
    radius,
    showPercentageOnSlice,
    showNameOnSlice,
    showValuesOnSlice,
    decimalPlaces,
    startAngle,
  } = data;

  const width = settings.width || 600;
  const height = settings.height || 520;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  // Tọa độ tâm hình tròn
  const centerX = width / 2;
  const hasLegend = settings.showLegend !== false && slices.length > 0;
  const centerY = showTitle ? (height * 0.44) : (height * 0.5);

  const { computedSlices, total } = calculatePieSlices(
    slices,
    radius || 150,
    centerX,
    centerY,
    startAngle || 0,
    decimalPlaces ?? 0,
    data.unit || ''
  );

  // Thu thập các dynamic pattern
  const dynamicPatterns = slices.map((s) => ({
    pattern: s.pattern || 'solid',
    patternColor: examMode ? '#000000' : (s.patternColor || '#000000'),
    patternBg: examMode ? '#ffffff' : (s.patternBg || '#ffffff'),
  }));

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.main;

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

      {/* Nền trắng chuẩn đề thi */}
      <rect width={width} height={height} fill={settings.backgroundColor || '#ffffff'} />

      {/* Tiêu đề biểu đồ */}
      {showTitle && (
        <text
          x={width / 2}
          y={SGK_STYLE.margin.titleY}
          textAnchor="middle"
          fontSize={settings.fontSize ? settings.fontSize + 2 : SGK_STYLE.fontSize.title}
          fontWeight="bold"
          fill="#000000"
          letterSpacing="0.5px"
        >
          {title}
        </text>
      )}

      {/* Các quạt tròn */}
      <g id="pie-slices-group">
        {computedSlices.map((slice) => {
          const fillUrl = getPatternFillUrl(
            slice.pattern,
            slice.color,
            slice.patternColor,
            slice.patternBg,
            examMode
          );

          return (
            <path
              key={slice.id}
              d={slice.pathD}
              fill={fillUrl}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* Nhãn và Phần trăm trên từng quạt */}
      <g id="pie-labels-group">
        {computedSlices.map((slice) => {
          if (slice.showLabelOnSlice === false) return null;
          if (slice.angle! < 5) return null; // Quá nhỏ để vẽ chữ

          const lines: string[] = [];
          if (showNameOnSlice && slice.name) lines.push(slice.name);
          if (showPercentageOnSlice) lines.push(slice.percentStr);
          if (showValuesOnSlice) lines.push(slice.valueStr);

          if (lines.length === 0) return null;

          return (
            <text
              key={`label-${slice.id}`}
              x={slice.labelX}
              y={slice.labelY - (lines.length - 1) * 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={settings.labelFontSize || 15}
              fontWeight="bold"
              fill="#000000"
            >
              {lines.map((line, idx) => (
                <tspan
                  key={idx}
                  x={slice.labelX}
                  dy={idx === 0 ? 0 : (settings.labelFontSize || 15) * 1.15}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </g>

      {/* Chú giải (Legend) phía dưới hoặc bên cạnh */}
      {hasLegend && (
        <g id="pie-legend-group" transform={`translate(0, ${centerY + radius + 36})`}>
          <g>
            {/* Chia các mục chú giải thành hàng hoặc cột */}
            {(() => {
              const itemWidth = 175;
              const cols = Math.min(3, Math.max(1, Math.floor((width - 60) / itemWidth)));
              const startX = (width - cols * itemWidth) / 2 + 10;

              return slices.map((slice, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = startX + col * itemWidth;
                const y = row * 28;

                const fillUrl = getPatternFillUrl(
                  slice.pattern,
                  slice.color,
                  slice.patternColor,
                  slice.patternBg,
                  examMode
                );

                const compSlice = computedSlices.find((cs) => cs.id === slice.id);
                const pctText = compSlice ? ` (${compSlice.percentStr})` : '';

                return (
                  <g key={`leg-${slice.id}`} transform={`translate(${x}, ${y})`}>
                    <rect
                      x={0}
                      y={-12}
                      width={20}
                      height={16}
                      fill={fillUrl}
                      stroke="#000000"
                      strokeWidth={1.2}
                    />
                    <text
                      x={28}
                      y={0}
                      fontSize={settings.labelFontSize ? settings.labelFontSize - 2 : 14}
                      fill="#000000"
                      dominantBaseline="middle"
                    >
                      {slice.name || `Nhóm ${index + 1}`}{pctText}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        </g>
      )}

      {total === 0 && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fontSize={16}
          fill="#888888"
          fontStyle="italic"
        >
          Vui lòng nhập số liệu lớn hơn 0 để hiển thị biểu đồ
        </text>
      )}
    </svg>
  );
};
