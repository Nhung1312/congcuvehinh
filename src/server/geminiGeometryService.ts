/**
 * geminiGeometryService.ts
 * Server-side service xử lý phân tích đề bài Toán THCS bằng mô hình Gemini 3.8 Flash.
 * Bảo mật hoàn toàn API key trong môi trường server.
 */
import { GoogleGenAI, Type } from '@google/genai';
import { GeometrySpecification } from '../ai/types';
import { VietnameseGeometryParser } from '../ai/parser/vietnameseGeometryParser';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Sư phạm Hình học Toán THCS Việt Nam (Toán lớp 6, 7, 8, 9) và là bộ phân tích ngôn ngữ tự nhiên thành Cấu trúc Dữ liệu Hình học (Geometry Specification JSON).

Nhiệm vụ: Phân tích đề bài hình học tiếng Việt của người dùng và trả về DUY NHẤT một JSON hợp lệ tuân thủ chính xác schema hình học THCS để vẽ hình trên Geometry Engine.

QUY TẮC PHÂN LOẠI & NHẬN DIỆN THỰC THỂ HÌNH HỌC:

1. shapeCategory:
   - "triangle": khi đề bài về tam giác (nhọn, vuông, cân, đều, vuông cân, tù).
   - "quadrilateral": khi đề bài về tứ giác, hình chữ nhật, hình vuông, hình bình hành, hình thoi, hình thang, hình thang cân, hình thang vuông.
   - "circle": khi đề bài về đường tròn (O), tiếp tuyến, cát tuyến, dây cung, góc nội tiếp.
   - "line-ray": khi đề bài về đoạn thẳng, tia, đường thẳng song song, đường thẳng vuông góc, trung điểm.
   - "angle": khi đề bài về góc xOy, tia phân giác Oz, hai đường thẳng song song bị cắt bởi cát tuyến (góc so le trong, đồng vị, trong cùng phía).

2. ĐỐI VỚI TAM GIÁC (triangle):
   - type: "general" (tam giác thường / nhọn), "right" (vuông), "isosceles" (cân), "equilateral" (đều), "right-isosceles" (vuông cân), "obtuse" (tù).
   - vertices: mảng 3 đỉnh, ví dụ ["A", "B", "C"].
   - specialVertex: đỉnh góc vuông hoặc đỉnh cân (ví dụ "A").
   - altitudes: mảng các đường cao. Mỗi phần tử: { from: "A", toLine: "BC", foot: "H", showRightAngle: true, style: "dashed" }
   - medians: mảng các đường trung tuyến. Mỗi phần tử: { from: "A", toSegment: "BC", midpoint: "M", showTicks: true, style: "dashed" }
   - bisectors: mảng các đường phân giác. Mỗi phần tử: { from: "A", toSegment: "BC", foot: "D", showEqualAngleArcs: true, style: "solid" }
   - perpBisectors: mảng đường trung trực. Mỗi phần tử: { segment: "BC", label: "d", showRightAngle: true, showTicks: true }

3. ĐỐI VỚI TỨ GIÁC (quadrilateral):
   - type: "rectangle", "square", "parallelogram", "rhombus", "trapezoid", "isosceles-trapezoid", "right-trapezoid".
   - vertices: mảng 4 đỉnh ["A", "B", "C", "D"].
   - parallelSides: ví dụ ["AB", "CD"] nếu là hình thang / hình bình hành.
   - showDiagonals: true nếu đề bài nhắc tới đường chéo AC, BD hoặc giao điểm O.
   - diagonalIntersection: "O" (hoặc tên điểm giao).

4. ĐỐI VỚI ĐƯỜNG TRÒN (circle):
   - presetType:
     * "basic": đường tròn tâm O bán kính R (điểm A trên đường tròn).
     * "diameter-chord": đường kính AB hoặc dây cung CD, đoạn vuông góc OH từ tâm đến dây.
     * "tangent-point": tiếp tuyến Ax tại tiếp điểm A trên đường tròn (Ax vuông góc OA).
     * "two-tangents": hai tiếp tuyến PA, PB cắt nhau tại P từ điểm P ngoài đường tròn.
     * "secant": cát tuyến PCD cắt đường tròn tại C và D.
     * "inscribed-angle": góc nội tiếp.
   - center: tên tâm (thường là "O").
   - tangentPoint, tangentLineName, externalPoint, twoTangentPoints, chordPoints, chordFoot tương ứng.

5. ĐỐI VỚI GÓC & CÁT TUYẾN SONG SONG (angle):
   - type: "single" (góc đơn), "parallel-cut" (2 đường thẳng song song bị cắt bởi cát tuyến).
   - parallelCutConfig: { line1: "a", line2: "b", transversal: "c", vertex1: "A", vertex2: "B", highlightType: "alternate-interior" | "corresponding" | "consecutive-interior" }

6. detectedEntities:
   - Danh sách các câu ngắn tiếng Việt tóm tắt các thực thể đã nhận diện được, ví dụ:
     ["Tam giác ABC nhọn", "Đường cao AH vuông góc BC tại H", "Đỉnh: A, B, C, H"]

7. explanation:
   - Tóm tắt hình học chuẩn sư phạm SGK trong 1 câu ngắn gọn.

QUAN TRỌNG:
- Không trả lời bất kỳ văn bản giải thích nào ngoài JSON.
- Không giải bài toán hay bịa thêm dữ kiện hình học quan trọng khi đề không có.`;

const GEOMETRY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tiêu đề ngắn gọn của hình vẽ' },
    shapeCategory: {
      type: Type.STRING,
      enum: ['triangle', 'quadrilateral', 'circle', 'line-ray', 'angle'],
      description: 'Nhóm hình học chính',
    },
    triangle: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['general', 'right', 'isosceles', 'equilateral', 'right-isosceles', 'obtuse'],
        },
        vertices: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 đỉnh tam giác ví dụ ["A", "B", "C"]',
        },
        specialVertex: { type: Type.STRING, description: 'Đỉnh góc vuông hoặc đỉnh cân' },
        equalSides: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Cặp cạnh bằng nhau ví dụ ["AB", "AC"]',
        },
      },
    },
    quadrilateral: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: [
            'rectangle',
            'square',
            'parallelogram',
            'rhombus',
            'trapezoid',
            'isosceles-trapezoid',
            'right-trapezoid',
          ],
        },
        vertices: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '4 đỉnh tứ giác ví dụ ["A", "B", "C", "D"]',
        },
        parallelSides: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        showDiagonals: { type: Type.BOOLEAN },
        diagonalIntersection: { type: Type.STRING },
      },
    },
    circle: {
      type: Type.OBJECT,
      properties: {
        presetType: {
          type: Type.STRING,
          enum: ['basic', 'diameter-chord', 'tangent-point', 'two-tangents', 'secant', 'inscribed-angle'],
        },
        center: { type: Type.STRING },
        radiusValue: { type: Type.STRING },
        radiusPoint: { type: Type.STRING },
        diameterPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        chordPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        chordFoot: { type: Type.STRING },
        tangentPoint: { type: Type.STRING },
        tangentLineName: { type: Type.STRING },
        externalPoint: { type: Type.STRING },
        twoTangentPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        secantPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
    lineRay: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['segment', 'ray', 'line', 'parallel', 'perpendicular', 'intersection'],
        },
        pointNames: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        hasMidpoint: { type: Type.BOOLEAN },
        midpointName: { type: Type.STRING },
        length: { type: Type.STRING },
      },
    },
    angle: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['single', 'adjacent', 'complementary', 'supplementary', 'opposite', 'parallel-cut'],
        },
        vertex: { type: Type.STRING },
        ray1: { type: Type.STRING },
        ray2: { type: Type.STRING },
        degrees: { type: Type.NUMBER },
        hasBisector: { type: Type.BOOLEAN },
        bisectorName: { type: Type.STRING },
        parallelCutConfig: {
          type: Type.OBJECT,
          properties: {
            line1: { type: Type.STRING },
            line2: { type: Type.STRING },
            transversal: { type: Type.STRING },
            vertex1: { type: Type.STRING },
            vertex2: { type: Type.STRING },
            highlightType: {
              type: Type.STRING,
              enum: ['alternate-interior', 'corresponding', 'consecutive-interior'],
            },
          },
        },
      },
    },
    altitudes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          toLine: { type: Type.STRING },
          foot: { type: Type.STRING },
          showRightAngle: { type: Type.BOOLEAN },
          style: { type: Type.STRING, enum: ['solid', 'dashed', 'dotted'] },
        },
      },
    },
    medians: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          toSegment: { type: Type.STRING },
          midpoint: { type: Type.STRING },
          showTicks: { type: Type.BOOLEAN },
          style: { type: Type.STRING, enum: ['solid', 'dashed', 'dotted'] },
        },
      },
    },
    bisectors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          toSegment: { type: Type.STRING },
          foot: { type: Type.STRING },
          showEqualAngleArcs: { type: Type.BOOLEAN },
          style: { type: Type.STRING, enum: ['solid', 'dashed', 'dotted'] },
        },
      },
    },
    perpBisectors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          segment: { type: Type.STRING },
          label: { type: Type.STRING },
          showRightAngle: { type: Type.BOOLEAN },
          showTicks: { type: Type.BOOLEAN },
        },
      },
    },
    detectedEntities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách các thực thể đã nhận diện',
    },
    explanation: {
      type: Type.STRING,
      description: 'Mô tả ngắn gọn về hình vẽ chuẩn SGK',
    },
  },
  required: ['title', 'shapeCategory', 'detectedEntities', 'explanation'],
};

/**
 * Phân tích đề bài hình học bằng Gemini 3.8 Flash
 */
export async function parseGeometryWithGemini(prompt: string): Promise<GeometrySpecification> {
  const client = getGeminiClient();

  if (!client) {
    // Khi chưa có GEMINI_API_KEY: chạy chế độ cục bộ độc lập (Local Rule-based)
    const fallback = VietnameseGeometryParser.parse(prompt);
    fallback.explanation = '(Đang sử dụng chế độ cục bộ - Phân tích cú pháp SGK)';
    return fallback;
  }

  // Gemini 3.8 Flash (model ID chính thức); lỗi API sẽ chuyển sang parser nội bộ như trước đây.
  const modelsToTry = [
    'gemini-3.8-flash',
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Hãy phân tích đề bài hình học THCS sau đây và trả về cấu trúc Geometry Specification JSON chuẩn xác:\n\n"${prompt}"`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GEOMETRY_RESPONSE_SCHEMA,
          temperature: 0.1, // Nhiệt độ thấp để đảm bảo tính tất định và chính xác toán học
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini không trả về nội dung');
      }

      const parsed: GeometrySpecification = JSON.parse(responseText);
      validateAndNormalizeSpec(parsed, prompt);
      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Geometry Service] Lỗi khi gọi model ${modelName}:`, err?.message || err);
      // Thử model tiếp theo trong danh sách fallback
    }
  }

  // Nếu tất cả các model đều gặp lỗi mạng/quota/billing, sử dụng fallback parser nội bộ
  console.warn('[Gemini Geometry Service] Chuyển sang parser quy tắc nội bộ do lỗi API:', lastError?.message);
  const fallback = VietnameseGeometryParser.parse(prompt);
  fallback.explanation = `(Đang sử dụng chế độ cục bộ - Tự động điều chỉnh theo chuẩn SGK)`;
  return fallback;
}

/**
 * Chuẩn hóa và kiểm tra tính hợp lệ của Specification
 */
function validateAndNormalizeSpec(spec: GeometrySpecification, originalPrompt: string): void {
  if (!spec.shapeCategory) {
    spec.shapeCategory = 'triangle';
  }

  if (!spec.title) {
    spec.title = 'HÌNH VẼ TOÁN THCS';
  }

  if (!Array.isArray(spec.detectedEntities) || spec.detectedEntities.length === 0) {
    spec.detectedEntities = ['Đã phân tích đề bài hình học'];
  }

  // Đảm bảo cấu trúc tam giác hợp lệ
  if (spec.shapeCategory === 'triangle') {
    if (!spec.triangle) {
      spec.triangle = {
        type: 'general',
        vertices: ['A', 'B', 'C'],
      };
    }
    if (!spec.triangle.vertices || spec.triangle.vertices.length !== 3) {
      spec.triangle.vertices = ['A', 'B', 'C'];
    }
  }

  // Đảm bảo cấu trúc tứ giác hợp lệ
  if (spec.shapeCategory === 'quadrilateral') {
    if (!spec.quadrilateral) {
      spec.quadrilateral = {
        type: 'rectangle',
        vertices: ['A', 'B', 'C', 'D'],
      };
    }
    if (!spec.quadrilateral.vertices || spec.quadrilateral.vertices.length !== 4) {
      spec.quadrilateral.vertices = ['A', 'B', 'C', 'D'];
    }
  }

  // Đảm bảo cấu trúc đường tròn hợp lệ
  if (spec.shapeCategory === 'circle') {
    if (!spec.circle) {
      spec.circle = {
        presetType: 'basic',
        center: 'O',
      };
    }
    if (!spec.circle.center) {
      spec.circle.center = 'O';
    }
  }
}
