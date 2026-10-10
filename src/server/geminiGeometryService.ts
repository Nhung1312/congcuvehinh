/**
 * geminiGeometryService.ts
 * Server-side service xử lý phân tích đề bài Toán THCS bằng mô hình Gemini 3.8 Flash.
 * Bảo mật hoàn toàn API key trong môi trường server.
 */
import { GoogleGenAI, Type } from '@google/genai';
import type { GeometrySpecification } from '../ai/types';
import { completeCompositeTriangle } from '../ai/parser/completeCompositeTriangle';
import { makeGeometryUserParts, type GeometryImageInput } from '../ai/geometryImageInput';

/** Gemini client được khởi tạo: ưu tiên API key cá nhân của người dùng, nếu không có sẽ dùng server GEMINI_API_KEY */
function getGeminiClient(userApiKey?: string): { client: GoogleGenAI; keySource: 'user' | 'server' } | null {
  const userKey = userApiKey?.trim();
  if (userKey) {
    return { client: new GoogleGenAI({ apiKey: userKey }), keySource: 'user' };
  }
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) {
    return { client: new GoogleGenAI({ apiKey: envKey }), keySource: 'server' };
  }
  return null;
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

3. CÁC ĐƯỜNG ĐẶC BIỆT CỦA TAM GIÁC (LƯU Ý: LÀ CÁC MẢNG Ở CẤP GỐC JSON, BẮT BUỘC XUẤT KHI ĐỀ CÓ):
   - altitudes: mảng các đường cao TỪ ĐỈNH TAM GIÁC.
     Nếu đề có "đường cao AH" hoặc "kẻ AH vuông góc BC tại H":
     BẮT BUỘC xuất: altitudes: [{ from: "A", toLine: "BC", foot: "H", showRightAngle: true, style: "dashed" }]
   - medians: mảng các đường trung tuyến.
     Nếu đề có "trung tuyến AM" hoặc "gọi M là trung điểm BC, nối AM":
     BẮT BUỘC xuất: medians: [{ from: "A", toSegment: "BC", midpoint: "M", showTicks: true, style: "dashed" }]
   - bisectors: mảng các đường phân giác.
     Nếu đề có "phân giác AD":
     BẮT BUỘC xuất: bisectors: [{ from: "A", toSegment: "BC", foot: "D", showEqualAngleArcs: true, style: "solid" }]
   - perpBisectors: mảng đường trung trực cạnh:
     perpBisectors: [{ segment: "BC", label: "d", showRightAngle: true, showTicks: true }]

LƯU Ý BẮT BUỘC:
- altitudes, medians, bisectors, perpBisectors, auxPoints, auxLines, rightAngles, parallels, equalSegments, equalAngles là các MẢNG Ở CẤP GỐC JSON (cùng cấp với triangle).
- Không được chỉ ghi tên thực thể trong detectedEntities hay title mà để mảng altitudes, medians rỗng!
- Nếu đề có HD vuông góc AB tại D sau khi dựng H, xuất auxPoints chứa {name:"D",type:"projection",fromPoint:"H",targetLine:"AB"}; tương tự E.

4. ĐỐI VỚI TỨ GIÁC (quadrilateral):
   - type: "rectangle", "square", "parallelogram", "rhombus", "trapezoid", "isosceles-trapezoid", "right-trapezoid".
   - vertices: mảng 4 đỉnh ["A", "B", "C", "D"].
   - parallelSides: ví dụ ["AB", "CD"] nếu là hình thang / hình bình hành.
   - showDiagonals: true nếu đề bài nhắc tới đường chéo AC, BD hoặc giao điểm O.
   - diagonalIntersection: "O" (hoặc tên điểm giao).
   - showCircumcircle: true nếu tứ giác nội tiếp đường tròn.

5. ĐỐI VỚI ĐƯỜNG TRÒN (circle):
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
   - type: "tangent": điểm hướng trên tiếp tuyến qua fromPoint với tâm centerPoint.
   - Với tiếp tuyến tại A cắt BC tại T: x là điểm hướng tiếp tuyến (type tangent), T là giao điểm (type intersection) line1 "Ax", line2 "BC"; các điểm dùng chung tam giác và đường tròn ngoại tiếp.

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

VÍ DỤ MẪU BẮT BUỘC TUÂN THỦ (FEW-SHOT EXAMPLES):

Ví dụ 1:
Đề bài: "Cho tam giác ABC vuông tại A. Kẻ AH vuông góc với BC tại H. Từ H kẻ HD vuông góc với AB tại D và HE vuông góc với AC tại E. Gọi M là trung điểm của BC. Nối DE và AM."
JSON trả về:
{
  "title": "Tam giác ABC vuông tại A với đường cao AH, hình chiếu D, E, trung tuyến AM và đoạn nối DE",
  "shapeCategory": "triangle",
  "triangle": {
    "type": "right",
    "vertices": ["A", "B", "C"],
    "specialVertex": "A"
  },
  "altitudes": [
    { "from": "A", "toLine": "BC", "foot": "H", "showRightAngle": true, "style": "dashed" }
  ],
  "medians": [
    { "from": "A", "toSegment": "BC", "midpoint": "M", "showTicks": true, "style": "dashed" }
  ],
  "bisectors": [],
  "perpBisectors": [],
  "auxPoints": [
    { "name": "D", "type": "projection", "fromPoint": "H", "targetLine": "AB" },
    { "name": "E", "type": "projection", "fromPoint": "H", "targetLine": "AC" }
  ],
  "auxLines": [
    { "from": "H", "to": "D", "style": "solid" },
    { "from": "H", "to": "E", "style": "solid" },
    { "from": "D", "to": "E", "style": "solid" }
  ],
  "rightAngles": [
    { "vertex": "A", "ray1": "B", "ray2": "C" },
    { "vertex": "H", "ray1": "A", "ray2": "B" },
    { "vertex": "D", "ray1": "H", "ray2": "A" },
    { "vertex": "E", "ray1": "H", "ray2": "A" }
  ],
  "parallels": [],
  "equalSegments": [],
  "equalAngles": [],
  "detectedEntities": [
    "Tam giác ABC vuông tại A",
    "Đường cao AH vuông góc BC tại H",
    "HD vuông góc AB tại D (D là hình chiếu của H trên AB)",
    "HE vuông góc AC tại E (E là hình chiếu của H trên AC)",
    "M là trung điểm của BC",
    "Đoạn nối DE",
    "Trung tuyến AM"
  ],
  "explanation": "Hình vẽ tam giác ABC vuông tại A có đường cao AH. D và E lần lượt là hình chiếu vuông góc của H trên hai cạnh góc vuông AB và AC, tạo thành hình chữ nhật ADHE. M là trung điểm cạnh huyền BC, các đoạn thẳng DE và AM được nối."
}

Ví dụ 2:
Đề bài: "Cho tam giác ABC nhọn có hai đường cao BD và CE cắt nhau tại H. Gọi M là trung điểm BC. Nối DE."
JSON trả về:
{
  "title": "Tam giác ABC nhọn có hai đường cao BD, CE cắt nhau tại trực tâm H",
  "shapeCategory": "triangle",
  "triangle": {
    "type": "general",
    "vertices": ["A", "B", "C"]
  },
  "altitudes": [
    { "from": "B", "toLine": "AC", "foot": "D", "showRightAngle": true, "style": "dashed" },
    { "from": "C", "toLine": "AB", "foot": "E", "showRightAngle": true, "style": "dashed" }
  ],
  "medians": [],
  "bisectors": [],
  "perpBisectors": [],
  "auxPoints": [
    { "name": "H", "type": "intersection", "line1": "BD", "line2": "CE" },
    { "name": "M", "type": "midpoint", "segment": "BC" }
  ],
  "auxLines": [
    { "from": "D", "to": "E", "style": "solid" }
  ],
  "rightAngles": [
    { "vertex": "D", "ray1": "B", "ray2": "A" },
    { "vertex": "E", "ray1": "C", "ray2": "A" }
  ],
  "parallels": [],
  "equalSegments": [],
  "equalAngles": [],
  "detectedEntities": [
    "Tam giác ABC nhọn",
    "Đường cao BD vuông góc AC tại D",
    "Đường cao CE vuông góc AB tại E",
    "Trực tâm H là giao điểm của BD và CE",
    "M là trung điểm BC",
    "Đoạn nối DE"
  ],
  "explanation": "Tam giác nhọn ABC với hai đường cao BD và CE cắt nhau tại trực tâm H, M là trung điểm cạnh đáy BC và đoạn thẳng DE nối hai chân đường cao."
}

Ví dụ 3 (Bài toán kết hợp Toán 9):
Đề bài: "Cho tam giác ABC nhọn nội tiếp đường tròn (O), hai đường cao BD và CE cắt nhau tại H. Kẻ tiếp tuyến Ax của đường tròn (O)."
JSON trả về:
{
  "title": "Tam giác ABC nhọn nội tiếp đường tròn (O), hai đường cao BD, CE cắt nhau tại H và tiếp tuyến Ax",
  "shapeCategory": "triangle",
  "triangle": {
    "type": "general",
    "vertices": ["A", "B", "C"],
    "circumscribedCircle": true
  },
  "altitudes": [
    { "from": "B", "toLine": "AC", "foot": "D", "showRightAngle": true, "style": "dashed" },
    { "from": "C", "toLine": "AB", "foot": "E", "showRightAngle": true, "style": "dashed" }
  ],
  "medians": [],
  "bisectors": [],
  "perpBisectors": [],
  "auxPoints": [
    { "name": "H", "type": "intersection", "line1": "BD", "line2": "CE" },
    { "name": "x", "type": "tangent", "fromPoint": "A", "centerPoint": "O" }
  ],
  "auxLines": [
    { "from": "A", "to": "x", "style": "solid" }
  ],
  "rightAngles": [
    { "vertex": "D", "ray1": "B", "ray2": "A" },
    { "vertex": "E", "ray1": "C", "ray2": "A" },
    { "vertex": "A", "ray1": "O", "ray2": "x" }
  ],
  "parallels": [],
  "equalSegments": [],
  "equalAngles": [],
  "detectedEntities": [
    "Tam giác ABC nhọn nội tiếp đường tròn (O)",
    "Đường cao BD vuông góc AC tại D",
    "Đường cao CE vuông góc AB tại E",
    "Trực tâm H là giao điểm của BD và CE",
    "Tiếp tuyến Ax của đường tròn (O) tại tiếp điểm A (Ax ⊥ OA)"
  ],
  "explanation": "Hình vẽ kết hợp chuẩn Toán 9: tam giác nhọn ABC nội tiếp đường tròn (O), hai đường cao BD và CE cắt nhau tại trực tâm H, tiếp tuyến Ax tại A vuông góc bán kính OA."
}

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
    polygon: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['equilateral-triangle', 'square', 'pentagon', 'hexagon', 'octagon', 'custom'] },
        sidesCount: { type: Type.INTEGER },
        vertexNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        centerName: { type: Type.STRING },
        showCircumcircle: { type: Type.BOOLEAN },
        showIncircle: { type: Type.BOOLEAN },
        showApothem: { type: Type.BOOLEAN },
        showRadii: { type: Type.BOOLEAN },
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
            enum: ['midpoint', 'ratio', 'projection', 'intersection', 'on-circle', 'free', 'tangent', 'orthocenter'],
          },
          segment: { type: Type.STRING, description: 'Đoạn thẳng chứa trung điểm hoặc tỉ số, ví dụ AB, BC' },
          ratio: { type: Type.NUMBER, description: 'Tỉ số chia từ 0 đến 1' },
          fromPoint: { type: Type.STRING, description: 'Điểm hạ hình chiếu vuông góc (VD: H hạ xuống AB thì fromPoint là H)' },
          targetLine: { type: Type.STRING, description: 'Đường thẳng nhận hình chiếu (VD: AB, AC, BC)' },
          line1: { type: Type.STRING, description: 'Đường thẳng 1 khi tìm giao điểm' },
          line2: { type: Type.STRING, description: 'Đường thẳng 2 khi tìm giao điểm' },
          centerPoint: { type: Type.STRING },
          angle: { type: Type.NUMBER },
          radius: { type: Type.NUMBER },
          freeX: { type: Type.NUMBER },
          freeY: { type: Type.NUMBER },
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
    equalAngles: {
      type: Type.ARRAY,
      description: 'Nhóm các góc bằng nhau, mỗi góc có vertex/ray1/ray2',
      items: {
        type: Type.OBJECT,
        properties: {
          angles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                vertex: { type: Type.STRING },
                ray1: { type: Type.STRING },
                ray2: { type: Type.STRING },
              },
              required: ['vertex', 'ray1', 'ray2'],
            },
          },
        },
        required: ['angles'],
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
export async function parseGeometryWithGemini(prompt: string, userApiKey?: string, image?: GeometryImageInput): Promise<GeometrySpecification> {
  const clientInfo = getGeminiClient(userApiKey);

  if (!clientInfo) {
    throw new Error('Chưa có API key Gemini. Vui lòng nhập API key cá nhân vào ô nhập liệu hoặc cấu hình GEMINI_API_KEY trên máy chủ.');
  }

  const { client, keySource } = clientInfo;

  // Gemini 3.8 Flash (model ID chính thức)
  const modelsToTry = [
    'gemini-3.8-flash',
  ];

  let lastErrorMsg = '';

  for (const modelName of modelsToTry) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: makeGeometryUserParts(prompt, image),
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

        let cleanText = responseText.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.slice(7).replace(/```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.slice(3).replace(/```$/, '').trim();
        }

        const parsed: GeometrySpecification = JSON.parse(cleanText);
        validateAndNormalizeSpec(parsed, prompt);
        parsed.generationInfo = {
          source: 'gemini',
          model: modelName,
          keySource: keySource === 'user' ? 'API key cá nhân' : 'API key hệ thống (server)',
        };
        return parsed;
      } catch (err: any) {
        let raw = err?.message || 'Lỗi gọi mô hình Gemini 3.8 Flash';
        if (userApiKey) {
          raw = raw.split(userApiKey).join('***');
        }

        const isHighDemandOrTransient = raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE');

        // Nếu gặp lỗi quá tải tạm thời (503), thử lại sau 1-1.5 giây
        if (isHighDemandOrTransient && attempt < maxAttempts) {
          console.warn(`[Gemini 3.8 Flash] Đang chịu tải tạm thời (503), tự động thử lại lần ${attempt + 1}/${maxAttempts} sau 1.2s...`);
          await new Promise((res) => setTimeout(res, 1200 * attempt));
          continue;
        }

        // Chẩn đoán mã lỗi thông dụng
        if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
          lastErrorMsg = 'API key không hợp lệ hoặc không tồn tại trên Google AI Studio.';
        } else if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('Quota exceeded')) {
          lastErrorMsg = 'Vượt quá hạn mức yêu cầu (Rate Limit / Quota Exceeded) của Google Gemini. Vui lòng thử lại sau giây lát.';
        } else if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
          lastErrorMsg = 'Quyền truy cập bị từ chối: API key này không có quyền truy cập model gemini-3.8-flash.';
        } else if (raw.includes('NOT_FOUND') || raw.includes('404')) {
          lastErrorMsg = 'Không tìm thấy model gemini-3.8-flash với tài khoản API key này.';
        } else if (isHighDemandOrTransient) {
          lastErrorMsg = 'Mô hình Gemini 3.8 Flash của Google đang chịu tải cao tạm thời (503 Service Unavailable / Spikes in demand). Vui lòng thử lại sau vài giây.';
        } else {
          lastErrorMsg = raw;
        }
        break;
      }
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
  if (!Array.isArray(spec.altitudes)) spec.altitudes = [];
  if (!Array.isArray(spec.medians)) spec.medians = [];
  if (!Array.isArray(spec.bisectors)) spec.bisectors = [];
  if (!Array.isArray(spec.perpBisectors)) spec.perpBisectors = [];
  if (!Array.isArray(spec.auxPoints)) spec.auxPoints = [];
  if (!Array.isArray(spec.auxLines)) spec.auxLines = [];
  if (!Array.isArray(spec.rightAngles)) spec.rightAngles = [];
  if (!Array.isArray(spec.parallels)) spec.parallels = [];
  if (!Array.isArray(spec.equalSegments)) spec.equalSegments = [];
  if (!Array.isArray(spec.equalAngles)) spec.equalAngles = [];

  // An toàn dự phòng: nếu đề bài hoặc detectedEntities có các phép dựng mà Gemini vô tình bỏ sót
  // Loại bỏ các câu kết luận chứng minh để không biến kết luận thành giả thiết
  const sanitizedPrompt = originalPrompt
    .replace(/(?:chứng\s*minh\s*(?:rằng)?|cmr\s*:?|chứng\s*tỏ\s*(?:rằng)?)[^.?!;]*(?:[.?!;]|$)/gi, ' ')
    .replace(/\b(?:tính|tìm)\s+(?:độ\s*dài|diện\s*tích|góc|số\s*đo)[^.?!;]*(?:[.?!;]|$)/gi, ' ');

  const combinedText = `${sanitizedPrompt} ${(spec.detectedEntities || []).join(' ')} ${(spec.explanation || '')}`;
  const rawText = combinedText.toLowerCase();

  if (spec.shapeCategory === 'triangle' && spec.triangle) {
    const [vA, vB, vC] = spec.triangle.vertices || ['A', 'B', 'C'];
    const oppBC = `${vB}${vC}`;

    // Tam giác tù
    if (rawText.includes('tù')) {
      spec.triangle.type = 'obtuse';
    }

    // Đường tròn ngoại tiếp (Bài toán kết hợp Toán 9)
    if (
      rawText.includes('nội tiếp đường tròn') ||
      rawText.includes('đường tròn ngoại tiếp') ||
      (rawText.includes('(o)') && !rawText.includes('nằm ngoài'))
    ) {
      spec.triangle.circumscribedCircle = true;
    }

    // 1. Nhận diện đỉnh góc vuông nếu chưa có
    if (spec.triangle.type === 'right' || spec.triangle.type === 'right-isosceles') {
      if (!spec.triangle.specialVertex) {
        const rightMatch = combinedText.match(/vuông\s+(?:cân\s+)?tại\s+([A-Za-z])/i);
        if (rightMatch) {
          spec.triangle.specialVertex = rightMatch[1].toUpperCase();
        } else {
          spec.triangle.specialVertex = vA;
        }
      }
      // Bổ sung ký hiệu góc vuông tại đỉnh vuông của tam giác nếu chưa có
      const sV = spec.triangle.specialVertex;
      const otherVerts = (spec.triangle.vertices || ['A', 'B', 'C']).filter(v => v !== sV);
      if (otherVerts.length === 2 && !spec.rightAngles.some(r => r.vertex === sV)) {
        spec.rightAngles.push({ vertex: sV, ray1: otherVerts[0], ray2: otherVerts[1] });
      }
    }

    // 2. Trực tâm H và hai đường cao
    if (
      rawText.includes('trực tâm h') ||
      (rawText.includes('đường cao') && (rawText.includes('cắt nhau tại h') || rawText.includes('giao nhau tại h')))
    ) {
      if (spec.altitudes.length < 2 && rawText.includes('bd') && rawText.includes('ce')) {
        if (!spec.altitudes.some(a => a.foot === 'D')) {
          spec.altitudes.push({ from: vB, toLine: `${vA}${vC}`, foot: 'D', showRightAngle: true, style: 'dashed' });
        }
        if (!spec.altitudes.some(a => a.foot === 'E')) {
          spec.altitudes.push({ from: vC, toLine: `${vA}${vB}`, foot: 'E', showRightAngle: true, style: 'dashed' });
        }
      }
      if (!spec.auxPoints.some(p => p.name === 'H')) {
        const alt1 = spec.altitudes[0];
        const alt2 = spec.altitudes[1];
        if (alt1 && alt2) {
          spec.auxPoints.push({
            name: 'H',
            type: 'intersection',
            line1: `${alt1.from}${alt1.foot}`,
            line2: `${alt2.from}${alt2.foot}`,
          });
        } else {
          spec.auxPoints.push({ name: 'H', type: 'orthocenter' });
        }
      }
    }

    // 3. Kiểm tra đường cao AH nếu Gemini chưa điền vào altitudes
    if (spec.altitudes.length === 0) {
      if (rawText.includes('đường cao ah') || (rawText.includes('ah') && (rawText.includes('vuông góc') || rawText.includes('chân đường cao')))) {
        spec.altitudes.push({
          from: vA,
          toLine: oppBC,
          foot: 'H',
          showRightAngle: true,
          style: 'dashed',
        });
      }
    }

    // 4. Kiểm tra trung tuyến AM: CHỈ thêm khi đề thực sự có "trung tuyến" hoặc "nối AM" / "kẻ AM"
    const hasMedianCommand = rawText.includes('trung tuyến am') ||
      (rawText.includes('m là trung điểm') && (rawText.includes('nối am') || rawText.includes('kẻ am')));
    if (hasMedianCommand && spec.medians.length === 0) {
      spec.medians.push({
        from: vA,
        toSegment: oppBC,
        midpoint: 'M',
        showTicks: true,
        style: 'dashed',
      });
    }

    // 5. Nếu đề chỉ có "M là trung điểm BC" mà không yêu cầu vẽ trung tuyến AM:
    // Không thêm đường trung tuyến, chỉ tạo điểm M là trung điểm
    const hasMidpointOnly = (rawText.includes('m là trung điểm') || rawText.includes('trung điểm m')) && !hasMedianCommand;
    if (hasMidpointOnly && !spec.auxPoints.some(p => p.name === 'M') && !spec.medians.some(m => m.midpoint === 'M')) {
      spec.auxPoints.push({
        name: 'M',
        type: 'midpoint',
        segment: oppBC,
      });
      if (!spec.equalSegments.some(es => es.segments.includes(`${vB}M`))) {
        spec.equalSegments.push({
          segments: [`${vB}M`, `M${vC}`],
          tickType: 1,
        });
      }
    }

    // 6. Tiếp tuyến Ax của (O)
    if (rawText.includes('tiếp tuyến ax') || (rawText.includes('tiếp tuyến') && rawText.includes('ax'))) {
      if (!spec.auxPoints.some(p => p.name === 'x')) {
        spec.auxPoints.push({
          name: 'x',
          type: 'tangent',
          fromPoint: 'A',
          centerPoint: 'O',
        });
      }
      if (!spec.auxLines.some(l => (l.from === 'A' && l.to === 'x') || (l.from === 'x' && l.to === 'A'))) {
        spec.auxLines.push({ from: 'A', to: 'x', style: 'solid' });
      }
      if (!spec.rightAngles.some(r => r.vertex === 'A' && ((r.ray1 === 'O' && r.ray2 === 'x') || (r.ray1 === 'x' && r.ray2 === 'O')))) {
        spec.rightAngles.push({ vertex: 'A', ray1: 'O', ray2: 'x' });
      }
    }
  }

  // 4. Nhận diện các hình chiếu vuông góc (Projections)
  // Mẫu: "từ H kẻ HD vuông góc AB tại D", "kẻ HE vuông góc AC tại E", "HD vuông góc với AB tại D", "hình chiếu của H trên AB là D"
  const altitudeFeet = new Set((spec.altitudes || []).map(a => a.foot));
  const projRegex = /(?:[Tt]ừ\s+([A-Z])\s+[kK]ẻ\s+)?\b([A-Z])([A-Z])\b\s*(?:vuông\s*góc|⊥)\s*(?:với\s+)?\b([A-Z]{2})\b(?:\s+tại\s+([A-Z]))?|\b([A-Z])\b\s+là\s+hình\s+chiếu\s+(?:vuông\s+góc\s+)?của\s+([A-Z])\s+(?:trên|lên)\s+\b([A-Z]{2})\b/g;
  let projMatch;
  while ((projMatch = projRegex.exec(combinedText)) !== null) {
    let fromP: string;
    let name: string;
    let targetLine: string;

    if (projMatch[6] && projMatch[7] && projMatch[8]) {
      name = projMatch[6].toUpperCase();
      fromP = projMatch[7].toUpperCase();
      targetLine = projMatch[8].toUpperCase();
    } else {
      fromP = (projMatch[1] || projMatch[2]).toUpperCase();
      name = (projMatch[5] || projMatch[3]).toUpperCase();
      targetLine = (projMatch[4] || '').toUpperCase();
    }

    if (fromP && name && targetLine && fromP !== name && targetLine.length === 2 && !targetLine.includes(name)) {
      if (!altitudeFeet.has(name) && !spec.auxPoints.some(p => p.name === name)) {
        spec.auxPoints.push({
          name,
          type: 'projection',
          fromPoint: fromP,
          targetLine,
        });
      }
      // Đảm bảo có đoạn nối fromP -> name
      const hasProjLine = spec.auxLines.some(
        l => (l.from === fromP && l.to === name) || (l.from === name && l.to === fromP)
      );
      if (!hasProjLine && !altitudeFeet.has(name)) {
        spec.auxLines.push({ from: fromP, to: name, style: 'solid' });
      }
      // Đảm bảo có ký hiệu góc vuông tại điểm hình chiếu name
      const hasRA = spec.rightAngles.some(r => r.vertex === name);
      if (!hasRA) {
        spec.rightAngles.push({ vertex: name, ray1: fromP, ray2: targetLine[0] });
      }
    }
  }

  // 5. Nhận diện các đoạn thẳng nối phụ (Nối DE, Nối AM...)
  const connectRegex = /\b[Nn]ối\s+([A-Z])([A-Z])(?:\s+và\s+([A-Z])([A-Z]))?\b/g;
  let connMatch;
  while ((connMatch = connectRegex.exec(combinedText)) !== null) {
    const pairs = [
      [connMatch[1], connMatch[2]],
      [connMatch[3], connMatch[4]],
    ];
    for (const [p1, p2] of pairs) {
      if (!p1 || !p2 || p1 === p2) continue;
      const pA = p1.toUpperCase();
      const pB = p2.toUpperCase();
      const isAlreadyInMedians = spec.medians.some(
        m => (m.from === pA && m.midpoint === pB) || (m.from === pB && m.midpoint === pA)
      );
      const isAlreadyInAltitudes = spec.altitudes.some(
        a => (a.from === pA && a.foot === pB) || (a.from === pB && a.foot === pA)
      );
      const isAlreadyInAuxLines = spec.auxLines.some(
        l => (l.from === pA && l.to === pB) || (l.from === pB && l.to === pA)
      );
      if (!isAlreadyInMedians && !isAlreadyInAltitudes && !isAlreadyInAuxLines) {
        spec.auxLines.push({ from: pA, to: pB, style: 'solid' });
      }
    }
  }
  completeCompositeTriangle(spec, sanitizedPrompt);
}
