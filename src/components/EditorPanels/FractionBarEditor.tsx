import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BaseChartSettings, FractionBarData, FractionBarItem, PatternType } from '../../types';
import { PATTERN_LIST } from '../../renderers/patterns/SvgPatterns';
import { CommonStyleEditor } from './CommonStyleEditor';

interface FractionBarEditorProps {
  data: FractionBarData;
  settings: BaseChartSettings;
  onChangeData: (data: FractionBarData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff'];

export const FractionBarEditor: React.FC<FractionBarEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const bars = data.bars || [];

  const handleAddBar = () => {
    const newId = 'fb_' + Date.now();
    const newBar: FractionBarItem = {
      id: newId,
      numerator: 2,
      denominator: 5,
      label: '2/5',
      color: PRESET_COLORS[bars.length % PRESET_COLORS.length],
      pattern: 'solid',
      patternColor: '#000000',
    };
    onChangeData({ ...data, bars: [...bars, newBar] });
  };

  const handleDeleteBar = (id: string) => {
    if (bars.length <= 1) return;
    onChangeData({ ...data, bars: bars.filter((b) => b.id !== id) });
  };

  const handleUpdateBar = (id: string, partial: Partial<FractionBarItem>) => {
    onChangeData({
      ...data,
      bars: bars.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
      />

      {/* 2. Cài đặt hiển thị phân số */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Mô hình Phân số trực quan
        </h4>

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showFractionsText !== false}
              onChange={(e) => onChangeData({ ...data, showFractionsText: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện phân số cạnh mỗi thanh</span>
          </label>
        </div>
      </div>

      {/* Danh sách các thanh phân số */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các thanh phân số so sánh ({bars.length})
          </h4>

          <button
            onClick={handleAddBar}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-lime-600 hover:bg-lime-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm thanh</span>
          </button>
        </div>

        {bars.map((bar, index) => (
          <div
            key={bar.id}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Thanh {index + 1}</span>

              {bars.length > 1 && (
                <button
                  onClick={() => handleDeleteBar(bar.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">
                  Tử số (phần tô màu) / Mẫu số (tổng phần)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={bar.numerator}
                    onChange={(e) =>
                      handleUpdateBar(bar.id, { numerator: Number(e.target.value) })
                    }
                    className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center text-lime-700"
                  />
                  <span className="font-bold text-slate-400">/</span>
                  <input
                    type="number"
                    min={1}
                    value={bar.denominator}
                    onChange={(e) =>
                      handleUpdateBar(bar.id, {
                        denominator: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center text-lime-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Hoa văn</label>
                <select
                  value={bar.pattern || 'solid'}
                  onChange={(e) =>
                    handleUpdateBar(bar.id, { pattern: e.target.value as PatternType })
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                >
                  {PATTERN_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Màu */}
            <div className="flex items-center gap-1.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdateBar(bar.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border shadow-xs transition ${
                    bar.color === c ? 'ring-2 ring-lime-500 scale-110' : 'border-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
