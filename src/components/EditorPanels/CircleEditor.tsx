import React from 'react';
import {
  CircleData,
  CirclePresetType,
  GeometrySegmentStyle,
  GeometryFillStyle,
  StrokeDashType,
} from '../../types';
import {
  Circle,
  Disc,
  Spline,
  GitCommit,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Palette,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getCirclePresetPoints } from '../../utils/geometryMath';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';

interface CircleEditorProps {
  circle: CircleData;
  onChangeCircle: (circle: CircleData) => void;
}

const PRESET_OPTIONS: { type: CirclePresetType; label: string; icon: string; desc: string }[] = [
  {
    type: 'basic',
    label: 'Tâm & Bán kính',
    icon: '⭕',
    desc: 'Đường tròn (O, R) với đoạn bán kính OA',
  },
  {
    type: 'diameter-chord',
    label: 'Đường kính & Dây cung',
    icon: '📏',
    desc: 'Đường kính AB, dây cung CD và khoảng cách OH ⊥ CD',
  },
  {
    type: 'arc',
    label: 'Cung tròn (Arc)',
    icon: '⌒',
    desc: 'Cung nhỏ / cung lớn AB kèm tên cung',
  },
  {
    type: 'tangent-point',
    label: 'Tiếp tuyến tại điểm',
    icon: '📐',
    desc: 'Tiếp tuyến Ax vuông góc bán kính OA tại A',
  },
  {
    type: 'two-tangents',
    label: 'Hai tiếp tuyến cắt nhau',
    icon: '✂️',
    desc: 'Từ P kẻ PA, PB tiếp xúc (O), nối OP',
  },
  {
    type: 'secant',
    label: 'Cát tuyến',
    icon: '↗️',
    desc: 'Đường thẳng PCD cắt đường tròn tại C, D',
  },
  {
    type: 'inscribed-angle',
    label: 'Góc nội tiếp / Góc ở tâm',
    icon: '∠',
    desc: 'Góc ∠APB nội tiếp và góc ∠AOB ở tâm',
  },
  {
    type: 'two-circles',
    label: 'Hai đường tròn',
    icon: '♾️',
    desc: 'Hai đường tròn (O1, R1) và (O2, R2) cắt nhau',
  },
];

const COLOR_PALETTE = [
  '#000000',
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#475569', // slate
];

const FILL_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#e2e8f0', // slate light
];

export const CircleEditor: React.FC<CircleEditorProps> = ({ circle, onChangeCircle }) => {
  const currentPreset = circle.presetType || 'basic';
  const cRadius = circle.radius || 110;

  // Đổi Preset
  const handleSelectPreset = (newPreset: CirclePresetType) => {
    const newPoints = getCirclePresetPoints(newPreset);
    onChangeCircle({
      ...circle,
      presetType: newPreset,
      points: newPoints,
      showRadius: newPreset === 'basic' || newPreset === 'tangent-point' || newPreset === 'inscribed-angle',
      showDiameter: newPreset === 'diameter-chord',
      showChord: newPreset === 'diameter-chord',
      showArc: newPreset === 'arc',
      showTangent: newPreset === 'tangent-point' || newPreset === 'two-tangents',
      tangentType: newPreset === 'two-tangents' ? 'two-tangents' : 'at-point',
      showSecant: newPreset === 'secant',
      showInscribedAngle: newPreset === 'inscribed-angle',
      showSecondCircle: newPreset === 'two-circles',
    });
  };

  return (
    <div className="space-y-4 pt-1 text-slate-800 text-xs">
      {/* 1. Bộ chọn Preset Đường tròn THCS */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          Chủ đề Đường tròn SGK
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_OPTIONS.map((opt) => {
            const isSelected = currentPreset === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectPreset(opt.type)}
                className={`p-2 text-left rounded-md border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{opt.icon}</span>
                  <span className={`font-bold text-[11px] ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Thiết lập Tâm O & Bán kính R */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            Tâm O & Bán kính R
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500">
              <input
                type="checkbox"
                checked={circle.showCenterPoint !== false}
                onChange={(e) => onChangeCircle({ ...circle, showCenterPoint: e.target.checked })}
                className="rounded text-indigo-600 w-3 h-3"
              />
              Điểm tâm
            </label>
            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500">
              <input
                type="checkbox"
                checked={circle.showCenterLabel !== false}
                onChange={(e) => onChangeCircle({ ...circle, showCenterLabel: e.target.checked })}
                className="rounded text-indigo-600 w-3 h-3"
              />
              Tên tâm
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Tên tâm</label>
            <input
              type="text"
              value={circle.centerName || 'O'}
              onChange={(e) => onChangeCircle({ ...circle, centerName: e.target.value })}
              className="w-full px-2 py-1 border border-slate-300 rounded font-bold text-center text-xs"
              placeholder="O"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Bán kính R ({cRadius}px)</label>
            <input
              type="range"
              min={50}
              max={190}
              step={2}
              value={cRadius}
              onChange={(e) => {
                const newR = Number(e.target.value);
                const pts = circle.points || getCirclePresetPoints(currentPreset);
                const center = pts[0] || { x: 280, y: 220 };
                const newPts = pts.map((p, idx) => {
                  if (idx === 0) return p;
                  const dx = p.x - center.x;
                  const dy = p.y - center.y;
                  const curDist = Math.hypot(dx, dy) || 1;
                  return {
                    x: center.x + (dx / curDist) * newR,
                    y: center.y + (dy / curDist) * newR,
                  };
                });
                onChangeCircle({
                  ...circle,
                  radius: newR,
                  points: newPts,
                });
              }}
              className="w-full accent-indigo-600 mt-1.5"
            />
          </div>
        </div>

        {/* Đoạn bán kính OA */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
              <input
                type="checkbox"
                checked={circle.showRadius !== false}
                onChange={(e) => onChangeCircle({ ...circle, showRadius: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Vẽ đoạn bán kính (OA)</span>
            </label>
          </div>

          {circle.showRadius !== false && (
            <div className="grid grid-cols-2 gap-2 pl-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Điểm mút trên đường tròn</label>
                <input
                  type="text"
                  value={circle.radiusPointName || 'A'}
                  onChange={(e) => onChangeCircle({ ...circle, radiusPointName: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Nhãn độ dài / chữ</label>
                <input
                  type="text"
                  value={circle.radiusLabel || 'R'}
                  onChange={(e) => onChangeCircle({ ...circle, radiusLabel: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs"
                  placeholder="R hoặc 3 cm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Thiết lập Đường kính AB & Dây cung CD */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
          Đường kính & Dây cung
        </span>

        {/* Đường kính */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
            <input
              type="checkbox"
              checked={circle.showDiameter || false}
              onChange={(e) => onChangeCircle({ ...circle, showDiameter: e.target.checked })}
              className="rounded text-teal-600"
            />
            <span>Đường kính AB (Đi qua tâm O)</span>
          </label>

          {circle.showDiameter && (
            <div className="grid grid-cols-2 gap-2 pl-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Tên điểm mút 1</label>
                <input
                  type="text"
                  value={circle.diameterPoints?.[0] || 'A'}
                  onChange={(e) =>
                    onChangeCircle({
                      ...circle,
                      diameterPoints: [e.target.value, circle.diameterPoints?.[1] || 'B'],
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Tên điểm mút 2</label>
                <input
                  type="text"
                  value={circle.diameterPoints?.[1] || 'B'}
                  onChange={(e) =>
                    onChangeCircle({
                      ...circle,
                      diameterPoints: [circle.diameterPoints?.[0] || 'A', e.target.value],
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Dây cung CD */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
            <input
              type="checkbox"
              checked={circle.showChord || false}
              onChange={(e) => onChangeCircle({ ...circle, showChord: e.target.checked })}
              className="rounded text-teal-600"
            />
            <span>Dây cung CD</span>
          </label>

          {circle.showChord && (
            <div className="space-y-2 pl-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Điểm C</label>
                  <input
                    type="text"
                    value={circle.chordPoints?.[0] || 'C'}
                    onChange={(e) =>
                      onChangeCircle({
                        ...circle,
                        chordPoints: [e.target.value, circle.chordPoints?.[1] || 'D'],
                      })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Điểm D</label>
                  <input
                    type="text"
                    value={circle.chordPoints?.[1] || 'D'}
                    onChange={(e) =>
                      onChangeCircle({
                        ...circle,
                        chordPoints: [circle.chordPoints?.[0] || 'C', e.target.value],
                      })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                  />
                </div>
              </div>

              {/* Khoảng cách từ tâm OH ⊥ CD */}
              <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 text-[11px]">
                  <input
                    type="checkbox"
                    checked={circle.showChordDistance !== false}
                    onChange={(e) => onChangeCircle({ ...circle, showChordDistance: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>Khoảng cách từ tâm (OH ⊥ CD)</span>
                </label>
                {circle.showChordDistance !== false && (
                  <div className="flex items-center gap-3 pl-4 text-[10px] text-slate-600">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={circle.showChordRightAngle !== false}
                        onChange={(e) =>
                          onChangeCircle({ ...circle, showChordRightAngle: e.target.checked })
                        }
                        className="rounded text-teal-600"
                      />
                      Góc vuông (⊥)
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={circle.showChordMidpoint !== false}
                        onChange={(e) =>
                          onChangeCircle({ ...circle, showChordMidpoint: e.target.checked })
                        }
                        className="rounded text-teal-600"
                      />
                      Trung điểm (HC = HD)
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Thiết lập Cung tròn (Arc) */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Spline className="w-3.5 h-3.5 text-pink-600" />
          Cung tròn (Arc)
        </span>

        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
          <input
            type="checkbox"
            checked={circle.showArc || false}
            onChange={(e) => onChangeCircle({ ...circle, showArc: e.target.checked })}
            className="rounded text-pink-600"
          />
          <span>Vẽ và nổi bật Cung tròn</span>
        </label>

        {circle.showArc && (
          <div className="space-y-2 pl-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Loại cung</label>
                <select
                  value={circle.arcType || 'minor'}
                  onChange={(e) =>
                    onChangeCircle({
                      ...circle,
                      arcType: e.target.value as 'minor' | 'major',
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                >
                  <option value="minor">Cung nhỏ AB (≤ 180°)</option>
                  <option value="major">Cung lớn AB (&gt; 180°)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Tên cung hiển thị</label>
                <input
                  type="text"
                  value={circle.arcName || 'AB'}
                  onChange={(e) => onChangeCircle({ ...circle, arcName: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                  placeholder="AB hoặc AmB"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Thiết lập Tiếp tuyến (Tangent) */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <GitCommit className="w-3.5 h-3.5 text-purple-600" />
          Tiếp tuyến & Hai tiếp tuyến cắt nhau
        </span>

        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
          <input
            type="checkbox"
            checked={circle.showTangent || false}
            onChange={(e) => onChangeCircle({ ...circle, showTangent: e.target.checked })}
            className="rounded text-purple-600"
          />
          <span>Bật đường tiếp tuyến</span>
        </label>

        {circle.showTangent && (
          <div className="space-y-2.5 pl-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Mô hình tiếp tuyến</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeCircle({ ...circle, tangentType: 'at-point' })}
                  className={`px-2 py-1.5 text-[11px] font-medium rounded border ${
                    (circle.tangentType || 'at-point') === 'at-point'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Tại điểm A trên (O)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCircle({ ...circle, tangentType: 'two-tangents' })}
                  className={`px-2 py-1.5 text-[11px] font-medium rounded border ${
                    circle.tangentType === 'two-tangents'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  2 Tiếp tuyến từ P
                </button>
              </div>
            </div>

            {circle.tangentType === 'two-tangents' ? (
              <div className="space-y-2 p-2 bg-slate-50 rounded border border-slate-200">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] text-slate-500">Điểm ngoài</label>
                    <input
                      type="text"
                      value={circle.externalPointName || 'P'}
                      onChange={(e) => onChangeCircle({ ...circle, externalPointName: e.target.value })}
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Tiếp điểm 1</label>
                    <input
                      type="text"
                      value={circle.tangentPointsNames?.[0] || 'A'}
                      onChange={(e) =>
                        onChangeCircle({
                          ...circle,
                          tangentPointsNames: [e.target.value, circle.tangentPointsNames?.[1] || 'B'],
                        })
                      }
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Tiếp điểm 2</label>
                    <input
                      type="text"
                      value={circle.tangentPointsNames?.[1] || 'B'}
                      onChange={(e) =>
                        onChangeCircle({
                          ...circle,
                          tangentPointsNames: [circle.tangentPointsNames?.[0] || 'A', e.target.value],
                        })
                      }
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={circle.showCenterConnector !== false}
                      onChange={(e) => onChangeCircle({ ...circle, showCenterConnector: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    Nối OP (Tia phân giác)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={circle.showChordAB || false}
                      onChange={(e) => onChangeCircle({ ...circle, showChordAB: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    Nối dây AB
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={circle.showTangentRightAngle !== false}
                      onChange={(e) =>
                        onChangeCircle({ ...circle, showTangentRightAngle: e.target.checked })
                      }
                      className="rounded text-purple-600"
                    />
                    Góc vuông (OA⊥PA, OB⊥PB)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={circle.showTangentEqualMarks !== false}
                      onChange={(e) =>
                        onChangeCircle({ ...circle, showTangentEqualMarks: e.target.checked })
                      }
                      className="rounded text-purple-600"
                    />
                    Ký hiệu PA = PB
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Tên tiếp điểm</label>
                  <input
                    type="text"
                    value={circle.tangentPointName || 'A'}
                    onChange={(e) => onChangeCircle({ ...circle, tangentPointName: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Tên đường tiếp tuyến</label>
                  <input
                    type="text"
                    value={circle.tangentLineName || 'Ax'}
                    onChange={(e) => onChangeCircle({ ...circle, tangentLineName: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs"
                    placeholder="d hoặc Ax"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Thiết lập Cát tuyến (Secant) & Giao điểm */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Disc className="w-3.5 h-3.5 text-cyan-600" />
          Cát tuyến (Secant)
        </span>

        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
          <input
            type="checkbox"
            checked={circle.showSecant || false}
            onChange={(e) => onChangeCircle({ ...circle, showSecant: e.target.checked })}
            className="rounded text-cyan-600"
          />
          <span>Vẽ cát tuyến cắt đường tròn tại 2 điểm</span>
        </label>

        {circle.showSecant && (
          <div className="grid grid-cols-2 gap-2 pl-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Giao điểm 1</label>
              <input
                type="text"
                value={circle.secantPointsNames?.[0] || 'C'}
                onChange={(e) =>
                  onChangeCircle({
                    ...circle,
                    secantPointsNames: [e.target.value, circle.secantPointsNames?.[1] || 'D'],
                  })
                }
                className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Giao điểm 2</label>
              <input
                type="text"
                value={circle.secantPointsNames?.[1] || 'D'}
                onChange={(e) =>
                  onChangeCircle({
                    ...circle,
                    secantPointsNames: [circle.secantPointsNames?.[0] || 'C', e.target.value],
                  })
                }
                className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Tô miền hình học (Circle / Sector / Segment Fill) */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Palette className="w-3.5 h-3.5 text-amber-500" />
          Tô miền hình học (Fill)
        </span>

        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 text-xs">
          <input
            type="checkbox"
            checked={circle.fill?.enabled || false}
            onChange={(e) =>
              onChangeCircle({
                ...circle,
                fill: {
                  enabled: e.target.checked,
                  color: circle.fill?.color || '#3b82f6',
                  opacity: circle.fill?.opacity ?? 0.25,
                },
              })
            }
            className="rounded text-amber-500"
          />
          <span>Bật tô màu miền</span>
        </label>

        {circle.fill?.enabled && (
          <div className="space-y-3 pl-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Dạng miền tô</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'full', label: 'Toàn bộ hình tròn' },
                  { id: 'sector', label: 'Hình quạt (Sector)' },
                  { id: 'segment', label: 'Hình viên phân' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChangeCircle({
                        ...circle,
                        fillType: item.id as 'full' | 'sector' | 'segment',
                      })
                    }
                    className={`px-1.5 py-1 text-[10px] rounded border transition text-center ${
                      (circle.fillType || 'full') === item.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Màu tô & Opacity */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Màu tô</label>
              <div className="flex items-center gap-1.5">
                {FILL_COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      onChangeCircle({
                        ...circle,
                        fill: {
                          ...circle.fill!,
                          color: c,
                        },
                      })
                    }
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border transition ${
                      circle.fill?.color === c
                        ? 'border-slate-900 ring-2 ring-slate-400 scale-110'
                        : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>Độ trong suốt</span>
                <span>{Math.round((circle.fill.opacity ?? 0.25) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.9}
                step={0.05}
                value={circle.fill.opacity ?? 0.25}
                onChange={(e) =>
                  onChangeCircle({
                    ...circle,
                    fill: {
                      ...circle.fill!,
                      opacity: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. Tùy chỉnh Nét & Màu sắc độc lập từng đối tượng */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 shadow-xs">
        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          Style nét vẽ độc lập
        </span>

        {/* Style Đường tròn chính */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>Đường tròn (O)</span>
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.slice(0, 5).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() =>
                    onChangeCircle({
                      ...circle,
                      circleStyle: { ...(circle.circleStyle || {}), strokeColor: col },
                    })
                  }
                  style={{ backgroundColor: col }}
                  className={`w-3.5 h-3.5 rounded-full border ${
                    (circle.circleStyle?.strokeColor || '#000000') === col
                      ? 'border-indigo-600 ring-1 ring-indigo-400'
                      : 'border-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500">Kiểu nét:</span>
              <select
                value={circle.circleStyle?.strokeStyle || 'solid'}
                onChange={(e) =>
                  onChangeCircle({
                    ...circle,
                    circleStyle: {
                      ...(circle.circleStyle || {}),
                      strokeStyle: e.target.value as StrokeDashType,
                    },
                  })
                }
                className="w-full mt-0.5 px-1 py-0.5 border border-slate-300 rounded text-[10px]"
              >
                <option value="solid">Nét liền</option>
                <option value="dashed">Nét đứt</option>
                <option value="dotted">Nét chấm</option>
              </select>
            </div>
            <div>
              <span className="text-slate-500">Độ dày ({circle.circleStyle?.strokeWidth || 1.8}px):</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.2}
                value={circle.circleStyle?.strokeWidth || 1.8}
                onChange={(e) =>
                  onChangeCircle({
                    ...circle,
                    circleStyle: {
                      ...(circle.circleStyle || {}),
                      strokeWidth: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-600 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Style Bán kính OA */}
        {circle.showRadius !== false && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Đoạn Bán kính (OA)</span>
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.slice(0, 5).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onChangeCircle({
                        ...circle,
                        radiusStyle: { ...(circle.radiusStyle || {}), strokeColor: col },
                      })
                    }
                    style={{ backgroundColor: col }}
                    className={`w-3.5 h-3.5 rounded-full border ${
                      (circle.radiusStyle?.strokeColor || '#000000') === col
                        ? 'border-indigo-600 ring-1 ring-indigo-400'
                        : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Style Dây cung CD */}
        {circle.showChord && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Dây cung (CD)</span>
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.slice(0, 5).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onChangeCircle({
                        ...circle,
                        chordStyle: { ...(circle.chordStyle || {}), strokeColor: col },
                      })
                    }
                    style={{ backgroundColor: col }}
                    className={`w-3.5 h-3.5 rounded-full border ${
                      (circle.chordStyle?.strokeColor || '#000000') === col
                        ? 'border-teal-600 ring-1 ring-teal-400'
                        : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Style Tiếp tuyến */}
        {circle.showTangent && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Tiếp tuyến</span>
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.slice(0, 5).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onChangeCircle({
                        ...circle,
                        tangentStyle: { ...(circle.tangentStyle || {}), strokeColor: col },
                      })
                    }
                    style={{ backgroundColor: col }}
                    className={`w-3.5 h-3.5 rounded-full border ${
                      (circle.tangentStyle?.strokeColor || '#000000') === col
                        ? 'border-purple-600 ring-1 ring-purple-400'
                        : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ĐƯỜNG PHỤ VÀ KÝ HIỆU HÌNH HỌC (GIAI ĐOẠN 3.2) */}
      <AuxiliaryElementsEditor
        availablePoints={[circle.centerName || 'O', circle.radiusPointName || 'A', 'B', 'C', 'D', 'H', 'P', 'M', 'N']}
        auxLines={circle.auxLines || []}
        auxPoints={circle.auxPoints || []}
        rightAngleMarkers={circle.rightAngleMarkers || []}
        parallelMarkers={circle.parallelMarkers || []}
        equalSidesMarkers={circle.equalSidesMarkers || []}
        equalAnglesMarkers={circle.equalAnglesMarkers || []}
        onChange={(auxData) => {
          onChangeCircle({
            ...circle,
            ...auxData,
          });
        }}
      />
    </div>
  );
};
