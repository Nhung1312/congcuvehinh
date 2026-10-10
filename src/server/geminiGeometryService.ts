/**
 * geminiGeometryService.ts
 * Server-side service xử lý phân tích đề bài Toán THCS bằng mô hình Gemini 3.8 Flash.
 * Bảo mật hoàn toàn API key trong môi trường server.
 */
import { GoogleGenAI, Type } from '@google/genai';
import type { GeometrySpecification } from '../ai/types';

/** A new Gemini client is created for each caller's personal key. */
function getGeminiClient(userApiKey?: string): GoogleGenAI | null {
  const key = userApiKey?.trim();
  return key ? new GoogleGenAI({ apiKey: key }) : null;
}

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Sư phạm Hình học Toán THCS Việt Nam (Toán lớp 6, 7, 8, 9) và là bộ phân tích ngôn ngữ tự nhiên thành Cấu trúc Dữ liệu Hình học phẳng (Geometry Specification JSON).

Nhiệm vụ: Phân tích đề bài hình học phẳng tiếng Việt của người dùng và trả về DUY NHẤT một JSON hợp lệ tuân thủ chính xác schema hình học THCS để vẽ hình trên Geometry Engine.

QUY TẮC PHÂN LOẠI & NHẬN DIỆN THỰC THỂ HÌNH HỌC:

1. shapeCategory (CHỈ HÌNH PHẲNG):
   - "triangle": khi đề bài về tam giác (nhọn, vuông, cân, đều, vuông cân, tù).
   - "quadrilateral": khi đề bài về tứ giác, hình chữ nhật, hình vuông, hình bình hành, hình thoi, hình thang, hình thang cân, hình thang vuông.
   - "circle": khi đề bài về đường tròn (O), tiếp tuyến, cát tuyến, dây cung, góc nội tiếp, vị trí tương đối hai đường tròn.
   - "line-ray": khi đề bài về đoạn thẳng, tia, đường thẳng song song, đường thẳng vuông góc, trung điểm.
   - "angle": khi đề bài về góc xOy, tia phân giác Oz, hai đường thẳng song song bị cắt bởi cát tuyến (góc so le trong, đồng vị, trong cùng phía).
   - "polygon": khi đề bài về đa giác đều (ngũ giác, lục giác đều...).
   - "symmetry": khi đề bài về phép đối xứng trục hoặc đối xứng tâm.

2. ĐỐI VỚI TAM GIÁC (triangle):
   - type: "general" (tam giác thường / nhọn), "right" (vuông), "isosceles" (cân), "equilateral" (đều), "right-isosceles" (vuông cân), "obtuse" (tù).
   - vertices: mảng 3 đỉnh, ví dụ ["A", "B", "C"].
   - specialVertex: đỉnh góc vuông hoặc đỉnh cân (ví dụ "A").
   - equalSides: cặp cạnh bằng nhau ví dụ ["AB", "AC"].
   - circumscribedCircle: true nếu đề bài có đường tròn ngoại tiếp tam giác.
   - inscribedCircle: true nếu đề bài có đường tròn nội tiếp tam giác.
   - altitudes: mảng các đường cao TỪ ĐỈNH TAM GIÁC (A, B, C). Mỗi phần tử: { from: "A", toLine: "BC", foot: "H", showRightAngle: true, style: "dashed" }
   - medians: mảng các đường trung tuyến TỪ ĐỈNH TAM GIÁC (A, B, C). Mỗi phần tử: { from: "A", toSegment: "BC", midpoint: "M", showTicks: true, style: "dashed" }
   - bisectors: mảng các đường phân giác TỪ ĐỈNH TAM GIÁC. Mỗi phần tử: { from: "A", toSegment: "BC", foot: "D", showEqualAngleArcs: true, style: "solid" }
   - perpBisectors: mảng đường trung trực cạnh. Mỗi phần tử: { segment: "BC", label: "d", showRightAngle: true, showTicks: true }

3. ĐỐI VỚI TỨ GIÁC (quadrilateral):
   - type: "rectangle", "square", "parallelogram", "rhombus", "trapezoid", "isosceles-trapezoid", "right-trapezoid".
   - vertices: mảng 4 đỉnh ["A", "B", "C", "D"].
   - parallelSides: ví dụ ["AB", "CD"] nếu là hình thang / hình bình hành.
   - showDiagonals: true nếu đề bài nhắc tới đường chéo AC, BD hoặc giao điểm O.
   - diagonalIntersection: "O" (hoặc tên điểm giao).
   - showCircumcircle: true nếu tứ giác nội tiếp đường tròn.

4. ĐỐI VỚI ĐƯỜNG TRÒN (circle):
   - presetType:
     * "basic": đường tròn tâm O bán kính R (điểm A trên đường tròn).
     * "diameter-chord": đường kính AB hoặc dây cung CD, đoạn vuông góc OH từ tâm đến dây.
     * "tangent-point": tiếp tuyến Ax tại tiếp điểm A trên đường tròn (Ax vuông góc OA).
     * "two-tangents": hai tiếp tuyến PA, PB cắt nhau tại P từ điểm P ngoài đường tròn (nối OA, OB, OP, AB).
     * "secant": cát tuyến PCD cắt đường tròn tại C và D.
     * "inscribed-angle": góc nội tiếp.
   - center: tên tâm (thường là "O").
   - tangentPoint, tangentLineName, externalPoint, twoTangentPoints, chordPoints, chordFoot tương ứng.

5. CÁC ĐIỂM PHỤ & PHÉP DỰNG PHỤ THUỘC NHIỀU BƯỚC (auxPoints):
   Tuyệt đối không bỏ sót các điểm phụ được sinh ra trong đề bài:
   - type: "projection": Chân đường vuông góc hạ từ một điểm bất kỳ xuống một đường thẳng (VD: H là hình chiếu của A trên BC; từ H kẻ HD vuông góc AB tại D -> D có fromPoint: "H", targetLine: "AB"; HE vuông góc AC tại E -> E có fromPoint: "H", targetLine: "AC").
   - type: "midpoint": Trung điểm của một đoạn thẳng (VD: M là trung điểm BC -> segment: "BC").
   - type: "ratio": Điểm chia đoạn thẳng theo tỉ số (VD: trọng tâm G trên trung tuyến AM có ratio: 0.67 từ A, hoặc điểm K nằm trên AB sao cho AK = 1/3 AB).
   - type: "intersection": Giao điểm của 2 đường thẳng (line1 và line2).
   - type: "on-circle": Điểm nằm trên đường tròn.
   - type: "free": Điểm tự do.

6. CÁC ĐOẠN THẲNG & ĐƯỜNG PHỤ NỐI (auxLines):
   Mọi yêu cầu nối hai điểm trong đề bài (ví dụ "Nối AM", "Nối DE", "Kẻ MN", "Nối OA, BC") phải được đưa vào auxLines:
   - from: tên điểm đầu (VD: "D", "A", "M")
   - to: tên điểm cuối (VD: "E", "M", "N")
   - style: "solid" hoặc "dashed" (nét liền hoặc nét đứt chuẩn SGK)

7. CÁC QUAN HỆ HÌNH HỌC KHÁC:
   - rightAngles: mảng các góc vuông (vertex, ray1, ray2) ví dụ [{ vertex: "D", ray1: "H", ray2: "A" }, { vertex: "E", ray1: "H", ray2: "A" }]
   - parallels: mảng quan hệ song song ({ line1: "MN", line2: "BC", arrowCount: 1 })
   - equalSegments: mảng các đoạn bằng nhau ({ segments: ["AD", "DB"], tickType: 1 })
   - equalAngles: mảng các góc bằng nhau

8. detectedEntities:
   - Danh sách tóm tắt tất cả thực thể và bước dựng nhận diện được:
     ["Tam giác ABC vuông tại A", "Đường cao AH vuông góc BC tại H", "Điểm D là hình chiếu của H trên AB (HD vuông góc AB)", "Điểm E là hình chiếu của H trên AC (HE vuông góc AC)", "Đoạn nối DE", "Trung điểm M của BC", "Đoạn nối AM"]

9. explanation:
   - Tóm tắt ngắn gọn hình học chuẩn SGK.

QUAN TRỌNG:
- Không trả lời bất kỳ văn bản giải thích nào ngoài JSON.
- Không tự bịa thêm dữ kiện hình học khi đề không có.
- Không tính tọa độ x, y số học (Geometry Engine sẽ tính toán tọa độ chính xác dựa vào các quan hệ).
- Đối với các bài có trung tuyến AM hoặc đường cao AH: nếu đã khai báo trong medians/altitudes thì cũng có thể thêm vào auxLines hoặc giữ trong medians/altitudes; đảm bảo không bị thiếu đối tượng nào.`;

const GEOMETRY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tiêu đề ngắn gọn của hình vẽ' },
    shapeCategory: {
      type: Type.STRING,
      enum: ['triangle', 'quadrilateral', 'circle', 'line-ray', 'angle', 'polygon', 'symmetry'],
      description: 'Nhóm hình học phẳng chính',
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
        circumscribedCircle: { type: Type.BOOLEAN, description: 'Đường tròn ngoại tiếp tam giác' },
        inscribedCircle: { type: Type.BOOLEAN, description: 'Đường tròn nội tiếp tam giác' },
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
        showCircumcircle: { type: Type.BOOLEAN, description: 'Tứ giác nội tiếp đường tròn' },
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
    symmetry: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['axial', 'central'],
        },
        targetShape: {
          type: Type.STRING,
          enum: ['point', 'segment', 'triangle', 'quadrilateral', 'circle'],
        },
        axisLabel: { type: Type.STRING },
        centerName: { type: Type.STRING },
        originalNames: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        reflectedNames: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        showConnectingDashedLines: { type: Type.BOOLEAN },
        showRightAngleMarkers: { type: Type.BOOLEAN },
        showEqualDistanceMarkers: { type: Type.BOOLEAN },
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
        required: ['from', 'foot'],
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
        required: ['from', 'midpoint'],
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
        required: ['from', 'foot'],
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
        required: ['segment'],
      },
    },
    auxPoints: {
      type: Type.ARRAY,
      description: 'Danh sách các điểm phụ thuộc nhiều bước (trung điểm, hình chiếu vuông góc, điểm chia tỉ số, giao điểm)',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Tên điểm phụ, ví dụ H, D, E, M, N, G, K, I' },
          type: {
            type: Type.STRING,
            enum: ['midpoint', 'ratio', 'projection', 'intersection', 'on-circle', 'free'],
          },
          segment: { type: Type.STRING, description: 'Đoạn thẳng chứa trung điểm hoặc tỉ số, ví dụ AB, BC' },
          ratio: { type: Type.NUMBER, description: 'Tỉ số chia từ 0 đến 1' },
          fromPoint: { type: Type.STRING, description: 'Điểm hạ hình chiếu vuông góc (VD: H hạ xuống AB thì fromPoint là H)' },
          targetLine: { type: Type.STRING, description: 'Đường thẳng nhận hình chiếu (VD: AB, AC, BC)' },
          line1: { type: Type.STRING, description: 'Đường thẳng 1 khi tìm giao điểm' },
          line2: { type: Type.STRING, description: 'Đường thẳng 2 khi tìm giao điểm' },
          centerPoint: { type: Type.STRING },
          angle: { type: Type.NUMBER },
        },
        required: ['name', 'type'],
      },
    },
    auxLines: {
      type: Type.ARRAY,
      description: 'Các đoạn thẳng hoặc đường phụ nối giữa hai điểm bất kỳ (ví dụ nối DE, nối AM, nối MN)',
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING, description: 'Điểm bắt đầu' },
          to: { type: Type.STRING, description: 'Điểm kết thúc' },
          style: { type: Type.STRING, enum: ['solid', 'dashed', 'dotted'] },
          label: { type: Type.STRING },
        },
        required: ['from', 'to'],
      },
    },
    rightAngles: {
      type: Type.ARRAY,
      description: 'Ký hiệu các góc vuông phát sinh',
      items: {
        type: Type.OBJECT,
        properties: {
          vertex: { type: Type.STRING, description: 'Đỉnh góc vuông' },
          ray1: { type: Type.STRING, description: 'Tia/Điểm thứ nhất' },
          ray2: { type: Type.STRING, description: 'Tia/Điểm thứ hai' },
        },
        required: ['vertex', 'ray1', 'ray2'],
      },
    },
    parallels: {
      type: Type.ARRAY,
      description: 'Quan hệ song song giữa hai đường thẳng/đoạn thẳng',
      items: {
        type: Type.OBJECT,
        properties: {
          line1: { type: Type.STRING },
          line2: { type: Type.STRING },
          arrowCount: { type: Type.INTEGER },
        },
        required: ['line1', 'line2'],
      },
    },
    equalSegments: {
      type: Type.ARRAY,
      description: 'Ký hiệu các đoạn thẳng bằng nhau',
      items: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          tickType: { type: Type.STRING, enum: ['1', '2', '3', 'o', 'x'] },
        },
        required: ['segments'],
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
export async function parseGeometryWithGemini(prompt: string, userApiKey?: string): Promise<GeometrySpecification> {
  const client = getGeminiClient(userApiKey);

  if (!client) throw new Error('Vui lòng nhập API key Gemini cá nhân.');

  // Gemini 3.8 Flash (model ID chính thức); lỗi API sẽ chuyển sang parser nội bộ như trước đây.
  const modelsToTry = [
    'gemini-3.8-flash',
  ];

  let lastErrorMsg = '';

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
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini không trả về nội dung');
      }

      const parsed: GeometrySpecification = JSON.parse(responseText);
      validateAndNormalizeSpec(parsed, prompt);
      parsed.generationInfo = { source: 'gemini', model: modelName };
      return parsed;
    } catch (err: any) {
      let raw = err?.message || 'Lỗi gọi mô hình Gemini 3.8 Flash';
      if (userApiKey) {
        raw = raw.split(userApiKey).join('***');
      }
      lastErrorMsg = raw;
    }
  }

  throw new Error(lastErrorMsg || 'Gemini 3.8 Flash không khả dụng với API key này.');
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

  // Khử trùng và chuẩn hóa các mảng đối tượng phụ nếu Gemini trả về null/undefined
  if (spec.altitudes && !Array.isArray(spec.altitudes)) spec.altitudes = [];
  if (spec.medians && !Array.isArray(spec.medians)) spec.medians = [];
  if (spec.bisectors && !Array.isArray(spec.bisectors)) spec.bisectors = [];
  if (spec.perpBisectors && !Array.isArray(spec.perpBisectors)) spec.perpBisectors = [];
  if (spec.auxPoints && !Array.isArray(spec.auxPoints)) spec.auxPoints = [];
  if (spec.auxLines && !Array.isArray(spec.auxLines)) spec.auxLines = [];
  if (spec.rightAngles && !Array.isArray(spec.rightAngles)) spec.rightAngles = [];
  if (spec.parallels && !Array.isArray(spec.parallels)) spec.parallels = [];
  if (spec.equalSegments && !Array.isArray(spec.equalSegments)) spec.equalSegments = [];
}
