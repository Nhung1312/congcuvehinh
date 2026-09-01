import React, { useState } from 'react';
import {
  LineRayData,
  LineRayType,
  Point2D,
  GeometrySegmentStyle,
  StrokeDashType,
} from '../../types';
import {
  Minus,
  ArrowRight,
  MoveHorizontal,
  GitCommit,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Palette,
  Eye,
  Check,
  Split,
  Plus,
} from 'lucide-react';
import { getLineRayPresetPoints } from '../../utils/geometryMath';
import { AuxiliaryElementsEditor } from './AuxiliaryElementsEditor';

interface LineRayEditorProps {
  lineRay: LineRayData;
  onChangeLineRay: (newLineRay: LineRayData) => void;
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

export const LineRayEditor: React.FC<LineRayEditorProps> = ({
  lineRay,
  onChangeLineRay,
}) => {
  const currentType = lineRay.type || 'segment';

  // State mở/đóng Accordion
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    type: true,
    points: true,
    options: true,
    style: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const pointNames = lineRay.pointNames || ['A', 'B', 'C', 'D'];
  const name1 = pointNames[0] || 'A';
  const name2 = pointNames[1] || 'B';
  const name3 = pointNames[2] || 'C';
  const name4 = pointNames[3] || 'D';

  const lineTypes: { id: LineRayType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'segment',
      label: 'Đoạn thẳng AB',
      desc: 'Giới hạn 2 đầu mút A, B, có trung điểm & độ dài',
      icon: <Minus className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'ray',
      label: 'Tia Ax / AB',
      desc: 'Gốc A, định hướng B kéo dài một phía',
      icon: <ArrowRight className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'line',
      label: 'Đường thẳng xy',
      desc: 'Đường thẳng vô tận qua 2 điểm A, B',
      icon: <MoveHorizontal className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'parallel',
      label: 'Hai đường song song',
      desc: 'Dựng a // b với ký hiệu mũi tên song song',
      icon: <Split className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'perpendicular',
      label: 'Hai đường vuông góc',
      desc: 'Dựng d ⊥ d\' kèm ký hiệu góc vuông chuẩn SGK',
      icon: <Plus className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'intersection',
      label: 'Hai đường cắt nhau',
      desc: 'Hai đường cắt nhau tại giao điểm O',
      icon: <GitCommit className="w-4 h-4 text-cyan-600" />,
    },
  ];

  const handleTypeChange = (newType: LineRayType) => {
    const newPoints = getLineRayPresetPoints(newType);
    onChangeLineRay({
      ...lineRay,
      type: newType,
      points: newPoints,
    });
  };

  const handleResetPoints = () => {
    onChangeLineRay({
      ...lineRay,
      points: getLineRayPresetPoints(currentType),
    });
  };

  const handleUpdatePointName = (index: number, name: string) => {
    const updated = [...pointNames];
    updated[index] = name;
    onChangeLineRay({
      ...lineRay,
      pointNames: updated,
      point1Name: updated[0],
      point2Name: updated[1],
    });
  };

  return (
    <div className="space-y-3 select-none">
      {/* 1. CHỌN LOẠI ĐỐI TƯỢNG (ĐOẠN THẲNG / TIA / ĐƯỜNG THẲNG / SONG SONG / VUÔNG GÓC) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <MoveHorizontal className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              1. Loại đường thẳng & Đối tượng
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
              {lineTypes.map((item) => {
                const isSelected = currentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeChange(item.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        isSelected ? 'bg-blue-200/80 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nút Reset lại vị trí chuẩn */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleResetPoints}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại vị trí chuẩn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. ĐẶT TÊN ĐIỂM & ĐƯỜNG THẲNG */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('points')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              2. Điểm & Tên nhãn hiển thị
            </span>
          </div>
          {openSections.points ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.points && (
          <div className="p-3 space-y-3">
            {/* Tên các điểm */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {currentType === 'ray' ? 'Điểm gốc (Gốc tia)' : 'Điểm thứ nhất'}
                </label>
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => handleUpdatePointName(0, e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="A"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {currentType === 'ray' ? 'Điểm định hướng' : 'Điểm thứ hai'}
                </label>
                <input
                  type="text"
                  value={name2}
                  onChange={(e) => handleUpdatePointName(1, e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="B hoặc x"
                />
              </div>
            </div>

            {/* Nếu là 2 đường song song / giao điểm */}
            {(currentType === 'parallel' || currentType === 'intersection') && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {currentType === 'parallel' ? 'Điểm P (Đường 2 qua)' : 'Điểm đường 2 (C)'}
                  </label>
                  <input
                    type="text"
                    value={name3}
                    onChange={(e) => handleUpdatePointName(2, e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="C hoặc P"
                  />
                </div>
                {currentType === 'intersection' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Điểm đường 2 (D)
                    </label>
                    <input
                      type="text"
                      value={name4}
                      onChange={(e) => handleUpdatePointName(3, e.target.value)}
                      className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="D"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Toggle hiển thị điểm & nhãn */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lineRay.showPoints !== false}
                  onChange={(e) =>
                    onChangeLineRay({ ...lineRay, showPoints: e.target.checked })
                  }
                  className="rounded text-blue-600"
                />
                <span>Hiện chấm tròn điểm</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lineRay.showLabels !== false}
                  onChange={(e) =>
                    onChangeLineRay({ ...lineRay, showLabels: e.target.checked })
                  }
                  className="rounded text-blue-600"
                />
                <span>Hiện chữ cái tên điểm</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. TÍNH NĂNG ĐẶC TRƯNG HÌNH HỌC (TRUNG ĐIỂM, ĐỘ DÀI, KÝ HIỆU VUÔNG GÓC, SONG SONG, GIAO ĐIỂM) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('options')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              3. Ký hiệu & Thông số hình học
            </span>
          </div>
          {openSections.options ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {openSections.options && (
          <div className="p-3 space-y-3 text-xs text-slate-700">
            {/* Nếu là đoạn thẳng */}
            {currentType === 'segment' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lineRay.showMidpoint || false}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, showMidpoint: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Trung điểm đoạn thẳng</span>
                  </label>

                  {lineRay.showMidpoint && (
                    <input
                      type="text"
                      value={lineRay.midpointName || 'M'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, midpointName: e.target.value })
                      }
                      className="w-12 text-center text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                      placeholder="M"
                    />
                  )}
                </div>

                {lineRay.showMidpoint && (
                  <label className="flex items-center gap-1.5 pl-5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={lineRay.showEqualSegmentMarks !== false}
                      onChange={(e) =>
                        onChangeLineRay({
                          ...lineRay,
                          showEqualSegmentMarks: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Ký hiệu 2 đoạn bằng nhau (MA = MB)</span>
                  </label>
                )}

                {/* Độ dài đoạn thẳng */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lineRay.showLength || false}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, showLength: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Hiển thị độ dài</span>
                  </label>

                  {lineRay.showLength && (
                    <input
                      type="text"
                      value={lineRay.lengthValue || '6 cm'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, lengthValue: e.target.value })
                      }
                      className="w-24 text-xs font-medium px-2 py-0.5 border border-slate-300 rounded bg-white text-right"
                      placeholder="6 cm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Nếu là Song song */}
            {currentType === 'parallel' && (
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineRay.showParallelMarkers !== false}
                    onChange={(e) =>
                      onChangeLineRay({ ...lineRay, showParallelMarkers: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Hiện ký hiệu mũi tên song song ( &gt; )</span>
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Tên đường thứ 1
                    </label>
                    <input
                      type="text"
                      value={lineRay.parallelLineLabel1 || 'a'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, parallelLineLabel1: e.target.value })
                      }
                      className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                      placeholder="a"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Tên đường thứ 2
                    </label>
                    <input
                      type="text"
                      value={lineRay.parallelLineLabel2 || 'b'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, parallelLineLabel2: e.target.value })
                      }
                      className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                      placeholder="b"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nếu là Vuông góc */}
            {currentType === 'perpendicular' && (
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={lineRay.showRightAngleMarker !== false}
                    onChange={(e) =>
                      onChangeLineRay({ ...lineRay, showRightAngleMarker: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Ký hiệu góc vuông ( ∟ )</span>
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Tên đường thẳng 1
                    </label>
                    <input
                      type="text"
                      value={lineRay.perpLineLabel1 || 'd'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, perpLineLabel1: e.target.value })
                      }
                      className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                      placeholder="d"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Tên đường thẳng 2
                    </label>
                    <input
                      type="text"
                      value={lineRay.perpLineLabel2 || "d'"}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, perpLineLabel2: e.target.value })
                      }
                      className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded"
                      placeholder="d'"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nếu là Giao điểm (Tool 5) */}
            {currentType === 'intersection' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={lineRay.showIntersectionPoint !== false}
                      onChange={(e) =>
                        onChangeLineRay({
                          ...lineRay,
                          showIntersectionPoint: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Hiện điểm giao nhau</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Tên:</span>
                    <input
                      type="text"
                      value={lineRay.intersectionName || 'O'}
                      onChange={(e) =>
                        onChangeLineRay({ ...lineRay, intersectionName: e.target.value })
                      }
                      className="w-12 text-center text-xs font-bold px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                      placeholder="O"
                    />
                  </div>
                </div>

                {/* Chọn loại hình thể cho đường 1 và đường 2 */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Đối tượng 1 ({name1}{name2})
                    </label>
                    <select
                      value={lineRay.line1Kind || 'line'}
                      onChange={(e) =>
                        onChangeLineRay({
                          ...lineRay,
                          line1Kind: e.target.value as any,
                        })
                      }
                      className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded bg-white"
                    >
                      <option value="line">Đường thẳng ({name1}{name2})</option>
                      <option value="ray">Tia ({name1}{name2})</option>
                      <option value="segment">Đoạn thẳng ({name1}{name2})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Đối tượng 2 ({name3}{name4})
                    </label>
                    <select
                      value={lineRay.line2Kind || 'line'}
                      onChange={(e) =>
                        onChangeLineRay({
                          ...lineRay,
                          line2Kind: e.target.value as any,
                        })
                      }
                      className="w-full text-xs px-1.5 py-1 border border-slate-300 rounded bg-white"
                    >
                      <option value="line">Đường thẳng ({name3}{name4})</option>
                      <option value="ray">Tia ({name3}{name4})</option>
                      <option value="segment">Đoạn thẳng ({name3}{name4})</option>
                    </select>
                  </div>
                </div>

                {/* Tùy chọn kéo dài nét đứt tới giao điểm */}
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={lineRay.showExtensionLines !== false}
                    onChange={(e) =>
                      onChangeLineRay({
                        ...lineRay,
                        showExtensionLines: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Tự động vẽ nét đứt kéo dài tới giao điểm</span>
                </label>
              </div>
            )}

            {/* Mũi tên định hướng (nếu là tia) */}
            {currentType === 'ray' && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lineRay.showArrows !== false}
                  onChange={(e) =>
                    onChangeLineRay({ ...lineRay, showArrows: e.target.checked })
                  }
                  className="rounded text-blue-600"
                />
                <span>Mũi tên định hướng tia</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* 4. TÙY BIẾN STYLE ĐƯỜNG NÉT & MÀU SẮC */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('style')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800">
              4. Màu sắc & Kiểu nét
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
            {/* Kiểu nét chính */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                Kiểu đường nét
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'solid', label: 'Nét liền' },
                    { id: 'dashed', label: 'Nét đứt' },
                    { id: 'dotted', label: 'Nét chấm' },
                  ] as { id: StrokeDashType; label: string }[]
                ).map((st) => {
                  const currentStyle = lineRay.line1Style?.style || 'solid';
                  const isSel = currentStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onChangeLineRay({
                          ...lineRay,
                          line1Style: { ...(lineRay.line1Style || {}), style: st.id },
                        })
                      }
                      className={`text-xs py-1 px-2 rounded border font-medium text-center transition ${
                        isSel
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Màu nét */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                Màu sắc nét vẽ
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_SWATCHES.map((sw) => {
                  const currColor = lineRay.line1Style?.color || '#000000';
                  const isSel = currColor === sw.value;
                  return (
                    <button
                      key={sw.value}
                      type="button"
                      title={sw.label}
                      onClick={() =>
                        onChangeLineRay({
                          ...lineRay,
                          line1Style: { ...(lineRay.line1Style || {}), color: sw.value },
                        })
                      }
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                        isSel ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'border-slate-300'
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

            {/* Độ dày nét */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span>Độ dày nét</span>
                <span className="font-bold">{lineRay.line1Style?.strokeWidth || 1.8} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.2"
                value={lineRay.line1Style?.strokeWidth || 1.8}
                onChange={(e) =>
                  onChangeLineRay({
                    ...lineRay,
                    line1Style: {
                      ...(lineRay.line1Style || {}),
                      strokeWidth: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ĐƯỜNG PHỤ VÀ KÝ HIỆU HÌNH HỌC (GIAI ĐOẠN 3.2) */}
      <AuxiliaryElementsEditor
        availablePoints={lineRay.pointNames || ['A', 'B', 'C', 'D', 'M', 'O']}
        auxLines={lineRay.auxLines || []}
        auxPoints={lineRay.auxPoints || []}
        rightAngleMarkers={lineRay.rightAngleMarkers || []}
        parallelMarkers={lineRay.parallelMarkers || []}
        equalSidesMarkers={lineRay.equalSidesMarkers || []}
        equalAnglesMarkers={lineRay.equalAnglesMarkers || []}
        onChange={(auxData) => {
          onChangeLineRay({
            ...lineRay,
            ...auxData,
          });
        }}
      />
    </div>
  );
};
