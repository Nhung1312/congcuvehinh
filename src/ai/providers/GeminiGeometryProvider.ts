/**
 * GeminiGeometryProvider.ts
 * Nhà cung cấp AI Gemini 2.5 Flash-Lite tích hợp giao thức GeometrySpecification
 */
import { IAIGeometryProvider } from '../AIGeometryProvider';
import { GeometrySpecification } from '../types';
import { VietnameseGeometryParser } from '../parser/vietnameseGeometryParser';

export class GeminiGeometryProvider implements IAIGeometryProvider {
  public readonly id = 'gemini';
  public readonly name = 'Gemini 2.5 Flash-Lite (Toán THCS)';
  public readonly description = 'Phân tích đề bài tiếng Việt bằng mô hình Gemini 2.5 Flash-Lite kết hợp Geometry Engine';

  public async parseGeometryProblem(prompt: string): Promise<GeometrySpecification> {
    try {
      const response = await fetch('/api/geometry/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Lỗi máy chủ AI`);
      }

      const data = await response.json();
      if (data && data.spec) {
        return data.spec as GeometrySpecification;
      }
      throw new Error('Dữ liệu JSON trả về không đúng cấu trúc GeometrySpecification');
    } catch (err: any) {
      console.warn('[GeminiGeometryProvider] Kết nối API thất bại, kích hoạt bộ phân tích toán học dự phòng:', err?.message || err);
      // Fallback sang bộ phân tích cú pháp SGK nội bộ để đảm bảo ứng dụng không bao giờ bị gián đoạn
      const fallbackSpec = VietnameseGeometryParser.parse(prompt);
      if (!fallbackSpec.explanation || fallbackSpec.explanation.includes('SGK')) {
        fallbackSpec.explanation = `${fallbackSpec.explanation || 'Hình học chuẩn SGK'} (Phân tích cú pháp toán học)`;
      }
      return fallbackSpec;
    }
  }
}

