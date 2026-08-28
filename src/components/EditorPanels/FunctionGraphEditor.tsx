import React from 'react';
import { Sparkles, GitCommit, Layers } from 'lucide-react';
import { BaseChartSettings, FunctionGraphData } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';

interface FunctionGraphEditorProps {
  data: FunctionGraphData;
  settings: BaseChartSettings;
  onChangeData: (data: FunctionGraphData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const FunctionGraphEditor: React.FC<FunctionGraphEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const secondFn = data.secondFunction || {
    enabled: false,
    functionType: 'linear',
    a: 1,
    b: 2,
    lineColor: '#dc2626',
    name: "d'",
  };

  // Mẫu nhanh tương giao đồ thị SGK Toán 9
  const handleApplyPreset = (preset: 'linear' | 'parabola' | 'intersect_lines' | 'intersect_parabola_line' | 'inverse') => {
    if (preset === 'linear') {
      onChangeData({
        ...data,
        functionType: 'linear',
        a: 2,
        b: -3,
        xMin: -3,
        xMax: 5,
        yMin: -5,
        yMax: 5,
        secondFunction: { ...secondFn, enabled: false },
      });
    } else if (preset === 'parabola') {
      onChangeData({
        ...data,
        functionType: 'quadratic',
        a: 0.5,
        b: 0,
        xMin: -4,
        xMax: 4,
        yMin: -1,
        yMax: 6,
        secondFunction: { ...secondFn, enabled: false },
      });
    } else if (preset === 'intersect_lines') {
      // 2 đường thẳng: y = 2x - 1 và y = -x + 2 => giao tại (1, 1)
      onChangeData({
        ...data,
        functionType: 'linear',
        a: 2,
        b: -1,
        xMin: -3,
        xMax: 4,
        yMin: -3,
        yMax: 5,
        secondFunction: {
          enabled: true,
          functionType: 'linear',
          a: -1,
          b: 2,
          lineColor: '#dc2626',
          name: "d'",
        },
        showIntersections: true,
        showIntersectionProjections: true,
      });
    } else if (preset === 'intersect_parabola_line') {
      // Parabol y = x^2 và đường thẳng y = x + 2 => giao tại (-1, 1) và (2, 4)
      onChangeData({
        ...data,
        functionType: 'quadratic',
        a: 1,
        b: 0,
        xMin: -3,
        xMax: 4,
        yMin: -1,
        yMax: 6,
        secondFunction: {
          enabled: true,
          functionType: 'linear',
          a: 1,
          b: 2,
          lineColor: '#dc2626',
          name: 'd',
        },
        showIntersections: true,
        showIntersectionProjections: true,
      });
    } else if (preset === 'inverse') {
      onChangeData({
        ...data,
        functionType: 'inverse',
        a: 4,
        b: 0,
        xMin: -6,
        xMax: 6,
        yMin: -6,
        yMax: 6,
        secondFunction: { ...secondFn, enabled: false },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
        showGridToggle={true}
        gridChecked={data.showGrid !== false}
        onToggleGrid={(show) => onChangeData({ ...data, showGrid: show })}
      />

      {/* 2. Chọn mẫu nhanh SGK */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Mẫu bài toán đồ thị hàm số SGK Toán 9</span>
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleApplyPreset('linear')}
            className="px-2 py-1.5 text-xs font-semibold rounded bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 text-left"
          >
            Đường thẳng y = ax + b
          </button>
          <button
            onClick={() => handleApplyPreset('parabola')}
            className="px-2 py-1.5 text-xs font-semibold rounded bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 text-left"
          >
            Parabol y = ax²
          </button>
          <button
            onClick={() => handleApplyPreset('intersect_lines')}
            className="px-2 py-1.5 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-left flex items-center gap-1"
          >
            <GitCommit className="w-3 h-3 text-blue-600" />
            <span>Giao điểm 2 đường thẳng</span>
          </button>
          <button
            onClick={() => handleApplyPreset('intersect_parabola_line')}
            className="px-2 py-1.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-left flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-indigo-600" />
            <span>Tương giao (P) &amp; Đường thẳng</span>
          </button>
        </div>
      </div>

      {/* 3. Hàm số thứ nhất (Primary) */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
          1. Hàm số thứ nhất (Đồ thị chính)
        </h4>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Loại hàm số
          </label>
          <select
            value={data.functionType}
            onChange={(e) =>
              onChangeData({
                ...data,
                functionType: e.target.value as 'linear' | 'quadratic' | 'inverse',
              })
            }
            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold focus:outline-none"
          >
            <option value="linear">Hàm số bậc nhất: y = ax + b (Đường thẳng)</option>
            <option value="quadratic">Hàm số bậc hai: y = ax² (Parabol)</option>
            <option value="inverse">Hàm số tỉ lệ nghịch: y = a/x (Hyperbol)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Hệ số a
            </label>
            <input
              type="number"
              step={0.25}
              value={data.a}
              onChange={(e) => onChangeData({ ...data, a: Number(e.target.value) })}
              className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none text-blue-700"
            />
          </div>

          {data.functionType === 'linear' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Hệ số b
              </label>
              <input
                type="number"
                step={0.5}
                value={data.b}
                onChange={(e) => onChangeData({ ...data, b: Number(e.target.value) })}
                className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none text-blue-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Hàm số thứ hai (Secondary) & Tương giao */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Hàm số thứ hai (Vẽ đồng thời / Tương giao)</span>
          </h4>
          <input
            type="checkbox"
            checked={secondFn.enabled}
            onChange={(e) =>
              onChangeData({
                ...data,
                secondFunction: {
                  ...secondFn,
                  enabled: e.target.checked,
                },
              })
            }
            className="w-4 h-4 text-rose-600 rounded"
          />
        </div>

        {secondFn.enabled && (
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Loại đồ thị thứ hai
              </label>
              <select
                value={secondFn.functionType}
                onChange={(e) =>
                  onChangeData({
                    ...data,
                    secondFunction: {
                      ...secondFn,
                      functionType: e.target.value as 'linear' | 'quadratic' | 'inverse',
                    },
                  })
                }
                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-semibold"
              >
                <option value="linear">Đường thẳng: y = ax + b</option>
                <option value="quadratic">Parabol: y = ax²</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Hệ số a
                </label>
                <input
                  type="number"
                  step={0.25}
                  value={secondFn.a}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      secondFunction: {
                        ...secondFn,
                        a: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded text-rose-700"
                />
              </div>

              {secondFn.functionType === 'linear' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Hệ số b
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={secondFn.b}
                    onChange={(e) =>
                      onChangeData({
                        ...data,
                        secondFunction: {
                          ...secondFn,
                          b: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded text-rose-700"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showIntersections !== false}
                  onChange={(e) => onChangeData({ ...data, showIntersections: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Tự động đánh dấu giao điểm (A, B)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showIntersectionProjections !== false}
                  onChange={(e) =>
                    onChangeData({ ...data, showIntersectionProjections: e.target.checked })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Dóng nét đứt từ giao điểm xuống trục Ox, Oy</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 5. Miền tọa độ xMin, xMax, yMin, yMax */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Miền giá trị hệ trục
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Miền x (xMin đến xMax)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={data.xMin}
                onChange={(e) => onChangeData({ ...data, xMin: Number(e.target.value) })}
                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
              />
              <span className="text-xs text-slate-400">đến</span>
              <input
                type="number"
                value={data.xMax}
                onChange={(e) => onChangeData({ ...data, xMax: Number(e.target.value) })}
                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Miền y (yMin đến yMax)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={data.yMin}
                onChange={(e) => onChangeData({ ...data, yMin: Number(e.target.value) })}
                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
              />
              <span className="text-xs text-slate-400">đến</span>
              <input
                type="number"
                value={data.yMax}
                onChange={(e) => onChangeData({ ...data, yMax: Number(e.target.value) })}
                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
