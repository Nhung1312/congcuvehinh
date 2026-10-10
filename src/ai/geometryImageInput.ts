/**
 * Single safe picture payload for the geometry parser. Never save this in a ChartDocument.
 */
export interface GeometryImageInput {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string; // Base64, not a data URL
}
export const MAX_GEOMETRY_IMAGE_BASE64 = 1_600_000;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateGeometryImageInput(value: unknown): GeometryImageInput | undefined {
  if (value == null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Dữ liệu ảnh đề bài không hợp lệ.');
  }
  const image = value as Record<string, unknown>;
  if (typeof image.mimeType !== 'string' || !MIME_TYPES.includes(image.mimeType)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
  }
  if (typeof image.data !== 'string' ||
      image.data.length < 16 || image.data.length > MAX_GEOMETRY_IMAGE_BASE64 ||
      image.data.length % 4 !== 0 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(image.data)) {
    throw new Error('Ảnh đề không hợp lệ hoặc quá lớn. Hãy chọn ảnh rõ nét khác.');
  }
  return { mimeType: image.mimeType as GeometryImageInput['mimeType'], data: image.data };
}

export const GEOMETRY_IMAGE_INSTRUCTION =
  'Đọc giả thiết hình học trong ảnh đề toán tiếng Việt, bao gồm tên điểm, đường và ký hiệu toán. ' +
  'Tạo JSON dựng hình CHỈ từ giả thiết, không coi yêu cầu chứng minh là giả thiết. ' +
  'Kết hợp đề chữ bên dưới khi có, ưu tiên ghi chú chữ nếu mâu thuẫn.';

export function makeGeometryUserParts(prompt: string, image?: GeometryImageInput) {
  const text = image
    ? GEOMETRY_IMAGE_INSTRUCTION + (prompt.trim() ? '\n\nGhi chú/đề chữ:\n' + prompt.trim() : '')
    : 'Hãy phân tích đề bài hình học THCS sau đây và trả về cấu trúc Geometry Specification JSON chuẩn xác:\n\n"' + prompt.trim() + '"';
  return image
    ? [{ text }, { inlineData: { mimeType: image.mimeType, data: image.data } }]
    : [{ text }];
}
