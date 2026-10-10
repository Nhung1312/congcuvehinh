/**
 * AIGeometryModal.tsx
 * Dialog Modal cho công cụ 🤖 AI TỰ ĐỘNG DỰNG HÌNH THCS
 */
import React from 'react';
import { X, Sparkles, Bot } from 'lucide-react';
import { ChartDocument, ToolType } from '../types';
import { AIGeometryEditor } from './EditorPanels/AIGeometryEditor';

interface AIGeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: ChartDocument;
  onApplyDoc: (newDoc: ChartDocument) => void;
  onSwitchToManualTool?: (toolType: ToolType) => void;
}

export const AIGeometryModal: React.FC<AIGeometryModalProps> = ({
  isOpen,
  onClose,
  currentDoc,
  onApplyDoc,
  onSwitchToManualTool,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>AI TỰ DỰNG HÌNH TOÁN THCS</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-normal">
                  Chuyển Đề bài → Hình vẽ SGK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhập đề bài tiếng Việt hoặc chọn đề mẫu có sẵn bên dưới
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <AIGeometryEditor
            currentDoc={currentDoc}
            onApplyDoc={onApplyDoc}
            onViewDrawing={onClose}
            onSwitchToManualTool={(type) => {
              if (onSwitchToManualTool) onSwitchToManualTool(type);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
