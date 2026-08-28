import React from 'react';
import { BaseChartSettings, PictogramData, PictogramIconType } from '../types';
import { SGK_STYLE, getMathFontFamily } from '../constants/style';

interface PictogramSvgProps {
  data: PictogramData;
  settings: BaseChartSettings;
}

export const PictogramIcon: React.FC<{
  type: PictogramIconType;
  size?: number;
  color?: string;
  isHalf?: boolean;
  halfClipId?: string;
}> = ({ type, size = 24, color = '#000000', isHalf = false, halfClipId }) => {
  const halfClip = halfClipId ? `url(#${halfClipId})` : undefined;

  const renderPath = () => {
    switch (type) {
      case 'star':
        return (
          <path
            d="M 12 2 L 15.09 8.26 L 22 9.27 L 17 14.14 L 18.18 21.02 L 12 17.77 L 5.82 21.02 L 7 14.14 L 2 9.27 L 8.91 8.26 Z"
            fill={color}
            stroke="#000000"
            strokeWidth="0.8"
          />
        );
      case 'book':
        return (
          <path
            d="M 4 19.5 A 2.5 2.5 0 0 1 6.5 17 H 20 M 4 19.5 A 2.5 2.5 0 0 0 6.5 22 H 20 V 2 H 6.5 A 2.5 2.5 0 0 0 4 4.5 Z"
            fill={color}
            stroke="#000000"
            strokeWidth="1.2"
          />
        );
      case 'student':
        return (
          <g fill={color} stroke="#000000" strokeWidth="0.8">
            <circle cx="12" cy="7" r="4" />
            <path d="M 5 21 C 5 16 8 13 12 13 C 16 13 19 16 19 21 Z" />
          </g>
        );
      case 'apple':
        return (
          <g fill={color} stroke="#000000" strokeWidth="0.8">
            <path d="M 12 2 Q 13 5 15 4" stroke="#000000" strokeWidth="1.2" fill="none" />
            <path d="M 12 6 C 8 4 4 7 4 13 C 4 19 8 21 12 21 C 16 21 20 19 20 13 C 20 7 16 4 12 6 Z" />
          </g>
        );
      case 'bus':
        return (
          <g fill={color} stroke="#000000" strokeWidth="1">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <rect x="5" y="6" width="6" height="4" fill="#ffffff" />
            <rect x="13" y="6" width="6" height="4" fill="#ffffff" />
            <circle cx="7" cy="18" r="2" fill="#000000" />
            <circle cx="17" cy="18" r="2" fill="#000000" />
          </g>
        );
      case 'tree':
        return (
          <g fill={color} stroke="#000000" strokeWidth="0.8">
            <rect x="10" y="15" width="4" height="7" fill="#8B5A2B" stroke="#000000" />
            <polygon points="12,2 4,15 20,15" />
          </g>
        );
      case 'ball':
        return (
          <g stroke="#000000" strokeWidth="1" fill={color}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" fill="#ffffff" />
            <line x1="12" y1="3" x2="12" y2="8" />
            <line x1="12" y1="16" x2="12" y2="21" />
            <line x1="3" y1="12" x2="8" y2="12" />
            <line x1="16" y1="12" x2="21" y2="12" />
          </g>
        );
      case 'pencil':
        return (
          <g fill={color} stroke="#000000" strokeWidth="1">
            <polygon points="18,2 22,6 8,20 4,20 4,16" />
            <polygon points="4,20 4,16 8,20" fill="#000000" />
          </g>
        );
      case 'flag':
        return (
          <g stroke="#000000" strokeWidth="1">
            <line x1="5" y1="2" x2="5" y2="22" strokeWidth="1.5" />
            <polygon points="5,3 19,8 5,13" fill={color} />
          </g>
        );
      case 'circle':
      default:
        return <circle cx="12" cy="12" r="8" fill={color} stroke="#000000" strokeWidth="1" />;
    }
  };

  return (
    <g transform={`scale(${size / 24})`} clipPath={halfClip}>
      {renderPath()}
    </g>
  );
};

export const PictogramSvg: React.FC<PictogramSvgProps> = ({ data, settings }) => {
  const {
    rows,
    iconType = 'star',
    valuePerIcon = 10,
    allowHalfIcon = true,
    iconSize = 28,
    iconColor = '#f59e0b',
    unit = 'học sinh',
    legendText,
    rowGap = 20,
  } = data;

  const width = settings.width || 640;
  const height = settings.height || 480;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const showLegend = settings.showLegend !== false;
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const effectiveIconColor = examMode ? '#000000' : (iconColor || '#000000');

  const startY = showTitle ? SGK_STYLE.margin.topWithTitle : SGK_STYLE.margin.topNoTitle;
  const leftLabelWidth = 140;

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
      <defs>
        {/* ClipPath cho nửa biểu tượng (Half Icon) */}
        <clipPath id="half-icon-clip">
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>

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

      {/* Bảng các dòng danh mục */}
      <g transform={`translate(30, ${startY})`}>
        {rows.map((row, index) => {
          const y = index * (iconSize + rowGap + 10);
          const rawCount = Number(row.count) || 0;
          const valPer = valuePerIcon > 0 ? valuePerIcon : 10;
          const fullIcons = Math.floor(rawCount / valPer);
          const remainder = rawCount % valPer;
          const hasHalf = allowHalfIcon && remainder >= valPer * 0.4 && remainder < valPer;

          return (
            <g key={row.id} transform={`translate(0, ${y})`}>
              {/* Tên danh mục bên trái */}
              <text
                x={leftLabelWidth - 10}
                y={iconSize / 2 + 5}
                textAnchor="end"
                fontSize={settings.labelFontSize || 15}
                fontWeight="bold"
                fill="#000000"
              >
                {row.category}
              </text>

              {/* Đường kẻ phân cách ngang nhẹ */}
              <line
                x1={leftLabelWidth}
                y1={iconSize + rowGap / 2}
                x2={width - 60}
                y2={iconSize + rowGap / 2}
                stroke="#e2e8f0"
                strokeWidth={0.8}
              />

              {/* Các biểu tượng nguyên */}
              <g transform={`translate(${leftLabelWidth + 10}, 0)`}>
                {Array.from({ length: fullIcons }).map((_, i) => (
                  <g
                    key={`icon-${row.id}-${i}`}
                    transform={`translate(${i * (iconSize + 8)}, 0)`}
                  >
                    <PictogramIcon
                      type={iconType}
                      size={iconSize}
                      color={effectiveIconColor}
                    />
                  </g>
                ))}

                {/* Biểu tượng nửa nếu có */}
                {hasHalf && (
                  <g transform={`translate(${fullIcons * (iconSize + 8)}, 0)`}>
                    <PictogramIcon
                      type={iconType}
                      size={iconSize}
                      color={effectiveIconColor}
                      isHalf={true}
                      halfClipId="half-icon-clip"
                    />
                  </g>
                )}

                {/* Số lượng tổng kết cuối dòng */}
                <text
                  x={(fullIcons + (hasHalf ? 1 : 0)) * (iconSize + 8) + 15}
                  y={iconSize / 2 + 5}
                  fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 14}
                  fill="#475569"
                >
                  ({rawCount} {unit})
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Chú giải ở dưới cùng (Ví dụ: 1 ⭐ = 10 học sinh) */}
      {showLegend && (
        <g transform={`translate(${width / 2 - 140}, ${height - 35})`}>
          <rect
            x={-10}
            y={-18}
            width={300}
            height={32}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={1}
            rx={4}
          />
          <g transform="translate(10, -10)">
            <PictogramIcon type={iconType} size={18} color={effectiveIconColor} />
          </g>
          <text
            x={38}
            y={3}
            fontSize={settings.labelFontSize ? settings.labelFontSize - 1 : 14}
            fill="#000000"
            fontStyle="italic"
          >
            {legendText || `1 biểu tượng ứng với ${valuePerIcon} ${unit}`}
          </text>
        </g>
      )}
    </svg>
  );
};
