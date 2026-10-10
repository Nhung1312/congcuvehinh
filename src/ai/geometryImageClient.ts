import { MAX_GEOMETRY_IMAGE_BASE64, validateGeometryImageInput, type GeometryImageInput } from './geometryImageInput';

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 1600;

/** Convert one clipboard/selected image to a small JPEG suitable for Gemini. */
export async function prepareGeometryQuestionImage(file: File): Promise<GeometryImageInput> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Vui lòng dán/chọn ảnh PNG, JPG hoặc WebP.');
  }
  if (!file.size || file.size > MAX_SOURCE_BYTES) {
    throw new Error('Ảnh gốc quá lớn (tối đa 20 MB). Hãy chọn ảnh khác.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Không đọc được ảnh. Hãy thử ảnh khác.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Ảnh không có kích thước hợp lệ.');
    const ratio = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.75, 0.62, 0.48]) {
      const output = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      if (output?.length <= MAX_GEOMETRY_IMAGE_BASE64) {
        const result = validateGeometryImageInput({ mimeType: 'image/jpeg', data: output });
        if (result) return result;
      }
    }
    throw new Error('Ảnh vẫn quá lớn sau nén. Hãy cắt bớt viền hoặc chụp riêng phần đề.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
