import React from 'react';
import { PatternType } from '../../types';

interface SvgPatternsProps {
  idPrefix?: string;
}

export const PATTERN_LIST: { id: PatternType; label: string; previewDesc: string }[] = [
  { id: 'solid', label: 'Màu trơn (Tô đặc)', previewDesc: 'Đổ màu nguyên khối' },
  { id: 'hatch-right', label: 'Gạch chéo (Phải /)', previewDesc: 'Đường chéo 45 độ' },
  { id: 'hatch-left', label: 'Gạch chéo (Trái \\)', previewDesc: 'Đường chéo 135 độ' },
  { id: 'hatch-horizontal', label: 'Sọc ngang (=)', previewDesc: 'Đường kẻ ngang' },
  { id: 'hatch-vertical', label: 'Sọc dọc (||)', previewDesc: 'Đường kẻ đứng' },
  { id: 'grid-square', label: 'Lưới vuông (#)', previewDesc: 'Lưới ô vuông' },
  { id: 'grid-cross', label: 'Caro chéo (X)', previewDesc: 'Lưới quả trám' },
  { id: 'dots', label: 'Chấm bi (..)', previewDesc: 'Hạt chấm thưa' },
  { id: 'dots-dense', label: 'Chấm bi dày', previewDesc: 'Hạt chấm dày đặc' },
  { id: 'waves', label: 'Sóng nước (~)', previewDesc: 'Đường lượn sóng' },
  { id: 'brick', label: 'Gạch so le', previewDesc: 'Họa tiết gạch xây' },
];

/**
 * Tạo ID cho SVG pattern dựa trên pattern type, màu nét và màu nền
 */
export function getPatternFillUrl(
  pattern: PatternType,
  color: string,
  patternColor: string = '#000000',
  patternBg: string = '#ffffff',
  examMode: boolean = false
): string {
  if (pattern === 'solid') {
    return examMode ? (color === '#ffffff' ? '#ffffff' : color || '#000000') : color;
  }
  const cleanPColor = (patternColor || '#000000').replace('#', '');
  const cleanBg = (patternBg || '#ffffff').replace('#', '');
  return `url(#pat-${pattern}-${cleanPColor}-${cleanBg})`;
}

export interface DynamicPatternDef {
  pattern: PatternType;
  patternColor: string;
  patternBg: string;
}

export const SvgPatternDefs: React.FC<{ dynamicPatterns?: DynamicPatternDef[] }> = ({
  dynamicPatterns = [],
}) => {
  // Loại bỏ các pattern trùng lặp
  const uniqueDefs = new Map<string, DynamicPatternDef>();
  dynamicPatterns.forEach((p) => {
    const key = `${p.pattern}-${p.patternColor || '#000000'}-${p.patternBg || '#ffffff'}`;
    uniqueDefs.set(key, p);
  });

  return (
    <defs>
      {/* Arrow markers for coordinate axes */}
      <marker
        id="math-arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#000000" />
      </marker>

      <marker
        id="math-arrow-sm"
        viewBox="0 0 10 10"
        refX="7"
        refY="5"
        markerWidth="4.5"
        markerHeight="4.5"
        orient="auto-start-reverse"
      >
        <path d="M 0 2 L 8 5 L 0 8 z" fill="#000000" />
      </marker>

      {/* Render Dynamic Patterns */}
      {Array.from(uniqueDefs.values()).map((p) => {
        const pColor = p.patternColor || '#000000';
        const bg = p.patternBg || '#ffffff';
        const cleanPColor = pColor.replace('#', '');
        const cleanBg = bg.replace('#', '');
        const id = `pat-${p.pattern}-${cleanPColor}-${cleanBg}`;

        switch (p.pattern) {
          case 'hatch-right':
            return (
              <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill={bg} />
                <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke={pColor} strokeWidth="1.1" />
              </pattern>
            );
          case 'hatch-left':
            return (
              <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill={bg} />
                <path d="M-2,6 l4,4 M0,0 l8,8 M6,-2 l4,4" stroke={pColor} strokeWidth="1.1" />
              </pattern>
            );
          case 'hatch-horizontal':
            return (
              <pattern key={id} id={id} width="8" height="6" patternUnits="userSpaceOnUse">
                <rect width="8" height="6" fill={bg} />
                <line x1="0" y1="3" x2="8" y2="3" stroke={pColor} strokeWidth="1.1" />
              </pattern>
            );
          case 'hatch-vertical':
            return (
              <pattern key={id} id={id} width="6" height="8" patternUnits="userSpaceOnUse">
                <rect width="6" height="8" fill={bg} />
                <line x1="3" y1="0" x2="3" y2="8" stroke={pColor} strokeWidth="1.1" />
              </pattern>
            );
          case 'grid-square':
            return (
              <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill={bg} />
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke={pColor} strokeWidth="1" />
              </pattern>
            );
          case 'grid-cross':
            return (
              <pattern key={id} id={id} width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill={bg} />
                <path d="M0,0 l10,10 M10,0 l-10,10" stroke={pColor} strokeWidth="1" />
              </pattern>
            );
          case 'dots':
            return (
              <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill={bg} />
                <circle cx="4" cy="4" r="1.2" fill={pColor} />
              </pattern>
            );
          case 'dots-dense':
            return (
              <pattern key={id} id={id} width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill={bg} />
                <circle cx="3" cy="3" r="1" fill={pColor} />
                <circle cx="0" cy="0" r="0.7" fill={pColor} />
                <circle cx="6" cy="0" r="0.7" fill={pColor} />
                <circle cx="0" cy="6" r="0.7" fill={pColor} />
                <circle cx="6" cy="6" r="0.7" fill={pColor} />
              </pattern>
            );
          case 'waves':
            return (
              <pattern key={id} id={id} width="16" height="8" patternUnits="userSpaceOnUse">
                <rect width="16" height="8" fill={bg} />
                <path d="M 0 4 Q 4 1, 8 4 T 16 4" fill="none" stroke={pColor} strokeWidth="1.1" />
              </pattern>
            );
          case 'brick':
            return (
              <pattern key={id} id={id} width="16" height="8" patternUnits="userSpaceOnUse">
                <rect width="16" height="8" fill={bg} />
                <path d="M 0 4 L 16 4 M 0 8 L 16 8 M 0 0 L 16 0 M 8 0 L 8 4 M 0 4 L 0 8 M 16 4 L 16 8" fill="none" stroke={pColor} strokeWidth="1" />
              </pattern>
            );
          default:
            return null;
        }
      })}
    </defs>
  );
};
