import React from 'react';
import { Plus, Trash2, Lock, Unlock, Palette, Eye, RefreshCw } from 'lucide-react';
import { BaseChartSettings, PieChartData, PieSlice, PatternType } from '../../types';
import { PATTERN_LIST } from '../../renderers/patterns/SvgPatterns';
import { redistributePiePercentages } from '../../calculations/mathCalculations';
import { CommonStyleEditor } from './CommonStyleEditor';

interface PieChartEditorProps {
  data: PieChartData;
  settings: BaseChartSettings;
  onChangeData: (data: PieChartData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const PRESET_COLORS = [
  '#ffffff', // Trắng
  '#000000', // Đen
  '#3b82f6', // Xanh dương
  '#10b981', // Xanh lá
  '#f59e0b', // Vàng cam
  '#ef4444', // Đỏ
  '#8b5cf6', // Tím
  '#06b6d4', // Cyan
  '#f97316', // Cam
  '#ec4899', // Hồng
];

export const PieChartEditor: React.FC<PieChartEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const slices = data.slices || [];

  // Thêm một nhóm mới
  const handleAddSlice = () => {
    const newId = 'slice_' + Date.now();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextChar = alphabet[slices.length % alphabet.length] || `Nhóm ${slices.length + 1}`;
    
    // Tìm hoa văn tiếp theo
    const nextPat = PATTERN_LIST[(slices.length) % PATTERN_LIST.length].id;
    const nextCol = PRESET_COLORS[(slices.length + 2) % PRESET_COLORS.length];

    const newSlice: PieSlice = {
      id: newId,
      name: `Nhóm ${nextChar}`,
      value: 20,
      color: nextCol,
      pattern: nextPat,
      patternColor: '#000000',
      patternBg: '#ffffff',
      isLocked: false,
      showLabelOnSlice: true,
    };

    const newSlices = [...slices, newSlice];
    onChangeData({ ...data, slices: newSlices });
  };

  // Xóa một nhóm
  const handleDeleteSlice = (id: string) => {
    if (slices.length <= 1) return;
    const newSlices = slices.filter((s) => s.id !== id);
    onChangeData({ ...data, slices: newSlices });
  };

  // Cập nhật giá trị lát cắt với tính năng khóa tỉ lệ như trong video
  const handleValueChange = (id: string, newVal: number) => {
    // Nếu đơn vị là % và người dùng muốn phân bổ lại thông minh
    if (data.unit === '%' || !data.unit) {
      const updatedSlices = redistributePiePercentages(slices, id, newVal);
      onChangeData({ ...data, slices: updatedSlices });
    } else {
      const updatedSlices = slices.map((s) =>
        s.id === id ? { ...s, value: Math.max(0, newVal) } : s
      );
      onChangeData({ ...data, slices: updatedSlices });
    }
  };

  // Cập nhật thông số từng slice
  const handleUpdateSlice = (id: string, partial: Partial<PieSlice>) => {
    const updatedSlices = slices.map((s) =>
      s.id === id ? { ...s, ...partial } : s
    );
    onChangeData({ ...data, slices: updatedSlices });
  };

  // Tính tổng % hoặc tổng giá trị
  const totalValue = slices.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font chuẩn SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
        showLegendToggle={true}
      />

      {/* 2. Cấu hình quạt tròn & Bán kính */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Thông số quạt tròn
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Đơn vị (VD: %, tấn, em)
            </label>
            <input
              type="text"
              value={data.unit || ''}
              onChange={(e) => onChangeData({ ...data, unit: e.target.value })}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Chữ số thập phân
            </label>
            <select
              value={data.decimalPlaces}
              onChange={(e) => onChangeData({ ...data, decimalPlaces: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            >
              <option value={0}>Làm tròn nguyên (50%)</option>
              <option value={1}>1 chữ số (50.5%)</option>
              <option value={2}>2 chữ số (50.25%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Bán kính quạt (px)
            </label>
            <input
              type="number"
              min={80}
              max={250}
              value={data.radius || 150}
              onChange={(e) => onChangeData({ ...data, radius: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Góc xoay (độ)
            </label>
            <input
              type="number"
              min={0}
              max={360}
              value={data.startAngle || 0}
              onChange={(e) => onChangeData({ ...data, startAngle: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>
        </div>

        {/* Tùy chọn hiển thị nhãn */}
        <div className="space-y-1.5 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showPercentageOnSlice}
              onChange={(e) => onChangeData({ ...data, showPercentageOnSlice: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện tỉ lệ % trên từng quạt</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showNameOnSlice}
              onChange={(e) => onChangeData({ ...data, showNameOnSlice: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện tên nhóm trên từng quạt</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showValuesOnSlice}
              onChange={(e) => onChangeData({ ...data, showValuesOnSlice: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện số liệu thực trên quạt</span>
          </label>
        </div>
      </div>

      {/* Danh sách các phần tử dữ liệu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dữ liệu ({slices.length} phần)
            </h4>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                Math.round(totalValue) === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Tổng: {Math.round(totalValue * 10) / 10}
              {data.unit ? ` ${data.unit}` : ''}
            </span>
          </div>

          <button
            onClick={handleAddSlice}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>

        {slices.map((slice, index) => (
          <div
            key={slice.id}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5 relative group"
          >
            {/* Hàng 1: Tên nhóm + Nút xóa */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={slice.name}
                onChange={(e) => handleUpdateSlice(slice.id, { name: e.target.value })}
                placeholder={`Nhóm ${index + 1}`}
                className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />

              {slices.length > 1 && (
                <button
                  onClick={() => handleDeleteSlice(slice.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                  title="Xóa nhóm này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hàng 2: Giá trị + Khóa tỉ lệ + Chọn hoa văn */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">
                  Giá trị ({data.unit || '%'})
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={slice.value}
                    onChange={(e) => handleValueChange(slice.id, Number(e.target.value))}
                    className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none"
                  />

                  {/* Nút Khóa / Mở khóa số liệu giống như trong video */}
                  <button
                    onClick={() => handleUpdateSlice(slice.id, { isLocked: !slice.isLocked })}
                    className={`p-1.5 rounded border transition shrink-0 ${
                      slice.isLocked
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={
                      slice.isLocked
                        ? 'Đã khóa: Giá trị này sẽ giữ nguyên khi chỉnh nhóm khác'
                        : 'Chưa khóa: Giá trị sẽ tự động điều chỉnh bù trừ khi chỉnh nhóm khác'
                    }
                  >
                    {slice.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">
                  Kiểu hoa văn
                </label>
                <select
                  value={slice.pattern || 'solid'}
                  onChange={(e) =>
                    handleUpdateSlice(slice.id, { pattern: e.target.value as PatternType })
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none bg-white font-medium"
                >
                  {PATTERN_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hàng 3: Bảng chọn màu nhanh */}
            <div className="pt-1">
              <label className="block text-[10px] text-slate-500 mb-1">
                Màu sắc / Nền:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleUpdateSlice(slice.id, { color: c, patternBg: c })}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border shadow-xs transition ${
                      slice.color === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300 hover:scale-105'
                    }`}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Checkbox hiện chữ trên quạt */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slice.showLabelOnSlice !== false}
                  onChange={(e) =>
                    handleUpdateSlice(slice.id, { showLabelOnSlice: e.target.checked })
                  }
                  className="rounded text-blue-600"
                />
                <span>Hiện phần % trên quạt này</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
