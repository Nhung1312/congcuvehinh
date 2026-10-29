/**
 * AIGeometryEditor.tsx
 * Giao diện công cụ 🤖 AI TỰ DỰNG HÌNH TOÁN THCS
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Cpu,
  Layers,
  ArrowRight,
  Lightbulb,
  Code2,
  Copy,
  Check,
  ImagePlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { ChartDocument, BaseChartSettings, ToolType } from '../../types';
import { AI_GEOMETRY_PRESETS, GeometryProblemPreset } from '../../ai/aiPresets';
import { MockGeometryProvider } from '../../ai/providers/MockGeometryProvider';
import { GeminiGeometryProvider } from '../../ai/providers/GeminiGeometryProvider';
import { ClaudeGeometryProvider } from '../../ai/providers/ClaudeGeometryProvider';
import { GeometrySpecificationAdapter } from '../../ai/adapter/geometrySpecificationAdapter';
import { GeometrySpecification } from '../../ai/types';
import { validateGeometryImageInput, type GeometryImageInput } from '../../ai/geometryImageInput';
import { prepareGeometryQuestionImage } from '../../ai/geometryImageClient';

interface AIGeometryEditorProps {
  currentDoc: ChartDocument;
  onApplyDoc: (newDoc: ChartDocument) => void;
  onSwitchToManualTool?: (toolType: ToolType) => void;
  onViewDrawing?: () => void;
}

type ProviderKey = 'mock' | 'gemini' | 'claude';

export const AIGeometryEditor: React.FC<AIGeometryEditorProps> = ({
  currentDoc,
  onApplyDoc,
  onSwitchToManualTool,
  onViewDrawing,
}) => {
  // Remember the exact question across Preview refreshes (API keys remain separate).
  const promptStorageKey = 'congcuvehinh-ai-question-text-v1';
  const imageStorageKey = 'congcuvehinh-ai-question-image-tab-v1';
  const [prompt, setPrompt] = useState<string>(() => {
    if (currentDoc.metadata?.aiPrompt) return currentDoc.metadata.aiPrompt;
    try { return window.localStorage.getItem(promptStorageKey) || ''; } catch { return ''; }
  });
  const [questionImage, setQuestionImage] = useState<GeometryImageInput | undefined>(() => {
    if (currentDoc.metadata?.aiQuestionImage) return currentDoc.metadata.aiQuestionImage;
    try {
      const stored = window.sessionStorage.getItem(imageStorageKey);
      return stored ? validateGeometryImageInput(JSON.parse(stored)) : undefined;
    } catch { return undefined; }
  });
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try { window.localStorage.setItem(promptStorageKey, prompt); } catch { /* storage disabled */ }
  }, [prompt]);
  useEffect(() => {
    try {
      if (questionImage) window.sessionStorage.setItem(imageStorageKey, JSON.stringify(questionImage));
      else window.sessionStorage.removeItem(imageStorageKey);
    } catch { /* private browsing/quota; image remains in the active editor */ }
  }, [questionImage]);
  const selectImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    setErrorMsg(null);
    try {
      const image = await prepareGeometryQuestionImage(file);
      setQuestionImage(image);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể đọc ảnh đề.');
    } finally {
      setImageBusy(false);
    }
  };
  const handleImagePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    let pasted: File | null = null;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        pasted = item.getAsFile();
        break;
      }
    }
    if (pasted) {
      event.preventDefault();
      void selectImage(pasted);
    }
  };
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('gemini');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepStatus, setStepStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedProvider, setFailedProvider] = useState<ProviderKey | null>(null);
  const [lastResult, setLastResult] = useState<GeometrySpecification | null>(null);
  const [showJsonSpec, setShowJsonSpec] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Key cá nhân của từng khách hàng, không lưu trên server hay trong tài liệu hình.
  // Chỉ lưu sessionStorage khi người dùng chủ động chọn, không dùng localStorage.
  const storageKey = 'congcuvehinh-gemini-key-session';
  const [saveKeyForTab, setSaveKeyForTab] = useState(() => {
    try { return window.sessionStorage.getItem(storageKey) !== null; } catch { return false; }
  });
  const [userApiKey, setUserApiKey] = useState(() => {
    try { return window.sessionStorage.getItem(storageKey) || ''; } catch { return ''; }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const changeApiKey = (value: string) => {
    setUserApiKey(value);
    if (saveKeyForTab) {
      try {
        if (value) window.sessionStorage.setItem(storageKey, value);
        else window.sessionStorage.removeItem(storageKey);
      } catch { /* Private browsing may block sessionStorage. */ }
    }
  };
  const changeSaveKey = (enabled: boolean) => {
    setSaveKeyForTab(enabled);
    try {
      if (enabled && userApiKey) window.sessionStorage.setItem(storageKey, userApiKey);
      else window.sessionStorage.removeItem(storageKey);
    } catch { /* Browser blocked storage. */ }
  };
  const clearApiKey = () => {
    setUserApiKey('');
    setSaveKeyForTab(false);
    try { window.sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
  };

  // Khởi tạo các provider
  const providers = {
    gemini: new GeminiGeometryProvider(),
    mock: new MockGeometryProvider(),
    claude: new ClaudeGeometryProvider(),
  };

  const handleRunAI = async (customPrompt?: string, overrideImage?: GeometryImageInput | null) => {
    const input = (customPrompt ?? prompt).trim();
    const image = overrideImage === undefined ? questionImage : (overrideImage || undefined);
    if (!input && !image) {
      setErrorMsg('Vui lòng nhập đề hoặc dán/chọn ảnh đề bài.');
      return;
    }

    if (image && selectedProvider !== 'gemini') {
      setErrorMsg('Đọc đề từ ảnh cần Gemini. Hãy chọn Gemini 3.8 Flash, hoặc xóa ảnh nếu dùng bộ quy tắc.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    setFailedProvider(null);
    setLastResult(null);
    setStepStatus('Đang phân tích đề...');

    try {
      // Gemini nhận key riêng của khách hàng chỉ trong request đang chạy.
      // Các provider quy tắc không nhận hoặc lưu key.
      const spec = selectedProvider === 'gemini'
        ? await providers.gemini.parseGeometryProblem(input, userApiKey, image)
        : await providers[selectedProvider].parseGeometryProblem(input);
      if (selectedProvider !== 'gemini') {
        spec.generationInfo = { source: 'rules', message: 'Bộ quy tắc SGK (không sử dụng Gemini).' };
      }
      
      setStepStatus('Đang dựng hình...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Bước 2: Chuyển GeometrySpecification sang ChartDocument qua Geometry Engine Adapter
      const newDoc = GeometrySpecificationAdapter.specToChartDocument(
        spec,
        currentDoc.settings
      );

      // Lưu trữ đề bài gốc vào metadata của tài liệu để luôn hiển thị ưu tiên khi chỉnh sửa
      newDoc.metadata = {
        aiPrompt: input,
        aiGeneratedPrompt: input,
        aiQuestionImage: image ? { mimeType: image.mimeType, data: image.data } : undefined,
        aiDetectedEntities: spec.detectedEntities,
        aiExplanation: spec.explanation,
        aiGenerationSource: selectedProvider,
      };

      // Bước 3: Đưa vào hệ thống render SVG và chỉnh sửa
      onApplyDoc(newDoc);
      setLastResult(spec);
      setStepStatus('Hoàn tất.');
      setTimeout(() => {
        setStepStatus(null);
      }, 1200);
    } catch (err: any) {
      setFailedProvider(selectedProvider);
      setErrorMsg(err.message || 'Không thể phân tích đề bài. Vui lòng kiểm tra lại cấu trúc câu.');
      setStepStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = (preset: GeometryProblemPreset) => {
    setPrompt(preset.prompt);
    setQuestionImage(undefined);
    void handleRunAI(preset.prompt, null);
  };

  return (
    <div className="space-y-3 select-none text-slate-800">
      {/* 1. Tiêu đề duy nhất: AI dựng hình */}
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">AI dựng hình</h2>

        {/* Hàng nhỏ chọn bộ máy AI & Nút mở rộng Cài đặt AI */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium text-slate-700">
            {selectedProvider === 'gemini'
              ? 'Gemini 3.8 Flash'
              : selectedProvider === 'mock'
              ? 'Quy tắc SGK'
              : 'Claude (chưa tích hợp)'}
          </span>
          <button
            type="button"
            onClick={() => setShowAiSettings(!showAiSettings)}
            className={`p-1 rounded-md transition ${
              showAiSettings
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Cài đặt AI (bộ máy & API key)"
            aria-label="Cài đặt AI"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Mục Cài đặt AI (Mặc định ĐÓNG, mở khi bấm icon góc phải) */}
      {showAiSettings && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="font-bold text-slate-800">Cài đặt AI</span>
            <button
              type="button"
              onClick={() => setShowAiSettings(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700"
            >
              Thu gọn
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Bộ máy phân tích:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedProvider('gemini')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                  selectedProvider === 'gemini'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Gemini 3.8 Flash
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('mock')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                  selectedProvider === 'mock'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Quy tắc SGK
              </button>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200">
            <label htmlFor="geometry-user-api-key" className="text-[11px] font-semibold text-slate-700">
              API key Gemini cá nhân (tùy chọn):
            </label>
            <div className="flex gap-1.5">
              <input
                id="geometry-user-api-key"
                type={showApiKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={userApiKey}
                onChange={(e) => changeApiKey(e.target.value)}
                placeholder="Dùng key hệ thống nếu để trống"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                className="rounded-lg px-2 border border-slate-300 bg-white text-[11px] text-slate-600 hover:bg-slate-50"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Ẩn' : 'Hiện'}
              </button>
              {userApiKey && (
                <button
                  type="button"
                  className="rounded-lg px-2 border border-slate-300 bg-white text-[11px] text-red-600 hover:bg-red-50"
                  onClick={clearApiKey}
                >
                  Xóa
                </button>
              )}
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-0.5">
              <input type="checkbox" checked={saveKeyForTab} onChange={(e) => changeSaveKey(e.target.checked)} />
              <span>Nhớ key trong phiên làm việc này</span>
            </label>
            <p className="text-[10px] text-slate-500">
              {userApiKey.trim()
                ? '✓ Đang ưu tiên dùng API key cá nhân của bạn.'
                : '✓ Chưa nhập key: Hệ thống tự động dùng key tích hợp sẵn.'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Ô nhập đề bài (Ngay dưới tiêu đề & bộ máy) */}
      <div className="space-y-1.5">
        <label htmlFor="geometry-ai-prompt" className="sr-only">
          Nội dung đề bài toán:
        </label>
        <div className="relative">
          <textarea
            id="geometry-ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handleImagePaste}
            rows={5}
            maxLength={6000}
            placeholder="Nhập hoặc dán đề bài Toán vào đây..."
            title="Nội dung đề bài toán (Hỗ trợ Ctrl+V ảnh)"
            className="w-full text-xs font-sans p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-2xs leading-relaxed resize-y"
          />

          <div className="absolute right-2 bottom-2.5 flex items-center gap-1 bg-white/90 p-0.5 rounded-md">
            <input
              ref={imageFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Chọn ảnh đề bài"
              onChange={(e) => {
                void selectImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => imageFileRef.current?.click()}
              disabled={isProcessing || imageBusy}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Chọn ảnh đề (hoặc nhấn Ctrl+V vào ô đề)"
              aria-label="Chọn ảnh đề"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span className="sr-only">Chọn ảnh đề</span>
            </button>
          </div>
        </div>

        {/* Thumbnail ảnh nếu có */}
        {questionImage && (
          <div className="flex items-center justify-between p-2 rounded-lg border border-blue-200 bg-blue-50/70 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={`data:${questionImage.mimeType};base64,${questionImage.data}`}
                alt="Ảnh đề bài"
                className="w-10 h-10 object-contain rounded border border-blue-200 bg-white shrink-0"
              />
              <span className="text-xs font-semibold text-blue-900 truncate">Ảnh đề bài đã nhận</span>
            </div>
            <button
              type="button"
              onClick={() => setQuestionImage(undefined)}
              disabled={isProcessing}
              className="p-1 rounded text-red-500 hover:bg-red-100 transition"
              title="Xóa ảnh đề"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Nút Dựng hình AI rõ ràng */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleRunAI()}
          disabled={isProcessing || imageBusy || (!prompt.trim() && !questionImage)}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 ${
            isProcessing || (!prompt.trim() && !questionImage)
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed border border-blue-200'
              : 'bg-blue-100/90 hover:bg-blue-200/90 text-blue-900 border border-blue-200 active:scale-98'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
              <span>Đang dựng hình...</span>
            </>
          ) : (
            <span>Dựng hình AI</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleRunAI()}
          disabled={isProcessing || imageBusy || (!prompt.trim() && !questionImage)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
          title="Dựng lại hình vẽ"
          aria-label="Dựng lại hình vẽ"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Trạng thái lỗi nếu có */}
      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* 5. Mục Đề mẫu (Mặc định ĐÓNG theo đúng mockup: Đề mẫu ▾) */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setIsPresetsOpen(!isPresetsOpen)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition"
        >
          <span>Đề mẫu</span>
          {isPresetsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isPresetsOpen && (
          <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {AI_GEOMETRY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="w-full text-left p-2 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 border border-slate-200 rounded-lg text-xs transition space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] truncate">
                    {preset.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold shrink-0">
                    {preset.grade}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 font-normal">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Chi tiết phân tích & JSON (Mặc định thu gọn) */}
      {lastResult && !isProcessing && (
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <span>Thông tin phân tích & JSON</span>
            {showAnalysisDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAnalysisDetails && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800">
                  {lastResult.generationInfo?.model || 'Gemini 3.8 Flash'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Đã chép' : 'Chép JSON'}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>Nhóm: <b>{lastResult.shapeCategory}</b></div>
                <div>Đường cao: {lastResult.altitudes?.length ?? 0} | Trung tuyến: {lastResult.medians?.length ?? 0}</div>
                <div>Điểm phụ: {lastResult.auxPoints?.length ?? 0}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
