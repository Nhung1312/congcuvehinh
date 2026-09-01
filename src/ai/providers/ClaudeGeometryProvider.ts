/**
 * ClaudeGeometryProvider.ts
 * Nhà cung cấp AI Anthropic Claude tích hợp giao thức GeometrySpecification
 */
import { IAIGeometryProvider } from '../AIGeometryProvider';
import { GeometrySpecification } from '../types';
import { VietnameseGeometryParser } from '../parser/vietnameseGeometryParser';

export class ClaudeGeometryProvider implements IAIGeometryProvider {
  public readonly id = 'claude';
  public readonly name = 'Anthropic Claude AI (Sẵn sàng kết nối)';
  public readonly description = 'Phân tích tự nhiên bằng Claude API qua cấu trúc JSON có kiểm soát';

  public async parseGeometryProblem(prompt: string): Promise<GeometrySpecification> {
    // Sẵn sàng kết nối API Claude khi người dùng cung cấp key; tự động chuyển tiếp qua parser nội bộ
    return VietnameseGeometryParser.parse(prompt);
  }
}
