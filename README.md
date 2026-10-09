# Công cụ vẽ hình Toán THCS

Ứng dụng vẽ hình THCS, có **Gemini 3.8 Flash** hỗ trợ đọc đề và bộ quy tắc SGK khi không có API key.

Website: https://congcuvehinh.vercel.app/

## Dành cho giáo viên / khách hàng (dùng API key riêng)

1. Mở website, chọn **AI TỰ DỰNG HÌNH TOÁN THCS** → **Gemini 3.8 Flash**.
2. Trong ô **API key Gemini cá nhân**, dán key được tạo tại https://aistudio.google.com/api-keys.
3. Nhập đề bài → **Phân tích & Dựng Hình AI**.
4. Kết quả hiển thị rõ `Gemini 3.8 Flash` hay `Bộ quy tắc SGK`; bấm **Xem hình vừa dựng** để đóng hộp thoại.
5. Key không đưa vào tài liệu hình, CSDL, repository hay biến môi trường chung của khách hàng. Chỉ gửi qua HTTPS đến API của ứng dụng khi người dùng bấm vẽ.
6. Tuỳ chọn **Nhớ key trong phiên tab này** lưu key trong `sessionStorage` của trình duyệt, **không được mã hóa**; không nên sử dụng trên thiết bị công cộng hoặc không tin cậy. Mặc định không lưu. Nút **Xóa** xóa key đã nhập và key trong phiên tab.

## Triển khai lên Vercel

- Dự án Vite có hai Vercel Functions dưới thư mục gốc `api/`:
  - `GET /api/health` → `status: ok`.
  - `POST /api/geometry/parse` → phân tích đề bằng Gemini hoặc parser quy tắc SGK.
- Vercel cần deploy commit có thư mục `api/`; thêm biến môi trường không sửa được lỗi 404 của API.
- Chế độ bán app mặc định **BYOK**: server không dùng `GEMINI_API_KEY` của chủ app cho khách hàng khi họ chưa nhập key, tránh dùng hết hạn mức của chủ app.
- Chỉ để thử nghiệm riêng: có thể bật `ALLOW_SHARED_GEMINI_KEY=true` đồng thời đặt `GEMINI_API_KEY` ở Vercel Settings → Environment Variables để cho phép sử dụng key server. **Không bật trên website công khai nếu chưa có xác thực người dùng và giới hạn lượt dùng.**
- Sau khi gộp PR vào `main`, đợi Vercel triển khai commit mới và kiểm tra `/api/health` trước khi thử Gemini.

## Chạy trên máy tính

1. `npm install`
2. `npm run dev`
3. Mở ứng dụng và dán API key vào giao diện AI; **không cần** tạo `.env.local` khi dùng key cá nhân.
4. Tuỳ chọn dành cho người phát triển: `.env.local` có thể gồm `GEMINI_API_KEY=...` và `ALLOW_SHARED_GEMINI_KEY=true`. File `.env.local` đã được đưa vào `.gitignore`, không commit lên GitHub.

Kiểm tra mã nguồn: `npm run lint`, sau đó `npm run build`.

### Giới hạn đã biết

Việc thay model Gemini và thêm ô nhập key **không tự bảo đảm** mọi bài hình học nhiều điểm phụ được vẽ đúng. Các điều kiện phức tạp vẫn phụ thuộc vào `GeometrySpecification` và `GeometrySpecificationAdapter`, cần xem lại hình vẽ trước khi sử dụng làm đề kiểm tra.
