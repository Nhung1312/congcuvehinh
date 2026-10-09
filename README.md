# Công cụ vẽ hình Toán THCS

Website: https://congcuvehinh.vercel.app/

## Chế độ trải nghiệm 3 lượt miễn phí + API key cá nhân (BYOK)

**Tham khảo:** cơ chế cookie có chữ ký của repo `Nhung1312/toan-matsuda-ai` (repo Matsuda hiện cho 5 lượt chấm). Bản Công cụ vẽ hình này cho **3 lượt vẽ Gemini** trên mỗi trình duyệt, không yêu cầu đăng nhập.

- Người dùng mở AI → **Gemini 3.8 Flash** sẽ thấy **Còn 3/3 lượt vẽ AI miễn phí** khi máy chủ đã cấu hình đúng.
- Nếu chưa nhập key riêng, 3 yêu cầu **Gemini thành công** đầu tiên dùng key của chủ app trên server. Chỉ trừ lượt sau khi Gemini trả kết quả hợp lệ.
- Từ lượt thứ tư, máy chủ trả mã `TRIAL_LIMIT_REACHED`; người dùng dán **API key riêng** vào giao diện để vẽ tiếp bằng quota của họ.
- Khi có key riêng, không trừ lượt dùng thử và không dùng key hệ thống.
- Các công cụ vẽ thủ công, bộ **Quy tắc SGK** và chức năng xuất hình không nằm trong giới hạn 3 lượt.
- API key của khách được gửi qua HTTPS khi bấm vẽ, không ghi vào GitHub, tài liệu hình học hay database. Tuỳ chọn lưu trong `sessionStorage` chỉ hoạt động khi người dùng bật và **không mã hóa** dữ liệu, không nên dùng trên máy dùng chung.

## Triển khai trên Vercel – cấu hình môi trường

Trong **Vercel → Project → Settings → Environment Variables** thêm ba biến **Production** sau:

| Tên | Giá trị |
| --- | --- |
| `GEMINI_API_KEY` | API key Gemini của **chủ app**, chỉ dùng trên server |
| `TRIAL_SIGNING_SECRET` | Chuỗi ngẫu nhiên mạnh, độc lập với Gemini key |
| `ENABLE_FREE_GEOMETRY_TRIAL` | `true` |

Đừng đặt `VITE_` ở trước các biến server trên. Không commit giá trị bí mật vào GitHub.

Sau khi merge PR và deploy thành công:

1. Mở `https://congcuvehinh.vercel.app/api/health` → trạng thái OK.
2. Mở `https://congcuvehinh.vercel.app/api/trial/status` → `enabled:true, limit:3, used:0, remaining:3` nếu trình duyệt chưa dùng.
3. Mở app → AI → không nhập key riêng → vẽ thành công 3 lần; thông báo còn lần lượt 2/3, 1/3, 0/3.
4. Lần thứ tư phải bị từ chối, không gọi key chủ app.
5. Nhập API key riêng → có thể tiếp tục, không mất thêm lượt miễn phí.
6. Cố tình nhập key sai phải hiện lỗi thật, không giả như Gemini đã vẽ thành công.

**Hạn chế phải hiểu rõ:** Đây là bản dùng thử tham khảo Matsuda dùng cookie HttpOnly ký HMAC. F5 không reset, sửa số lượt trong cookie sẽ không vượt qua chữ ký; **nhưng xóa cookie, đổi trình duyệt, thiết bị hoặc gửi nhiều request đồng thời có thể vượt giới hạn 3 lượt**. Vì vậy, nó **chỉ phù hợp thử nghiệm có kiểm soát**, chưa bảo vệ tốt quota chủ app trước lưu lượng công khai lớn. Khi mở bán rộng rãi nên thay bằng bộ đếm atomic trên database gắn với tài khoản/định danh đáng tin, kèm IP rate limit / CAPTCHA phù hợp.

Nếu một trong ba biến môi trường thiếu, API sẽ **không sử dụng key của chủ app** và UI thông báo miễn phí chưa được bật. Không có default secret để tránh nguy cơ giả mạo cookie trên production.

## Chạy local

1. `npm install`
2. Tạo file `.env.local` nếu muốn thử 3 lượt miễn phí ở local, có thể sao chép tên biến từ `.env.example`, điền giá trị **bí mật** ở máy cá nhân.
3. `npm run dev` → mở localhost:3000; có thể dùng key cá nhân mà không cần file môi trường.
4. Chạy `npm run lint` và `npm run build` để kiểm tra. Không commit `.env.local`.

## Thông tin kỹ thuật

- Vercel Functions: `GET /api/health`, `GET /api/trial/status`, `POST /api/geometry/parse`.
- `src/server/geometryTrialService.ts` chỉ xử lý số lượt, cookie HttpOnly và chữ ký server.
- `src/server/geminiGeometryService.ts` chỉ dùng key hệ thống khi backend đã kiểm tra quyền dùng thử và cho phép rõ ràng.
- Không thay đổi SVG renderer, geometryMath hay bộ chuyển đổi dữ liệu hình học.
- AI vẫn có giới hạn đọc/dựng một số bài hình học phức tạp nhiều điểm phụ. Chỉ trừ lượt sau khi Gemini trả kết quả; chưa có bước kiểm định hình vẽ hoàn toàn chính xác.
