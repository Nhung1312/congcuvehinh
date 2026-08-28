import React, { useState } from 'react';
import {
  CustomAuxLine,
  CustomAuxPoint,
  CustomRightAngleMarker,
  CustomParallelMarker,
  CustomEqualSidesMarker,
  CustomEqualAnglesMarker,
  StrokeDashType,
} from '../../types';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  CornerDownRight,
  GitCommit,
  Hash,
  ArrowRight,
  Maximize2,
  Square,
  Sparkles,
} from 'lucide-react';

interface AuxiliaryElementsEditorProps {
  availablePoints?: string[];
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];
  onChange: (data: {
    auxLines?: CustomAuxLine[];
    auxPoints?: CustomAuxPoint[];
    rightAngleMarkers?: CustomRightAngleMarker[];
    parallelMarkers?: CustomParallelMarker[];
    equalSidesMarkers?: CustomEqualSidesMarker[];
    equalAnglesMarkers?: CustomEqualAnglesMarker[];
  }) => void;
}

export const AuxiliaryElementsEditor: React.FC<AuxiliaryElementsEditorProps> = ({
  availablePoints = ['A', 'B', 'C', 'D', 'M', 'N', 'P', 'H', 'K', 'O', 'I', 'E', 'F'],
  auxLines = [],
  auxPoints = [],
  rightAngleMarkers = [],
  parallelMarkers = [],
  equalSidesMarkers = [],
  equalAnglesMarkers = [],
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'lines' | 'points' | 'rightAngle' | 'parallel' | 'equalSides' | 'equalAngles'>('lines');
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // 1. Quản lý Đường phụ (AuxLines)
  const addAuxLine = () => {
    const fromPt = availablePoints[0] || 'A';
    const toPt = availablePoints[1] || 'B';
    const newLine: CustomAuxLine = {
      id: `aux-line-${Date.now()}`,
      from: fromPt,
      to: toPt,
      style: 'dashed',
      color: '#000000',
      strokeWidth: 1.4,
      arrows: 'none',
      enabled: true,
      showLabel: false,
    };
    onChange({
      auxLines: [...auxLines, newLine],
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const updateAuxLine = (id: string, partial: Partial<CustomAuxLine>) => {
    onChange({
      auxLines: auxLines.map((l) => (l.id === id ? { ...l, ...partial } : l)),
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const deleteAuxLine = (id: string) => {
    onChange({
      auxLines: auxLines.filter((l) => l.id !== id),
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  // 2. Quản lý Điểm phụ (AuxPoints)
  const addAuxPoint = () => {
    const newPoint: CustomAuxPoint = {
      id: `aux-pt-${Date.now()}`,
      name: 'M',
      type: 'midpoint',
      segment: ['B', 'C'],
      color: '#000000',
      showPoint: true,
      showLabel: true,
    };
    onChange({
      auxLines,
      auxPoints: [...auxPoints, newPoint],
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const updateAuxPoint = (id: string, partial: Partial<CustomAuxPoint>) => {
    onChange({
      auxLines,
      auxPoints: auxPoints.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const deleteAuxPoint = (id: string) => {
    onChange({
      auxLines,
      auxPoints: auxPoints.filter((p) => p.id !== id),
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  // 3. Quản lý Góc vuông (RightAngleMarkers)
  const addRightAngle = () => {
    const newMarker: CustomRightAngleMarker = {
      id: `ra-${Date.now()}`,
      vertex: 'H',
      ray1: 'A',
      ray2: 'C',
      size: 10,
      color: '#000000',
      strokeWidth: 1.2,
      enabled: true,
    };
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers: [...rightAngleMarkers, newMarker],
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const updateRightAngle = (id: string, partial: Partial<CustomRightAngleMarker>) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers: rightAngleMarkers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const deleteRightAngle = (id: string) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers: rightAngleMarkers.filter((m) => m.id !== id),
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  // 4. Quản lý Song song (ParallelMarkers)
  const addParallelMarker = () => {
    const newMarker: CustomParallelMarker = {
      id: `par-${Date.now()}`,
      segment1: ['A', 'B'],
      segment2: ['C', 'D'],
      arrowCount: 1,
      color: '#000000',
      enabled: true,
    };
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers: [...parallelMarkers, newMarker],
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const updateParallelMarker = (id: string, partial: Partial<CustomParallelMarker>) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers: parallelMarkers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  const deleteParallelMarker = (id: string) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers: parallelMarkers.filter((m) => m.id !== id),
      equalSidesMarkers,
      equalAnglesMarkers,
    });
  };

  // 5. Quản lý Cạnh bằng nhau (EqualSidesMarkers)
  const addEqualSidesMarker = () => {
    const newMarker: CustomEqualSidesMarker = {
      id: `eq-sides-${Date.now()}`,
      segments: [
        ['A', 'B'],
        ['A', 'C'],
      ],
      tickType: 1,
      color: '#000000',
      enabled: true,
    };
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers: [...equalSidesMarkers, newMarker],
      equalAnglesMarkers,
    });
  };

  const updateEqualSidesMarker = (id: string, partial: Partial<CustomEqualSidesMarker>) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers: equalSidesMarkers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
      equalAnglesMarkers,
    });
  };

  const deleteEqualSidesMarker = (id: string) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers: equalSidesMarkers.filter((m) => m.id !== id),
      equalAnglesMarkers,
    });
  };

  // 6. Quản lý Góc bằng nhau (EqualAnglesMarkers)
  const addEqualAnglesMarker = () => {
    const newMarker: CustomEqualAnglesMarker = {
      id: `eq-angles-${Date.now()}`,
      angles: [
        { vertex: 'A', ray1: 'B', ray2: 'D' },
        { vertex: 'A', ray1: 'D', ray2: 'C' },
      ],
      arcType: 1,
      color: '#000000',
      enabled: true,
    };
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers: [...equalAnglesMarkers, newMarker],
    });
  };

  const updateEqualAnglesMarker = (id: string, partial: Partial<CustomEqualAnglesMarker>) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers: equalAnglesMarkers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    });
  };

  const deleteEqualAnglesMarker = (id: string) => {
    onChange({
      auxLines,
      auxPoints,
      rightAngleMarkers,
      parallelMarkers,
      equalSidesMarkers,
      equalAnglesMarkers: equalAnglesMarkers.filter((m) => m.id !== id),
    });
  };

  const totalCount =
    auxLines.length +
    auxPoints.length +
    rightAngleMarkers.length +
    parallelMarkers.length +
    equalSidesMarkers.length +
    equalAnglesMarkers.length;

  return (
    <div className="border border-indigo-200 rounded-lg overflow-hidden bg-white shadow-xs">
      {/* Header Accordion */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-indigo-50/70 hover:bg-indigo-100/70 text-left transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-600" />
          <span className="text-xs font-bold text-indigo-950">
            Đường phụ & Ký hiệu hình học (Giai đoạn 3.2)
          </span>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
              {totalCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={14} className="text-indigo-700" /> : <ChevronRight size={14} className="text-indigo-700" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 border-t border-indigo-100">
          {/* Sub-tabs điều hướng 6 loại yếu tố */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('lines')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'lines' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đoạn nối ({auxLines.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'points' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Điểm phụ ({auxPoints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rightAngle')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'rightAngle' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vuông góc ({rightAngleMarkers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parallel')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'parallel' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Song song ({parallelMarkers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('equalSides')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'equalSides' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cạnh bằng ({equalSidesMarkers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('equalAngles')}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                activeTab === 'equalAngles' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Góc bằng ({equalAnglesMarkers.length})
            </button>
          </div>

          {/* TAB 1: ĐOẠN NỐI / ĐƯỜNG PHỤ TÙY Ý */}
          {activeTab === 'lines' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Nối 2 điểm bất kỳ (nét đứt / nét liền / mũi tên)
                </span>
                <button
                  type="button"
                  onClick={addAuxLine}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm đoạn nối</span>
                </button>
              </div>

              {auxLines.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có đoạn nối phụ nào. Nhấn "+ Thêm đoạn nối" để tạo.
                </div>
              ) : (
                <div className="space-y-2">
                  {auxLines.map((line, idx) => (
                    <div
                      key={line.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <label className="font-semibold text-slate-700">Đoạn:</label>
                          <input
                            type="text"
                            value={line.from}
                            onChange={(e) => updateAuxLine(line.id!, { from: e.target.value.trim() })}
                            placeholder="Điểm 1 (vd: A)"
                            className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-center bg-white"
                          />
                          <span className="text-slate-400">→</span>
                          <input
                            type="text"
                            value={line.to}
                            onChange={(e) => updateAuxLine(line.id!, { to: e.target.value.trim() })}
                            placeholder="Điểm 2 (vd: M)"
                            className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-center bg-white"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateAuxLine(line.id!, { enabled: line.enabled === false ? true : false })}
                            title={line.enabled === false ? 'Hiện' : 'Ẩn'}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            {line.enabled === false ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAuxLine(line.id!)}
                            title="Xóa"
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Tùy chỉnh nét & mũi tên */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Kiểu nét</label>
                          <select
                            value={line.style || 'dashed'}
                            onChange={(e) => updateAuxLine(line.id!, { style: e.target.value as StrokeDashType })}
                            className="w-full px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="dashed">Nét đứt (---)</option>
                            <option value="solid">Nét liền (───)</option>
                            <option value="dotted">Nét chấm (···)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Mũi tên</label>
                          <select
                            value={line.arrows || 'none'}
                            onChange={(e) => updateAuxLine(line.id!, { arrows: e.target.value as any })}
                            className="w-full px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="none">Không có</option>
                            <option value="end">Đầu cuối (→)</option>
                            <option value="start">Đầu bắt đầu (←)</option>
                            <option value="both">Hai đầu (↔)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Màu sắc</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={line.color || '#000000'}
                              onChange={(e) => updateAuxLine(line.id!, { color: e.target.value })}
                              className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0.5"
                              max="4"
                              step="0.2"
                              value={line.strokeWidth || 1.4}
                              onChange={(e) => updateAuxLine(line.id!, { strokeWidth: parseFloat(e.target.value) })}
                              className="w-12 px-1 py-0.5 border border-slate-300 rounded text-center text-[11px] bg-white"
                              title="Độ dày (px)"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tùy chọn Trung điểm & Nhãn */}
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px]">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={line.showMidpoint || false}
                            onChange={(e) => updateAuxLine(line.id!, { showMidpoint: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Hiện trung điểm</span>
                        </label>
                        {line.showMidpoint && (
                          <input
                            type="text"
                            value={line.midpointLabel || ''}
                            onChange={(e) => updateAuxLine(line.id!, { midpointLabel: e.target.value })}
                            placeholder="Tên (vd: I)"
                            className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ĐIỂM PHỤ TÍNH TOÁN (AuxPoints) */}
          {activeTab === 'points' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Tạo điểm M, N, H, K tự động theo trung điểm/chiếu/giao
                </span>
                <button
                  type="button"
                  onClick={addAuxPoint}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm điểm phụ</span>
                </button>
              </div>

              {auxPoints.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có điểm phụ nào. Nhấn "+ Thêm điểm phụ" để tạo.
                </div>
              ) : (
                <div className="space-y-2">
                  {auxPoints.map((pt, idx) => (
                    <div
                      key={pt.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <label className="font-semibold text-slate-700">Tên điểm:</label>
                          <input
                            type="text"
                            value={pt.name}
                            onChange={(e) => updateAuxPoint(pt.id!, { name: e.target.value.trim() })}
                            className="w-12 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-center bg-white text-indigo-700"
                          />
                          <select
                            value={pt.type}
                            onChange={(e) => updateAuxPoint(pt.id!, { type: e.target.value as any })}
                            className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="midpoint">Trung điểm của đoạn</option>
                            <option value="projection">Hình chiếu lên đoạn</option>
                            <option value="intersection">Giao 2 đường thẳng</option>
                            <option value="ratio">Tỉ lệ trên đoạn</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteAuxPoint(pt.id!)}
                          title="Xóa"
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Chi tiết theo type */}
                      {pt.type === 'midpoint' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Trung điểm của:</span>
                          <input
                            type="text"
                            value={pt.segment?.[0] || 'B'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { segment: [e.target.value.trim(), pt.segment?.[1] || 'C'] })
                            }
                            className="w-10 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>và</span>
                          <input
                            type="text"
                            value={pt.segment?.[1] || 'C'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { segment: [pt.segment?.[0] || 'B', e.target.value.trim()] })
                            }
                            className="w-10 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>
                      )}

                      {pt.type === 'projection' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500">Chiếu từ:</span>
                          <input
                            type="text"
                            value={pt.fromPoint || 'A'}
                            onChange={(e) => updateAuxPoint(pt.id!, { fromPoint: e.target.value.trim() })}
                            className="w-10 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span className="text-[11px] text-slate-500">lên đường nối:</span>
                          <input
                            type="text"
                            value={pt.targetLine?.[0] || 'B'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, {
                                targetLine: [e.target.value.trim(), pt.targetLine?.[1] || 'C'],
                              })
                            }
                            className="w-10 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={pt.targetLine?.[1] || 'C'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, {
                                targetLine: [pt.targetLine?.[0] || 'B', e.target.value.trim()],
                              })
                            }
                            className="w-10 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>
                      )}

                      {pt.type === 'intersection' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500">Giao (</span>
                          <input
                            type="text"
                            value={pt.line1?.[0] || 'A'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { line1: [e.target.value.trim(), pt.line1?.[1] || 'C'] })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={pt.line1?.[1] || 'C'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { line1: [pt.line1?.[0] || 'A', e.target.value.trim()] })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>) & (</span>
                          <input
                            type="text"
                            value={pt.line2?.[0] || 'B'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { line2: [e.target.value.trim(), pt.line2?.[1] || 'D'] })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={pt.line2?.[1] || 'D'}
                            onChange={(e) =>
                              updateAuxPoint(pt.id!, { line2: [pt.line2?.[0] || 'B', e.target.value.trim()] })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KÝ HIỆU VUÔNG GÓC (RightAngleMarkers) */}
          {activeTab === 'rightAngle' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Tự động xoay ô vuông vuông góc chuẩn xác
                </span>
                <button
                  type="button"
                  onClick={addRightAngle}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm ký hiệu vuông góc</span>
                </button>
              </div>

              {rightAngleMarkers.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có ký hiệu vuông góc nào. Nhấn "+ Thêm ký hiệu vuông góc" để tạo.
                </div>
              ) : (
                <div className="space-y-2">
                  {rightAngleMarkers.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Square size={13} className="text-indigo-600" />
                          <span className="font-semibold text-slate-700">Đỉnh vuông:</span>
                          <input
                            type="text"
                            value={m.vertex}
                            onChange={(e) => updateRightAngle(m.id!, { vertex: e.target.value.trim() })}
                            placeholder="Đỉnh (vd: H)"
                            className="w-12 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-center bg-white text-indigo-700"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateRightAngle(m.id!, { enabled: m.enabled === false ? true : false })}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            {m.enabled === false ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRightAngle(m.id!)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500">Tia 1:</span>
                          <input
                            type="text"
                            value={m.ray1}
                            onChange={(e) => updateRightAngle(m.id!, { ray1: e.target.value.trim() })}
                            placeholder="vd: A"
                            className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span className="text-[11px] text-slate-500 ml-1">Tia 2:</span>
                          <input
                            type="text"
                            value={m.ray2}
                            onChange={(e) => updateRightAngle(m.id!, { ray2: e.target.value.trim() })}
                            placeholder="vd: C"
                            className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-slate-500">Kích thước:</span>
                          <select
                            value={m.size || 10}
                            onChange={(e) => updateRightAngle(m.id!, { size: parseInt(e.target.value, 10) })}
                            className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="8">8px (Nhỏ)</option>
                            <option value="10">10px (Chuẩn)</option>
                            <option value="12">12px (Vừa)</option>
                            <option value="14">14px (Lớn)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KÝ HIỆU SONG SONG (ParallelMarkers) */}
          {activeTab === 'parallel' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Ký hiệu mũi tên song song (1 hoặc 2 mũi tên)
                </span>
                <button
                  type="button"
                  onClick={addParallelMarker}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm song song</span>
                </button>
              </div>

              {parallelMarkers.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có ký hiệu song song nào.
                </div>
              ) : (
                <div className="space-y-2">
                  {parallelMarkers.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700">Đoạn 1:</span>
                          <input
                            type="text"
                            value={m.segment1?.[0] || 'A'}
                            onChange={(e) =>
                              updateParallelMarker(m.id!, {
                                segment1: [e.target.value.trim(), m.segment1?.[1] || 'B'],
                              })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={m.segment1?.[1] || 'B'}
                            onChange={(e) =>
                              updateParallelMarker(m.id!, {
                                segment1: [m.segment1?.[0] || 'A', e.target.value.trim()],
                              })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />

                          <span className="font-semibold text-slate-700 ml-2">// Đoạn 2:</span>
                          <input
                            type="text"
                            value={m.segment2?.[0] || 'C'}
                            onChange={(e) =>
                              updateParallelMarker(m.id!, {
                                segment2: [e.target.value.trim(), m.segment2?.[1] || 'D'],
                              })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={m.segment2?.[1] || 'D'}
                            onChange={(e) =>
                              updateParallelMarker(m.id!, {
                                segment2: [m.segment2?.[0] || 'C', e.target.value.trim()],
                              })
                            }
                            className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteParallelMarker(m.id!)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">Mũi tên:</span>
                        <select
                          value={m.arrowCount || 1}
                          onChange={(e) => updateParallelMarker(m.id!, { arrowCount: parseInt(e.target.value, 10) as any })}
                          className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                        >
                          <option value="1">1 mũi tên (&gt;)</option>
                          <option value="2">2 mũi tên (&gt;&gt;)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KÝ HIỆU CẠNH BẰNG NHAU (EqualSidesMarkers) */}
          {activeTab === 'equalSides' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Gạch đánh dấu các cạnh bằng nhau (|, ||, |||, o, x)
                </span>
                <button
                  type="button"
                  onClick={addEqualSidesMarker}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm nhóm cạnh</span>
                </button>
              </div>

              {equalSidesMarkers.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có ký hiệu cạnh bằng nhau.
                </div>
              ) : (
                <div className="space-y-2">
                  {equalSidesMarkers.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Kiểu gạch:</span>
                          <select
                            value={m.tickType || 1}
                            onChange={(e) =>
                              updateEqualSidesMarker(m.id!, {
                                tickType: isNaN(parseInt(e.target.value, 10))
                                  ? (e.target.value as any)
                                  : (parseInt(e.target.value, 10) as any),
                              })
                            }
                            className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="1">1 gạch ( | )</option>
                            <option value="2">2 gạch ( || )</option>
                            <option value="3">3 gạch ( ||| )</option>
                            <option value="o">Vòng tròn nhỏ ( o )</option>
                            <option value="x">Dấu chéo ( x )</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteEqualSidesMarker(m.id!)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Các cạnh trong nhóm */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 block">Danh sách các cạnh áp dụng:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.segments?.map((seg, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded"
                            >
                              <input
                                type="text"
                                value={seg[0]}
                                onChange={(e) => {
                                  const newSegs = [...(m.segments || [])];
                                  newSegs[sIdx] = [e.target.value.trim(), seg[1]];
                                  updateEqualSidesMarker(m.id!, { segments: newSegs });
                                }}
                                className="w-6 text-center font-bold"
                              />
                              <span>-</span>
                              <input
                                type="text"
                                value={seg[1]}
                                onChange={(e) => {
                                  const newSegs = [...(m.segments || [])];
                                  newSegs[sIdx] = [seg[0], e.target.value.trim()];
                                  updateEqualSidesMarker(m.id!, { segments: newSegs });
                                }}
                                className="w-6 text-center font-bold"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newSegs = [...(m.segments || []), ['A', 'B'] as [string, string]];
                              updateEqualSidesMarker(m.id!, { segments: newSegs });
                            }}
                            className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                          >
                            + Cạnh
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: KÝ HIỆU GÓC BẰNG NHAU (EqualAnglesMarkers) */}
          {activeTab === 'equalAngles' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Cung đánh dấu các góc bằng nhau (1 cung, 2 cung, gạch, chấm)
                </span>
                <button
                  type="button"
                  onClick={addEqualAnglesMarker}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                >
                  <Plus size={12} />
                  <span>Thêm nhóm góc</span>
                </button>
              </div>

              {equalAnglesMarkers.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có ký hiệu góc bằng nhau.
                </div>
              ) : (
                <div className="space-y-2">
                  {equalAnglesMarkers.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Kiểu cung:</span>
                          <select
                            value={m.arcType || 1}
                            onChange={(e) =>
                              updateEqualAnglesMarker(m.id!, {
                                arcType: isNaN(parseInt(e.target.value, 10))
                                  ? (e.target.value as any)
                                  : (parseInt(e.target.value, 10) as any),
                              })
                            }
                            className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                          >
                            <option value="1">1 cung ( ⌒ )</option>
                            <option value="2">2 cung ( ⌒⌒ )</option>
                            <option value="3">3 cung ( ⌒⌒⌒ )</option>
                            <option value="arc-tick">1 cung có gạch ( ⌒| )</option>
                            <option value="arc-dot">1 cung có chấm ( ⌒· )</option>
                            <option value="double-arc">Cung kép</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteEqualAnglesMarker(m.id!)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Các góc trong nhóm */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 block">Các góc (Đỉnh - Tia 1 - Tia 2):</span>
                        <div className="space-y-1">
                          {m.angles?.map((ang, aIdx) => (
                            <div
                              key={aIdx}
                              className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded"
                            >
                              <span className="text-[10px] text-slate-400">∠</span>
                              <input
                                type="text"
                                value={ang.ray1}
                                onChange={(e) => {
                                  const newAngles = [...(m.angles || [])];
                                  newAngles[aIdx] = { ...ang, ray1: e.target.value.trim() };
                                  updateEqualAnglesMarker(m.id!, { angles: newAngles });
                                }}
                                placeholder="B"
                                className="w-8 text-center font-bold border border-slate-200 rounded"
                              />
                              <input
                                type="text"
                                value={ang.vertex}
                                onChange={(e) => {
                                  const newAngles = [...(m.angles || [])];
                                  newAngles[aIdx] = { ...ang, vertex: e.target.value.trim() };
                                  updateEqualAnglesMarker(m.id!, { angles: newAngles });
                                }}
                                placeholder="A (Đỉnh)"
                                className="w-10 text-center font-bold border border-indigo-300 text-indigo-700 rounded"
                              />
                              <input
                                type="text"
                                value={ang.ray2}
                                onChange={(e) => {
                                  const newAngles = [...(m.angles || [])];
                                  newAngles[aIdx] = { ...ang, ray2: e.target.value.trim() };
                                  updateEqualAnglesMarker(m.id!, { angles: newAngles });
                                }}
                                placeholder="D"
                                className="w-8 text-center font-bold border border-slate-200 rounded"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newAngles = [
                                ...(m.angles || []),
                                { vertex: 'A', ray1: 'B', ray2: 'C' },
                              ];
                              updateEqualAnglesMarker(m.id!, { angles: newAngles });
                            }}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                          >
                            + Thêm góc vào nhóm
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
