import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BaseChartSettings, PictogramData, PictogramIconType, PictogramRow } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';

interface PictogramEditorProps {
  data: PictogramData;
  settings: BaseChartSettings;
  onChangeData: (data: PictogramData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

const AVAILABLE_ICONS: { type: PictogramIconType; label: string; emoji: string }[] = [
  { type: 'star', label: 'Ngôi sao', emoji: '⭐' },
  { type: 'student', label: 'Học sinh', emoji: '🧑‍🎓' },
  { type: 'book', label: 'Quyển sách', emoji: '📖' },
  { type: 'apple', label: 'Quả táo / Hoa quả', emoji: '🍎' },
  { type: 'bus', label: 'Xe buýt / Phương tiện', emoji: '🚌' },
  { type: 'tree', label: 'Cây xanh', emoji: '🌳' },
  { type: 'ball', label: 'Quả bóng', emoji: '⚽' },
  { type: 'pencil', label: 'Cây bút', emoji: '✏️' },
  { type: 'flag', label: 'Lá cờ', emoji: '🚩' },
  { type: 'circle', label: 'Hình tròn', emoji: '🔵' },
];

export const PictogramEditor: React.FC<PictogramEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const rows = data.rows || [];

  const handleAddRow = () => {
    const newId = 'pr_' + Date.now();
    const nextIdx = rows.length + 1;
    const newRow: PictogramRow = {
      id: newId,
      category: `Tổ ${nextIdx}`,
      count: 30,
    };
    onChangeData({ ...data, rows: [...rows, newRow] });
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    onChangeData({ ...data, rows: rows.filter((r) => r.id !== id) });
  };

  const handleUpdateRow = (id: string, partial: Partial<PictogramRow>) => {
    onChangeData({
      ...data,
      rows: rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor
        settings={settings}
        onChangeSettings={onChangeSettings}
      />

      {/* 2. Cấu hình biểu tượng & quy đổi */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Biểu tượng & Quy đổi
        </h4>

        {/* Chọn biểu tượng */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
            Chọn loại biểu tượng
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {AVAILABLE_ICONS.map((ic) => (
              <button
                key={ic.type}
                onClick={() => onChangeData({ ...data, iconType: ic.type })}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition ${
                  data.iconType === ic.type
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
                title={ic.label}
              >
                <span className="text-base">{ic.emoji}</span>
                <span className="text-[10px] text-slate-600 font-medium truncate w-full mt-0.5">
                  {ic.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              1 biểu tượng tương ứng với
            </label>
            <input
              type="number"
              min={1}
              value={data.valuePerIcon}
              onChange={(e) =>
                onChangeData({ ...data, valuePerIcon: Math.max(1, Number(e.target.value)) })
              }
              className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none text-amber-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Đơn vị tính
            </label>
            <input
              type="text"
              value={data.unit || ''}
              onChange={(e) => onChangeData({ ...data, unit: e.target.value })}
              placeholder="VD: học sinh, cây xanh, chiếc"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.allowHalfIcon !== false}
              onChange={(e) => onChangeData({ ...data, allowHalfIcon: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Cho phép hiển thị nửa biểu tượng (khi lẻ)</span>
          </label>
        </div>
      </div>

      {/* Danh sách các dòng dữ liệu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Danh mục & Số lượng ({rows.length} mục)
          </h4>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng</span>
          </button>
        </div>

        {rows.map((r, index) => (
          <div
            key={r.id}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center gap-2.5"
          >
            <span className="text-xs font-bold text-slate-400 w-5">{index + 1}.</span>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={r.category}
                onChange={(e) => handleUpdateRow(r.id, { category: e.target.value })}
                placeholder={`Tên danh mục ${index + 1}`}
                className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:outline-none"
              />

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={r.count}
                  onChange={(e) => handleUpdateRow(r.id, { count: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none text-amber-700"
                />
                <span className="text-xs text-slate-500 shrink-0">{data.unit}</span>
              </div>
            </div>

            {rows.length > 1 && (
              <button
                onClick={() => handleDeleteRow(r.id)}
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
