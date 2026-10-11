import React, { useEffect, useRef, useState } from 'react';
import { X, BookOpen, Search, TrendingUp } from 'lucide-react';
import type { ChartDocument } from '../types';
import { TEXTBOOK_TEMPLATES } from '../storage/storageService';
import { createTemplateDocument, getTemplateCategory, type TextbookCategory } from '../storage/textbookTemplates';
import { GeometrySvg } from '../renderers/GeometrySvg';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (doc: ChartDocument) => void;
}
const categories: TextbookCategory[] = ['Đường thẳng & Góc', 'Tam giác', 'Tứ giác', 'Đường tròn', 'Đồ thị & Biểu đồ'];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [category, setCategory] = useState<TextbookCategory | 'Tất cả'>('Tất cả');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    setCategory('Tất cả');
    setQuery('');
    const previous = document.activeElement as HTMLElement | null;
    searchRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, input');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const matches = TEXTBOOK_TEMPLATES.filter(tpl => (category === 'Tất cả' || getTemplateCategory(tpl) === category)
    && normalize(`${tpl.title} ${tpl.textbookDescription || tpl.settings.title}`).includes(normalize(query)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="templates-title"
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-700" />
            <div>
              <h2 id="templates-title" className="text-base font-bold text-slate-800">Mẫu hình cơ bản THCS</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chọn hình có sẵn, chỉnh tên điểm và đường phụ rồi xuất hình. Không cần AI.</p>
            </div>
          </div>
          <button type="button" aria-label="Đóng thư viện mẫu" onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-200 rounded-md"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-3 border-b border-slate-200 space-y-3 shrink-0">
          <label className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input ref={searchRef} aria-label="Tìm mẫu hình" placeholder="Tìm hình: tam giác cân, trung trực, tiếp tuyến…"
              value={query} onChange={e => setQuery(e.target.value)} className="w-full outline-none text-sm" />
          </label>
          <div className="flex gap-2 flex-wrap" aria-label="Nhóm mẫu hình">
            {(['Tất cả', ...categories] as const).map(item => (
              <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium ${item === category
                  ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{item}</button>
            ))}
          </div>
          <p className="text-xs text-slate-500" role="status">{matches.length} mẫu có sẵn</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {matches.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy mẫu. Thử tên hình khác.</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(tpl => (
                <button key={tpl.id} type="button" data-template-id={tpl.id}
                  onClick={() => { onSelectTemplate(createTemplateDocument(tpl)); onClose(); }}
                  className="flex flex-col border border-slate-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-md transition text-left group focus-visible:ring-2 focus-visible:ring-blue-500">
                  <div className="h-40 w-full bg-white border-b border-slate-100 flex items-center justify-center pointer-events-none [&>svg]:w-full [&>svg]:h-full" aria-hidden="true">
                    {tpl.data.geometry ? (
                      <GeometrySvg data={tpl.data.geometry} svgId={`preview-${tpl.id}`} settings={{ ...tpl.settings, fontSize: 24, showTitle: false }} />
                    ) : <TrendingUp className="w-12 h-12 text-blue-500" />}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{tpl.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex-1">{tpl.textbookDescription || tpl.settings.title}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500">{tpl.textbookGrade ? `Lớp ${tpl.textbookGrade}` : getTemplateCategory(tpl)}</span>
                      <span className="text-xs text-blue-700 font-semibold">Dùng mẫu →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
