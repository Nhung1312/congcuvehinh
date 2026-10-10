# Công cụ vẽ hình Toán THCS

Website: https://congcuvehinh.vercel.app/

## Test Gemini 3.8 Flash với API key cá nhân (BYOK)

1. Mở bản Vercel Preview của nhánh sửa.
2. Vào **AI TỰ DỰNG HÌNH** → **Gemini 3.8 Flash**.
3. Dán API key cá nhân vào ô password.
4. Nhập đề bài → **Phân Tích & Dựng Hình AI**.
5. Nếu Gemini phản hồi thành công, ứng dụng hiện **Đã dùng AI: gemini-3.8-flash** rồi bấm **Xem hình vừa dựng**.

Key chỉ được chuyển qua HTTPS tới API của ứng dụng khi bấm dựng hình. Không lưu vào tài liệu, GitHub hoặc cơ sở dữ liệu. Có tùy chọn ghi vào `sessionStorage` của tab nếu chủ động bật (không mã hóa; không nên dùng trên máy chung). Nút Xóa để bỏ key.

**Không có dùng thử, không có cookie, không có giới hạn lượt, không có API `/api/trial/status`, không dùng API key chủ app từ Vercel trong nhánh test này.** Chỉ API key trong ô nhập được sử dụng khi yêu cầu Gemini.

API: `GET /api/health`, `POST /api/geometry/parse`.

Để kiểm tra local: `npm install`, `npm run lint`, `npm run build`, `npm run dev`.

Không sửa geometry renderer/adapter. Nếu Gemini phân tích được đề nhưng hình phức tạp vẽ chưa đúng, cần kiểm tra riêng GeometrySpecificationAdapter.
