import React, { useState } from 'react';
import { X, Table, Sparkles, ArrowRight, Clipboard, Check } from 'lucide-react';
import { ChartDocument, ToolType } from '../types';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (newDoc: ChartDocument) => void;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [pasteText, setPasteText] = useState(
    `Danh mục\tGiá trị\nBơi lội\t40\nBóng đá\t35\nCầu lông\t25`
  );
  const [targetType, setTargetType] = useState<ToolType>('PIE_CHART');
  const [chartTitle, setChartTitle] = useState('BẢNG THỐNG KÊ SỐ LIỆU');
  const [parsedRows, setParsedRows] = useState<{ col1: string; col2: number; col3?: number }[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    try {
      const lines = pasteText.trim().split('\n');
      const rows: { col1: string; col2: number; col3?: number }[] = [];

      lines.forEach((line, idx) => {
        const parts = line.split(/[\t,;|]/).map((p) => p.trim());
        if (parts.length >= 2) {
          // Bỏ qua dòng header nếu là chữ
          const val1 = parseFloat(parts[1]);
          if (isNaN(val1) && idx === 0) {
            return;
          }
          const val2 = parts[2] ? parseFloat(parts[2]) : undefined;
          rows.push({
            col1: parts[0] || `Mục ${rows.length + 1}`,
            col2: isNaN(val1) ? 0 : val1,
            col3: val2 !== undefined && !isNaN(val2) ? val2 : undefined,
          });
        }
      });

      setParsedRows(rows);
      setHasParsed(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChart = () => {
    if (parsedRows.length === 0) {
      handleParse();
    }

    const rowsToUse = parsedRows.length > 0 ? parsedRows : [
      { col1: 'Mục A', col2: 40 },
      { col1: 'Mục B', col2: 35 },
      { col1: 'Mục C', col2: 25 },
    ];

    const baseDoc: ChartDocument = {
      id: 'doc_' + Date.now(),
      type: targetType,
      title: chartTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        title: chartTitle,
        fontFamily: 'Times New Roman',
        titleFontSize: 18,
        labelFontSize: 14,
        strokeWidth: 1.3,
        examMode: false,
        width: 640,
        height: 480,
        showLegend: true,
        legendPosition: 'bottom',
        backgroundColor: '#ffffff',
      },
      data: {},
    };

    if (targetType === 'PIE_CHART') {
      baseDoc.data.pie = {
        unit: '%',
        radius: 150,
        showPercentageOnSlice: true,
        showNameOnSlice: false,
        showValuesOnSlice: false,
        decimalPlaces: 0,
        startAngle: 0,
        slices: rowsToUse.map((r, i) => ({
          id: `p_${i}`,
          name: r.col1,
          value: r.col2,
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
          pattern: 'solid',
          patternColor: '#000000',
          patternBg: '#ffffff',
          isLocked: false,
        })),
      };
    } else if (targetType === 'BAR_CHART') {
      baseDoc.data.bar = {
        orientation: 'vertical',
        xAxisTitle: 'Danh mục',
        yAxisTitle: 'Số lượng',
        unit: '',
        barWidth: 40,
        barGap: 24,
        showValueOnBar: true,
        showAxisArrows: true,
        showGridLines: true,
        items: rowsToUse.map((r, i) => ({
          id: `b_${i}`,
          category: r.col1,
          value: r.col2,
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
          pattern: 'solid',
          patternColor: '#000000',
        })),
      };
    } else if (targetType === 'DOUBLE_BAR_CHART') {
      baseDoc.data.doubleBar = {
        group1Name: 'Nhóm 1',
        group2Name: 'Nhóm 2',
        group1Color: '#3b82f6',
        group1Pattern: 'solid',
        group2Color: '#f59e0b',
        group2Pattern: 'hatch-right',
        xAxisTitle: 'Danh mục',
        yAxisTitle: 'Số lượng',
        unit: '',
        barWidth: 28,
        groupGap: 24,
        showValueOnBar: true,
        showGridLines: true,
        items: rowsToUse.map((r, i) => ({
          id: `db_${i}`,
          category: r.col1,
          value1: r.col2,
          value2: r.col3 !== undefined ? r.col3 : Math.round(r.col2 * 1.2),
        })),
      };
    } else if (targetType === 'LINE_CHART') {
      baseDoc.data.line = {
        xAxisTitle: 'Danh mục',
        yAxisTitle: 'Giá trị',
        unit: '',
        lineColor: '#000000',
        lineWidth: 1.8,
        lineStyle: 'solid',
        pointRadius: 4,
        pointStyle: 'circle',
        showPoints: true,
        showValues: true,
        showDashedProjections: true,
        showGridLines: true,
        points: rowsToUse.map((r, i) => ({
          id: `lp_${i}`,
          xLabel: r.col1,
          xValue: i + 1,
          yValue: r.col2,
        })),
      };
    }

    onApplyData(baseDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Bảng số liệu đa năng & Dán từ Excel
              </h3>
              <p className="text-xs text-slate-500">
                Dán bảng dữ liệu trực tiếp từ Word, Excel hoặc Google Sheets để tự động vẽ biểu đồ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề biểu đồ
            </label>
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Dán số liệu (Tab hoặc Dấu phẩy phân tách)
              </label>
              <button
                onClick={handleParse}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kiểm tra dữ liệu</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                setHasParsed(false);
              }}
              placeholder={`Danh mục\tGiá trị\nBơi lội\t40\nBóng đá\t35\nCầu lông\t25`}
              className="w-full font-mono text-xs p-3 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Chọn loại biểu đồ muốn chuyển đổi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chuyển đổi thành loại biểu đồ:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'PIE_CHART' as ToolType, label: 'Quạt tròn (%)' },
                { type: 'BAR_CHART' as ToolType, label: 'Cột đơn' },
                { type: 'DOUBLE_BAR_CHART' as ToolType, label: 'Cột kép' },
                { type: 'LINE_CHART' as ToolType, label: 'Đoạn thẳng' },
              ].map((t) => (
                <button
                  key={t.type}
                  onClick={() => setTargetType(t.type)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                    targetType === t.type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
          >
            Đóng
          </button>
          <button
            onClick={handleCreateChart}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <span>Tạo biểu đồ ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
