import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExplicitConstructions } from '../src/ai/parser/normalizeExplicitConstructions';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { GeometrySpecification } from '../src/ai/types';
import { dist, dotProd, vecSub, vecNorm } from '../src/utils/geometryMath';

test('Audit Parallelogram ABCD with AB > AD, angle BAD acute, H in AD', () => {
  const prompt = 'Cho hình bình hành ABCD có AB > AD và góc BAD là góc nhọn. Gọi O là giao điểm hai đường chéo AC và BD. Gọi M là trung điểm AB, N là trung điểm CD. Từ M kẻ MH vuông góc với AD tại H (H thuộc đoạn AD). Nối MN, OH và ON.';
  
  const baseSpec: GeometrySpecification = {
    title: 'Audit Parallelogram',
    shapeCategory: 'quadrilateral',
    quadrilateral: {
      type: 'parallelogram',
      vertices: ['A', 'B', 'C', 'D'],
      showDiagonals: true,
      diagonalIntersection: 'O',
    },
    detectedEntities: [],
    explanation: 'Dựng hình bình hành ABCD',
  };

  const normalized = normalizeExplicitConstructions(baseSpec, prompt);

  // 1. Kiểm tra trích xuất ràng buộc cạnh và góc
  assert.ok(normalized.quadrilateral?.sideComparisons, 'Phải trích xuất được sideComparisons');
  const hasABgreaterAD = normalized.quadrilateral.sideComparisons.some(
    (sc) => (sc.longer.includes('A') && sc.longer.includes('B')) && (sc.shorter.includes('A') && sc.shorter.includes('D'))
  );
  assert.ok(hasABgreaterAD, 'Phải nhận diện AB > AD (AD ngắn hơn AB)');

  assert.ok(normalized.quadrilateral?.specialAngle, 'Phải trích xuất được góc đặc biệt');
  assert.equal(normalized.quadrilateral.specialAngle.vertex, 'A');
  assert.equal(normalized.quadrilateral.specialAngle.type, 'acute');

  // 2. Kiểm tra trích xuất các điểm phụ M, N, H, O
  const auxPoints = normalized.auxPoints || [];
  const pointM = auxPoints.find((p) => p.name === 'M');
  const pointN = auxPoints.find((p) => p.name === 'N');
  const pointH = auxPoints.find((p) => p.name === 'H');
  const pointO = auxPoints.find((p) => p.name === 'O');

  assert.ok(pointM, 'Phải có điểm M');
  assert.equal(pointM.type, 'midpoint');
  assert.ok(pointN, 'Phải có điểm N');
  assert.equal(pointN.type, 'midpoint');
  assert.ok(pointH, 'Phải có điểm H');
  assert.equal(pointH.type, 'projection');
  assert.equal(pointH.mustBeInsideSegment, true, 'H phải có flag mustBeInsideSegment');
  assert.ok(pointO, 'Phải có điểm O');

  // 3. Kiểm tra chuyển đổi sang ChartDocument và tính toán tọa độ
  const doc = GeometrySpecificationAdapter.specToChartDocument(normalized);
  assert.equal(doc.type, 'GEOMETRY_QUADRILATERAL');
  const quad = doc.data.geometry?.quadrilateral;
  assert.ok(quad, 'Quad data phải tồn tại');

  const [pA, pB, pC, pD] = quad.points;
  const lenAB = dist(pA, pB);
  const lenAD = dist(pA, pD);
  assert.ok(lenAB > lenAD, `AB (${lenAB}) phải lớn hơn AD (${lenAD})`);

  // Tính góc BAD
  const uAB = vecNorm(vecSub(pB, pA));
  const uAD = vecNorm(vecSub(pD, pA));
  const cosA = dotProd(uAB, uAD);
  const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
  assert.ok(angleDeg < 90, `Góc BAD (${angleDeg.toFixed(1)}°) phải là góc nhọn (< 90°)`);

  // Tính vị trí hình chiếu H của trung điểm M trên đoạn AD
  const pM = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
  const dAD = vecSub(pD, pA);
  const lenSqAD = dAD.x * dAD.x + dAD.y * dAD.y;
  const dAM = vecSub(pM, pA);
  const t = (dAM.x * dAD.x + dAM.y * dAD.y) / lenSqAD;

  assert.ok(t > 0 && t < 1, `Hệ số hình chiếu t (${t}) phải nằm trong khoảng (0, 1) để H thuộc đoạn AD`);

  // 4. Kiểm tra verification
  assert.ok(normalized.verification, 'Phải có kết quả verification');
  assert.equal(normalized.verification.valid, true, `Verification phải hợp lệ: ${normalized.verification.errors?.join(', ')}`);
});

test('Audit Parallelogram with angle BAD obtuse constraint', () => {
  const prompt = 'Cho hình bình hành ABCD có AB > AD và góc BAD là góc tù.';
  const baseSpec: GeometrySpecification = {
    title: 'Audit Parallelogram Obtuse',
    shapeCategory: 'quadrilateral',
    quadrilateral: {
      type: 'parallelogram',
      vertices: ['A', 'B', 'C', 'D'],
    },
    detectedEntities: [],
    explanation: 'Dựng hình bình hành ABCD góc BAD tù',
  };

  const normalized = normalizeExplicitConstructions(baseSpec, prompt);
  assert.equal(normalized.quadrilateral?.specialAngle?.type, 'obtuse');

  const doc = GeometrySpecificationAdapter.specToChartDocument(normalized);
  const quad = doc.data.geometry?.quadrilateral;
  assert.ok(quad);
  const [pA, pB, , pD] = quad.points;
  const uAB = vecNorm(vecSub(pB, pA));
  const uAD = vecNorm(vecSub(pD, pA));
  const cosA = dotProd(uAB, uAD);
  const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
  assert.ok(angleDeg > 90, `Góc BAD (${angleDeg.toFixed(1)}°) phải là góc tù (> 90°)`);
});

test('Audit Rectangle PQRS with PQ > PS constraint', () => {
  const prompt = 'Cho hình chữ nhật PQRS có PQ > PS. Kẻ PN vuông góc với QS tại N.';
  const baseSpec: GeometrySpecification = {
    title: 'Audit Rectangle PQRS',
    shapeCategory: 'quadrilateral',
    quadrilateral: {
      type: 'rectangle',
      vertices: ['P', 'Q', 'R', 'S'],
    },
    detectedEntities: [],
    explanation: 'Dựng hình chữ nhật PQRS',
  };

  const normalized = normalizeExplicitConstructions(baseSpec, prompt);
  const doc = GeometrySpecificationAdapter.specToChartDocument(normalized);
  const quad = doc.data.geometry?.quadrilateral;
  assert.ok(quad);
  const [pP, pQ, , pS] = quad.points;
  const lenPQ = dist(pP, pQ);
  const lenPS = dist(pP, pS);
  assert.ok(lenPQ > lenPS, `PQ (${lenPQ}) phải lớn hơn PS (${lenPS})`);
  assert.equal(normalized.verification?.valid, true);
});
