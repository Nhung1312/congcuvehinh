import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BaseChartSettings, DoubleBarChartData, DoubleBarItem, PatternType } from '../../types';
import { PATTERN_LIST } from '../../renderers/patterns/SvgPatterns';
import { CommonStyleEditor } from './CommonStyleEditor';

interface DoubleBarChartEditorProps {
  data: DoubleBarChartData;
  settings: BaseChartSettings;
  onChangeData: (data: DoubleBarChartData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const PRESET_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ffffff', '#000000'];

export const DoubleBarChartEditor: React.FC<DoubleBarChartEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const items = data.items || [];

  const handleAddItem = () => {
    const newId = 'db_' + Date.now();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextChar = alphabet[items.length % alphabet.length] || `${items.length + 1}`;

    const newItem: DoubleBarItem = {
      id: newId,
      category: `Mục ${nextChar}`,
      value1: 15,
      value2: 20,
    };

    onChangeData({ ...data, items: [...items, newItem] });
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    onChangeData({ ...data, items: items.filter((it) => it.id !== id) });
  };

  const handleUpdateItem = (id: string, partial: Partial<DoubleBarItem>) => {
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
        showLegendToggle={true}
        showGridToggle={true}
        gridChecked={data.showGridLines !== false}
        onToggleGrid={(show) => onChangeData({ ...data, showGridLines: show })}
      />

      {/* 2. Cấu hình chung & Nhóm */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          2 Nhóm dữ liệu & Trục
        </h4>

        {/* Thiết lập Nhóm 1 */}
        <div className="p-2.5 bg-white border border-slate-200 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">Thiết lập Nhóm 1</span>
            <select
              value={data.group1Pattern || 'solid'}
              onChange={(e) =>
                onChangeData({ ...data, group1Pattern: e.target.value as PatternType })
              }
              className="text-[11px] px-1.5 py-1 border border-slate-300 rounded bg-white"
            >
              {PATTERN_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={data.group1Name}
            onChange={(e) => onChangeData({ ...data, group1Name: e.target.value })}
            placeholder="Tên nhóm 1 (VD: Nam, Năm 2022, Học kỳ I)"
            className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
          />
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={`g1-${c}`}
                onClick={() => onChangeData({ ...data, group1Color: c })}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border shadow-xs transition ${
                  data.group1Color === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Thiết lập Nhóm 2 */}
        <div className="p-2.5 bg-white border border-slate-200 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Thiết lập Nhóm 2</span>
            <select
              value={data.group2Pattern || 'hatch-right'}
              onChange={(e) =>
                onChangeData({ ...data, group2Pattern: e.target.value as PatternType })
              }
              className="text-[11px] px-1.5 py-1 border border-slate-300 rounded bg-white"
            >
              {PATTERN_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={data.group2Name}
            onChange={(e) => onChangeData({ ...data, group2Name: e.target.value })}
            placeholder="Tên nhóm 2 (VD: Nữ, Năm 2023, Học kỳ II)"
            className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
          />
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={`g2-${c}`}
                onClick={() => onChangeData({ ...data, group2Color: c })}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border shadow-xs transition ${
                  data.group2Color === c ? 'ring-2 ring-amber-500 scale-110' : 'border-slate-300'
                }`}
              />
            ))}
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
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Tên trục tung & Đơn vị
            </label>
            <input
              type="text"
              value={data.yAxisTitle || ''}
              onChange={(e) => onChangeData({ ...data, yAxisTitle: e.target.value })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showValueOnBar !== false}
              onChange={(e) => onChangeData({ ...data, showValueOnBar: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện số trên đầu cột</span>
          </label>
        </div>
      </div>

      {/* Danh sách các cặp dữ liệu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các danh mục so sánh ({items.length})
          </h4>

          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mục</span>
          </button>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={item.category}
                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:outline-none"
              />

              {items.length > 1 && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-blue-600 font-bold mb-0.5">
                  {data.group1Name || 'Nhóm 1'}:
                </label>
                <input
                  type="number"
                  value={item.value1}
                  onChange={(e) => handleUpdateItem(item.id, { value1: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-2 py-1 border border-blue-200 rounded bg-blue-50/40"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-600 font-bold mb-0.5">
                  {data.group2Name || 'Nhóm 2'}:
                </label>
                <input
                  type="number"
                  value={item.value2}
                  onChange={(e) => handleUpdateItem(item.id, { value2: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-2 py-1 border border-amber-200 rounded bg-amber-50/40"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
