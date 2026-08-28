import React from 'react';
import { X, BookOpen, ChevronRight, PieChart, Triangle, Circle, TrendingUp } from 'lucide-react';
import { ChartDocument } from '../types';
import { TEXTBOOK_TEMPLATES } from '../storage/storageService';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (doc: ChartDocument) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    if (type.includes('PIE') || type.includes('BAR')) return <PieChart className="w-5 h-5 text-emerald-600" />;
    if (type.includes('TRIANGLE') || type.includes('QUAD')) return <Triangle className="w-5 h-5 text-amber-600" />;
    if (type.includes('CIRCLE')) return <Circle className="w-5 h-5 text-indigo-600" />;
    if (type.includes('FUNCTION') || type.includes('COORDINATE')) return <TrendingUp className="w-5 h-5 text-rose-600" />;
    return <BookOpen className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Thư viện Mẫu SGK (Templates)</h2>
              <p className="text-xs text-slate-500">Các hình vẽ thường gặp trong đề thi Toán THCS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-md transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEXTBOOK_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.id || idx}
                onClick={() => {
                  // Tạo bản sao độc lập của mẫu để không ghi đè lên mẫu gốc
                  const cloned = JSON.parse(JSON.stringify(tpl));
                  cloned.id = 'doc_' + Date.now();
                  onSelectTemplate(cloned);
                  onClose();
                }}
                className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md hover:bg-blue-50/30 transition text-left group"
              >
                <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition">
                  {getIcon(tpl.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.settings.title}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase">
                      {tpl.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition self-center" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};