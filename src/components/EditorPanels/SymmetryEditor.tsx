import React, { useState } from 'react';
import {
  SymmetryData,
  SymmetryType,
  SymmetryTargetShape,
  Point2D,
  StrokeDashType,
} from '../../types';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';
import {
  Repeat,
  Check,
  ChevronDown,
  ChevronRight,
  Palette,
  Circle,
  Eye,
  Sliders,
  Triangle,
  Square,
  Minus,
  Sparkles,
} from 'lucide-react';
import { getSymmetryPresetPoints } from '../../utils/geometryMath';

interface SymmetryEditorProps {
  symmetry: SymmetryData;
  onChangeSymmetry: (newSymmetry: SymmetryData) => void;
}

const COLOR_SWATCHES = [
  { label: 'Xanh lam (Gốc)', value: '#2563eb' },
  { label: 'Đỏ (Đối xứng)', value: '#dc2626' },
  { label: 'Đen SGK', value: '#000000' },
  { label: 'Xanh lục', value: '#16a34a' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Xám', value: '#475569' },
];

export const SymmetryEditor: React.FC<SymmetryEditorProps> = ({
  symmetry,
  onChangeSymmetry,
}) => {
  const currentType = symmetry.type || 'axial';
  const targetShape = symmetry.targetShape || 'triangle';

  const [openSection, setOpenSection] = useState<
    'type' | 'shape' | 'axis' | 'markers' | 'styles' | 'labels' | null
  >('type');

  const toggleSection = (
    sec: 'type' | 'shape' | 'axis' | 'markers' | 'styles' | 'labels'
  ) => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const handleSelectSymType = (type: SymmetryType) => {
    const presets = getSymmetryPresetPoints(type, targetShape);
    onChangeSymmetry({
      ...symmetry,
      type,
      ...presets,
    });
  };

  const handleSelectTargetShape = (shape: SymmetryTargetShape) => {
    const presets = getSymmetryPresetPoints(currentType, shape);
    onChangeSymmetry({
      ...symmetry,
      targetShape: shape,
      ...presets,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. CHỌN LOẠI PHÉP ĐỐI XỨNG */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue-600" />
            <span>1. Chọn loại phép đối xứng (Trục / Tâm)</span>
          </div>
          {openSection === 'type' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'type' && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSelectSymType('axial')}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  currentType === 'axial'
                    ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">ĐỐI XỨNG TRỤC</span>
                  {currentType === 'axial' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Qua đường thẳng d (Toán 8 SGK mới)
                </p>
              </button>

              <button
                onClick={() => handleSelectSymType('central')}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  currentType === 'central'
                    ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">ĐỐI XỨNG TÂM</span>
                  {currentType === 'central' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Qua điểm I / O (Toán 6, 8 SGK mới)
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHỌN HÌNH GỐC CẦN LẤY ĐỐI XỨNG */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('shape')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Triangle className="w-4 h-4 text-emerald-600" />
            <span>2. Chọn đối tượng lấy đối xứng (Điểm, Đoạn, Tam giác, Tứ giác, Tròn)</span>
          </div>
          {openSection === 'shape' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'shape' && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'point', label: 'Điểm (A)', icon: <Circle className="w-3.5 h-3.5" /> },
                { id: 'segment', label: 'Đoạn thẳng (AB)', icon: <Minus className="w-3.5 h-3.5" /> },
                { id: 'triangle', label: 'Tam giác (ABC)', icon: <Triangle className="w-3.5 h-3.5" /> },
                { id: 'quadrilateral', label: 'Tứ giác (ABCD)', icon: <Square className="w-3.5 h-3.5" /> },
                { id: 'circle', label: 'Đường tròn (O)', icon: <Circle className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTargetShape(item.id as SymmetryTargetShape)}
                  className={`p-2 rounded-lg border text-left text-xs transition flex items-center justify-between ${
                    targetShape === item.id
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {targetShape === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. THIẾT LẬP TRỤC / TÂM ĐỐI XỨNG */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('axis')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>3. Thiết lập Trục đối xứng d / Tâm đối xứng I</span>
          </div>
          {openSection === 'axis' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'axis' && (
          <div className="p-3 space-y-3 text-xs">
            {currentType === 'axial' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">Tên trục đối xứng:</span>
                  <input
                    type="text"
                    value={symmetry.axisLabel || 'd'}
                    onChange={(e) =>
                      onChangeSymmetry({
                        ...symmetry,
                        axisLabel: e.target.value,
                      })
                    }
                    className="w-14 p-1 border rounded text-center font-bold"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">Kiểu nét trục:</span>
                  <select
                    value={symmetry.axisStyle?.strokeStyle || 'dashed'}
                    onChange={(e) =>
                      onChangeSymmetry({
                        ...symmetry,
                        axisStyle: {
                          ...symmetry.axisStyle,
                          strokeStyle: e.target.value as StrokeDashType,
                        },
                      })
                    }
                    className="p-1 border rounded bg-white text-xs"
                  >
                    <option value="dashed">Nét đứt (SGK chuẩn)</option>
                    <option value="solid">Nét liền</option>
                    <option value="dotted">Nét chấm</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Bạn có thể dùng chuột kéo 2 đầu trục d trên màn hình để xoay nghiêng hoặc dời trục tùy ý!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">Tên tâm đối xứng:</span>
                  <input
                    type="text"
                    value={symmetry.centerName || 'I'}
                    onChange={(e) =>
                      onChangeSymmetry({
                        ...symmetry,
                        centerName: e.target.value,
                      })
                    }
                    className="w-14 p-1 border rounded text-center font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Bạn có thể dùng chuột kéo điểm tâm I trên màn hình để kiểm tra hình đối xứng thay đổi tương ứng!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. KÝ HIỆU HÌNH HỌC VÀ ĐƯỜNG DÓNG NỐI */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('markers')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>4. Đường dóng nét đứt & Ký hiệu vuông góc, bằng nhau</span>
          </div>
          {openSection === 'markers' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'markers' && (
          <div className="p-3 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={symmetry.showConnectingDashedLines !== false}
                onChange={(e) =>
                  onChangeSymmetry({
                    ...symmetry,
                    showConnectingDashedLines: e.target.checked,
                  })
                }
                className="rounded text-blue-600"
              />
              <span>Hiển thị đường dóng nét đứt nối các cặp điểm tương ứng (AA', BB'...)</span>
            </label>

            {currentType === 'axial' && (
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={symmetry.showRightAngleMarkers !== false}
                  onChange={(e) =>
                    onChangeSymmetry({
                      ...symmetry,
                      showRightAngleMarkers: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600"
                />
                <span>Ký hiệu vuông góc tại giao điểm với trục d</span>
              </label>
            )}

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={symmetry.showEqualDistanceMarkers !== false}
                onChange={(e) =>
                  onChangeSymmetry({
                    ...symmetry,
                    showEqualDistanceMarkers: e.target.checked,
                  })
                }
                className="rounded text-blue-600"
              />
              <span>Ký hiệu khoảng cách bằng nhau (gạch chia đoạn)</span>
            </label>
          </div>
        )}
      </div>

      {/* 5. TÊN CÁC ĐỈNH VÀ ĐIỂM ĐỐI XỨNG */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('labels')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-600" />
            <span>5. Tên các đỉnh và nhãn hình</span>
          </div>
          {openSection === 'labels' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'labels' && (
          <div className="p-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-blue-900 block mb-1">Hình gốc (A, B, C...):</span>
                <div className="space-y-1.5">
                  {(symmetry.originalNames || ['A', 'B', 'C', 'D']).map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-12 font-mono">Điểm {idx + 1}:</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(symmetry.originalNames || ['A', 'B', 'C', 'D'])];
                          newNames[idx] = e.target.value;
                          onChangeSymmetry({
                            ...symmetry,
                            originalNames: newNames,
                          });
                        }}
                        className="w-12 p-1 border rounded text-center font-bold text-blue-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-red-900 block mb-1">Hình đối xứng (A', B', C'...):</span>
                <div className="space-y-1.5">
                  {(symmetry.reflectedNames || ["A'", "B'", "C'", "D'"]).map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-12 font-mono">Điểm {idx + 1}:</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(symmetry.reflectedNames || ["A'", "B'", "C'", "D'"])];
                          newNames[idx] = e.target.value;
                          onChangeSymmetry({
                            ...symmetry,
                            reflectedNames: newNames,
                          });
                        }}
                        className="w-12 p-1 border rounded text-center font-bold text-red-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. ĐƯỜNG PHỤ TỰ DO */}
      <AuxiliaryElementsEditor
        data={symmetry}
        onChangeData={(updated) => onChangeSymmetry(updated as SymmetryData)}
        defaultPointNames={[
          symmetry.centerName || 'I',
          symmetry.axisLabel || 'd',
          ...(symmetry.originalNames || []),
          ...(symmetry.reflectedNames || []),
        ]}
      />
    </div>
  );
};
