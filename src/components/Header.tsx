import React from 'react';
import {
  Undo,
  Redo,
  FilePlus,
  Save,
  FolderOpen,
  BookOpen,
  Table,
  FileDown,
  Copy,
  Printer,
  Sparkles,
  HelpCircle,
  Check,
  Download,
  Upload,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ChartDocument } from '../types';

interface HeaderProps {
  currentDoc: ChartDocument;
  onNewDoc: () => void;
  onSaveDoc: () => void;
  onOpenSaved: () => void;
  onOpenTemplates: () => void;
  onOpenDataTable: () => void;
  onOpenHelp: () => void;
  onOpenAIModal?: () => void;
  onCopyImage: () => void;
  onCopySvg: () => void;
  onCopyTikz: () => void; // Thêm prop onCopyTikz
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadJson: () => void;
  onUploadJson: (file: File) => void;
  onToggleExamMode: () => void;
  examMode: boolean;
  copyFeedback: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDoc,
  onNewDoc,
  onSaveDoc,
  onOpenSaved,
  onOpenTemplates,
  onOpenDataTable,
  onOpenHelp,
  onOpenAIModal,
  onCopyImage,
  onCopySvg,
  onCopyTikz, // Lấy prop từ App.tsx
  onDownloadPng,
  onDownloadSvg,
  onDownloadJson,
  onUploadJson,
  onToggleExamMode,
  examMode,
  copyFeedback,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadJson(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 sm:px-6 shadow-md border-b border-slate-800 shrink-0 z-30">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner font-bold text-white text-lg">
          ∑
        </div>
        <div>
          <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide flex items-center gap-2">
            TOOL VẼ BIỂU ĐỒ & HÌNH TOÁN THCS
          </h1>
          <p className="text-xs text-slate-400 font-normal hidden sm:block">
            Xuất hình chuẩn đề kiểm tra, tài liệu Word & bài giảng
          </p>
        </div>
      </div>

      {/* Center Actions / Quick Modals */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Nút AI Dựng Hình Nổi Bật */}
        {onOpenAIModal && (
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 transition shadow-xs"
            title="🤖 AI Tự động dựng hình học từ đề bài tiếng Việt"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Dựng Hình</span>
          </button>
        )}

        {/* Khối Undo / Redo */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-md p-0.5 border border-slate-700 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition ${canUndo ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
            title="Hoàn tác (Ctrl + Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700"></div>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition ${canRedo ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
            title="Làm lại (Ctrl + Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onNewDoc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Tạo hình vẽ mới"
        >
          <FilePlus className="w-4 h-4 text-blue-400" />
          <span>Tạo mới</span>
        </button>

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Thư viện mẫu SGK Cánh Diều, Kết Nối, Chân Trời"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Mẫu SGK</span>
        </button>

        <button
          onClick={onOpenDataTable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Nhập và dán bảng từ Excel / Google Sheets"
        >
          <Table className="w-4 h-4 text-amber-400" />
          <span>Bảng số liệu</span>
        </button>

        <button
          onClick={onOpenSaved}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Danh sách hình đã lưu"
        >
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span>Đã lưu</span>
        </button>

        <button
          onClick={onSaveDoc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          title="Lưu cấu hình hình vẽ hiện tại"
        >
          <Save className="w-4 h-4" />
          <span>Lưu</span>
        </button>
      </div>

      {/* Right Controls: Exam Mode & Export Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Chế độ Đề thi (Đen trắng) */}
        <button
          onClick={onToggleExamMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
            examMode
              ? 'bg-slate-100 text-slate-900 border-white shadow-sm ring-2 ring-blue-400'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Chế độ nét đen trắng hoa văn chuyên dùng in đề thi THCS"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Chế độ In Đề</span>
        </button>

        {/* NÚT SAO CHÉP HÌNH NHANH (CHO WORD) */}
        <button
          onClick={onCopyImage}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition animate-pulse-slow"
          title="Sao chép ảnh vào Clipboard (Ctrl + V sang Word ngay)"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Sao chép Hình (Word)</span>
          <span className="sm:hidden">Copy</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Xuất hình</span>
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 text-sm"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  onCopyImage();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Copy className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-medium text-xs">Sao chép ảnh PNG</div>
                  <div className="text-[10px] text-slate-400">Ctrl + V trực tiếp sang Word</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onCopySvg();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Copy className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-medium text-xs">Sao chép mã SVG</div>
                  <div className="text-[10px] text-slate-400">Dành cho phần mềm vector</div>
                </div>
              </button>

              {/* Nút Copy TikZ mới */}
              <div className="border-t border-slate-700 my-1"></div>
              <button
                onClick={() => {
                  onCopyTikz();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium text-xs">Sao chép mã TikZ (LaTeX)</div>
                  <div className="text-[10px] text-slate-400">Dùng cho Overleaf / MathType</div>
                </div>
              </button>

              <div className="border-t border-slate-700 my-1"></div>

              <button
                onClick={() => {
                  onDownloadPng();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-medium text-xs">Tải PNG Siêu Nét (600 DPI)</div>
                  <div className="text-[10px] text-slate-400">Độ phân giải cao in ấn</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onDownloadSvg();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-medium text-xs">Tải file SVG Vector</div>
                  <div className="text-[10px] text-slate-400">Không vỡ hình khi phóng to</div>
                </div>
              </button>

              <div className="border-t border-slate-700 my-1"></div>

              <button
                onClick={() => {
                  onDownloadJson();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium text-xs">Tải cấu hình JSON</div>
                  <div className="text-[10px] text-slate-400">Lưu để chỉnh sửa lại sau</div>
                </div>
              </button>

              <label className="w-full text-left px-3.5 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2.5 cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-medium text-xs">Nhập cấu hình JSON</div>
                  <div className="text-[10px] text-slate-400">Mở file đã lưu từ máy</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>

        {/* Nút Hướng dẫn */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
          title="Hướng dẫn sử dụng & chèn Word"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Copy Toast Feedback Popup */}
      {copyFeedback && (
        <div className="fixed top-20 right-6 bg-slate-900/95 text-emerald-300 border border-emerald-500/50 shadow-2xl px-4 py-3 rounded-lg flex items-center gap-3 z-50 text-sm backdrop-blur-sm animate-bounce-short">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span>{copyFeedback}</span>
        </div>
      )}
    </header>
  );
};