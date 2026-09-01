import React, { useState } from 'react';
import {
  TriangleData,
  TriangleType,
  AltitudeConfig,
  MedianConfig,
  BisectorConfig,
  PerpBisectorConfig,
  Point2D,
  GeometrySegmentStyle,
  StrokeDashType,
} from '../../types';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';
import {
  Triangle,
  Move,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Palette,
  Paintbrush,
  Eye,
  Circle,
} from 'lucide-react';

interface TriangleEditorProps {
  triangle: TriangleData;
  onChangeTriangle: (newTriangle: TriangleData) => void;
}

// Bảng màu thông dụng chuẩn Sư phạm Toán học
const COLOR_SWATCHES = [
  { label: 'Đen (Chuẩn SGK)', value: '#000000' },
  { label: 'Xanh lam', value: '#2563eb' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Xanh lục', value: '#16a34a' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Xám đậm', value: '#475569' },
];

const FILL_COLOR_SWATCHES = [
  { label: 'Xanh dương nhạt', value: '#3b82f6' },
  { label: 'Xanh ngọc', value: '#06b6d4' },
  { label: 'Xanh lá', value: '#10b981' },
  { label: 'Vàng cam', value: '#f59e0b' },
  { label: 'Đỏ nhạt', value: '#ef4444' },
  { label: 'Tím nhạt', value: '#8b5cf6' },
  { label: 'Hồng phấn', value: '#ec4899' },
  { label: 'Xám', value: '#64748b' },
];

export const TriangleEditor: React.FC<TriangleEditorProps> = ({
  triangle,
  onChangeTriangle,
}) => {
  const currentType = triangle.type || 'general';
  const vertexNames = triangle.vertexNames || ['A', 'B', 'C'];
  const nameA = vertexNames[0] || 'A';
  const nameB = vertexNames[1] || 'B';
  const nameC = vertexNames[2] || 'C';

  // State mở/đóng các nhóm công cụ
  const [openSection, setOpenSection] = useState<
    'presets' | 'thales' | 'fill' | 'edges' | 'vertices' | 'altitudes' | 'medians' | 'bisectors' | 'perpBisectors' | 'circles' | 'symbols' | null
  >('presets');

  // Tab chọn cạnh đang chỉnh sửa: 'AB' | 'BC' | 'CA' | 'ALL'
  const [selectedEdgeTab, setSelectedEdgeTab] = useState<'AB' | 'BC' | 'CA' | 'ALL'>('AB');

  const toggleSection = (
    sec: 'presets' | 'thales' | 'fill' | 'edges' | 'vertices' | 'altitudes' | 'medians' | 'bisectors' | 'perpBisectors' | 'circles' | 'symbols'
  ) => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  // Các toạ độ mẫu chuẩn cho từng loại tam giác
  const getPresetPoints = (tType: TriangleType): [Point2D, Point2D, Point2D] => {
    if (tType === 'right') {
      return [
        { x: 170, y: 120 },
        { x: 170, y: 340 },
        { x: 440, y: 340 },
      ];
    } else if (tType === 'right-isosceles') {
      return [
        { x: 180, y: 130 },
        { x: 180, y: 340 },
        { x: 390, y: 340 },
      ];
    } else if (tType === 'equilateral') {
      return [
        { x: 280, y: 104 },
        { x: 150, y: 340 },
        { x: 410, y: 340 },
      ];
    } else if (tType === 'isosceles') {
      return [
        { x: 280, y: 110 },
        { x: 140, y: 340 },
        { x: 420, y: 340 },
      ];
    }
    return [
      { x: 260, y: 110 },
      { x: 130, y: 340 },
      { x: 430, y: 340 },
    ];
  };

  const handleSelectType = (newType: TriangleType) => {
    const newPoints = getPresetPoints(newType);
    onChangeTriangle({
      ...triangle,
      type: newType,
      points: newPoints,
      showRightAngleMarker: newType === 'right' || newType === 'right-isosceles',
      showEqualSidesMarker:
        newType === 'isosceles' || newType === 'equilateral' || newType === 'right-isosceles',
    });
  };

  const handleResetCoordinates = () => {
    const newPoints = getPresetPoints(currentType);
    onChangeTriangle({
      ...triangle,
      points: newPoints,
    });
  };

  // ==========================================
  // Helper quản lý Tô miền (Fill)
  // ==========================================
  const fillConfig = triangle.fill || {
    enabled: false,
    color: '#3b82f6',
    opacity: 0.25,
  };

  const handleUpdateFill = (partial: Partial<typeof fillConfig>) => {
    onChangeTriangle({
      ...triangle,
      fill: {
        ...fillConfig,
        ...partial,
      },
    });
  };

  // ==========================================
  // Helper quản lý Style từng cạnh (Edges)
  // ==========================================
  const edgeStyles = triangle.edgeStyles || {};
  const getEdgeStyle = (edge: 'AB' | 'BC' | 'CA'): GeometrySegmentStyle => {
    return edgeStyles[edge] || {
      strokeColor: '#000000',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
    };
  };

  const handleUpdateEdgeStyle = (edge: 'AB' | 'BC' | 'CA', partial: Partial<GeometrySegmentStyle>) => {
    const current = getEdgeStyle(edge);
    onChangeTriangle({
      ...triangle,
      edgeStyles: {
        ...edgeStyles,
        [edge]: {
          ...current,
          ...partial,
        },
      },
    });
  };

  const handleApplyStyleToAllEdges = (partial: Partial<GeometrySegmentStyle>) => {
    const currAB = getEdgeStyle('AB');
    const currBC = getEdgeStyle('BC');
    const currCA = getEdgeStyle('CA');
    onChangeTriangle({
      ...triangle,
      edgeStyles: {
        AB: { ...currAB, ...partial },
        BC: { ...currBC, ...partial },
        CA: { ...currCA, ...partial },
      },
    });
  };

  // ==========================================
  // Helper quản lý Đường cao
  // ==========================================
  const altitudes: AltitudeConfig[] = triangle.altitudes || [
    { fromVertex: 'A', enabled: triangle.showAltitudes !== false, label: 'H', style: 'dashed', showRightAngle: true },
    { fromVertex: 'B', enabled: false, label: 'K', style: 'dashed', showRightAngle: true },
    { fromVertex: 'C', enabled: false, label: 'L', style: 'dashed', showRightAngle: true },
  ];

  const updateAltitude = (fromVertex: 'A' | 'B' | 'C', partial: Partial<AltitudeConfig>) => {
    const existing = altitudes.find((a) => a.fromVertex === fromVertex);
    let updatedList: AltitudeConfig[];
    if (existing) {
      updatedList = altitudes.map((a) => (a.fromVertex === fromVertex ? { ...a, ...partial } : a));
    } else {
      updatedList = [
        ...altitudes,
        {
          fromVertex,
          enabled: true,
          label: fromVertex === 'A' ? 'H' : fromVertex === 'B' ? 'K' : 'L',
          style: 'dashed',
          showRightAngle: true,
          ...partial,
        },
      ];
    }
    onChangeTriangle({
      ...triangle,
      altitudes: updatedList,
      showAltitudes: updatedList.some((a) => a.enabled),
    });
  };

  // ==========================================
  // Helper quản lý Trung tuyến
  // ==========================================
  const medians: MedianConfig[] = triangle.medians || [
    { fromVertex: 'A', enabled: triangle.showMedians || false, label: 'M', style: 'dashed', showTickMarks: true },
    { fromVertex: 'B', enabled: false, label: 'N', style: 'dashed', showTickMarks: true },
    { fromVertex: 'C', enabled: false, label: 'P', style: 'dashed', showTickMarks: true },
  ];

  const updateMedian = (fromVertex: 'A' | 'B' | 'C', partial: Partial<MedianConfig>) => {
    const existing = medians.find((m) => m.fromVertex === fromVertex);
    let updatedList: MedianConfig[];
    if (existing) {
      updatedList = medians.map((m) => (m.fromVertex === fromVertex ? { ...m, ...partial } : m));
    } else {
      updatedList = [
        ...medians,
        {
          fromVertex,
          enabled: true,
          label: fromVertex === 'A' ? 'M' : fromVertex === 'B' ? 'N' : 'P',
          style: 'dashed',
          showTickMarks: true,
          ...partial,
        },
      ];
    }
    onChangeTriangle({
      ...triangle,
      medians: updatedList,
      showMedians: updatedList.some((m) => m.enabled),
    });
  };

  // ==========================================
  // Helper quản lý Phân giác
  // ==========================================
  const bisectors: BisectorConfig[] = triangle.bisectors || [
    { fromVertex: 'A', enabled: triangle.showBisectors || false, label: 'D', style: 'dashed', showAngleMarks: true },
    { fromVertex: 'B', enabled: false, label: 'E', style: 'dashed', showAngleMarks: true },
    { fromVertex: 'C', enabled: false, label: 'F', style: 'dashed', showAngleMarks: true },
  ];

  const updateBisector = (fromVertex: 'A' | 'B' | 'C', partial: Partial<BisectorConfig>) => {
    const existing = bisectors.find((b) => b.fromVertex === fromVertex);
    let updatedList: BisectorConfig[];
    if (existing) {
      updatedList = bisectors.map((b) => (b.fromVertex === fromVertex ? { ...b, ...partial } : b));
    } else {
      updatedList = [
        ...bisectors,
        {
          fromVertex,
          enabled: true,
          label: fromVertex === 'A' ? 'D' : fromVertex === 'B' ? 'E' : 'F',
          style: 'dashed',
          showAngleMarks: true,
          ...partial,
        },
      ];
    }
    onChangeTriangle({
      ...triangle,
      bisectors: updatedList,
      showBisectors: updatedList.some((b) => b.enabled),
    });
  };

  // ==========================================
  // Helper quản lý Trung trực
  // ==========================================
  const perpBisectors: PerpBisectorConfig[] = triangle.perpBisectors || [
    { side: 'BC', enabled: false, label: 'd', style: 'dashed', showRightAngle: true, showTickMarks: true },
    { side: 'AC', enabled: false, label: 'd₁', style: 'dashed', showRightAngle: true, showTickMarks: true },
    { side: 'AB', enabled: false, label: 'd₂', style: 'dashed', showRightAngle: true, showTickMarks: true },
  ];

  const updatePerpBisector = (side: 'BC' | 'AC' | 'AB', partial: Partial<PerpBisectorConfig>) => {
    const existing = perpBisectors.find((p) => p.side === side);
    let updatedList: PerpBisectorConfig[];
    if (existing) {
      updatedList = perpBisectors.map((p) => (p.side === side ? { ...p, ...partial } : p));
    } else {
      updatedList = [
        ...perpBisectors,
        {
          side,
          enabled: true,
          label: side === 'BC' ? 'd' : side === 'AC' ? 'd₁' : 'd₂',
          style: 'dashed',
          showRightAngle: true,
          showTickMarks: true,
          ...partial,
        },
      ];
    }
    onChangeTriangle({
      ...triangle,
      perpBisectors: updatedList,
    });
  };

  const getAlt = (v: 'A' | 'B' | 'C') => altitudes.find((a) => a.fromVertex === v) || { fromVertex: v, enabled: false, label: v === 'A' ? 'H' : v === 'B' ? 'K' : 'L', style: 'dashed' as const, showRightAngle: true };
  const getMed = (v: 'A' | 'B' | 'C') => medians.find((m) => m.fromVertex === v) || { fromVertex: v, enabled: false, label: v === 'A' ? 'M' : v === 'B' ? 'N' : 'P', style: 'dashed' as const, showTickMarks: true };
  const getBis = (v: 'A' | 'B' | 'C') => bisectors.find((b) => b.fromVertex === v) || { fromVertex: v, enabled: false, label: v === 'A' ? 'D' : v === 'B' ? 'E' : 'F', style: 'dashed' as const, showAngleMarks: true };
  const getPerp = (s: 'BC' | 'AC' | 'AB') => perpBisectors.find((p) => p.side === s) || { side: s, enabled: false, label: s === 'BC' ? 'd' : s === 'AC' ? 'd₁' : 'd₂', style: 'dashed' as const, showRightAngle: true, showTickMarks: true };

  const sideLabels = triangle.sideLengthLabels || ['', '', ''];

  return (
    <div className="space-y-3">
      {/* Gợi ý kéo thả trực tiếp */}
      <div className="flex items-center gap-2 p-2 bg-blue-50/80 border border-blue-200 rounded text-blue-800 text-[11px] leading-tight">
        <Move size={14} className="shrink-0 text-blue-600" />
        <span>
          <strong>Kéo thả trực quan:</strong> Nhấn giữ chuột tại các điểm {nameA}, {nameB}, {nameC} trên khung vẽ để di chuyển tự do.
        </span>
      </div>

      {/* 1. Chọn loại tam giác mẫu nhanh */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Triangle size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800">1. Mẫu tam giác SGK</span>
          </div>
          {openSection === 'presets' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'presets' && (
          <div className="p-3 space-y-2.5 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'general', label: 'Tam giác thường', desc: '3 góc nhọn' },
                { id: 'isosceles', label: 'Tam giác cân', desc: 'AB = AC' },
                { id: 'equilateral', label: 'Tam giác đều', desc: '3 cạnh = 60°' },
                { id: 'right', label: 'Tam giác vuông', desc: '∠ = 90°' },
                { id: 'right-isosceles', label: 'Vuông cân', desc: '∠ = 90° & 2 cạnh =' },
              ].map((item) => {
                const isActive = currentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectType(item.id as TriangleType)}
                    className={`p-2 text-left rounded border transition flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.label}</span>
                      {isActive && <Check size={12} className="text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleResetCoordinates}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
            >
              <RotateCcw size={12} />
              <span>Khôi phục toạ độ mẫu chuẩn</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. ĐỊNH LÝ TA-LÉT (ĐƯỜNG THẲNG SONG SONG CẮT 2 CẠNH - NHÓM 2 CÔNG CỤ 1) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('thales')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              2. Định lý Ta-lét (Song song cắt 2 cạnh) {triangle.thales?.enabled ? '✨ (Đang bật)' : ''}
            </span>
          </div>
          {openSection === 'thales' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'thales' && (
          <div className="p-3 space-y-3 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={triangle.thales?.enabled || false}
                  onChange={(e) =>
                    onChangeTriangle({
                      ...triangle,
                      thales: {
                        ...(triangle.thales || {
                          cutSide: 'AB-AC',
                          ratio: 0.4,
                          pointMName: 'M',
                          pointNName: 'N',
                          showParallelMarkers: true,
                          showDashedExtensions: true,
                          showFillTriangle: false,
                          fillColor: '#38bdf8',
                          fillOpacity: 0.25,
                          showRatiosText: false,
                        }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Dựng đường thẳng song song cắt 2 cạnh tam giác (MN // BC)</span>
              </label>
            </div>

            {triangle.thales?.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Chọn cặp cạnh bị cắt */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cặp cạnh bị cắt & Cạnh song song:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'AB-AC', label: `${nameA}${nameB} & ${nameA}${nameC}`, desc: `Song song ${nameB}${nameC}` },
                      { id: 'BC-BA', label: `${nameB}${nameC} & ${nameB}${nameA}`, desc: `Song song ${nameA}${nameC}` },
                      { id: 'CA-CB', label: `${nameC}${nameA} & ${nameC}${nameB}`, desc: `Song song ${nameA}${nameB}` },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onChangeTriangle({
                            ...triangle,
                            thales: {
                              ...triangle.thales,
                              enabled: true,
                              cutSide: item.id as any,
                            },
                          })
                        }
                        className={`p-1.5 rounded border text-left transition ${
                          (triangle.thales?.cutSide || 'AB-AC') === item.id
                            ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{item.label}</div>
                        <div className="text-[9px] text-slate-500">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vị trí điểm M / Tỉ lệ Ta-lét AM/AB */}
                <div>
                  <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                    <span>
                      Vị trí điểm {triangle.thales?.pointMName || 'M'} trên cạnh (Tỉ lệ: {Math.round((triangle.thales?.ratio ?? 0.4) * 100)}%):
                    </span>
                    <span className="font-mono text-blue-600 font-bold">
                      {((triangle.thales?.ratio ?? 0.4)).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.02}
                    value={triangle.thales?.ratio ?? 0.4}
                    onChange={(e) =>
                      onChangeTriangle({
                        ...triangle,
                        thales: {
                          ...triangle.thales,
                          enabled: true,
                          ratio: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    💡 Bạn cũng có thể dùng chuột bấm kéo trực tiếp điểm {triangle.thales?.pointMName || 'M'} trên hình vẽ!
                  </p>
                </div>

                {/* Tên điểm M và N */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Tên điểm 1:</span>
                    <input
                      type="text"
                      value={triangle.thales?.pointMName || 'M'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            pointMName: e.target.value,
                          },
                        })
                      }
                      className="w-10 p-1 border rounded text-center font-bold text-blue-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Tên điểm 2:</span>
                    <input
                      type="text"
                      value={triangle.thales?.pointNName || 'N'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            pointNName: e.target.value,
                          },
                        })
                      }
                      className="w-10 p-1 border rounded text-center font-bold text-blue-700"
                    />
                  </div>
                </div>

                {/* Tùy chọn ký hiệu song song và đường kéo dài */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triangle.thales?.showParallelMarkers !== false}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            showParallelMarkers: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Ký hiệu mũi tên song song (//) trên {triangle.thales?.pointMName || 'M'}{triangle.thales?.pointNName || 'N'} và cạnh đáy</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triangle.thales?.showDashedExtensions || false}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            showDashedExtensions: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Đường kéo dài nét đứt hai đầu MN (Mô hình Ta-lét mở rộng)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triangle.thales?.showFillTriangle || false}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            showFillTriangle: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Highlight tô màu tam giác đồng dạng A{triangle.thales?.pointMName || 'M'}{triangle.thales?.pointNName || 'N'}</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triangle.thales?.showRatiosText || false}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          thales: {
                            ...triangle.thales,
                            enabled: true,
                            showRatiosText: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Hiện bảng hệ thức tỉ lệ Ta-lét sư phạm ở góc hình</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. TÔ MIỀN TAM GIÁC (Fill & Opacity) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('fill')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Paintbrush size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-slate-800">
              2. Tô miền tam giác {fillConfig.enabled ? '(Đang bật)' : '(Chưa tô)'}
            </span>
          </div>
          {openSection === 'fill' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'fill' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={fillConfig.enabled}
                  onChange={(e) => handleUpdateFill({ enabled: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Tô màu miền bên trong</span>
              </label>

              {fillConfig.enabled && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {Math.round(fillConfig.opacity * 100)}% độ đậm
                </span>
              )}
            </div>

            {fillConfig.enabled && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                {/* Chọn màu tô nhanh */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Màu tô miền</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FILL_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.value}
                        type="button"
                        title={swatch.label}
                        onClick={() => handleUpdateFill({ color: swatch.value })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          fillConfig.color === swatch.value
                            ? 'border-slate-800 scale-110 shadow-sm'
                            : 'border-white shadow hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.value }}
                      />
                    ))}
                    {/* Custom Color Input */}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="color"
                        value={fillConfig.color || '#3b82f6'}
                        onChange={(e) => handleUpdateFill({ color: e.target.value })}
                        className="w-7 h-7 p-0 border border-slate-300 rounded cursor-pointer"
                        title="Tùy chọn mã màu"
                      />
                      <input
                        type="text"
                        value={fillConfig.color || '#3b82f6'}
                        onChange={(e) => handleUpdateFill({ color: e.target.value })}
                        className="w-16 text-[11px] font-mono px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Độ trong suốt (Opacity slider) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Độ trong suốt (Opacity)</span>
                    <span className="font-mono">{Math.round(fillConfig.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={fillConfig.opacity}
                    onChange={(e) => handleUpdateFill({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>5% (Mờ nhẹ)</span>
                    <span>50%</span>
                    <span>100% (Đậm hoàn toàn)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. MÀU SẮC & KIỂU NÉT TỪNG CẠNH (AB, BC, CA) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('edges')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-violet-600" />
            <span className="text-xs font-bold text-slate-800">3. Màu & Kiểu nét từng cạnh</span>
          </div>
          {openSection === 'edges' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'edges' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {/* Tabs chọn cạnh */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              {[
                { id: 'AB', label: `Cạnh ${nameA}${nameB}` },
                { id: 'BC', label: `Cạnh ${nameB}${nameC}` },
                { id: 'CA', label: `Cạnh ${nameC}${nameA}` },
                { id: 'ALL', label: 'Tất cả cạnh' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedEdgeTab(tab.id as any)}
                  className={`flex-1 py-1 px-1.5 rounded-md text-center transition ${
                    selectedEdgeTab === tab.id
                      ? 'bg-white text-violet-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel tùy chỉnh cho cạnh được chọn */}
            {(() => {
              const isAll = selectedEdgeTab === 'ALL';
              const targetEdge = isAll ? 'AB' : selectedEdgeTab;
              const currentStyle = getEdgeStyle(targetEdge);

              return (
                <div className="space-y-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {isAll ? 'Tùy chỉnh đồng bộ 3 cạnh' : `Đang chỉnh: Cạnh ${targetEdge === 'AB' ? `${nameA}${nameB}` : targetEdge === 'BC' ? `${nameB}${nameC}` : `${nameC}${nameA}`}`}
                    </span>
                    <div
                      className="w-4 h-4 rounded border border-slate-300 shadow-xs"
                      style={{ backgroundColor: currentStyle.strokeColor || '#000000' }}
                    />
                  </div>

                  {/* 1. Chọn màu viền */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Màu nét cạnh</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch.value}
                          type="button"
                          title={swatch.label}
                          onClick={() =>
                            isAll
                              ? handleApplyStyleToAllEdges({ strokeColor: swatch.value })
                              : handleUpdateEdgeStyle(targetEdge, { strokeColor: swatch.value })
                          }
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${
                            currentStyle.strokeColor === swatch.value
                              ? 'border-violet-600 scale-110 shadow-xs'
                              : 'border-white shadow hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.value }}
                        />
                      ))}
                      <input
                        type="color"
                        value={currentStyle.strokeColor || '#000000'}
                        onChange={(e) =>
                          isAll
                            ? handleApplyStyleToAllEdges({ strokeColor: e.target.value })
                            : handleUpdateEdgeStyle(targetEdge, { strokeColor: e.target.value })
                        }
                        className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer ml-1"
                        title="Màu tùy chọn"
                      />
                    </div>
                  </div>

                  {/* 2. Kiểu nét (Nét liền, Nét đứt, Nét chấm) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Kiểu nét</label>
                      <select
                        value={currentStyle.strokeStyle || 'solid'}
                        onChange={(e) => {
                          const val = e.target.value as StrokeDashType;
                          isAll
                            ? handleApplyStyleToAllEdges({ strokeStyle: val })
                            : handleUpdateEdgeStyle(targetEdge, { strokeStyle: val });
                        }}
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="solid">─ Nét liền</option>
                        <option value="dashed">-- Nét đứt</option>
                        <option value="dotted">··· Nét chấm</option>
                      </select>
                    </div>

                    {/* 3. Độ dày nét */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Độ dày: {currentStyle.strokeWidth || 1.5}px
                      </label>
                      <select
                        value={currentStyle.strokeWidth || 1.5}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          isAll
                            ? handleApplyStyleToAllEdges({ strokeWidth: val })
                            : handleUpdateEdgeStyle(targetEdge, { strokeWidth: val });
                        }}
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="1">1.0 px (Mảnh)</option>
                        <option value="1.4">1.4 px (Chuẩn SGK)</option>
                        <option value="2">2.0 px (Đậm vừa)</option>
                        <option value="2.8">2.8 px (Rất đậm)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 4. Đỉnh & Tên đỉnh */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5">
        <label className="block text-xs font-bold text-slate-800">4. Tên các đỉnh & Nhãn chữ</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Đỉnh 1</label>
            <input
              type="text"
              value={nameA}
              onChange={(e) =>
                onChangeTriangle({
                  ...triangle,
                  vertexNames: [e.target.value, nameB, nameC],
                })
              }
              className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Đỉnh 2</label>
            <input
              type="text"
              value={nameB}
              onChange={(e) =>
                onChangeTriangle({
                  ...triangle,
                  vertexNames: [nameA, e.target.value, nameC],
                })
              }
              className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Đỉnh 3</label>
            <input
              type="text"
              value={nameC}
              onChange={(e) =>
                onChangeTriangle({
                  ...triangle,
                  vertexNames: [nameA, nameB, e.target.value],
                })
              }
              className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={triangle.showLabels !== false}
              onChange={(e) => onChangeTriangle({ ...triangle, showLabels: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện nhãn chữ ({nameA}, {nameB}, {nameC})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={triangle.showVertices !== false}
              onChange={(e) => onChangeTriangle({ ...triangle, showVertices: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện chấm đỉnh</span>
          </label>
        </div>
      </div>

      {/* 5. Đường cao (Altitudes) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('altitudes')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              5. Đường cao ({altitudes.filter((a) => a.enabled).length} đang bật)
            </span>
          </div>
          {openSection === 'altitudes' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'altitudes' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {(['A', 'B', 'C'] as const).map((v) => {
              const alt = getAlt(v);
              const oppSide = v === 'A' ? `${nameB}${nameC}` : v === 'B' ? `${nameA}${nameC}` : `${nameA}${nameB}`;
              const fromName = v === 'A' ? nameA : v === 'B' ? nameB : nameC;

              return (
                <div key={`alt-${v}`} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={alt.enabled}
                        onChange={(e) => updateAltitude(v, { enabled: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>
                        Từ đỉnh {fromName} (⊥ {oppSide})
                      </span>
                    </label>

                    {alt.enabled && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Màu:</span>
                        <input
                          type="color"
                          value={alt.color || '#000000'}
                          onChange={(e) => updateAltitude(v, { color: e.target.value })}
                          className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {alt.enabled && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500">Tên chân</label>
                        <input
                          type="text"
                          value={alt.label || (v === 'A' ? 'H' : v === 'B' ? 'K' : 'L')}
                          onChange={(e) => updateAltitude(v, { label: e.target.value })}
                          className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                        <select
                          value={alt.style || 'dashed'}
                          onChange={(e) => updateAltitude(v, { style: e.target.value as StrokeDashType })}
                          className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="dashed">Nét đứt</option>
                          <option value="solid">Nét liền</option>
                          <option value="dotted">Nét chấm</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700 py-1">
                          <input
                            type="checkbox"
                            checked={alt.showRightAngle !== false}
                            onChange={(e) => updateAltitude(v, { showRightAngle: e.target.checked })}
                            className="rounded text-emerald-600"
                          />
                          <span>Góc vuông (∟)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Trung tuyến (Medians) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('medians')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              6. Trung tuyến ({medians.filter((m) => m.enabled).length} đang bật)
            </span>
          </div>
          {openSection === 'medians' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'medians' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {(['A', 'B', 'C'] as const).map((v) => {
              const med = getMed(v);
              const oppSide = v === 'A' ? `${nameB}${nameC}` : v === 'B' ? `${nameA}${nameC}` : `${nameA}${nameB}`;
              const fromName = v === 'A' ? nameA : v === 'B' ? nameB : nameC;

              return (
                <div key={`med-${v}`} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={med.enabled}
                        onChange={(e) => updateMedian(v, { enabled: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>
                        Từ đỉnh {fromName} (trung điểm {oppSide})
                      </span>
                    </label>

                    {med.enabled && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Màu:</span>
                        <input
                          type="color"
                          value={med.color || '#000000'}
                          onChange={(e) => updateMedian(v, { color: e.target.value })}
                          className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {med.enabled && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500">Tên trung điểm</label>
                        <input
                          type="text"
                          value={med.label || (v === 'A' ? 'M' : v === 'B' ? 'N' : 'P')}
                          onChange={(e) => updateMedian(v, { label: e.target.value })}
                          className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                        <select
                          value={med.style || 'dashed'}
                          onChange={(e) => updateMedian(v, { style: e.target.value as StrokeDashType })}
                          className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="dashed">Nét đứt</option>
                          <option value="solid">Nét liền</option>
                          <option value="dotted">Nét chấm</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700 py-1">
                          <input
                            type="checkbox"
                            checked={med.showTickMarks !== false}
                            onChange={(e) => updateMedian(v, { showTickMarks: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Vạch bằng (|)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Phân giác (Bisectors) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('bisectors')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-purple-600" />
            <span className="text-xs font-bold text-slate-800">
              7. Đường phân giác ({bisectors.filter((b) => b.enabled).length} đang bật)
            </span>
          </div>
          {openSection === 'bisectors' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'bisectors' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {(['A', 'B', 'C'] as const).map((v) => {
              const bis = getBis(v);
              const fromName = v === 'A' ? nameA : v === 'B' ? nameB : nameC;

              return (
                <div key={`bis-${v}`} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={bis.enabled}
                        onChange={(e) => updateBisector(v, { enabled: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span>Phân giác góc {fromName}</span>
                    </label>

                    {bis.enabled && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Màu:</span>
                        <input
                          type="color"
                          value={bis.color || '#000000'}
                          onChange={(e) => updateBisector(v, { color: e.target.value })}
                          className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {bis.enabled && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500">Tên chân</label>
                        <input
                          type="text"
                          value={bis.label || (v === 'A' ? 'D' : v === 'B' ? 'E' : 'F')}
                          onChange={(e) => updateBisector(v, { label: e.target.value })}
                          className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                        <select
                          value={bis.style || 'dashed'}
                          onChange={(e) => updateBisector(v, { style: e.target.value as StrokeDashType })}
                          className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="dashed">Nét đứt</option>
                          <option value="solid">Nét liền</option>
                          <option value="dotted">Nét chấm</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700 py-1">
                          <input
                            type="checkbox"
                            checked={bis.showAngleMarks !== false}
                            onChange={(e) => updateBisector(v, { showAngleMarks: e.target.checked })}
                            className="rounded text-purple-600"
                          />
                          <span>Cung góc bằng</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Đường trung trực (Perpendicular Bisectors) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('perpBisectors')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-600" />
            <span className="text-xs font-bold text-slate-800">
              8. Đường trung trực ({perpBisectors.filter((p) => p.enabled).length} đang bật)
            </span>
          </div>
          {openSection === 'perpBisectors' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'perpBisectors' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {(['BC', 'AC', 'AB'] as const).map((side) => {
              const pb = getPerp(side);
              const sideLabel = side === 'BC' ? `${nameB}${nameC}` : side === 'AC' ? `${nameA}${nameC}` : `${nameA}${nameB}`;

              return (
                <div key={`perp-${side}`} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={pb.enabled}
                        onChange={(e) => updatePerpBisector(side, { enabled: e.target.checked })}
                        className="rounded text-cyan-600"
                      />
                      <span>Trung trực cạnh {sideLabel}</span>
                    </label>

                    {pb.enabled && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Màu:</span>
                        <input
                          type="color"
                          value={pb.color || '#000000'}
                          onChange={(e) => updatePerpBisector(side, { color: e.target.value })}
                          className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {pb.enabled && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500">Tên đường</label>
                        <input
                          type="text"
                          value={pb.label || (side === 'BC' ? 'd' : side === 'AC' ? 'd₁' : 'd₂')}
                          onChange={(e) => updatePerpBisector(side, { label: e.target.value })}
                          className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                        <select
                          value={pb.style || 'dashed'}
                          onChange={(e) => updatePerpBisector(side, { style: e.target.value as StrokeDashType })}
                          className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="dashed">Nét đứt</option>
                          <option value="solid">Nét liền</option>
                          <option value="dotted">Nét chấm</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700 py-1">
                          <input
                            type="checkbox"
                            checked={pb.showRightAngle !== false}
                            onChange={(e) => updatePerpBisector(side, { showRightAngle: e.target.checked })}
                            className="rounded text-cyan-600"
                          />
                          <span>Vuông góc (∟)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 9. Đường tròn ngoại tiếp & Đường tròn nội tiếp (Tool 2) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('circles')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Circle size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800">9. Đường tròn Ngoại tiếp & Nội tiếp</span>
          </div>
          {openSection === 'circles' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'circles' && (
          <div className="p-3 space-y-4 border-t border-slate-200">
            {/* Đường tròn ngoại tiếp */}
            <div className="p-2.5 border border-blue-100 bg-blue-50/40 rounded-md space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-blue-900">Đường tròn ngoại tiếp tam giác</span>
                <input
                  type="checkbox"
                  checked={triangle.circumscribedCircle?.enabled || false}
                  onChange={(e) =>
                    onChangeTriangle({
                      ...triangle,
                      circumscribedCircle: {
                        enabled: e.target.checked,
                        showCenter: true,
                        centerLabel: 'O',
                        color: '#2563eb',
                        strokeWidth: 1.3,
                        style: 'solid',
                        showRadii: false,
                        ...triangle.circumscribedCircle,
                      },
                    })
                  }
                  className="rounded text-blue-600"
                />
              </label>

              {triangle.circumscribedCircle?.enabled && (
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-200/60">
                  <div>
                    <label className="block text-[10px] text-slate-500">Tên tâm</label>
                    <input
                      type="text"
                      value={triangle.circumscribedCircle.centerLabel || 'O'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          circumscribedCircle: {
                            ...triangle.circumscribedCircle,
                            centerLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                    <select
                      value={triangle.circumscribedCircle.style || 'solid'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          circumscribedCircle: {
                            ...triangle.circumscribedCircle,
                            style: e.target.value as StrokeDashType,
                          },
                        })
                      }
                      className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="solid">Nét liền</option>
                      <option value="dashed">Nét đứt</option>
                      <option value="dotted">Nét chấm</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-700 py-1">
                      <input
                        type="checkbox"
                        checked={triangle.circumscribedCircle.showRadii || false}
                        onChange={(e) =>
                          onChangeTriangle({
                            ...triangle,
                            circumscribedCircle: {
                              ...triangle.circumscribedCircle,
                              showRadii: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-blue-600"
                      />
                      <span>Nối bán kính (OA, OB, OC)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Đường tròn nội tiếp */}
            <div className="p-2.5 border border-orange-100 bg-orange-50/40 rounded-md space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-orange-900">Đường tròn nội tiếp tam giác</span>
                <input
                  type="checkbox"
                  checked={triangle.inscribedCircle?.enabled || false}
                  onChange={(e) =>
                    onChangeTriangle({
                      ...triangle,
                      inscribedCircle: {
                        enabled: e.target.checked,
                        showCenter: true,
                        centerLabel: 'I',
                        color: '#ea580c',
                        strokeWidth: 1.3,
                        style: 'solid',
                        showRadii: true,
                        showContactPoints: true,
                        ...triangle.inscribedCircle,
                      },
                    })
                  }
                  className="rounded text-orange-600"
                />
              </label>

              {triangle.inscribedCircle?.enabled && (
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-orange-200/60">
                  <div>
                    <label className="block text-[10px] text-slate-500">Tên tâm</label>
                    <input
                      type="text"
                      value={triangle.inscribedCircle.centerLabel || 'I'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          inscribedCircle: {
                            ...triangle.inscribedCircle,
                            centerLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                    <select
                      value={triangle.inscribedCircle.style || 'solid'}
                      onChange={(e) =>
                        onChangeTriangle({
                          ...triangle,
                          inscribedCircle: {
                            ...triangle.inscribedCircle,
                            style: e.target.value as StrokeDashType,
                          },
                        })
                      }
                      className="w-full text-xs px-1 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="solid">Nét liền</option>
                      <option value="dashed">Nét đứt</option>
                      <option value="dotted">Nét chấm</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-700 py-1">
                      <input
                        type="checkbox"
                        checked={triangle.inscribedCircle.showRadii !== false}
                        onChange={(e) =>
                          onChangeTriangle({
                            ...triangle,
                            inscribedCircle: {
                              ...triangle.inscribedCircle,
                              showRadii: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-orange-600"
                      />
                      <span>Bán kính hạ vuông góc</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 10. Ký hiệu & Độ dài cạnh */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('symbols')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">10. Ký hiệu & Độ dài cạnh</span>
          </div>
          {openSection === 'symbols' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'symbols' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triangle.showRightAngleMarker !== false}
                  onChange={(e) => onChangeTriangle({ ...triangle, showRightAngleMarker: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ký hiệu góc vuông chính (∟)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triangle.showEqualSidesMarker || false}
                  onChange={(e) => onChangeTriangle({ ...triangle, showEqualSidesMarker: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ký hiệu các cạnh bằng nhau (vạch |)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triangle.showSideLengths || false}
                  onChange={(e) => onChangeTriangle({ ...triangle, showSideLengths: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Hiện chữ / số đo độ dài cạnh</span>
              </label>
            </div>

            {triangle.showSideLengths && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] text-slate-500">Cạnh {nameB}{nameC}</label>
                  <input
                    type="text"
                    placeholder="ví dụ: a hoặc 6cm"
                    value={sideLabels[0] || ''}
                    onChange={(e) =>
                      onChangeTriangle({
                        ...triangle,
                        sideLengthLabels: [e.target.value, sideLabels[1] || '', sideLabels[2] || ''],
                      })
                    }
                    className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded text-center bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Cạnh {nameA}{nameC}</label>
                  <input
                    type="text"
                    placeholder="ví dụ: b hoặc 8cm"
                    value={sideLabels[1] || ''}
                    onChange={(e) =>
                      onChangeTriangle({
                        ...triangle,
                        sideLengthLabels: [sideLabels[0] || '', e.target.value, sideLabels[2] || ''],
                      })
                    }
                    className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded text-center bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Cạnh {nameA}{nameB}</label>
                  <input
                    type="text"
                    placeholder="ví dụ: c hoặc 10cm"
                    value={sideLabels[2] || ''}
                    onChange={(e) =>
                      onChangeTriangle({
                        ...triangle,
                        sideLengthLabels: [sideLabels[0] || '', sideLabels[1] || '', e.target.value],
                      })
                    }
                    className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded text-center bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. ĐƯỜNG PHỤ VÀ KÝ HIỆU HÌNH HỌC (Giai đoạn 3.2) */}
      <AuxiliaryElementsEditor
        availablePoints={[nameA, nameB, nameC, 'H', 'K', 'L', 'M', 'N', 'P', 'D', 'E', 'F', 'I', 'O']}
        auxLines={triangle.auxLines || []}
        auxPoints={triangle.auxPoints || []}
        rightAngleMarkers={triangle.rightAngleMarkers || []}
        parallelMarkers={triangle.parallelMarkers || []}
        equalSidesMarkers={triangle.equalSidesMarkers || []}
        equalAnglesMarkers={triangle.equalAnglesMarkers || []}
        onChange={(auxData) => {
          onChangeTriangle({
            ...triangle,
            ...auxData,
          });
        }}
      />
    </div>
  );
};
