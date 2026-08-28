import React from 'react';
import { BaseChartSettings } from '../../types';
import { FONT_OPTIONS } from '../../constants/style';

interface CommonStyleEditorProps {
  settings: BaseChartSettings;
  onChangeSettings: (settings: BaseChartSettings) => void;
  // Optional toggles
  showLegendToggle?: boolean;
  showGridToggle?: boolean;
  onToggleGrid?: (show: boolean) => void;
  gridChecked?: boolean;
}

export const CommonStyleEditor: React.FC<CommonStyleEditorProps> = ({
  settings,
  onChangeSettings,
  showLegendToggle = false,
  showGridToggle = false,
  onToggleGrid,
  gridChecked,
}) => {
  return (
    <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Tiêu đề & Kiểu chữ SGK
        </h4>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={settings.showTitle !== false}
            onChange={(e) => onChangeSettings({ ...settings, showTitle: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span>Hiện tiêu đề</span>
        </label>
      </div>

      {settings.showTitle !== false && (
        <div>
          <input
            type="text"
            value={settings.title || ''}
            onChange={(e) => onChangeSettings({ ...settings, title: e.target.value })}
            placeholder="Nhập tiêu đề biểu đồ / hình vẽ..."
            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium text-slate-600 mb-1">
          Phông chữ (Toán THCS)
        </label>
        <select
          value={settings.fontFamily || FONT_OPTIONS[0].value}
          onChange={(e) => onChangeSettings({ ...settings, fontFamily: e.target.value })}
          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded font-medium focus:outline-none"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggles tùy chọn */}
      {(showLegendToggle || showGridToggle) && (
        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700 flex-wrap">
          {showLegendToggle && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLegend !== false}
                onChange={(e) => onChangeSettings({ ...settings, showLegend: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>Hiện chú giải</span>
            </label>
          )}

          {showGridToggle && onToggleGrid && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={gridChecked ?? (settings.showGrid !== false)}
                onChange={(e) => onToggleGrid(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Hiện đường lưới</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
};
