/**
 * AIGeometryEditor.tsx
 * Giao diện công cụ 🤖 AI TỰ DỰNG HÌNH TOÁN THCS
 */
import React, { useState } from 'react';
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
} from 'lucide-react';
import { ChartDocument, BaseChartSettings, ToolType } from '../../types';
import { AI_GEOMETRY_PRESETS, GeometryProblemPreset } from '../../ai/aiPresets';
import { MockGeometryProvider } from '../../ai/providers/MockGeometryProvider';
import { GeminiGeometryProvider } from '../../ai/providers/GeminiGeometryProvider';
import { ClaudeGeometryProvider } from '../../ai/providers/ClaudeGeometryProvider';
import { GeometrySpecificationAdapter } from '../../ai/adapter/geometrySpecificationAdapter';
import { GeometrySpecification } from '../../ai/types';

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
  const [prompt, setPrompt] = useState<string>(
    'Cho tam giác ABC nhọn. Kẻ đường cao AH từ đỉnh A xuống cạnh BC (H thuộc BC).'
  );
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

  const handleRunAI = async (customPrompt?: string) => {
    const input = (customPrompt || prompt).trim();
    if (!input) {
      setErrorMsg('Vui lòng nhập đề bài hình học.');
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
        ? await providers.gemini.parseGeometryProblem(input, userApiKey)
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
    handleRunAI(preset.prompt);
  };

  return (
    <div className="space-y-5 select-none text-slate-800">
      {/* Banner Giới thiệu */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>AI TỰ ĐỘNG DỰNG HÌNH THCS</span>
              <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded-full font-semibold">
                Toán 6-9
              </span>
            </h3>
            <p className="text-[11px] text-slate-600">
              Nhập đề bài tiếng Việt tự nhiên → AI tính toán tọa độ & vẽ hình chuẩn SGK
            </p>
          </div>
        </div>
      </div>

      {/* Lựa chọn Provider */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            Bộ máy xử lý AI:
          </span>
          <span className="text-[10px] text-slate-500 font-normal">Độc lập & Có thể mở rộng</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedProvider('gemini')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
              selectedProvider === 'gemini'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Quy tắc SGK
          </button>
          <button
            type="button"
            onClick={() => setSelectedProvider('claude')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
              selectedProvider === 'claude'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Claude (chưa tích hợp)
          </button>
        </div>
      </div>

      {/* BYOK: mỗi khách hàng dùng key của mình, chỉ gửi tới server khi yêu cầu dựng hình. */}
      <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
        <label htmlFor="geometry-user-api-key" className="text-xs font-bold text-slate-800">
          API key Gemini cá nhân (Gemini 3.8 Flash)
        </label>
        <div className="flex gap-2">
          <input
            id="geometry-user-api-key"
            type={showApiKey ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={userApiKey}
            onChange={(e) => changeApiKey(e.target.value)}
            placeholder="Dán API key Gemini của bạn vào đây"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" className="rounded-lg px-2 border border-slate-300 bg-white text-xs" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? 'Ẩn' : 'Hiện'}
          </button>
          <button type="button" className="rounded-lg px-2 border border-slate-300 bg-white text-xs" onClick={clearApiKey}>
            Xóa
          </button>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-700">
          <input type="checkbox" checked={saveKeyForTab} onChange={(e) => changeSaveKey(e.target.checked)} />
          Nhớ key trong phiên tab này (không chọn trên máy dùng chung)
        </label>
        <p className="text-[11px] text-slate-600">
          Key chỉ gửi tới API của ứng dụng khi bấm dựng hình; không ghi vào tài liệu hay cơ sở dữ liệu.
          {selectedProvider === 'gemini' && !userApiKey.trim()
            ? ' Cần dán API key cá nhân để kiểm tra Gemini 3.8 Flash.'
            : ''}
        </p>
        <a className="text-[11px] text-blue-700 underline" href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">
          Mở Google AI Studio để tạo/quản lý API key
        </a>
      </div>

      {/* Ô nhập đề bài */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            Nội dung đề bài toán:
          </label>
          <span className="text-[10px] text-slate-400">Hỗ trợ mọi cách diễn đạt</span>
        </div>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ví dụ: Cho tam giác ABC nhọn. Kẻ đường cao AH từ đỉnh A xuống BC. Kẻ trung tuyến AM và phân giác AD..."
            className="w-full text-xs font-sans p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-2xs leading-relaxed"
          />
        </div>
      </div>

      {/* Nút hành động chính */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleRunAI()}
          disabled={isProcessing || !prompt.trim()}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition ${
            isProcessing
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-98'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang dựng hình...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Phân Tích & Dựng Hình AI</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleRunAI()}
          disabled={isProcessing || !prompt.trim()}
          className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          title="Dựng lại hình vẽ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Trạng thái xử lý / Thông báo */}
      {stepStatus && (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2.5 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span className="font-medium">{stepStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {failedProvider === 'gemini'
                ? 'GEMINI THẤT BẠI'
                : 'LỖI PHÂN TÍCH'}
            </span>
          </div>
          <p className="text-[11px] text-red-700 leading-relaxed">{errorMsg}</p>
          {failedProvider === 'gemini' && (
            <p className="text-[10px] text-red-600 italic">
              API lỗi. Hệ thống không tự chuyển sang parser quy tắc nội bộ.
            </p>
          )}
        </div>
      )}

      {/* Kết quả phân tích thành công */}
      {lastResult && !isProcessing && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
          {/* Header trạng thái nguồn kết quả */}
          {lastResult.generationInfo?.source === 'gemini' ? (
            <div className="p-2.5 bg-white border border-emerald-300 rounded-lg space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>GEMINI THÀNH CÔNG: Có phản hồi JSON hợp lệ</span>
              </div>
              <div className="text-[11px] text-slate-700 grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                <div>
                  Model thực tế: <strong className="font-mono text-emerald-900">{lastResult.generationInfo.model || 'gemini-3.8-flash'}</strong>
                </div>
                <div>
                  Nhóm hình: <strong className="text-emerald-900">{lastResult.shapeCategory}</strong>
                </div>
                <div>
                  Đường cao (altitudes): <strong className="text-emerald-900">{lastResult.altitudes?.length ?? 0}</strong>
                </div>
                <div>
                  Trung tuyến (medians): <strong className="text-emerald-900">{lastResult.medians?.length ?? 0}</strong>
                </div>
                <div>
                  Phân giác (bisectors): <strong className="text-emerald-900">{lastResult.bisectors?.length ?? 0}</strong>
                </div>
                <div>
                  Điểm phụ (auxPoints): <strong className="text-emerald-900">{lastResult.auxPoints?.length ?? 0}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-white border border-amber-300 rounded-lg space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>QUY TẮC SGK: Hình được phân tích bằng parser nội bộ</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {lastResult.generationInfo?.message || 'Không gọi Gemini AI.'}
              </p>
            </div>
          )}

          {/* Nút xem hình & Xem JSON */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowJsonSpec(!showJsonSpec)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition shadow-2xs"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showJsonSpec ? 'Ẩn JSON GeometrySpecification' : 'Xem JSON GeometrySpecification AI'}</span>
            </button>
            {onViewDrawing && (
              <button
                type="button"
                onClick={onViewDrawing}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Xem hình
              </button>
            )}
          </div>

          {/* Khối hiển thị JSON GeometrySpecification */}
          {showJsonSpec && (
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-slate-100 text-[10px] font-mono space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                <span>JSON GeometrySpecification ({lastResult.generationInfo?.model || 'AI'})</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap leading-tight text-[10px] text-emerald-300">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-1 pt-1">
            <div className="text-[11px] font-bold text-slate-700">Các thực thể nhận diện:</div>
            {lastResult.detectedEntities.map((ent, i) => (
              <div key={i} className="text-[11px] text-emerald-900 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{ent}</span>
              </div>
            ))}
          </div>

          {onSwitchToManualTool && (
            <div className="pt-2 border-t border-emerald-200/80">
              <button
                type="button"
                onClick={() => onSwitchToManualTool(currentDoc.type)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-2xs"
              >
                <span>Chuyển sang Chỉnh sửa thủ công</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Danh sách 12 Đề Mẫu THCS Tiêu Chuẩn */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            12 Đề mẫu THCS chuẩn SGK:
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">Nhấn để dựng ngay</span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {AI_GEOMETRY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 border border-slate-200 rounded-lg text-xs transition group space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 group-hover:text-blue-800 text-[11px]">
                  {preset.title}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold group-hover:bg-blue-200 group-hover:text-blue-800">
                  {preset.grade}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-700 font-normal">
                {preset.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
