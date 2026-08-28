import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BaseChartSettings, CoordinatePlaneData, OxyPoint, OxyLineSegment } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';

interface CoordinatePlaneEditorProps {
  data: CoordinatePlaneData;
  settings: BaseChartSettings;
  onChangeData: (data: CoordinatePlaneData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const CoordinatePlaneEditor: React.FC<CoordinatePlaneEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const points = data.points || [];
  const segments = data.segments || [];

  const handleAddPoint = () => {
    const newId = 'pt_' + Date.now();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextChar = alphabet[points.length % alphabet.length] || `P${points.length + 1}`;
    const newPt: OxyPoint = {
      id: newId,
      name: nextChar,
      x: Math.floor(Math.random() * 6) - 3,
      y: Math.floor(Math.random() * 6) - 3,
      color: '#dc2626',
      showCoordinates: true,
      showProjections: true,
    };
    onChangeData({ ...data, points: [...points, newPt] });
  };

  const handleDeletePoint = (id: string) => {
    onChangeData({
      ...data,
      points: points.filter((p) => p.id !== id),
      segments: segments.filter((s) => s.fromPointId !== id && s.toPointId !== id),
    });
  };

  const handleUpdatePoint = (id: string, partial: Partial<OxyPoint>) => {
    onChangeData({
      ...data,
      points: points.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    });
  };

  const handleAddSegment = () => {
    if (points.length < 2) return;
    const newSeg: OxyLineSegment = {
      id: 'seg_' + Date.now(),
      fromPointId: points[0].id,
      toPointId: points[1].id,
      style: 'solid',
      color: '#000000',
      width: 1.5,
    };
    onChangeData({ ...data, segments: [...segments, newSeg] });
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

      {/* 2. Cài đặt miền tọa độ */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Miền giá trị hệ trục Oxy
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Trục x (xMin đến xMax)
            </label>
            <div className="flex items-center gap-1.5">
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
              Trục y (yMin đến yMax)
            </label>
            <div className="flex items-center gap-1.5">
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

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showAxisNumbers !== false}
              onChange={(e) => onChangeData({ ...data, showAxisNumbers: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Hiện số mốc trên trục (1, 2, 3...)</span>
          </label>
        </div>
      </div>

      {/* Danh sách các điểm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các điểm tọa độ ({points.length})
          </h4>

          <button
            onClick={handleAddPoint}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm điểm</span>
          </button>
        </div>

        {points.map((p) => (
          <div
            key={p.id}
            className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleUpdatePoint(p.id, { name: e.target.value })}
                placeholder="Tên điểm (A, B...)"
                className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none"
              />

              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-500">x:</span>
                <input
                  type="number"
                  value={p.x}
                  onChange={(e) => handleUpdatePoint(p.id, { x: Number(e.target.value) })}
                  className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                />

                <span className="text-xs text-slate-500 ml-1">y:</span>
                <input
                  type="number"
                  value={p.y}
                  onChange={(e) => handleUpdatePoint(p.id, { y: Number(e.target.value) })}
                  className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                />
              </div>

              <button
                onClick={() => handleDeletePoint(p.id)}
                className="p-1 text-slate-400 hover:text-red-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.showProjections}
                  onChange={(e) => handleUpdatePoint(p.id, { showProjections: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Dóng nét đứt tới Ox, Oy</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.showCoordinates}
                  onChange={(e) => handleUpdatePoint(p.id, { showCoordinates: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Hiện tọa độ (x; y)</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Đoạn thẳng nối các điểm */}
      {points.length >= 2 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Đoạn thẳng nối điểm ({segments.length})
            </h4>

            <button
              onClick={handleAddSegment}
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-slate-800 text-white rounded hover:bg-slate-700"
            >
              <Plus className="w-3 h-3" />
              <span>Nối điểm</span>
            </button>
          </div>

          {segments.map((seg) => (
            <div
              key={seg.id}
              className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <select
                  value={seg.fromPointId}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      segments: segments.map((s) =>
                        s.id === seg.id ? { ...s, fromPointId: e.target.value } : s
                      ),
                    })
                  }
                  className="px-1.5 py-1 bg-white border border-slate-300 rounded font-semibold"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <span>nối với</span>

                <select
                  value={seg.toPointId}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      segments: segments.map((s) =>
                        s.id === seg.id ? { ...s, toPointId: e.target.value } : s
                      ),
                    })
                  }
                  className="px-1.5 py-1 bg-white border border-slate-300 rounded font-semibold"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  onChangeData({
                    ...data,
                    segments: segments.filter((s) => s.id !== seg.id),
                  })
                }
                className="p-1 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
