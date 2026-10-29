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
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ToolCategory, ToolType } from '../types';

interface SidebarProps {
  currentType: ToolType;
  onSelectTool: (type: ToolType) => void;
  onOpenTemplates: () => void;
}

interface ToolItem {
  type: ToolType;
  label: string;
  category: ToolCategory;
  icon: React.ReactNode;
  badge?: string;
  isSpecial?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentType, onSelectTool, onOpenTemplates }) => {
  // Ghi nhớ trạng thái thu gọn trên trình duyệt, mặc định thu gọn (icon-bar 68px) theo yêu cầu
  // Khi ở chế độ AI_GEOMETRY, luôn thu gọn về 68px và không để trạng thái cũ làm mở rộng
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    if (currentType === 'AI_GEOMETRY') return true;
    try {
      const saved = localStorage.getItem('toan_thcs_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return true; // Mặc định thu gọn thanh icon 68px
    } catch {
      return true;
    }
  });

  // Tự động thu gọn về 68px khi người dùng chọn vào AI Dựng Hình
  React.useEffect(() => {
    if (currentType === 'AI_GEOMETRY') {
      setIsCollapsed(true);
    }
  }, [currentType]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toan_thcs_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const categories: { id: ToolCategory; title: string; shortTitle: string; items: ToolItem[] }[] = [
    {
      id: 'ai',
      title: '🤖 TRỢ LÝ AI TOÁN HỌC',
      shortTitle: 'AI',
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
      shortTitle: 'Phẳng',
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
      shortTitle: 'K.Gian',
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
      shortTitle: 'Đồ thị',
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
      shortTitle: 'Thống kê',
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
      shortTitle: 'Mô hình',
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
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-full transition-all duration-200 z-20 ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Header Sidebar với nút đóng/mở */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between min-h-[46px]">
        {!isCollapsed && (
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">
            Danh mục công cụ
          </span>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-white border border-slate-200/80 shadow-2xs transition ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Mở rộng danh mục (256px)' : 'Thu gọn danh mục (chỉ hiện icon)'}
          aria-label={isCollapsed ? 'Mở rộng danh mục' : 'Thu gọn danh mục'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Danh sách các công cụ */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Nút Mẫu hình cơ bản THCS */}
        {isCollapsed ? (
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={onOpenTemplates}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition shadow-2xs"
              title="Mẫu hình cơ bản THCS (Chọn hình có sẵn)"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
            </button>
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
              Mẫu hình cơ bản THCS
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenTemplates}
            className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-left hover:bg-blue-100 transition"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold truncate">Mẫu hình cơ bản THCS</span>
              <span className="block text-[10px] text-blue-600 truncate mt-0.5">Chọn hình có sẵn</span>
            </div>
          </button>
        )}

        {/* Các nhóm công cụ */}
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-1">
            {!isCollapsed ? (
              <h3 className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate">
                {cat.title}
              </h3>
            ) : (
              <div className="pt-1 border-t border-slate-100 flex justify-center">
                <span className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase">
                  {cat.shortTitle}
                </span>
              </div>
            )}

            <div className="space-y-1">
              {cat.items.map((item) => {
                const isActive = currentType === item.type;

                if (isCollapsed) {
                  return (
                    <div key={item.type} className="relative group flex justify-center">
                      <button
                        type="button"
                        onClick={() => onSelectTool(item.type)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={`${item.label}${item.badge ? ' (' + item.badge + ')' : ''}`}
                      >
                        <div className={isActive ? 'text-white' : ''}>
                          {item.icon}
                        </div>
                      </button>

                      {/* Tooltip nổi bên phải khi di chuột */}
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap flex items-center gap-1.5">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

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
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <div
                        className={`p-1 rounded-md shrink-0 ${
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
