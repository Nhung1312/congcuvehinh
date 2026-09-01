import React from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  BarChart2,
  LineChart as LineIcon,
  Smile,
  Compass,
  TrendingUp,
  Triangle,
  Square,
  Circle,
  Divide,
  Activity,
  Layers,
  MoveHorizontal,
  Sparkles,
  Box,
  Hexagon,
  Repeat,
} from 'lucide-react';
import { ToolCategory, ToolType } from '../types';

interface SidebarProps {
  currentType: ToolType;
  onSelectTool: (type: ToolType) => void;
}

interface ToolItem {
  type: ToolType;
  label: string;
  category: ToolCategory;
  icon: React.ReactNode;
  badge?: string;
  isSpecial?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentType, onSelectTool }) => {
  const categories: { id: ToolCategory; title: string; items: ToolItem[] }[] = [
    {
      id: 'ai',
      title: '🤖 TRỢ LÝ AI TOÁN HỌC',
      items: [
        {
          type: 'AI_GEOMETRY',
          label: 'AI Tự Dựng Hình',
          category: 'ai',
          icon: <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />,
          badge: 'Mới ✨',
          isSpecial: true,
        },
      ],
    },
    {
      id: 'geometry',
      title: 'HÌNH PHẲNG THCS',
      items: [
        {
          type: 'GEOMETRY_LINE_RAY',
          label: 'Đoạn thẳng, Tia, Đ.Thẳng',
          category: 'geometry',
          icon: <MoveHorizontal className="w-4 h-4 text-sky-600" />,
          badge: 'Toán 6-7',
        },
        {
          type: 'GEOMETRY_ANGLE',
          label: 'Góc & Tia phân giác',
          category: 'geometry',
          icon: <Layers className="w-4 h-4 text-pink-600" />,
          badge: 'Toán 6-7',
        },
        {
          type: 'GEOMETRY_TRIANGLE',
          label: 'Tam giác & Đường cao',
          category: 'geometry',
          icon: <Triangle className="w-4 h-4 text-orange-600" />,
        },
        {
          type: 'GEOMETRY_QUADRILATERAL',
          label: 'Tứ giác (Thang, Chữ nhật, Thoi)',
          category: 'geometry',
          icon: <Square className="w-4 h-4 text-teal-600" />,
        },
        {
          type: 'GEOMETRY_CIRCLE',
          label: 'Đường tròn & Bán kính',
          category: 'geometry',
          icon: <Circle className="w-4 h-4 text-indigo-600" />,
          badge: 'Toán 9',
        },
        {
          type: 'GEOMETRY_POLYGON',
          label: 'Đa giác đều (3, 4, 5, 6, 8)',
          category: 'geometry',
          icon: <Hexagon className="w-4 h-4 text-emerald-600" />,
          badge: 'Toán 6, 9',
        },
        {
          type: 'GEOMETRY_SYMMETRY',
          label: 'Đối xứng trục & Đối xứng tâm',
          category: 'geometry',
          icon: <Repeat className="w-4 h-4 text-blue-600" />,
          badge: 'Toán 6, 8',
        },
      ],
    },
    {
      id: 'spatial',
      title: 'HÌNH HỌC KHÔNG GIAN',
      items: [
        {
          type: 'GEOMETRY_SPATIAL',
          label: 'Khối hộp, Lăng trụ, Chóp',
          category: 'spatial',
          icon: <Box className="w-4 h-4 text-violet-600" />,
          badge: 'Toán 7-8-9',
        },
      ],
    },
    {
      id: 'coordinates',
      title: 'TỌA ĐỘ – ĐỒ THỊ',
      items: [
        {
          type: 'COORDINATE_PLANE',
          label: 'Mặt phẳng tọa độ Oxy',
          category: 'coordinates',
          icon: <Compass className="w-4 h-4 text-rose-600" />,
          badge: 'Toán 7-8',
        },
        {
          type: 'FUNCTION_GRAPH',
          label: 'Đồ thị hàm số',
          category: 'coordinates',
          icon: <TrendingUp className="w-4 h-4 text-cyan-600" />,
          badge: 'Toán 8-9',
        },
      ],
    },
    {
      id: 'statistics',
      title: 'THỐNG KÊ – BIỂU ĐỒ',
      items: [
        {
          type: 'PIE_CHART',
          label: 'Biểu đồ quạt tròn',
          category: 'statistics',
          icon: <PieIcon className="w-4 h-4 text-emerald-600" />,
          badge: 'Toán 7',
        },
        {
          type: 'BAR_CHART',
          label: 'Biểu đồ cột',
          category: 'statistics',
          icon: <BarChart3 className="w-4 h-4 text-blue-600" />,
          badge: 'Toán 6',
        },
        {
          type: 'DOUBLE_BAR_CHART',
          label: 'Biểu đồ cột kép',
          category: 'statistics',
          icon: <BarChart2 className="w-4 h-4 text-indigo-600" />,
          badge: 'Toán 6',
        },
        {
          type: 'LINE_CHART',
          label: 'Biểu đồ đoạn thẳng',
          category: 'statistics',
          icon: <LineIcon className="w-4 h-4 text-purple-600" />,
          badge: 'Toán 7',
        },
        {
          type: 'PICTOGRAM',
          label: 'Biểu đồ tranh',
          category: 'statistics',
          icon: <Smile className="w-4 h-4 text-amber-600" />,
          badge: 'Toán 6',
        },
      ],
    },
    {
      id: 'models',
      title: 'MÔ HÌNH TOÁN HỌC',
      items: [
        {
          type: 'FRACTION_BAR',
          label: 'Thanh phân số',
          category: 'models',
          icon: <Divide className="w-4 h-4 text-lime-600" />,
          badge: 'Toán 6',
        },
        {
          type: 'NUMBER_LINE',
          label: 'Trục số nguyên & hữu tỉ',
          category: 'models',
          icon: <Activity className="w-4 h-4 text-violet-600" />,
          badge: 'Toán 6-7',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto select-none h-full">
      <div className="p-3 border-b border-slate-100 bg-slate-50/70">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Danh mục công cụ
        </span>
      </div>

      <div className="p-2 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-1">
            <h3 className="px-2.5 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {cat.title}
            </h3>
            <div className="space-y-0.5">
              {cat.items.map((item) => {
                const isActive = currentType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => onSelectTool(item.type)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-800 font-semibold shadow-xs ring-1 ring-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`p-1 rounded-md ${
                          isActive ? 'bg-blue-100' : 'bg-slate-100'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                          isActive
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
