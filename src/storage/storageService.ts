import { BASIC_TEXTBOOK_TEMPLATES, type TextbookTemplate } from './textbookTemplates';
import { ChartDocument, ToolType } from '../types';

export interface StorageService {
  getAll(): Promise<ChartDocument[]>;
  getById(id: string): Promise<ChartDocument | null>;
  save(doc: ChartDocument): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<ChartDocument>;
}

const STORAGE_KEY = 'toan_thcs_saved_documents_v1';

export class LocalStorageService implements StorageService {
  async getAll(): Promise<ChartDocument[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as ChartDocument[];
    } catch (e) {
      console.error('Failed to load from storage:', e);
      return [];
    }
  }

  async getById(id: string): Promise<ChartDocument | null> {
    const list = await this.getAll();
    return list.find((item) => item.id === id) || null;
  }

  async save(doc: ChartDocument): Promise<void> {
    const list = await this.getAll();
    const existingIndex = list.findIndex((item) => item.id === doc.id);
    const updatedDoc = {
      ...doc,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedDoc;
    } else {
      list.unshift(updatedDoc);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  async duplicate(id: string): Promise<ChartDocument> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Không tìm thấy tài liệu để nhân bản');
    }

    const newDoc: ChartDocument = {
      ...original,
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: `${original.title} (Bản sao)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.save(newDoc);
    return newDoc;
  }
}

export const storage = new LocalStorageService();

// Hàm tạo ID ngẫu nhiên
const genId = () => 'tpl_' + Math.random().toString(36).substr(2, 9);

/**
 * Bộ mẫu chuẩn SGK Toán THCS (Textbook standard templates)
 */
const LEGACY_TEXTBOOK_TEMPLATES: TextbookTemplate[] = [
  // 1. Định lý Ta-lét / Tam giác đồng dạng
  {
    id: genId(),
    type: 'GEOMETRY_TRIANGLE',
    title: 'Định lý Ta-lét / Tam giác đồng dạng (Toán 8)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: { title: 'Định lý Ta-lét (MN // BC)', fontFamily: 'Times New Roman', titleFontSize: 18, labelFontSize: 14, strokeWidth: 1.5, examMode: false, width: 640, height: 480, showLegend: false, legendPosition: 'none', backgroundColor: '#ffffff' },
    data: {
      geometry: {
        subType: 'triangle',
        triangle: {
          type: 'general', vertexNames: ['A', 'B', 'C'], points: [{x: 320, y: 100}, {x: 150, y: 350}, {x: 500, y: 350}],
          showVertices: true, showLabels: true, altitudes: [], medians: [], bisectors: [], perpBisectors: [], showRightAngleMarker: false, showEqualSidesMarker: false, showSideLengths: false, sideLengthLabels: ['','',''],
          auxPoints: [
            { id: 'p1', name: 'M', type: 'ratio', segment: ['A', 'B'], ratio: 0.5, color: '#000', showPoint: true, showLabel: true },
            { id: 'p2', name: 'N', type: 'ratio', segment: ['A', 'C'], ratio: 0.5, color: '#000', showPoint: true, showLabel: true }
          ],
          auxLines: [
            { id: 'l1', from: 'M', to: 'N', style: 'solid', color: '#dc2626', strokeWidth: 2, arrows: 'none', enabled: true, showLabel: false }
          ],
          parallelMarkers: [
            { id: 'pm1', segment1: ['M', 'N'], segment2: ['B', 'C'], arrowCount: 1, color: '#000', enabled: true }
          ]
        }
      }
    }
  },
  // 2. Tứ giác nội tiếp đường tròn
  {
    id: genId(),
    type: 'GEOMETRY_CIRCLE',
    title: 'Tứ giác nội tiếp đường tròn (Toán 9)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: { title: 'Tứ giác ABCD nội tiếp (O)', fontFamily: 'Times New Roman', titleFontSize: 18, labelFontSize: 14, strokeWidth: 1.5, examMode: false, width: 640, height: 480, showLegend: false, legendPosition: 'none', backgroundColor: '#ffffff' },
    data: {
      geometry: {
        subType: 'circle',
        circle: {
          presetType: 'basic', centerName: 'O', radius: 140, showCenterPoint: true, showCenterLabel: true, showRadius: false, radiusPointName: '', radiusLabel: '', showRadiusLabel: false,
          points: [{x: 320, y: 240}],
          auxPoints: [
            { id: 'a', name: 'A', type: 'on-circle', angle: -60, color: '#000', showPoint: true, showLabel: true },
            { id: 'b', name: 'B', type: 'on-circle', angle: 30, color: '#000', showPoint: true, showLabel: true },
            { id: 'c', name: 'C', type: 'on-circle', angle: 120, color: '#000', showPoint: true, showLabel: true },
            { id: 'd', name: 'D', type: 'on-circle', angle: 210, color: '#000', showPoint: true, showLabel: true }
          ],
          auxLines: [
            { id: 'l1', from: 'A', to: 'B', style: 'solid', color: '#000', strokeWidth: 1.5, arrows: 'none', enabled: true },
            { id: 'l2', from: 'B', to: 'C', style: 'solid', color: '#000', strokeWidth: 1.5, arrows: 'none', enabled: true },
            { id: 'l3', from: 'C', to: 'D', style: 'solid', color: '#000', strokeWidth: 1.5, arrows: 'none', enabled: true },
            { id: 'l4', from: 'D', to: 'A', style: 'solid', color: '#000', strokeWidth: 1.5, arrows: 'none', enabled: true },
            { id: 'l5', from: 'A', to: 'C', style: 'dashed', color: '#64748b', strokeWidth: 1.2, arrows: 'none', enabled: true },
            { id: 'l6', from: 'B', to: 'D', style: 'dashed', color: '#64748b', strokeWidth: 1.2, arrows: 'none', enabled: true }
          ]
        }
      }
    }
  },
  // 3. Đồ thị hàm số bậc nhất
  {
    id: genId(),
    type: 'FUNCTION_GRAPH',
    title: 'Tương giao 2 đồ thị hàm số (Toán 9)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: { title: 'Giao điểm của d1 và d2', fontFamily: 'Times New Roman', titleFontSize: 18, labelFontSize: 14, strokeWidth: 1.5, examMode: false, width: 640, height: 480, showLegend: false, legendPosition: 'none', backgroundColor: '#ffffff' },
    data: {
      functionGraph: {
        functionType: 'linear', a: 2, b: -2, xMin: -3, xMax: 4, yMin: -4, yMax: 5, showEquation: true, showGrid: true,
        secondFunction: { enabled: true, functionType: 'linear', a: -1, b: 1, lineColor: '#dc2626', name: 'd2' },
        showIntersections: true, showIntersectionProjections: true
      }
    }
  },
  // 4. Biểu đồ quạt Thống kê
  {
    id: genId(),
    type: 'PIE_CHART',
    title: 'Biểu đồ xếp loại học lực (Toán 7)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: { title: 'Tỉ lệ xếp loại học lực lớp 7A', fontFamily: 'Times New Roman', titleFontSize: 18, labelFontSize: 14, strokeWidth: 1.3, examMode: false, width: 640, height: 480, showLegend: true, legendPosition: 'bottom', backgroundColor: '#ffffff' },
    data: {
      pie: { unit: '%', radius: 150, showPercentageOnSlice: true, showNameOnSlice: false, showValuesOnSlice: false, decimalPlaces: 0, startAngle: 0, slices: [
        { id: 's1', name: 'Tốt', value: 25, color: '#3b82f6', pattern: 'solid', patternColor: '#000', patternBg: '#fff', isLocked: false },
        { id: 's2', name: 'Khá', value: 45, color: '#10b981', pattern: 'hatch-right', patternColor: '#000', patternBg: '#fff', isLocked: false },
        { id: 's3', name: 'Đạt', value: 20, color: '#f59e0b', pattern: 'dots', patternColor: '#000', patternBg: '#fff', isLocked: false },
        { id: 's4', name: 'Chưa đạt', value: 10, color: '#ef4444', pattern: 'crosshatch', patternColor: '#000', patternBg: '#fff', isLocked: false }
      ]}
    }
  }
];

export const TEXTBOOK_TEMPLATES: TextbookTemplate[] = [...LEGACY_TEXTBOOK_TEMPLATES, ...BASIC_TEXTBOOK_TEMPLATES];
