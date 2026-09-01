import React, { useState } from 'react';
import { PolygonData, PolygonType, Point2D, StrokeDashType } from '../../types';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';
import {
  Hexagon,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Palette,
  Circle,
  Eye,
  Settings2,
  Maximize2,
  Layers,
} from 'lucide-react';
import {
  getRegularPolygonPresetPoints,
  getPolygonPresetSides,
  getDefaultPolygonVertexNames,
} from '../../utils/geometryMath';

interface RegularPolygonEditorProps {
  polygon: PolygonData;
  onChangePolygon: (newPolygon: PolygonData) => void;
}

const COLOR_SWATCHES = [
  { label: 'Đen SGK', value: '#000000' },
  { label: 'Xanh lam', value: '#2563eb' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Xanh lục', value: '#16a34a' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Xám', value: '#475569' },
];

const FILL_COLOR_SWATCHES = [
  { label: 'Xanh dương nhạt', value: '#3b82f6' },
  { label: 'Xanh ngọc', value: '#06b6d4' },
  { label: 'Xanh lá', value: '#10b981' },
  { label: 'Vàng cam', value: '#f59e0b' },
  { label: 'Đỏ nhạt', value: '#ef4444' },
  { label: 'Tím nhạt', value: '#8b5cf6' },
];

export const RegularPolygonEditor: React.FC<RegularPolygonEditorProps> = ({
  polygon,
  onChangePolygon,
}) => {
  const currentType = polygon.type || 'pentagon';
  const sidesCount = polygon.sidesCount || getPolygonPresetSides(currentType);
  const vertexNames = polygon.vertexNames || getDefaultPolygonVertexNames(sidesCount);
  const centerName = polygon.centerName || 'O';

  const [openSection, setOpenSection] = useState<
    'presets' | 'fill' | 'circles' | 'apothem' | 'diagonals' | 'symbols' | 'vertices' | null
  >('presets');

  const toggleSection = (
    sec: 'presets' | 'fill' | 'circles' | 'apothem' | 'diagonals' | 'symbols' | 'vertices'
  ) => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const handleSelectType = (type: PolygonType, customN?: number) => {
    const n = customN || getPolygonPresetSides(type);
    const center = polygon.center || { x: 300, y: 220 };
    const radius = polygon.radius || 120;
    const rot = polygon.rotationAngle ?? -90;
    const newPts = getRegularPolygonPresetPoints(type, center, radius, rot, n);
    const defaultNames = getDefaultPolygonVertexNames(n);

    onChangePolygon({
      ...polygon,
      type,
      sidesCount: n,
      center,
      radius,
      rotationAngle: rot,
      points: newPts,
      vertexNames: defaultNames,
    });
  };

  const updateRadius = (newRadius: number) => {
    const center = polygon.center || { x: 300, y: 220 };
    const rot = polygon.rotationAngle ?? -90;
    const newPts = getRegularPolygonPresetPoints(currentType, center, newRadius, rot, sidesCount);
    onChangePolygon({
      ...polygon,
      radius: newRadius,
      points: newPts,
    });
  };

  const updateRotation = (newRot: number) => {
    const center = polygon.center || { x: 300, y: 220 };
    const radius = polygon.radius || 120;
    const newPts = getRegularPolygonPresetPoints(currentType, center, radius, newRot, sidesCount);
    onChangePolygon({
      ...polygon,
      rotationAngle: newRot,
      points: newPts,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. CHỌN LOẠI ĐA GIÁC ĐỀU */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Hexagon className="w-4 h-4 text-blue-600" />
            <span>1. Chọn loại đa giác đều (Tam giác, Hình vuông, Ngũ giác, Lục giác, Bát giác...)</span>
          </div>
          {openSection === 'presets' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'presets' && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'equilateral-triangle', label: 'Tam giác đều (n = 3)', sides: 3 },
                { id: 'square', label: 'Hình vuông (n = 4)', sides: 4 },
                { id: 'pentagon', label: 'Ngũ giác đều (n = 5)', sides: 5 },
                { id: 'hexagon', label: 'Lục giác đều (n = 6)', sides: 6 },
                { id: 'octagon', label: 'Bát giác đều (n = 8)', sides: 8 },
                { id: 'decagon', label: 'Thập giác đều (n = 10)', sides: 10 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectType(item.id as PolygonType, item.sides)}
                  className={`p-2 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                    currentType === item.id
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    {currentType === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Tùy chỉnh số cạnh tự do (n = 3 -> 20) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <label className="font-medium text-slate-700">Số cạnh n tuỳ chỉnh ({sidesCount} cạnh):</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={sidesCount}
                  onChange={(e) => handleSelectType('custom', parseInt(e.target.value))}
                  className="w-28 accent-blue-600"
                />
                <span className="w-6 text-center font-mono font-bold text-blue-700">{sidesCount}</span>
              </div>
            </div>

            {/* Bán kính R & Góc xoay */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Bán kính ngoại tiếp R: {Math.round(polygon.radius || 120)}px
                </label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={polygon.radius || 120}
                  onChange={(e) => updateRadius(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Góc xoay hình: {Math.round(polygon.rotationAngle ?? -90)}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={polygon.rotationAngle ?? -90}
                  onChange={(e) => updateRotation(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. ĐƯỜNG TRÒN NGOẠI TIẾP & NỘI TIẾP */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('circles')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-emerald-600" />
            <span>2. Đường tròn ngoại tiếp & nội tiếp</span>
          </div>
          {openSection === 'circles' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'circles' && (
          <div className="p-3 space-y-3 text-xs">
            {/* Đường tròn ngoại tiếp */}
            <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showCircumcircle || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showCircumcircle: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Đường tròn ngoại tiếp (tâm O, bán kính R)</span>
              </label>

              {polygon.showCircumcircle && (
                <div className="flex items-center gap-3 pt-1 text-slate-600">
                  <span>Kiểu nét:</span>
                  <select
                    value={polygon.circumcircleStyle || 'dashed'}
                    onChange={(e) =>
                      onChangePolygon({
                        ...polygon,
                        circumcircleStyle: e.target.value as StrokeDashType,
                      })
                    }
                    className="p-1 border rounded bg-white text-xs"
                  >
                    <option value="solid">Nét liền</option>
                    <option value="dashed">Nét đứt</option>
                    <option value="dotted">Nét chấm</option>
                  </select>
                </div>
              )}
            </div>

            {/* Đường tròn nội tiếp */}
            <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showIncircle || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showIncircle: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>Đường tròn nội tiếp (tâm O, bán kính r)</span>
              </label>

              {polygon.showIncircle && (
                <div className="flex items-center gap-3 pt-1 text-slate-600">
                  <span>Kiểu nét:</span>
                  <select
                    value={polygon.incircleStyle || 'dashed'}
                    onChange={(e) =>
                      onChangePolygon({
                        ...polygon,
                        incircleStyle: e.target.value as StrokeDashType,
                      })
                    }
                    className="p-1 border rounded bg-white text-xs"
                  >
                    <option value="solid">Nét liền</option>
                    <option value="dashed">Nét đứt</option>
                    <option value="dotted">Nét chấm</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. TRUNG ĐOẠN & BÁN KÍNH */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('apothem')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-red-600" />
            <span>3. Trung đoạn (Apothem OH ⊥ AB) & Bán kính (OA, OB...)</span>
          </div>
          {openSection === 'apothem' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'apothem' && (
          <div className="p-3 space-y-3 text-xs">
            {/* Trung đoạn */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showApothem || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showApothem: e.target.checked,
                    })
                  }
                  className="rounded text-red-600 focus:ring-0"
                />
                <span>Vẽ trung đoạn OH (khoảng cách từ tâm đến cạnh)</span>
              </label>

              {polygon.showApothem && (
                <div className="flex items-center gap-3 pl-6">
                  <span className="text-slate-600">Tên chân đường vuông góc:</span>
                  <input
                    type="text"
                    value={polygon.apothemName || 'H'}
                    onChange={(e) =>
                      onChangePolygon({
                        ...polygon,
                        apothemName: e.target.value,
                      })
                    }
                    className="w-12 p-1 border rounded text-center font-bold"
                  />
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={polygon.showApothemRightAngle !== false}
                      onChange={(e) =>
                        onChangePolygon({
                          ...polygon,
                          showApothemRightAngle: e.target.checked,
                        })
                      }
                      className="rounded text-red-600"
                    />
                    <span>Ký hiệu vuông góc</span>
                  </label>
                </div>
              )}
            </div>

            {/* Bán kính nối tâm đến tất cả đỉnh */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showRadii || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showRadii: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Vẽ các bán kính nối tâm O đến các đỉnh</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. ĐƯỜNG CHÉO (DIAGONALS) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('diagonals')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>4. Đường chéo đa giác</span>
          </div>
          {openSection === 'diagonals' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'diagonals' && (
          <div className="p-3 space-y-3 text-xs">
            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={polygon.showDiagonals || false}
                onChange={(e) =>
                  onChangePolygon({
                    ...polygon,
                    showDiagonals: e.target.checked,
                  })
                }
                className="rounded text-purple-600 focus:ring-0"
              />
              <span>Hiển thị đường chéo</span>
            </label>

            {polygon.showDiagonals && (
              <div className="pl-6 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="diagType"
                      checked={polygon.diagonalsType !== 'all'}
                      onChange={() =>
                        onChangePolygon({
                          ...polygon,
                          diagonalsType: 'main',
                        })
                      }
                    />
                    <span>Chỉ đường chéo chính qua tâm / đối xứng</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="diagType"
                      checked={polygon.diagonalsType === 'all'}
                      onChange={() =>
                        onChangePolygon({
                          ...polygon,
                          diagonalsType: 'all',
                        })
                      }
                    />
                    <span>Tất cả các đường chéo</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. KÝ HIỆU BẰNG NHAU & TÔ MÀU */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('symbols')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-600" />
            <span>5. Ký hiệu cạnh/góc bằng nhau & Tô miền</span>
          </div>
          {openSection === 'symbols' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'symbols' && (
          <div className="p-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showEqualSidesMarkers || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showEqualSidesMarkers: e.target.checked,
                    })
                  }
                  className="rounded text-amber-600"
                />
                <span>Ký hiệu các cạnh bằng nhau</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showEqualAnglesMarkers || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showEqualAnglesMarkers: e.target.checked,
                    })
                  }
                  className="rounded text-amber-600"
                />
                <span>Ký hiệu các góc bằng nhau</span>
              </label>
            </div>

            {/* Tô miền bên trong */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.fill?.enabled || false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      fill: {
                        enabled: e.target.checked,
                        color: polygon.fill?.color || '#3b82f6',
                        opacity: polygon.fill?.opacity ?? 0.2,
                      },
                    })
                  }
                  className="rounded text-blue-600"
                />
                <span>Tô màu miền đa giác</span>
              </label>

              {polygon.fill?.enabled && (
                <div className="pl-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Màu tô:</span>
                    <div className="flex items-center gap-1.5">
                      {FILL_COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch.value}
                          onClick={() =>
                            onChangePolygon({
                              ...polygon,
                              fill: {
                                ...polygon.fill,
                                enabled: true,
                                color: swatch.value,
                              },
                            })
                          }
                          style={{ backgroundColor: swatch.value }}
                          className={`w-5 h-5 rounded-full border ${
                            polygon.fill?.color === swatch.value ? 'ring-2 ring-blue-600' : 'border-slate-300'
                          }`}
                          title={swatch.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Độ đậm: {Math.round((polygon.fill?.opacity ?? 0.2) * 100)}%</span>
                    <input
                      type="range"
                      min={0.05}
                      max={0.9}
                      step={0.05}
                      value={polygon.fill?.opacity ?? 0.2}
                      onChange={(e) =>
                        onChangePolygon({
                          ...polygon,
                          fill: {
                            ...polygon.fill,
                            enabled: true,
                            opacity: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-32 accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. TÊN ĐỈNH VÀ TÂM */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('vertices')}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-600" />
            <span>6. Tên đỉnh & Tâm O</span>
          </div>
          {openSection === 'vertices' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {openSection === 'vertices' && (
          <div className="p-3 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Tên tâm:</span>
              <input
                type="text"
                value={centerName}
                onChange={(e) =>
                  onChangePolygon({
                    ...polygon,
                    centerName: e.target.value,
                  })
                }
                className="w-12 p-1 border rounded text-center font-bold"
              />
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={polygon.showCenter !== false}
                  onChange={(e) =>
                    onChangePolygon({
                      ...polygon,
                      showCenter: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600"
                />
                <span>Hiện tâm O</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700 block mb-2">Tên các đỉnh:</span>
              <div className="flex flex-wrap gap-2">
                {vertexNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-slate-500 font-mono">Đỉnh {idx + 1}:</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...vertexNames];
                        newNames[idx] = e.target.value;
                        onChangePolygon({
                          ...polygon,
                          vertexNames: newNames,
                        });
                      }}
                      className="w-12 p-1 border rounded text-center font-bold text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. ĐƯỜNG PHỤ TỰ DO */}
      <AuxiliaryElementsEditor
        data={polygon}
        onChangeData={(updated) => onChangePolygon(updated as PolygonData)}
        defaultPointNames={[centerName, ...vertexNames]}
      />
    </div>
  );
};
