import { ChartDocument } from '../types';

/**
 * Xuất chuỗi XML chuẩn từ SVG DOM element
 */
export function getSvgXmlString(svgElement: SVGSVGElement): string {
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Đảm bảo xmlns và viewBox đầy đủ
  if (!clonedSvg.getAttribute('xmlns')) {
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Thêm doctype XML nếu cần
  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  }

  return svgString;
}

/**
 * Chuyển SVG thành PNG Blob với độ phân giải tùy chọn (mặc định 3x / ~300 DPI)
 */
export async function svgToPngBlob(
  svgElement: SVGSVGElement,
  scale: number = 3
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const svgString = getSvgXmlString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth || 600;
        const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight || 450;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context not supported'));
          return;
        }

        // Đổ nền trắng mặc định để không bị đen trong Word
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scale vẽ độ nét cao
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, 'image/png', 1.0);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * SAO CHÉP HÌNH ẢNH TRỰC TIẾP VÀO CLIPBOARD (ĐỂ CTRL + V SANG WORD)
 */
export async function copyImageToClipboard(
  svgElement: SVGSVGElement,
  scale: number = 2.5
): Promise<{ success: boolean; message: string }> {
  try {
    const blob = await svgToPngBlob(svgElement, scale);

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const data = [new ClipboardItem({ [blob.type]: blob })];
      await navigator.clipboard.write(data);
      return {
        success: true,
        message: 'Đã sao chép hình vào Clipboard! Hãy mở Word hoặc PowerPoint và nhấn Ctrl + V.',
      };
    } else {
      throw new Error('Trình duyệt không hỗ trợ sao chép ảnh trực tiếp vào Clipboard.');
    }
  } catch (err: any) {
    console.error('Copy to clipboard failed:', err);
    return {
      success: false,
      message: 'Không thể sao chép trực tiếp: ' + (err.message || 'Lỗi không xác định'),
    };
  }
}

/**
 * SAO CHÉP MÃ VECTOR SVG VÀO CLIPBOARD
 */
export async function copySvgCodeToClipboard(
  svgElement: SVGSVGElement
): Promise<{ success: boolean; message: string }> {
  try {
    const svgString = getSvgXmlString(svgElement);
    await navigator.clipboard.writeText(svgString);
    return {
      success: true,
      message: 'Đã sao chép mã SVG vector vào Clipboard!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Lỗi sao chép SVG: ' + err.message,
    };
  }
}

/**
 * TẢI XUỐNG TỆP PNG CHẤT LƯỢNG CAO (300 DPI)
 */
export async function downloadPngFile(
  svgElement: SVGSVGElement,
  filename: string = 'toan_thcs_hinh_ve.png',
  scale: number = 3
): Promise<void> {
  const blob = await svgToPngBlob(svgElement, scale);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * TẢI XUỐNG TỆP VECTOR SVG
 */
export function downloadSvgFile(
  svgElement: SVGSVGElement,
  filename: string = 'toan_thcs_vector.svg'
): void {
  const svgString = getSvgXmlString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * TẢI XUỐNG CẤU HÌNH JSON
 */
export function downloadJsonConfig(documentConfig: ChartDocument, filename: string): void {
  const jsonStr = JSON.stringify(documentConfig, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ĐỌC CẤU HÌNH TỪ TỆP JSON
 */
export async function readJsonConfig(file: File): Promise<ChartDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as ChartDocument;
        resolve(parsed);
      } catch (err) {
        reject(new Error('Tệp JSON không hợp lệ'));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp'));
    reader.readAsText(file);
  });
}
