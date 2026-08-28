import React from 'react';
import { Plus, Trash2, Palette, Check } from 'lucide-react';
import { BaseChartSettings, LineChartData, LinePoint } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';

interface LineChartEditorProps {
  data: LineChartData;
  settings: BaseChartSettings;
  onChangeData: (data: LineChartData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const PRESET_COLORS = [
  { name: 'Đen', value: '#000000', border: 'border-slate-400' },
  { name: 'Xanh dương', value: '#2563eb', border: 'border-blue-700' },
  { name: 'Đỏ', value: '#dc2626', border: 'border-red-700' },
  { name: 'Xanh lá', value: '#16a34a', border: 'border-green-700' },
  { name: 'Cam', value: '#ea580c', border: 'border-orange-700' },
  { name: 'Tím', value: '#9333ea', border: 'border-purple-700' },
];

export const LineChartEditor: React.FC<LineChartEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const points = data.points || [];
  const currentColor = data.lineColor || '#000000';

  const handleAddPoint = () => {
    const newId = 'pt_' + Date.now();
    const nextIdx = points.length + 1;
    const newPt: LinePoint = {
      id: newId,
      xLabel: `${nextIdx * 2}h`,
      xValue: nextIdx,
      yValue: 20 + Math.floor(Math.random() * 10),
      pointName: '',
    };
    onChangeData({ ...data, points: [...points, newPt] });
  };

  const handleDeletePoint = (id: string) => {
    if (points.length <= 2) return;
    onChangeData({ ...data, points: points.filter((p) => p.id !== id) });
  };

  const handleUpdatePoint = (id: string, partial: Partial<LinePoint>) => {
    onChangeData({
      ...data,
      points: points.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    });
  };

  const handleColorChange = (newColor: string) => {
    onChangeData({ ...data, lineColor: newColor });
  };

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
        showGridToggle={true}
        gridChecked={data.showGridLines !== false}
        onToggleGrid={(show) => onChangeData({ ...data, showGridLines: show })}
      />

      {/* 2. Khu vực Màu sắc đường đoạn thẳng */}
      <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>🎨 Màu sắc đoạn thẳng</span>
          </h4>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">
            {currentColor.toUpperCase()}
          </span>
        </div>

        {/* Nút chọn nhanh các màu chuẩn */}
        <div className="grid grid-cols-6 gap-2 pt-1">
          {PRESET_COLORS.map((c) => {
            const isSelected = currentColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleColorChange(c.value)}
                title={`Màu ${c.name}`}
                className={`group flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-xs transition-transform ${c.border} ${
                    isSelected ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.value === '#000000' || c.value === '#2563eb' || c.value === '#dc2626' || c.value === '#9333ea' || c.value === '#16a34a' || c.value === '#ea580c'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Color picker tùy chỉnh */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
          <label className="text-[11px] font-medium text-slate-600">
            Màu tùy chọn khác:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 p-0 border border-slate-300 rounded cursor-pointer bg-transparent"
              title="Nhấp để chọn màu bất kỳ"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="w-20 text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            />
          </div>
        </div>
      </div>

      {/* 3. Cấu hình trục & Nét vẽ */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Trục tọa độ & Đoạn thẳng
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Kiểu đường nối
            </label>
            <select
              value={data.lineStyle || 'solid'}
              onChange={(e) =>
                onChangeData({ ...data, lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })
              }
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            >
              <option value="solid">Nét liền (Chuẩn SGK)</option>
              <option value="dashed">Nét đứt</option>
              <option value="dotted">Nét chấm</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Đơn vị trục Oy
            </label>
            <input
              type="text"
              value={data.unit || ''}
              onChange={(e) => onChangeData({ ...data, unit: e.target.value })}
              placeholder="VD: °C, nghìn đồng, kg"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tên trục hoành Ox
            </label>
            <input
              type="text"
              value={data.xAxisTitle || ''}
              onChange={(e) => onChangeData({ ...data, xAxisTitle: e.target.value })}
              placeholder="VD: Thời gian, Tháng"
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tên trục tung Oy
            </label>
            <input
              type="text"
              value={data.yAxisTitle || ''}
              onChange={(e) => onChangeData({ ...data, yAxisTitle: e.target.value })}
              placeholder="VD: Nhiệt độ, Doanh thu"
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showDashedProjections !== false}
              onChange={(e) => onChangeData({ ...data, showDashedProjections: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện đường dóng nét đứt tới trục</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showValues !== false}
              onChange={(e) => onChangeData({ ...data, showValues: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện số liệu trên đầu điểm</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showPoints !== false}
              onChange={(e) => onChangeData({ ...data, showPoints: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện chấm điểm tròn (Node)</span>
          </label>
        </div>
      </div>

      {/* Bảng các điểm (x, y) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Bảng giá trị (x | y) ({points.length} điểm)
          </h4>

          <button
            onClick={handleAddPoint}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm điểm</span>
          </button>
        </div>

        {points.map((p, index) => (
          <div
            key={p.id}
            className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center gap-2"
          >
            <span className="text-xs font-bold text-slate-400 w-5">{index + 1}.</span>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500">Mốc x (trục ngang)</label>
                <input
                  type="text"
                  value={p.xLabel}
                  onChange={(e) => handleUpdatePoint(p.id, { xLabel: e.target.value })}
                  placeholder="VD: 7h, T1"
                  className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">Giá trị y (trục đứng)</label>
                <input
                  type="number"
                  value={p.yValue}
                  onChange={(e) => handleUpdatePoint(p.id, { yValue: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none text-purple-700"
                />
              </div>
            </div>

            {points.length > 2 && (
              <button
                onClick={() => handleDeletePoint(p.id)}
                className="p-1 text-slate-400 hover:text-red-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
