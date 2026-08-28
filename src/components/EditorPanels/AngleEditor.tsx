import React, { useState } from 'react';
import {
  AngleData,
  AngleType,
  Point2D,
  GeometrySegmentStyle,
  GeometryFillStyle,
  StrokeDashType,
} from '../../types';
import {
  Compass,
  Layers,
  Sparkles,
  Split,
  MoveHorizontal,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Palette,
  Eye,
  Check,
  Paintbrush,
  Maximize2,
} from 'lucide-react';
import { getAnglePresetPoints } from '../../utils/geometryMath';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';

interface AngleEditorProps {
  angle: AngleData;
  onChangeAngle: (newAngle: AngleData) => void;
}

const COLOR_SWATCHES = [
  { label: 'Đen (Chuẩn SGK)', value: '#000000' },
  { label: 'Xanh lam', value: '#2563eb' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Xanh lục', value: '#16a34a' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Xám đậm', value: '#475569' },
];

const FILL_SWATCHES = [
  { label: 'Vàng cam nhạt', value: '#fef08a' },
  { label: 'Xanh lam nhạt', value: '#bfdbfe' },
  { label: 'Xanh lá nhạt', value: '#bbf7d0' },
  { label: 'Hồng phấn', value: '#fbcfe8' },
  { label: 'Tím nhạt', value: '#e9d5ff' },
  { label: 'Cam nhạt', value: '#fed7aa' },
];

export const AngleEditor: React.FC<AngleEditorProps> = ({
  angle,
  onChangeAngle,
}) => {
  const currentType = angle.type || 'single';

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    type: true,
    measure: true,
    bisector: true,
    fill: false,
    style: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const angleTypes: { id: AngleType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'single',
      label: 'Góc đơn (∠xOy / ∠ABC)',
      desc: 'Tự do kéo đỉnh & tia, hiển thị số đo & cung góc',
      icon: <Compass className="w-4 h-4 text-pink-600" />,
    },
    {
      id: 'bisector',
      label: 'Tia phân giác (Oz / BD)',
      desc: 'Tia phân giác chính xác chia đôi góc & ký hiệu bằng nhau',
      icon: <Split className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'vertical-angles',
      label: 'Hai góc đối đỉnh',
      desc: 'Hai đường thẳng cắt nhau tại O (O₁ = O₃, O₂ = O₄)',
      icon: <Layers className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'supplementary',
      label: 'Hai góc kề bù',
      desc: 'Hai góc kề nhau có tổng số đo bằng 180° trên đường thẳng',
      icon: <MoveHorizontal className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'parallel-transversal',
      label: 'So le trong – Đồng vị – Trong cùng phía',
      desc: 'Cát tuyến cắt 2 đường song song (Toán 7 SGK)',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    },
  ];

  const handleTypeChange = (newType: AngleType) => {
    const newPoints = getAnglePresetPoints(newType);
    onChangeAngle({
      ...angle,
      type: newType,
      points: newPoints,
      showBisector: newType === 'bisector' ? true : angle.showBisector,
    });
  };

  const handleResetPoints = () => {
    onChangeAngle({
      ...angle,
      points: getAnglePresetPoints(currentType),
    });
  };

  return (
    <div className="space-y-3 select-none">
      {/* 1. CHỌN LOẠI CẤU HÌNH GÓC SGK */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-pink-600" />
            <span className="text-xs font-bold text-slate-800">
              1. Cấu hình Góc & Chuyên đề SGK
            </span>
          </div>
          {openSections.type ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.type && (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-1 gap-1.5">
              {angleTypes.map((item) => {
                const isSelected = currentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeChange(item.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/70 text-pink-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        isSelected ? 'bg-pink-200/80 text-pink-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nút Reset toạ độ */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleResetPoints}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-pink-600 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại vị trí chuẩn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. THIẾT LẬP TÊN ĐỈNH, CÁC TIA & SỐ ĐO GÓC */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('measure')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              2. Đỉnh, Tên tia & Số đo góc
            </span>
          </div>
          {openSections.measure ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.measure && (
          <div className="p-3 space-y-3">
            {/* Tên Đỉnh và 2 tia */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Đỉnh góc
                </label>
                <input
                  type="text"
                  value={angle.vertexName || 'O'}
                  onChange={(e) =>
                    onChangeAngle({ ...angle, vertexName: e.target.value })
                  }
                  className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded text-center bg-white"
                  placeholder="O hoặc B"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tia thứ nhất
                </label>
                <input
                  type="text"
                  value={angle.ray1Name || 'x'}
                  onChange={(e) =>
                    onChangeAngle({ ...angle, ray1Name: e.target.value })
                  }
                  className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded text-center bg-white"
                  placeholder="x hoặc A"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tia thứ hai
                </label>
                <input
                  type="text"
                  value={angle.ray2Name || 'y'}
                  onChange={(e) =>
                    onChangeAngle({ ...angle, ray2Name: e.target.value })
                  }
                  className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded text-center bg-white"
                  placeholder="y hoặc C"
                />
              </div>
            </div>

            {/* Số đo góc */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={angle.showDegreeValue !== false}
                    onChange={(e) =>
                      onChangeAngle({ ...angle, showDegreeValue: e.target.checked })
                    }
                    className="rounded text-pink-600"
                  />
                  <span>Hiện số đo góc (°Cung góc)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={angle.autoCalculateDegrees !== false}
                    onChange={(e) =>
                      onChangeAngle({
                        ...angle,
                        autoCalculateDegrees: e.target.checked,
                      })
                    }
                    className="rounded text-pink-600"
                  />
                  <span>Tự tính theo kéo thả</span>
                </label>
              </div>

              {/* Nhập số đo cố định nếu tắt auto */}
              {!angle.autoCalculateDegrees && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-600">Số đo:</span>
                  <input
                    type="number"
                    min={5}
                    max={175}
                    value={angle.degrees || 60}
                    onChange={(e) =>
                      onChangeAngle({ ...angle, degrees: Number(e.target.value) })
                    }
                    className="w-20 text-xs font-bold px-2 py-1 border border-slate-300 rounded text-pink-700 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600">°</span>
                </div>
              )}
            </div>

            {/* Bán kính cung góc */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span>Kích thước cung góc</span>
                <span className="font-bold">{angle.arcRadius || 34} px</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                value={angle.arcRadius || 34}
                onChange={(e) =>
                  onChangeAngle({ ...angle, arcRadius: Number(e.target.value) })
                }
                className="w-full accent-pink-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. TIA PHÂN GIÁC & KÝ HIỆU GÓC BẰNG NHAU */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('bisector')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800">
              3. Tia phân giác & Ký hiệu bằng nhau
            </span>
          </div>
          {openSections.bisector ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.bisector && (
          <div className="p-3 space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={angle.showBisector || currentType === 'bisector'}
                  onChange={(e) =>
                    onChangeAngle({ ...angle, showBisector: e.target.checked })
                  }
                  className="rounded text-purple-600"
                />
                <span>Vẽ tia phân giác</span>
              </label>

              {(angle.showBisector || currentType === 'bisector') && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">Tên:</span>
                  <input
                    type="text"
                    value={angle.bisectorName || 'z'}
                    onChange={(e) =>
                      onChangeAngle({ ...angle, bisectorName: e.target.value })
                    }
                    className="w-12 text-center text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                    placeholder="z hoặc D"
                  />
                </div>
              )}
            </div>

            {(angle.showBisector || currentType === 'bisector') && (
              <div className="space-y-2 pl-5 pt-1 text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={angle.showEqualAngleMarks !== false}
                    onChange={(e) =>
                      onChangeAngle({
                        ...angle,
                        showEqualAngleMarks: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span>Đánh dấu 2 góc bằng nhau (Vòng cung có gạch)</span>
                </label>
              </div>
            )}

            {/* Nếu là Cát tuyến cắt 2 đường song song */}
            {currentType === 'parallel-transversal' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700">
                  Cặp góc cần làm nổi bật (Toán 7)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'alternate-interior', label: 'So le trong' },
                    { id: 'corresponding', label: 'Đồng vị' },
                    { id: 'consecutive-interior', label: 'Trong cùng phía' },
                    { id: 'all', label: 'Hiện tất cả các góc' },
                  ].map((hl) => {
                    const currHL =
                      angle.parallelCutConfig?.highlightType || 'alternate-interior';
                    const isSel = currHL === hl.id;
                    return (
                      <button
                        key={hl.id}
                        type="button"
                        onClick={() =>
                          onChangeAngle({
                            ...angle,
                            parallelCutConfig: {
                              ...(angle.parallelCutConfig || {}),
                              highlightType: hl.id as any,
                            },
                          })
                        }
                        className={`text-xs py-1.5 px-2 rounded border font-medium text-center transition ${
                          isSel
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {hl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. TÔ MIỀN GÓC (ANGLE SECTOR FILL) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('fill')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800">
              4. Tô miền góc (Vùng trong góc)
            </span>
          </div>
          {openSections.fill ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.fill && (
          <div className="p-3 space-y-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={angle.fill?.enabled || false}
                onChange={(e) =>
                  onChangeAngle({
                    ...angle,
                    fill: {
                      ...(angle.fill || { color: '#fef08a', opacity: 0.35 }),
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-amber-600"
              />
              <span>Bật màu nền tô miền góc</span>
            </label>

            {angle.fill?.enabled && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Màu nền miền góc
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FILL_SWATCHES.map((fsw) => {
                      const currFill = angle.fill?.color || '#fef08a';
                      const isSel = currFill === fsw.value;
                      return (
                        <button
                          key={fsw.value}
                          type="button"
                          title={fsw.label}
                          onClick={() =>
                            onChangeAngle({
                              ...angle,
                              fill: { ...(angle.fill || { enabled: true }), color: fsw.value },
                            })
                          }
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                            isSel
                              ? 'ring-2 ring-amber-500 ring-offset-1 scale-110'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: fsw.value }}
                        >
                          {isSel && <Check className="w-3 h-3 text-slate-800" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Độ trong suốt (Opacity)</span>
                    <span className="font-bold">
                      {Math.round((angle.fill?.opacity ?? 0.35) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={angle.fill?.opacity ?? 0.35}
                    onChange={(e) =>
                      onChangeAngle({
                        ...angle,
                        fill: {
                          ...(angle.fill || { enabled: true, color: '#fef08a' }),
                          opacity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MÀU SẮC & KIỂU NÉT VẼ */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('style')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800">
              5. Màu sắc & Kiểu nét
            </span>
          </div>
          {openSections.style ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.style && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                Màu nét tia & cung góc
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_SWATCHES.map((sw) => {
                  const currColor = angle.ray1Style?.color || '#000000';
                  const isSel = currColor === sw.value;
                  return (
                    <button
                      key={sw.value}
                      type="button"
                      title={sw.label}
                      onClick={() =>
                        onChangeAngle({
                          ...angle,
                          ray1Style: { ...(angle.ray1Style || {}), color: sw.value },
                          ray2Style: { ...(angle.ray2Style || {}), color: sw.value },
                        })
                      }
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                        isSel ? 'ring-2 ring-pink-500 ring-offset-1 scale-110' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: sw.value }}
                    >
                      {isSel && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            sw.value === '#ffffff' || sw.value === '#f59e0b'
                              ? 'text-slate-800'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span>Độ dày nét tia</span>
                <span className="font-bold">{angle.ray1Style?.strokeWidth || 1.8} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.2"
                value={angle.ray1Style?.strokeWidth || 1.8}
                onChange={(e) =>
                  onChangeAngle({
                    ...angle,
                    ray1Style: {
                      ...(angle.ray1Style || {}),
                      strokeWidth: Number(e.target.value),
                    },
                    ray2Style: {
                      ...(angle.ray2Style || {}),
                      strokeWidth: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-pink-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ĐƯỜNG PHỤ VÀ KÝ HIỆU HÌNH HỌC (GIAI ĐOẠN 3.2) */}
      <AuxiliaryElementsEditor
        availablePoints={[angle.vertexName || 'O', angle.ray1Name || 'A', angle.ray2Name || 'B', 'C', 'z', 'M']}
        auxLines={angle.auxLines || []}
        auxPoints={angle.auxPoints || []}
        rightAngleMarkers={angle.rightAngleMarkers || []}
        parallelMarkers={angle.parallelMarkers || []}
        equalSidesMarkers={angle.equalSidesMarkers || []}
        equalAnglesMarkers={angle.equalAnglesMarkers || []}
        onChange={(auxData) => {
          onChangeAngle({
            ...angle,
            ...auxData,
          });
        }}
      />
    </div>
  );
};
