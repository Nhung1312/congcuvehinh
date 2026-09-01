/**
 * MockGeometryProvider.ts
 * Nhà cung cấp AI giả lập thông minh: Phân tích ngôn ngữ tiếng Việt toán học và trả về cấu trúc GeometrySpecification
 */
import { IAIGeometryProvider } from '../AIGeometryProvider';
import { GeometrySpecification } from '../types';
import { VietnameseGeometryParser } from '../parser/vietnameseGeometryParser';

export class MockGeometryProvider implements IAIGeometryProvider {
  public readonly id = 'mock';
  public readonly name = 'AI Parser Cục Bộ (Quy tắc SGK THCS)';
  public readonly description = 'Phân tích cú pháp đề bài tiếng Việt bằng engine hình học nội bộ chuẩn SGK';

  public async parseGeometryProblem(prompt: string): Promise<GeometrySpecification> {
    // Giả lập độ trễ xử lý suy luận (300ms) để giao diện có trạng thái mượt mà
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    if (!prompt || !prompt.trim()) {
      throw new Error('Vui lòng nhập nội dung đề bài Toán THCS.');
    }

    const spec = VietnameseGeometryParser.parse(prompt);
    return spec;
  }
}
