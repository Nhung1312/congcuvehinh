import React from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  Eye,
  Sliders,
  MoveHorizontal,
  Compass,
} from 'lucide-react';
import { BaseChartSettings, NumberLineData, NumberLineMarker } from '../../types';
import { CommonStyleEditor } from './CommonStyleEditor';
import {
  parseMathExpression,
  calculateOptimalSubDivisions,
} from '../../utils/numberLineMath';

interface NumberLineEditorProps {
  data: NumberLineData;
  settings: BaseChartSettings;
  onChangeData: (data: NumberLineData) => void;
  onChangeSettings: (settings: BaseChartSettings) => void;
}

export const NumberLineEditor: React.FC<NumberLineEditorProps> = ({
  data,
  settings,
  onChangeData,
  onChangeSettings,
}) => {
  const markers = data.markers || [];
  const illustration = data.illustration || {
    enabled: false,
    targetType: 'sqrt2',
    mode: 'visual',
    showArc: true,
    showTriangle: true,
    showRightAngleMarker: true,
    showSideLengths: true,
    showFormulas: true,
    color: '#2563eb',
  };

  const autoSubDiv = data.autoSubDivision !== false;
  const currentOptimalSubDiv = calculateOptimalSubDivisions(markers, data.subDivision);

  // Thêm điểm mới
  const handleAddMarker = (defaultExpr: string = '1', defaultName?: string) => {
    const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextChar =
      defaultName || alphabet[markers.length % alphabet.length] || `P${markers.length + 1}`;

    const parsed = parseMathExpression(defaultExpr);

    const newM: NumberLineMarker = {
      id: newId,
      expression: defaultExpr,
      numericValue: parsed.numericValue,
      value: parsed.numericValue,
      pointName: nextChar,
      color: '#dc2626',
    };
    onChangeData({ ...data, markers: [...markers, newM] });
  };

  // Xóa điểm
  const handleDeleteMarker = (id: string) => {
    onChangeData({ ...data, markers: markers.filter((m) => m.id !== id) });
  };

  // Cập nhật biểu thức / giá trị của điểm
  const handleUpdateMarkerExpr = (id: string, newExpr: string) => {
    const parsed = parseMathExpression(newExpr);
    onChangeData({
      ...data,
      markers: markers.map((m) =>
        m.id === id
          ? {
              ...m,
              expression: newExpr,
              numericValue: parsed.numericValue,
              value: parsed.numericValue,
            }
          : m
      ),
    });
  };

  const handleUpdateMarker = (id: string, partial: Partial<NumberLineMarker>) => {
    onChangeData({
      ...data,
      markers: markers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    });
  };

  // Nạp nhanh bộ điểm mẫu sư phạm THCS
  const handleApplyPreset = (type: 'frac_1_3' | 'frac_3_5' | 'frac_pair' | 'repeating' | 'sqrt2' | 'sqrt5') => {
    if (type === 'frac_1_3') {
      const parsed = parseMathExpression('1/3');
      onChangeData({
        ...data,
        min: -1,
        max: 3,
        step: 1,
        autoSubDivision: true,
        illustration: { ...illustration, enabled: false },
        markers: [
          {
            id: 'm_1',
            expression: '1/3',
            numericValue: parsed.numericValue,
            value: parsed.numericValue,
            pointName: 'A',
            color: '#dc2626',
          },
        ],
      });
    } else if (type === 'frac_3_5') {
      const parsed = parseMathExpression('3/5');
      onChangeData({
        ...data,
        min: -1,
        max: 3,
        step: 1,
        autoSubDivision: true,
        illustration: { ...illustration, enabled: false },
        markers: [
          {
            id: 'm_1',
            expression: '3/5',
            numericValue: parsed.numericValue,
            value: parsed.numericValue,
            pointName: 'A',
            color: '#dc2626',
          },
        ],
      });
    } else if (type === 'frac_pair') {
      const p1 = parseMathExpression('1/2');
      const p2 = parseMathExpression('3/4');
      onChangeData({
        ...data,
        min: -1,
        max: 3,
        step: 1,
        autoSubDivision: true,
        illustration: { ...illustration, enabled: false },
        markers: [
          {
            id: 'm_1',
            expression: '1/2',
            numericValue: p1.numericValue,
            value: p1.numericValue,
            pointName: 'A',
            color: '#2563eb',
          },
          {
            id: 'm_2',
            expression: '3/4',
            numericValue: p2.numericValue,
            value: p2.numericValue,
            pointName: 'B',
            color: '#dc2626',
          },
        ],
      });
    } else if (type === 'repeating') {
      const p1 = parseMathExpression('0,(3)');
      onChangeData({
        ...data,
        min: -1,
        max: 3,
        step: 1,
        autoSubDivision: true,
        illustration: { ...illustration, enabled: false },
        markers: [
          {
            id: 'm_1',
            expression: '0,(3)',
            numericValue: p1.numericValue,
            value: p1.numericValue,
            pointName: 'A',
            color: '#9333ea',
          },
        ],
      });
    } else if (type === 'sqrt2') {
      const p1 = parseMathExpression('√2');
      onChangeData({
        ...data,
        min: -1,
        max: 3,
        step: 1,
        autoSubDivision: false,
        subDivision: 1,
        illustration: {
          enabled: true,
          targetType: 'sqrt2',
          mode: 'visual',
          showArc: true,
          showTriangle: true,
          showRightAngleMarker: true,
          showSideLengths: true,
          showFormulas: true,
          color: '#2563eb',
        },
        markers: [
          {
            id: 'm_sqrt2',
            expression: '√2',
            numericValue: p1.numericValue,
            value: p1.numericValue,
            pointName: 'A',
            color: '#2563eb',
          },
        ],
      });
    } else if (type === 'sqrt5') {
      const p1 = parseMathExpression('√5');
      onChangeData({
        ...data,
        min: -1,
        max: 4,
        step: 1,
        autoSubDivision: false,
        subDivision: 1,
        illustration: {
          enabled: true,
          targetType: 'sqrt5',
          mode: 'visual',
          showArc: true,
          showTriangle: true,
          showRightAngleMarker: true,
          showSideLengths: true,
          showFormulas: true,
          color: '#0891b2',
        },
        markers: [
          {
            id: 'm_sqrt5',
            expression: '√5',
            numericValue: p1.numericValue,
            value: p1.numericValue,
            pointName: 'A',
            color: '#0891b2',
          },
        ],
      });
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Tiêu đề & Kiểu font SGK */}
      <CommonStyleEditor settings={settings} onChangeSettings={onChangeSettings} />

      {/* 2. Mẫu đề bài THCS thông dụng */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mẫu biểu diễn THCS nhanh</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleApplyPreset('frac_1_3')}
            className="px-2 py-1 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded font-medium text-slate-700 transition"
          >
            A = 1/3 (Chia 3)
          </button>
          <button
            onClick={() => handleApplyPreset('frac_3_5')}
            className="px-2 py-1 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded font-medium text-slate-700 transition"
          >
            A = 3/5 (Chia 5)
          </button>
          <button
            onClick={() => handleApplyPreset('frac_pair')}
            className="px-2 py-1 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded font-medium text-slate-700 transition"
          >
            A = 1/2, B = 3/4
          </button>
          <button
            onClick={() => handleApplyPreset('repeating')}
            className="px-2 py-1 text-xs bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded font-medium text-slate-700 transition"
          >
            0,(3) = 1/3
          </button>
          <button
            onClick={() => handleApplyPreset('sqrt2')}
            className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold transition flex items-center justify-center gap-1"
          >
            <span>💡 Minh họa √2</span>
          </button>
          <button
            onClick={() => handleApplyPreset('sqrt5')}
            className="px-2 py-1 text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded font-bold transition flex items-center justify-center gap-1"
          >
            <span>💡 Minh họa √5</span>
          </button>
        </div>
      </div>

      {/* 3. Cấu hình Khoảng trục & Vạch chia nhỏ đơn vị (Sub-ticks) */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Khoảng trục & Vạch chia đơn vị</span>
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Giá trị nhỏ nhất
            </label>
            <input
              type="number"
              value={data.min}
              onChange={(e) => onChangeData({ ...data, min: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Giá trị lớn nhất
            </label>
            <input
              type="number"
              value={data.max}
              onChange={(e) => onChangeData({ ...data, max: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-1">
              Bước chính (Step)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={data.step}
              onChange={(e) => onChangeData({ ...data, step: Math.max(1, Number(e.target.value)) })}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center"
            />
          </div>
        </div>

        {/* Tùy chọn chia nhỏ đơn vị theo phân số */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSubDiv}
                onChange={(e) =>
                  onChangeData({ ...data, autoSubDivision: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>Tự động chia nhỏ đơn vị theo phân số (SGK)</span>
            </label>
            {autoSubDiv && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {currentOptimalSubDiv > 1 ? `Chia ${currentOptimalSubDiv} phần/đơn vị` : 'Không có phân số'}
              </span>
            )}
          </div>

          {!autoSubDiv && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 shrink-0">Số phần chia thủ công:</label>
              <select
                value={data.subDivision || 1}
                onChange={(e) =>
                  onChangeData({ ...data, subDivision: Number(e.target.value) })
                }
                className="text-xs px-2 py-1 bg-white border border-slate-300 rounded"
              >
                <option value={1}>1 (Không chia nhỏ)</option>
                <option value={2}>2 (Chia đôi: 1/2)</option>
                <option value={3}>3 (Chia ba: 1/3)</option>
                <option value={4}>4 (Chia tư: 1/4)</option>
                <option value={5}>5 (Chia năm: 1/5)</option>
                <option value={6}>6 (Chia sáu: 1/6)</option>
                <option value={8}>8 (Chia tám: 1/8)</option>
                <option value={10}>10 (Chia mười: 0.1)</option>
              </select>
            </div>
          )}

          <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
            💡 <strong>Quy chuẩn SGK:</strong> Vạch số nguyên 0, 1, 2... có nhãn số căn giữa. Các vạch chia phụ chỉ vẽ vạch, <strong>tuyệt đối không ghi số</strong>. Nhãn chỉ xuất hiện tại đúng điểm biểu diễn.
          </div>
        </div>
      </div>

      {/* 4. DANH SÁCH CÁC ĐIỂM BIỂU DIỄN (MARKERS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các điểm biểu diễn ({markers.length})
          </h4>

          <button
            onClick={() => handleAddMarker('1/2')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm điểm</span>
          </button>
        </div>

        {markers.length === 0 && (
          <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
            Chưa có điểm nào trên trục. Nhấn &quot;Thêm điểm&quot; hoặc chọn mẫu nhanh phía trên.
          </div>
        )}

        {markers.map((m, index) => {
          const parsed = parseMathExpression(m.expression || m.numericValue || m.value || 0);

          return (
            <div
              key={m.id}
              className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* Tên điểm */}
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Tên điểm
                    </label>
                    <input
                      type="text"
                      value={m.pointName || ''}
                      onChange={(e) => handleUpdateMarker(m.id, { pointName: e.target.value })}
                      placeholder="VD: A"
                      className="w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded text-center"
                    />
                  </div>

                  {/* Biểu thức giá trị */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Biểu thức (1/3, 3/5, √2, 0,(3), -2.5...)
                    </label>
                    <input
                      type="text"
                      value={m.expression || String(m.value ?? m.numericValue ?? '')}
                      onChange={(e) => handleUpdateMarkerExpr(m.id, e.target.value)}
                      placeholder="VD: 1/3 hoặc √2 hoặc 0,(3)"
                      className="w-full text-xs font-bold px-2.5 py-1 border border-blue-300 bg-blue-50/40 rounded text-blue-900 font-mono"
                    />
                  </div>
                </div>

                {/* Nút xóa */}
                <button
                  onClick={() => handleDeleteMarker(m.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  title="Xóa điểm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Thông tin toán học nhận diện & Dời nhãn */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Toán học:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {parsed.type === 'fraction' && parsed.fraction
                      ? `Phân số ${parsed.fraction.numerator}/${parsed.fraction.denominator} ≈ ${parsed.numericValue.toFixed(4)}`
                      : parsed.type === 'repeating' && parsed.fraction
                      ? `Tuần hoàn = ${parsed.fraction.numerator}/${parsed.fraction.denominator}`
                      : parsed.type === 'irrational'
                      ? `Số vô tỉ ≈ ${parsed.numericValue.toFixed(4)}`
                      : `Giá trị: ${parsed.numericValue}`}
                  </span>
                </div>

                {/* Màu điểm */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">Màu:</span>
                  <input
                    type="color"
                    value={m.color || '#dc2626'}
                    onChange={(e) => handleUpdateMarker(m.id, { color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0"
                  />
                </div>
              </div>

              {/* Nút bật minh họa nếu là số vô tỉ */}
              {(m.expression?.includes('√2') || m.expression?.includes('sqrt(2)')) && (
                <div className="pt-1 flex items-center justify-between bg-blue-50/60 p-1.5 rounded border border-blue-200">
                  <span className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Minh họa hình học √2 cho điểm này:</span>
                  </span>
                  <button
                    onClick={() =>
                      onChangeData({
                        ...data,
                        illustration: {
                          ...illustration,
                          enabled: !illustration.enabled,
                          targetType: 'sqrt2',
                        },
                      })
                    }
                    className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                      illustration.enabled && illustration.targetType === 'sqrt2'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {illustration.enabled && illustration.targetType === 'sqrt2'
                      ? 'Đang bật'
                      : 'Bật minh họa √2'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. CÔNG CỤ MINH HỌA HÌNH HỌC CHO SỐ VÔ TỈ (√2, √5) */}
      <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Minh họa số vô tỉ trên trục số</span>
          </h4>

          <label className="flex items-center gap-1.5 text-xs font-bold text-blue-800 cursor-pointer">
            <input
              type="checkbox"
              checked={illustration.enabled}
              onChange={(e) =>
                onChangeData({
                  ...data,
                  illustration: { ...illustration, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span>{illustration.enabled ? 'Đang hiển thị' : 'Bật minh họa'}</span>
          </label>
        </div>

        {illustration.enabled && (
          <div className="space-y-2.5 pt-1">
            {/* Chọn số vô tỉ để minh họa */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Số vô tỉ cần minh họa
                </label>
                <select
                  value={illustration.targetType}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        targetType: e.target.value as any,
                      },
                    })
                  }
                  className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-bold text-blue-900"
                >
                  <option value="sqrt2">Số vô tỉ √2 (Đáy 1, Cao 1)</option>
                  <option value="sqrt5">Số vô tỉ √5 (Đáy 2, Cao 1)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Chế độ giảng dạy
                </label>
                <select
                  value={illustration.mode}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        mode: e.target.value as any,
                      },
                    })
                  }
                  className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                >
                  <option value="visual">Chế độ 1: Trực quan (Lớp 7)</option>
                  <option value="pythagoras_grade8">Chế độ 2: Giải thích Pitago (Lớp 8)</option>
                </select>
              </div>
            </div>

            {/* Tùy chọn chi tiết các thành phần minh họa */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={illustration.showTriangle}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        showTriangle: e.target.checked,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Tam giác vuông OAB</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={illustration.showArc}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        showArc: e.target.checked,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Cung tròn tâm O cắt trục</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={illustration.showSideLengths}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        showSideLengths: e.target.checked,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Độ dài cạnh (1, 1, √2)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={illustration.showRightAngleMarker}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        showRightAngleMarker: e.target.checked,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Ký hiệu góc vuông</span>
              </label>
            </div>

            {illustration.mode === 'pythagoras_grade8' && (
              <label className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={illustration.showFormulas}
                  onChange={(e) =>
                    onChangeData({
                      ...data,
                      illustration: {
                        ...illustration,
                        showFormulas: e.target.checked,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>Hiển thị bảng công thức Pitago (OB² = OA² + AB²)</span>
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
