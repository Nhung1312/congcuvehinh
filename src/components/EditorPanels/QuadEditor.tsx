import React, { useState } from 'react';
import {
  QuadData,
  QuadType,
  Point2D,
  GeometrySegmentStyle,
  StrokeDashType,
  QuadAltitudeConfig,
} from '../../types';
import { getQuadPresetPoints } from '../../utils/geometryMath';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';
import {
  Square,
  Move,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Palette,
  Paintbrush,
} from 'lucide-react';

interface QuadEditorProps {
  quad: QuadData;
  onChangeQuad: (newQuad: QuadData) => void;
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

export const QuadEditor: React.FC<QuadEditorProps> = ({ quad, onChangeQuad }) => {
  const currentType = quad.type || 'rectangle';
  const vertexNames = quad.vertexNames || ['A', 'B', 'C', 'D'];
  const nameA = vertexNames[0] || 'A';
  const nameB = vertexNames[1] || 'B';
  const nameC = vertexNames[2] || 'C';
  const nameD = vertexNames[3] || 'D';

  // State mở/đóng các nhóm công cụ
  const [openSection, setOpenSection] = useState<
    'presets' | 'fill' | 'edges' | 'vertices' | 'diagonals' | 'altitudes' | 'symbols' | null
  >('presets');

  // Tab chọn cạnh đang chỉnh sửa: 'AB' | 'BC' | 'CD' | 'DA' | 'ALL'
  const [selectedEdgeTab, setSelectedEdgeTab] = useState<'AB' | 'BC' | 'CD' | 'DA' | 'ALL'>('AB');

  const toggleSection = (
    sec: 'presets' | 'fill' | 'edges' | 'vertices' | 'diagonals' | 'altitudes' | 'symbols'
  ) => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const handleSelectType = (newType: QuadType) => {
    const newPoints = getQuadPresetPoints(newType);
    onChangeQuad({
      ...quad,
      type: newType,
      points: newPoints,
      showRightAngleMarkers:
        newType === 'rectangle' || newType === 'square' || newType === 'right-trapezoid',
      showEqualSidesMarkers:
        newType === 'square' ||
        newType === 'rhombus' ||
        newType === 'isosceles-trapezoid' ||
        newType === 'parallelogram',
      showParallelMarkers:
        newType === 'parallelogram' ||
        newType === 'trapezoid' ||
        newType === 'right-trapezoid' ||
        newType === 'isosceles-trapezoid',
    });
  };

  const handleResetCoordinates = () => {
    const newPoints = getQuadPresetPoints(currentType);
    onChangeQuad({
      ...quad,
      points: newPoints,
    });
  };

  // ==========================================
  // 1. Helper quản lý Tô miền (Fill)
  // ==========================================
  const fillConfig = quad.fill || {
    enabled: false,
    color: '#3b82f6',
    opacity: 0.25,
  };

  const handleUpdateFill = (partial: Partial<typeof fillConfig>) => {
    onChangeQuad({
      ...quad,
      fill: {
        ...fillConfig,
        ...partial,
      },
    });
  };

  // ==========================================
  // 2. Helper quản lý Style từng cạnh (Edges: AB, BC, CD, DA)
  // ==========================================
  const edgeStyles = quad.edgeStyles || {};
  const getEdgeStyle = (edge: 'AB' | 'BC' | 'CD' | 'DA'): GeometrySegmentStyle => {
    return (
      edgeStyles[edge] || {
        strokeColor: '#000000',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
      }
    );
  };

  const handleUpdateEdgeStyle = (
    edge: 'AB' | 'BC' | 'CD' | 'DA',
    partial: Partial<GeometrySegmentStyle>
  ) => {
    const current = getEdgeStyle(edge);
    onChangeQuad({
      ...quad,
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
    const currCD = getEdgeStyle('CD');
    const currDA = getEdgeStyle('DA');
    onChangeQuad({
      ...quad,
      edgeStyles: {
        AB: { ...currAB, ...partial },
        BC: { ...currBC, ...partial },
        CD: { ...currCD, ...partial },
        DA: { ...currDA, ...partial },
      },
    });
  };

  // ==========================================
  // 3. Helper quản lý Đường chéo (Diagonals AC, BD & Giao điểm O)
  // ==========================================
  const diagonals = quad.diagonals || {
    AC: { enabled: quad.showDiagonals || false, style: 'dashed', color: '#64748b' },
    BD: { enabled: quad.showDiagonals || false, style: 'dashed', color: '#64748b' },
    showIntersection: false,
    intersectionLabel: 'O',
  };

  const handleUpdateDiagonal = (
    diag: 'AC' | 'BD',
    partial: Partial<typeof diagonals.AC>
  ) => {
    const current = diagonals[diag] || { enabled: false, style: 'dashed', color: '#64748b' };
    const updatedDiag = { ...current, ...partial };
    const newDiags = {
      ...diagonals,
      [diag]: updatedDiag,
    };
    onChangeQuad({
      ...quad,
      diagonals: newDiags,
      showDiagonals: Boolean(newDiags.AC?.enabled || newDiags.BD?.enabled),
    });
  };

  const handleToggleIntersection = (enabled: boolean) => {
    onChangeQuad({
      ...quad,
      diagonals: {
        ...diagonals,
        showIntersection: enabled,
      },
    });
  };

  // ==========================================
  // 4. Helper quản lý Đường cao đáy (Altitudes AH, BK)
  // ==========================================
  const altitudes: QuadAltitudeConfig[] = quad.altitudes || [
    { fromVertex: 'A', enabled: false, label: 'H', style: 'dashed', showRightAngle: true, color: '#000000' },
    { fromVertex: 'B', enabled: false, label: 'K', style: 'dashed', showRightAngle: true, color: '#000000' },
  ];

  const updateAltitude = (fromVertex: 'A' | 'B', partial: Partial<QuadAltitudeConfig>) => {
    const existing = altitudes.find((a) => a.fromVertex === fromVertex);
    let updatedList: QuadAltitudeConfig[];
    if (existing) {
      updatedList = altitudes.map((a) => (a.fromVertex === fromVertex ? { ...a, ...partial } : a));
    } else {
      updatedList = [
        ...altitudes,
        {
          fromVertex,
          enabled: true,
          label: fromVertex === 'A' ? 'H' : 'K',
          style: 'dashed',
          showRightAngle: true,
          color: '#000000',
          ...partial,
        },
      ];
    }
    onChangeQuad({
      ...quad,
      altitudes: updatedList,
    });
  };

  const getAlt = (v: 'A' | 'B') =>
    altitudes.find((a) => a.fromVertex === v) || {
      fromVertex: v,
      enabled: false,
      label: v === 'A' ? 'H' : 'K',
      style: 'dashed' as const,
      showRightAngle: true,
      color: '#000000',
    };

  const sideLabels = quad.sideLengthLabels || ['', '', '', ''];

  return (
    <div className="space-y-3">
      {/* Gợi ý kéo thả trực tiếp */}
      <div className="flex items-center gap-2 p-2 bg-blue-50/80 border border-blue-200 rounded text-blue-800 text-[11px] leading-tight">
        <Move size={14} className="shrink-0 text-blue-600" />
        <span>
          <strong>Kéo thả trực quan:</strong> Nhấn giữ chuột tại các điểm {nameA}, {nameB}, {nameC}, {nameD} trên khung vẽ để di chuyển (các tính chất hình học được tự động bảo toàn).
        </span>
      </div>

      {/* 1. Chọn loại tứ giác mẫu SGK */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Square size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800">1. Mẫu tứ giác SGK THCS</span>
          </div>
          {openSection === 'presets' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'presets' && (
          <div className="p-3 space-y-2.5 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'general', label: 'Tứ giác thường', desc: '4 đỉnh lồi tự do' },
                { id: 'trapezoid', label: 'Hình thang', desc: 'AB // CD' },
                { id: 'right-trapezoid', label: 'Hình thang vuông', desc: 'AB // CD, ∠A = 90°' },
                { id: 'isosceles-trapezoid', label: 'Hình thang cân', desc: 'AB // CD, AD = BC' },
                { id: 'parallelogram', label: 'Hình bình hành', desc: 'AB // CD, AD // BC' },
                { id: 'rectangle', label: 'Hình chữ nhật', desc: '4 góc vuông' },
                { id: 'rhombus', label: 'Hình thoi', desc: '4 cạnh bằng nhau' },
                { id: 'square', label: 'Hình vuông', desc: '4 góc 90° & 4 cạnh =' },
              ].map((item) => {
                const isActive = currentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectType(item.id as QuadType)}
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

      {/* 2. TÔ MIỀN TỨ GIÁC (Fill & Opacity) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('fill')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Paintbrush size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-slate-800">
              2. Tô miền tứ giác {fillConfig.enabled ? '(Đang bật)' : '(Chưa tô)'}
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

                {/* Độ trong suốt (Opacity) */}
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
                    <span>100% (Đậm)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. MÀU SẮC & KIỂU NÉT TỪNG CẠNH (AB, BC, CD, DA) */}
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
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto">
              {[
                { id: 'AB', label: `${nameA}${nameB}` },
                { id: 'BC', label: `${nameB}${nameC}` },
                { id: 'CD', label: `${nameC}${nameD}` },
                { id: 'DA', label: `${nameD}${nameA}` },
                { id: 'ALL', label: 'Tất cả' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedEdgeTab(tab.id as any)}
                  className={`flex-1 py-1 px-1 rounded-md text-center text-[11px] transition ${
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
                      {isAll
                        ? 'Tùy chỉnh đồng bộ 4 cạnh'
                        : `Đang chỉnh: Cạnh ${
                            targetEdge === 'AB'
                              ? `${nameA}${nameB}`
                              : targetEdge === 'BC'
                              ? `${nameB}${nameC}`
                              : targetEdge === 'CD'
                              ? `${nameC}${nameD}`
                              : `${nameD}${nameA}`
                          }`}
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

                  {/* 2. Kiểu nét và độ dày */}
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

      {/* 4. Đỉnh & Tên đỉnh (A, B, C, D) */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5">
        <label className="block text-xs font-bold text-slate-800">4. Tên các đỉnh & Nhãn chữ</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { idx: 0, val: nameA },
            { idx: 1, val: nameB },
            { idx: 2, val: nameC },
            { idx: 3, val: nameD },
          ].map(({ idx, val }) => (
            <div key={idx}>
              <label className="block text-[10px] text-slate-500 mb-0.5">Đỉnh {idx + 1}</label>
              <input
                type="text"
                value={val}
                onChange={(e) => {
                  const updated = [...vertexNames];
                  updated[idx] = e.target.value;
                  onChangeQuad({
                    ...quad,
                    vertexNames: updated,
                  });
                }}
                className="w-full text-xs font-bold px-1.5 py-1 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={quad.showLabels !== false}
              onChange={(e) => onChangeQuad({ ...quad, showLabels: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện nhãn chữ ({nameA}, {nameB}, {nameC}, {nameD})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={quad.showVertices !== false}
              onChange={(e) => onChangeQuad({ ...quad, showVertices: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện chấm đỉnh</span>
          </label>
        </div>
      </div>

      {/* 5. Đường chéo & Giao điểm (Diagonals) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('diagonals')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              5. Đường chéo ({[diagonals.AC?.enabled, diagonals.BD?.enabled].filter(Boolean).length} đang bật)
            </span>
          </div>
          {openSection === 'diagonals' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'diagonals' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {/* Đường chéo AC */}
            <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={diagonals.AC?.enabled || false}
                    onChange={(e) => handleUpdateDiagonal('AC', { enabled: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Đường chéo {nameA}{nameC}</span>
                </label>
                {diagonals.AC?.enabled && (
                  <input
                    type="color"
                    value={diagonals.AC.color || '#64748b'}
                    onChange={(e) => handleUpdateDiagonal('AC', { color: e.target.value })}
                    className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                )}
              </div>
              {diagonals.AC?.enabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                    <select
                      value={diagonals.AC.style || 'dashed'}
                      onChange={(e) => handleUpdateDiagonal('AC', { style: e.target.value as StrokeDashType })}
                      className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="dashed">Nét đứt</option>
                      <option value="solid">Nét liền</option>
                      <option value="dotted">Nét chấm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Độ dày</label>
                    <select
                      value={diagonals.AC.strokeWidth || 1.2}
                      onChange={(e) => handleUpdateDiagonal('AC', { strokeWidth: parseFloat(e.target.value) })}
                      className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="1">1.0 px</option>
                      <option value="1.2">1.2 px</option>
                      <option value="1.8">1.8 px</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Đường chéo BD */}
            <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={diagonals.BD?.enabled || false}
                    onChange={(e) => handleUpdateDiagonal('BD', { enabled: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Đường chéo {nameB}{nameD}</span>
                </label>
                {diagonals.BD?.enabled && (
                  <input
                    type="color"
                    value={diagonals.BD.color || '#64748b'}
                    onChange={(e) => handleUpdateDiagonal('BD', { color: e.target.value })}
                    className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                )}
              </div>
              {diagonals.BD?.enabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-500">Kiểu nét</label>
                    <select
                      value={diagonals.BD.style || 'dashed'}
                      onChange={(e) => handleUpdateDiagonal('BD', { style: e.target.value as StrokeDashType })}
                      className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="dashed">Nét đứt</option>
                      <option value="solid">Nét liền</option>
                      <option value="dotted">Nét chấm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Độ dày</label>
                    <select
                      value={diagonals.BD.strokeWidth || 1.2}
                      onChange={(e) => handleUpdateDiagonal('BD', { strokeWidth: parseFloat(e.target.value) })}
                      className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="1">1.0 px</option>
                      <option value="1.2">1.2 px</option>
                      <option value="1.8">1.8 px</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Giao điểm 2 đường chéo (O) */}
            <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200 flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-900">
                <input
                  type="checkbox"
                  checked={diagonals.showIntersection || false}
                  onChange={(e) => handleToggleIntersection(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Hiện giao điểm 2 đường chéo</span>
              </label>
              {diagonals.showIntersection && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-emerald-800">Tên:</span>
                  <input
                    type="text"
                    value={diagonals.intersectionLabel || 'O'}
                    onChange={(e) =>
                      onChangeQuad({
                        ...quad,
                        diagonals: { ...diagonals, intersectionLabel: e.target.value },
                      })
                    }
                    className="w-10 text-xs font-bold px-1 py-0.5 border border-emerald-300 rounded text-center bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Đường cao đáy (Altitudes: AH, BK) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('altitudes')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-600" />
            <span className="text-xs font-bold text-slate-800">
              6. Đường cao ({altitudes.filter((a) => a.enabled).length} đang bật)
            </span>
          </div>
          {openSection === 'altitudes' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'altitudes' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            {(['A', 'B'] as const).map((v) => {
              const alt = getAlt(v);
              const fromName = v === 'A' ? nameA : nameB;
              const bottomSide = `${nameC}${nameD}`;

              return (
                <div key={`alt-${v}`} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={alt.enabled}
                        onChange={(e) => updateAltitude(v, { enabled: e.target.checked })}
                        className="rounded text-cyan-600"
                      />
                      <span>
                        Từ {fromName} (⊥ đáy {bottomSide})
                      </span>
                    </label>

                    {alt.enabled && (
                      <input
                        type="color"
                        value={alt.color || '#000000'}
                        onChange={(e) => updateAltitude(v, { color: e.target.value })}
                        className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                      />
                    )}
                  </div>

                  {alt.enabled && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500">Tên chân</label>
                        <input
                          type="text"
                          value={alt.label || (v === 'A' ? 'H' : 'K')}
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
                            className="rounded text-cyan-600"
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

      {/* 7. Ký hiệu hình học & Nhãn độ dài cạnh */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('symbols')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">7. Ký hiệu & Độ dài cạnh</span>
          </div>
          {openSection === 'symbols' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSection === 'symbols' && (
          <div className="p-3 space-y-3 border-t border-slate-200">
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quad.showRightAngleMarkers !== false}
                  onChange={(e) => onChangeQuad({ ...quad, showRightAngleMarkers: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ký hiệu góc vuông (∟)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quad.showEqualSidesMarkers !== false}
                  onChange={(e) => onChangeQuad({ ...quad, showEqualSidesMarkers: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ký hiệu cạnh bằng nhau (||)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quad.showParallelMarkers !== false}
                  onChange={(e) => onChangeQuad({ ...quad, showParallelMarkers: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ký hiệu các cạnh song song (&gt;&gt;)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quad.showSideLengths || false}
                  onChange={(e) => onChangeQuad({ ...quad, showSideLengths: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Hiện nhãn ký hiệu độ dài các cạnh</span>
              </label>
            </div>

            {quad.showSideLengths && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600">Nhãn độ dài 4 cạnh</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: `${nameA}${nameB}`, idx: 0 },
                    { label: `${nameB}${nameC}`, idx: 1 },
                    { label: `${nameC}${nameD}`, idx: 2 },
                    { label: `${nameD}${nameA}`, idx: 3 },
                  ].map(({ label, idx }) => (
                    <div key={idx}>
                      <label className="block text-[10px] text-slate-500 mb-0.5">{label}</label>
                      <input
                        type="text"
                        placeholder="vd: a, 4cm"
                        value={sideLabels[idx] || ''}
                        onChange={(e) => {
                          const updated = [...sideLabels];
                          updated[idx] = e.target.value;
                          onChangeQuad({
                            ...quad,
                            sideLengthLabels: updated,
                          });
                        }}
                        className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded text-center bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. ĐƯỜNG PHỤ VÀ KÝ HIỆU HÌNH HỌC (GIAI ĐOẠN 3.2) */}
      <AuxiliaryElementsEditor
        availablePoints={[nameA, nameB, nameC, nameD, 'O', 'M', 'N', 'P', 'Q', 'H', 'K', 'E', 'F', 'I']}
        auxLines={quad.auxLines || []}
        auxPoints={quad.auxPoints || []}
        rightAngleMarkers={quad.rightAngleMarkers || []}
        parallelMarkers={quad.parallelMarkers || []}
        equalSidesMarkers={quad.equalSidesMarkers || []}
        equalAnglesMarkers={quad.equalAnglesMarkers || []}
        onChange={(auxData) => {
          onChangeQuad({
            ...quad,
            ...auxData,
          });
        }}
      />
    </div>
  );
};
