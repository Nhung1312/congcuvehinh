/**
 * GeminiGeometryProvider.ts
 * Nhà cung cấp AI Gemini 3.8 Flash tích hợp giao thức GeometrySpecification
 */
import { IAIGeometryProvider } from '../AIGeometryProvider';
import { GeometrySpecification } from '../types';

export class GeminiGeometryProvider implements IAIGeometryProvider {
  public readonly id = 'gemini';
  public readonly name = 'Gemini 3.8 Flash (Toán THCS)';
  public readonly description = 'Phân tích đề bài tiếng Việt bằng mô hình Gemini 3.8 Flash kết hợp Geometry Engine';

  public async parseGeometryProblem(prompt: string, userApiKey?: string): Promise<GeometrySpecification> {
    let response: Response;
    try {
      response = await fetch('/api/geometry/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ prompt, apiKey: userApiKey?.trim() || undefined }),
      });
    } catch {
      throw new Error('Không kết nối được máy chủ AI. Hãy kiểm tra chức năng API trên Vercel.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `Lỗi máy chủ AI (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data?.spec) {
      throw new Error('Máy chủ AI không trả về dữ liệu hình học hợp lệ.');
    }
    return data.spec as GeometrySpecification;
  }
}
