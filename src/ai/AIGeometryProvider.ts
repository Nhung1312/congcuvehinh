/**
 * AIGeometryProvider.ts
 * Interface chuẩn cho các nhà cung cấp AI Dựng hình (Mock, Gemini, Claude)
 */
import { GeometrySpecification } from './types';

export interface IAIGeometryProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  /**
   * Phân tích đề bài tiếng Việt và sinh ra GeometrySpecification
   */
  parseGeometryProblem(prompt: string): Promise<GeometrySpecification>;
}

export type ProviderType = 'mock' | 'gemini' | 'claude';
