import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BarChartData, BaseChartSettings, BarItem, PatternType } from '../../types';
import { PATTERN_LIST } from '../../renderers/patterns/SvgPatterns';
import { CommonStyleEditor } from './CommonStyleEditor';

interface BarChartEditorProps {
  data: BarChartData;
  settings: BaseChartSettings;
  onChangeData: (data: BarChartData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ffffff', '#000000'];

export const BarChartEditor: React.FC<BarChartEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const items = data.items || [];

  const handleAddItem = () => {
    const newId = 'bar_' + Date.now();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextChar = alphabet[items.length % alphabet.length] || `Cột ${items.length + 1}`;
    const nextPat = PATTERN_LIST[items.length % PATTERN_LIST.length].id;
    const nextCol = PRESET_COLORS[items.length % PRESET_COLORS.length];

    const newItem: BarItem = {
      id: newId,
      category: `Mục ${nextChar}`,
      value: 15,
      color: nextCol,
      pattern: nextPat,
      patternColor: '#000000',
    };

    onChangeData({ ...data, items: [...items, newItem] });
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    onChangeData({ ...data, items: items.filter((it) => it.id !== id) });
  };

  const handleUpdateItem = (id: string, partial: Partial<BarItem>) => {
    onChangeData({
      ...data,
      items: items.map((it) => (it.id === id ? { ...it, ...partial } : it)),
    });
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

      {/* 2. Cấu hình trục & thông số cột */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Trục tọa độ & Định dạng
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Kiểu hiển thị cột
            </label>
            <select
              value={data.orientation}
              onChange={(e) =>
                onChangeData({ ...data, orientation: e.target.value as 'vertical' | 'horizontal' })
              }
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded font-medium focus:outline-none"
            >
              <option value="vertical">Cột đứng (Thẳng)</option>
              <option value="horizontal">Cột ngang (Nằm ngang)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Đơn vị đo
            </label>
            <input
              type="text"
              value={data.unit || ''}
              onChange={(e) => onChangeData({ ...data, unit: e.target.value })}
              placeholder="VD: học sinh, tấn, triệu đồng"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tên trục hoành (Ox)
            </label>
            <input
              type="text"
              value={data.xAxisTitle || ''}
              onChange={(e) => onChangeData({ ...data, xAxisTitle: e.target.value })}
              placeholder="VD: Danh mục, Lớp"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tên trục tung (Oy)
            </label>
            <input
              type="text"
              value={data.yAxisTitle || ''}
              onChange={(e) => onChangeData({ ...data, yAxisTitle: e.target.value })}
              placeholder="VD: Số lượng"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showValueOnBar !== false}
              onChange={(e) => onChangeData({ ...data, showValueOnBar: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện số liệu trên đầu cột</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showAxisArrows !== false}
              onChange={(e) => onChangeData({ ...data, showAxisArrows: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Mũi tên trục</span>
          </label>
        </div>
      </div>

      {/* Danh sách các cột */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các cột dữ liệu ({items.length})
          </h4>

          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cột</span>
          </button>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={item.category}
                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                placeholder={`Tên danh mục ${index + 1}`}
                className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />

              {items.length > 1 && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                  title="Xóa cột này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Giá trị</label>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => handleUpdateItem(item.id, { value: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Hoa văn</label>
                <select
                  value={item.pattern || 'solid'}
                  onChange={(e) =>
                    handleUpdateItem(item.id, { pattern: e.target.value as PatternType })
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

            {/* Màu sắc */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleUpdateItem(item.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border shadow-xs transition ${
                      item.color === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
