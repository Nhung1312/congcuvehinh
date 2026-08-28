import React from 'react';
import { BaseChartSettings, FractionBarData } from '../types';
import { SvgPatternDefs, getPatternFillUrl } from './patterns/SvgPatterns';
import { SGK_STYLE, DEFAULT_MATH_FONT, getMathFontFamily } from '../constants/style';

interface FractionBarSvgProps {
  data: FractionBarData;
  settings: BaseChartSettings;
}

export const FractionBarSvg: React.FC<FractionBarSvgProps> = ({ data, settings }) => {
  const {
    bars = [
      { id: '1', numerator: 3, denominator: 5, label: '3/5', color: '#3b82f6', pattern: 'hatch-right' },
    ],
    showFractions = true,
    showPercentages = false,
    barHeight = 44,
  } = data;

  const width = settings.width || 600;
  const height = settings.height || 400;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const dynamicPatterns = bars.map((b) => ({
    pattern: b.pattern || 'solid',
    patternColor: examMode ? '#000000' : '#000000',
    patternBg: examMode ? '#ffffff' : '#ffffff',
  }));

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.main;

  const startY = showTitle ? 70 : 45;
  const totalBarWidth = width - 180;

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

      <g transform={`translate(100, ${startY})`}>
        {bars.map((bar, index) => {
          const y = index * (barHeight + 50);
          const den = Math.max(1, bar.denominator || 1);
          const num = Math.max(0, Math.min(den, bar.numerator || 0));
          const partWidth = totalBarWidth / den;

          const fillUrl = getPatternFillUrl(bar.pattern, bar.color, '#000000', '#ffffff', examMode);

          return (
            <g key={bar.id} transform={`translate(0, ${y})`}>
              {/* Tên phân số bên trái */}
              <text
                x={-20}
                y={barHeight / 2 + 6}
                textAnchor="end"
                fontSize={20}
                fontWeight="bold"
                fill="#000000"
              >
                {bar.numerator}/{bar.denominator}
              </text>

              {/* Khung toàn bộ thanh (mẫu số phần) */}
              <rect
                x={0}
                y={0}
                width={totalBarWidth}
                height={barHeight}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />

              {/* Các phần được tô màu (tử số phần) */}
              {Array.from({ length: num }).map((_, i) => (
                <rect
                  key={`part-${i}`}
                  x={i * partWidth}
                  y={0}
                  width={partWidth}
                  height={barHeight}
                  fill={fillUrl}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              ))}

              {/* Các vạch phân chia đều từng phần */}
              {Array.from({ length: den - 1 }).map((_, i) => (
                <line
                  key={`div-${i}`}
                  x1={(i + 1) * partWidth}
                  y1={0}
                  x2={(i + 1) * partWidth}
                  y2={barHeight}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              ))}

              {/* Ghi chú dưới thanh: mỗi ô là 1/n */}
              <g transform={`translate(0, ${barHeight + 20})`}>
                {Array.from({ length: den }).map((_, i) => (
                  <text
                    key={`txt-part-${i}`}
                    x={i * partWidth + partWidth / 2}
                    y={0}
                    textAnchor="middle"
                    fontSize={13}
                    fill="#64748b"
                  >
                    1/{den}
                  </text>
                ))}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
