import React from 'react';
import {
  Box,
  Pyramid,
  Sparkles,
  Sliders,
  Eye,
  Type,
  Maximize2,
  Compass,
} from 'lucide-react';
import { BaseChartSettings, SpatialGeometryData, SpatialShapeType } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';

interface SpatialGeometryEditorProps {
  data: SpatialGeometryData;
  settings: BaseChartSettings;
  onChangeData: (data: SpatialGeometryData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const SpatialGeometryEditor: React.FC<SpatialGeometryEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const shapeType = data.shapeType || 'box';
  const customNames = data.vertexNames || [];

  // Mẫu nhanh chuẩn SGK Toán 7 & 8
  const handleApplyPreset = (type: SpatialShapeType) => {
    let names: string[] = [];
    let showAltitude = false;
    let showBaseDiagonals = false;
    let showBaseCenter = false;
    let showSolidDiagonals = false;

    if (type === 'box') {
      names = ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"];
    } else if (type === 'cube') {
      names = ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"];
    } else if (type === 'triangular-prism') {
      names = ['A', 'B', 'C', "A'", "B'", "C'"];
    } else if (type === 'quad-pyramid') {
      names = ['S', 'A', 'B', 'C', 'D', 'O'];
      showAltitude = true;
      showBaseDiagonals = true;
      showBaseCenter = true;
    } else if (type === 'triangular-pyramid') {
      names = ['S', 'A', 'B', 'C', 'H'];
      showAltitude = true;
    } else if (type === 'pyramid-altitude') {
      names = ['S', 'A', 'B', 'C', 'D'];
      showAltitude = true;
    } else if (type === 'cylinder') {
      names = ["O'", 'O'];
      showAltitude = true;
    } else if (type === 'cone') {
      names = ['S', 'O', 'A'];
      showAltitude = true;
    }

    onChangeData({
      ...data,
      shapeType: type,
      vertexNames: names,
      showAltitude,
      showBaseDiagonals,
      showBaseCenter,
      showSolidDiagonals,
      showRightAngleMarkers: true,
      dimensions: {
        showDimensions: false,
        length: 'a',
        width: 'b',
        height: 'h',
      },
    });
  };

  const handleUpdateVertexName = (index: number, newName: string) => {
    const updated = [...customNames];
    updated[index] = newName;
    onChangeData({ ...data, vertexNames: updated });
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor settings={settings} onChangeSettings={onChangeSettings} />

      {/* 2. Chọn nhanh mẫu khối SGK Toán 7 & 8 */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Khối hình học không gian chuẩn SGK</span>
          </span>
        </div>

        {/* Nhóm Toán 7: Hình lăng trụ & Hình hộp */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
            📘 TOÁN 7 (Hình hộp & Lăng trụ đứng)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleApplyPreset('box')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'box'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Hộp chữ nhật ABCD.A&apos;B&apos;C&apos;D&apos;</span>
            </button>

            <button
              onClick={() => handleApplyPreset('cube')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'cube'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Hình lập phương</span>
            </button>

            <button
              onClick={() => handleApplyPreset('triangular-prism')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 col-span-2 ${
                shapeType === 'triangular-prism'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <Pyramid className="w-3.5 h-3.5" />
              <span>Lăng trụ đứng tam giác ABC.A&apos;B&apos;C&apos;</span>
            </button>
          </div>
        </div>

        {/* Nhóm Toán 8: Hình chóp */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
          <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
            📙 TOÁN 8 (Hình chóp tam giác & tứ giác đều)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleApplyPreset('quad-pyramid')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'quad-pyramid'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
              }`}
            >
              <Pyramid className="w-3.5 h-3.5" />
              <span>Chóp tứ giác đều S.ABCD</span>
            </button>

            <button
              onClick={() => handleApplyPreset('triangular-pyramid')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'triangular-pyramid'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
              }`}
            >
              <Pyramid className="w-3.5 h-3.5" />
              <span>Chóp tam giác đều S.ABC</span>
            </button>

            <button
              onClick={() => handleApplyPreset('pyramid-altitude')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 col-span-2 ${
                shapeType === 'pyramid-altitude'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Chóp có cạnh bên vuông góc đáy (SA ⊥ đáy)</span>
            </button>
          </div>
        </div>

        {/* Nhóm Toán 9: Hình trụ & Hình nón */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
          <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
            📗 TOÁN 9 (Hình trụ & Hình nón)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleApplyPreset('cylinder')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'cylinder'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Hình trụ (O, O&apos;)</span>
            </button>

            <button
              onClick={() => handleApplyPreset('cone')}
              className={`px-2 py-1.5 text-xs font-semibold rounded border transition text-left flex items-center gap-1.5 ${
                shapeType === 'cone'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
              }`}
            >
              <Pyramid className="w-3.5 h-3.5" />
              <span>Hình nón (S, O)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Kích thước & Góc phối cảnh trục đo (Axonometric) */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-600" />
          <span>Kích thước & Phối cảnh trục đo</span>
        </h4>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Chiều dài (L)
            </label>
            <input
              type="number"
              min={80}
              max={350}
              value={data.length || 180}
              onChange={(e) => onChangeData({ ...data, length: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Chiều rộng (W)
            </label>
            <input
              type="number"
              min={50}
              max={250}
              value={data.width || 120}
              onChange={(e) => onChangeData({ ...data, width: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Chiều cao (H)
            </label>
            <input
              type="number"
              min={60}
              max={300}
              value={data.height || 160}
              onChange={(e) => onChangeData({ ...data, height: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Góc nghiêng phối cảnh ({data.slantAngle !== undefined ? data.slantAngle : 35}°)
            </label>
            <input
              type="range"
              min={15}
              max={60}
              value={data.slantAngle !== undefined ? data.slantAngle : 35}
              onChange={(e) => onChangeData({ ...data, slantAngle: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Tỉ lệ co trục sâu (SGK: 0.5)
            </label>
            <select
              value={data.slantRatio !== undefined ? data.slantRatio : 0.5}
              onChange={(e) => onChangeData({ ...data, slantRatio: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value={0.5}>1/2 (Chuẩn SGK Việt Nam)</option>
              <option value={0.4}>2/5 (Co hẹp đáy sâu)</option>
              <option value={0.6}>3/5 (Mở rộng đáy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Các yếu tố đặc biệt: Đường cao, Đường chéo, Góc vuông, Đổ bóng */}
      <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span>Đường phụ & Ký hiệu không gian</span>
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {shapeType.includes('pyramid') && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showAltitude !== false}
                  onChange={(e) => onChangeData({ ...data, showAltitude: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Đường cao (SO / SH / SA)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showBaseCenter !== false}
                  onChange={(e) => onChangeData({ ...data, showBaseCenter: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Tâm đáy (O / H)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showBaseDiagonals !== false}
                  onChange={(e) => onChangeData({ ...data, showBaseDiagonals: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Đường chéo đáy (AC, BD)</span>
              </label>
            </>
          )}

          {(shapeType === 'box' || shapeType === 'cube') && (
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showSolidDiagonals || false}
                onChange={(e) => onChangeData({ ...data, showSolidDiagonals: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Đường chéo khối (AC&apos;)</span>
            </label>
          )}

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showRightAngleMarkers !== false}
              onChange={(e) => onChangeData({ ...data, showRightAngleMarkers: e.target.checked })}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span>Ký hiệu góc vuông chân đ.cao</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showFaceShading || false}
              onChange={(e) => onChangeData({ ...data, showFaceShading: e.target.checked })}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span>Đổ bóng 3D mặt trước</span>
          </label>
        </div>

        {/* Bật tắt kích thước đo đạc */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.dimensions?.showDimensions || false}
              onChange={(e) =>
                onChangeData({
                  ...data,
                  dimensions: {
                    ...data.dimensions,
                    showDimensions: e.target.checked,
                  },
                })
              }
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span>Hiển thị mũi tên kích thước (a, b, h hoặc cm)</span>
          </label>

          {data.dimensions?.showDimensions && (
            <div className="grid grid-cols-3 gap-2 pt-1 bg-white p-2 rounded border border-slate-200">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Dài (a)</label>
                <input
                  type="text"
                  value={data.dimensions.length || 'a'}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      dimensions: { ...data.dimensions, length: e.target.value },
                    })
                  }
                  className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Rộng (b)</label>
                <input
                  type="text"
                  value={data.dimensions.width || 'b'}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      dimensions: { ...data.dimensions, width: e.target.value },
                    })
                  }
                  className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Cao (h)</label>
                <input
                  type="text"
                  value={data.dimensions.height || 'h'}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      dimensions: { ...data.dimensions, height: e.target.value },
                    })
                  }
                  className="w-full text-xs px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tên các đỉnh */}
      <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-slate-600" />
          <span>Tên các đỉnh</span>
        </h4>

        <div className="grid grid-cols-4 gap-1.5">
          {customNames.map((name, idx) => (
            <div key={'vertex_input_' + idx}>
              <input
                type="text"
                value={name}
                onChange={(e) => handleUpdateVertexName(idx, e.target.value)}
                className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
