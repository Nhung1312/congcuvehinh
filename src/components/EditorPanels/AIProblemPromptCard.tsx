import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Edit3,
  Play,
  RotateCcw,
  X,
  Eye,
  Maximize2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { DocumentAiMetadata } from '../../types';

interface AIProblemPromptCardProps {
  metadata?: DocumentAiMetadata;
  onUpdatePrompt: (newPrompt: string) => void;
  onRerunAI?: (prompt: string) => Promise<void> | void;
  isAIRunning?: boolean;
}

export const AIProblemPromptCard: React.FC<AIProblemPromptCardProps> = ({
  metadata,
  onUpdatePrompt,
  onRerunAI,
  isAIRunning = false,
}) => {
  const prompt = metadata?.aiPrompt || '';
  const generatedPrompt = metadata?.aiGeneratedPrompt || prompt;
  const questionImage = metadata?.aiQuestionImage;
  const generationSource = metadata?.aiGenerationSource;
  const isOutdated = Boolean(generatedPrompt && prompt && prompt.trim() !== generatedPrompt.trim());

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(prompt);
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!prompt && !questionImage) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveOnly = () => {
    onUpdatePrompt(editText.trim());
    setIsEditing(false);
  };

  const handleSaveAndRerun = async () => {
    const trimmed = editText.trim();
    onUpdatePrompt(trimmed);
    setIsEditing(false);
    if (onRerunAI) {
      await onRerunAI(trimmed);
    }
  };

  const handleCancelEdit = () => {
    setEditText(prompt);
    setIsEditing(false);
  };

  const handleTriggerRerun = async () => {
    if (onRerunAI && prompt.trim()) {
      await onRerunAI(prompt.trim());
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50/90 via-indigo-50/40 to-slate-50/60 border border-blue-200/90 rounded-xl p-3 shadow-xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-md bg-blue-100 text-blue-700 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider truncate">
            Đề bài đang dựng
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100/80 text-blue-800 border border-blue-200/60 shrink-0">
            {generationSource === 'gemini' ? 'Gemini 3.8 Flash' : 'AI Dựng hình'}
          </span>
        </div>

        {/* Quick Tools in Header */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className={`p-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                copied
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
              title="Sao chép toàn bộ đề bài vào bộ nhớ tạm"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span className="hidden sm:inline text-[10px]">{copied ? 'Đã chép' : 'Chép đề'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditText(prompt);
                setIsEditing(true);
              }}
              className="p-1 rounded-md text-[11px] font-medium flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition"
              title="Chỉnh sửa nội dung đề bài"
            >
              <Edit3 className="w-3 h-3 text-blue-600" />
              <span className="hidden sm:inline text-[10px]">Sửa đề</span>
            </button>
          </div>
        )}
      </div>

      {/* Body: Prompt text or Edit area */}
      {isEditing ? (
        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-blue-300 shadow-xs">
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Chỉnh sửa văn bản đề bài:
          </label>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="w-full text-xs font-sans p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 leading-relaxed shadow-inner"
            placeholder="Nhập hoặc chỉnh sửa đề bài..."
          />
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 bg-white shadow-2xs"
            >
              Lưu đề
            </button>
            <button
              type="button"
              disabled={isAIRunning || !editText.trim()}
              onClick={handleSaveAndRerun}
              className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow-xs flex items-center gap-1 transition"
            >
              {isAIRunning ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>Dựng lại với đề mới</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Cảnh báo nếu đề bài đã sửa nhưng chưa bấm dựng lại */}
          {isOutdated && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Đề bài đã sửa (chưa dựng lại)</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-snug">
                Hình vẽ hiện tại đang thuộc về đề bài cũ. Bấm <b>Dựng lại bằng AI</b> bên dưới để AI vẽ lại hình khớp với đề bài này.
              </p>
            </div>
          )}

          {/* Main prompt box */}
          {prompt ? (
            <div className="bg-white/95 p-3 rounded-lg border border-blue-100/90 text-xs font-sans text-slate-800 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap selection:bg-blue-100 shadow-2xs">
              {prompt}
            </div>
          ) : (
            <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100 text-[11px] text-slate-500 italic flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Đề bài được nhập từ ảnh chụp</span>
            </div>
          )}

          {/* Optional Question Image thumbnail preview */}
          {questionImage && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-blue-150 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={`data:${questionImage.mimeType};base64,${questionImage.data}`}
                  alt="Ảnh đề bài gốc"
                  className="w-9 h-9 object-contain rounded border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-80 transition shrink-0"
                  onClick={() => setShowImageModal(true)}
                  title="Nhấn để xem ảnh phóng to"
                />
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-700 truncate">
                    Ảnh đề bài gốc
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Đã nhận dạng và dựng hình
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-2 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 shrink-0"
                title="Xem ảnh đề bài kích thước gốc"
              >
                <Eye className="w-3 h-3" />
                <span>Xem ảnh</span>
              </button>
            </div>
          )}

          {/* Dựng lại bằng AI action button */}
          {onRerunAI && (
            <button
              type="button"
              disabled={isAIRunning}
              onClick={handleTriggerRerun}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
              title="Phân tích và dựng lại hình từ đề bài này"
            >
              {isAIRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang dựng lại hình...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Dựng lại bằng AI</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal for Question Image */}
      {showImageModal && questionImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 space-y-3 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Ảnh đề bài gốc</span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 p-2 rounded-lg border border-slate-200">
              <img
                src={`data:${questionImage.mimeType};base64,${questionImage.data}`}
                alt="Ảnh đề bài gốc phóng to"
                className="max-w-full max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
