import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeGeometryUserParts, validateGeometryImageInput, MAX_GEOMETRY_IMAGE_BASE64 } from '../src/ai/geometryImageInput';
import { AIGeometryEditor } from '../src/components/EditorPanels/AIGeometryEditor';
import { POST } from '../api/geometry/parse';
import { GeometrySpecificationAdapter } from '../src/ai/adapter/geometrySpecificationAdapter';
import { VietnameseGeometryParser } from '../src/ai/parser/vietnameseGeometryParser';

const sample = { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' } as const;

test('Đề chữ cũ tiếp tục gọi Gemini bằng phần text (không gửi ảnh)', () => {
  const parts = makeGeometryUserParts('Cho tam giác ABC nhọn.', undefined);
  assert.equal(parts.length, 1);
  assert.ok(parts[0].text.includes('Cho tam giác ABC'));
  assert.equal('inlineData' in parts[0], false);
});

test('Ảnh và ghi chú cùng vào một lần Gemini, không lưu ảnh trong prompt text', () => {
  const image = validateGeometryImageInput(sample)!;
  const parts = makeGeometryUserParts('Dựng thêm đường cao AH.', image);
  assert.equal(parts.length, 2);
  assert.ok(parts[0].text.includes('Dựng thêm đường cao AH.'));
  assert.deepEqual(parts[1], { inlineData: image });
  assert.ok(!parts[0].text.includes(image.data));
  assert.ok(makeGeometryUserParts('', image)[0].text.includes('trong ảnh'));
});

test('Từ chối mime lạ, dataURL, ảnh quá lớn, payload sai', () => {
  assert.throws(() => validateGeometryImageInput({mimeType:'image/svg+xml',data:sample.data}), /JPG|PNG/);
  assert.throws(() => validateGeometryImageInput({mimeType:'image/jpeg',data:'data:image/png;base64,'+sample.data}), /không hợp lệ|quá lớn/);
  assert.throws(() => validateGeometryImageInput({mimeType:'image/png',data:'x'.repeat(MAX_GEOMETRY_IMAGE_BASE64 + 4)}), /quá lớn/);
  assert.throws(() => validateGeometryImageInput({mimeType:'image/png',data:'aaaa+bad!'}), /không hợp lệ/);
});

test('Vercel API từ chối ảnh sai trước khi gọi model hoặc đọc key', async () => {
  const response = await POST(new Request('http://localhost/api/geometry/parse', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({prompt:'',image:{mimeType:'image/svg+xml',data:'hi'}}),
  }));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /JPG|PNG|WebP/);
});

test('Giao diện có Ctrl+V, chọn ảnh, xóa ảnh, nhớ đề và dựng lại', () => {
  const doc = GeometrySpecificationAdapter.specToChartDocument(
    VietnameseGeometryParser.parse('Cho tam giác ABC nhọn.')
  );
  const html = renderToStaticMarkup(React.createElement(AIGeometryEditor, {
    currentDoc: doc, onApplyDoc: () => {},
  }));
  assert.ok(html.includes('Chọn ảnh đề'));
  assert.ok(html.includes('Ctrl+V'));
  assert.ok(html.includes('Dựng lại hình vẽ'));
  assert.ok(html.includes('Nội dung đề bài toán'));
  assert.ok(html.includes('type="file"'));
});
