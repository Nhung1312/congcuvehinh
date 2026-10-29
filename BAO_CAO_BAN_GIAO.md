# BÀN GIAO LÕI AI DỰNG HÌNH TOÁN THCS

Ngày: 29/10/2026. Repository đích: Nhung1312/congcuvehinh.

## Nền mã nguồn và trạng thái bàn giao

- Nền duy nhất: tệp đính kèm `congcuvehinh (3)(1).zip` (bản ZIP (3) do người dùng cung cấp).
- SHA-256 bản gốc: `d4752ebff6d365ff482c7e1452d3558b10077a283664f3a67701ec676c234727`.
- Không lấy GitHub main làm nền, không push, không merge, không deploy.
- Giữ nguyên những thay đổi cuối của ZIP: checkedConditions/unsupportedConditions/contradictions; schema sideComparisons/specialAngle/mustBeInsideSegment; xóa verification tự khai của Gemini.
- Đây là mã nguồn đầy đủ để đối chiếu trước triển khai. Không chứa node_modules, dist, cấu hình môi trường thực hoặc khóa riêng được thêm vào.

## Đã sửa

1. Kiểm định góc nhọn/tù/vuông và số đo bằng tọa độ thực; bắt được ca sai 108,43° và 67,62°. Giữ tất cả điều kiện góc, thay vì ghi đè góc trước.
2. Dùng cùng bộ giải điểm phụ nhiều bước cho kiểm định và SVG AI. Kiểm tra đúng điểm nguồn/đường nhận, tham số thuộc đoạn/tia/đường thẳng và các phụ thuộc trả về ngược thứ tự.
3. Kiểm tra quan hệ cạnh, góc, song song, vuông góc, các phép dựng trung điểm/giao điểm/hình chiếu, tâm tam giác và các bất biến hình chính. Không lấy verification từ Gemini làm bằng chứng.
4. Tứ giác dùng họ tọa độ tham số bảo toàn loại hình, tối ưu xác định có giới hạn để xét nhiều điều kiện cùng lúc. Tam giác có bước giải bổ sung cho góc/số đo cạnh và điều kiện phụ. Không có nhánh nhận tên một đề cụ thể.
5. Bốn trạng thái: verified, invalid, unsupported, incomplete. valid chỉ đúng khi không có lỗi, điều kiện thiếu, mâu thuẫn hoặc điều kiện chưa hỗ trợ; đã có điều kiện thực sự được kiểm tra.
6. Hai luồng giao diện đều kiểm định lại trước áp dụng. Hình sai/chưa hỗ trợ không thay bản vẽ đang có và không hiện thông báo thành công.
7. Lưu giả thiết kiểm định trong metadata. Mọi thay đổi tài liệu, gồm kéo điểm và chỉnh định nghĩa điểm phụ, đều kiểm định lại; nạp bản nháp cũng kiểm định lại. Không chạy lại bộ tối ưu để tự kéo điểm về vị trí ban đầu.
8. Sửa nhầm vai trò A/B/C khi đổi thứ tự tên đỉnh và chặn nhận hai đoạn tiếp tuyến PA/PB thành tia tiếp tuyến tại P.
9. Giữ ảnh, đề gốc và luồng gửi key cá nhân; key không được thêm vào metadata kiểm định. Không sửa API route, cấu hình tài khoản, cơ sở dữ liệu hoặc hosting.

## Kiểm thử đã thực thi

| Nhóm | Kết quả |
| --- | --- |
| Bộ cũ trên ZIP trước sửa | 105 PASS / 0 FAIL |
| Toàn bộ bộ cũ sau sửa | 105 PASS / 0 FAIL |
| Kiểm thử toán học/hồi quy mới | 123 PASS / 0 FAIL |
| Nút dựng hình và dựng lại qua React DOM + API/Cloud giả lập | 4 PASS / 0 FAIL |
| Tổng lần chạy cuối | **232 PASS / 0 FAIL / 0 SKIP** |
| TypeScript: npm run lint | PASS |
| Production: npm run build | PASS |

Lệnh kiểm tra tổng: `npm run test:geometry-all`. Lệnh riêng: `npm run test:geometry-constraints` và `npm run test:geometry-dom`.

Toàn bộ test A–F hiện có đều chạy lại. Bộ mới có đổi tên đỉnh (kể cả A1/B1 và hoán đổi A/B), nhiều góc/cạnh/điểm phụ đồng thời, biến đổi đồng dạng tọa độ, đúng/sai số đo góc, dữ liệu thiếu và mâu thuẫn, trường hợp chưa hỗ trợ, kéo thả/khôi phục và kiểm tra SVG/TikZ. Các luồng DOM kiểm tra cả đường thành công và bị chặn, ảnh/đề gốc/key cá nhân, và giữ nguyên tài liệu cũ khi thất bại.

Không gọi Gemini thật. Test API chạy SDK với fetch giả lập và JSON cố định. Test giao diện dùng jsdom với Cloud client giả lập, không đăng nhập hay thao tác dữ liệu thực.

Môi trường chạy: Node v24.22.1; TypeScript 5.8.3; Vite 6.4.5. package-lock.json ghi lại bộ phụ thuộc đã dùng. jsdom chỉ được thêm vào devDependencies để chạy kiểm thử DOM.

Production build có cảnh báo Vite về chunk JS lớn hơn 500 kB (khoảng 1,20 MB trước gzip, khoảng 296 kB sau gzip); build vẫn kết thúc exit 0. Không mở rộng sang tối ưu tải trang.

## Giới hạn được giữ trung thực

- Đây là bộ giải/kiểm định số trong kiến trúc hiện tại, không phải bộ chứng minh hình học hoặc bộ giải mọi bài Toán 6–9. Bước tối ưu bị chặn số vòng và miền tham số; bài có nghiệm ngoài miền hoặc không hội tụ đủ chính xác sẽ bị chặn, không được tự kết luận là vô nghiệm.
- Chỉ kết luận mâu thuẫn khi kiểm tra được trực tiếp (ví dụ chu trình bất đẳng thức, bất đẳng thức tam giác, góc mâu thuẫn với hình chữ nhật). Các tình huống chưa giải được còn lại báo thiếu dữ liệu/phép dựng không có nghiệm hoặc lỗi điều kiện, không nhận định là đã chứng minh mâu thuẫn.
- Kiểm định dựa trên giả thiết có cấu trúc nhận được và các mẫu văn bản đã được chuẩn hóa; không bảo đảm Gemini/OCR luôn trích đủ mọi câu trong một đề tự nhiên. unhandledConditions được giữ và chặn áp dụng. Không kiểm nghiệm độ chính xác OCR/Gemini trực tuyến trong phiên này.
- Một số cấu hình góc nâng cao (hai đường song song với cát tuyến, cách biểu diễn hai góc kề bù), vị trí tương đối/tiếp tuyến chung hai đường tròn, một số preset đường tròn nâng cao và độ dài dạng biểu thức được báo chưa kiểm định đầy đủ. Chúng không bị coi là đã đúng; các mẫu dựng trực tiếp không dùng AI vẫn giữ luồng cũ.
- 15/16 preset AI hiện có được kiểm định hợp lệ từ bộ quy tắc. Preset 10 (hai đường song song và cát tuyến) được báo unsupported và chặn áp dụng AI cho đến khi có kiểm định đầy đủ. Test cho kết quả này là test sự trung thực của trạng thái, không phải tuyên bố cấu hình đó đã được hỗ trợ.
- Dùng dung sai số: góc có số đo/vuông khoảng 0,00018°; các quan hệ khác chủ yếu 1e-6 theo tỉ lệ cảnh. Riêng đa giác đều kế thừa làm tròn pixel khi kéo: cho phép 2 pixel về độ dài cạnh, 1 pixel về khoảng cách đường tròn và khoảng 1,08° về góc. Không diễn giải đây là chứng minh chính xác ký hiệu.
- Không chạy được Chromium: tải Chromium và Headless Shell đều trả về gói không hợp lệ/bị cắt. Đã thay bằng 4 kiểm thử tương tác React DOM và kiểm tra xuất SVG bằng renderToStaticMarkup; chưa xác nhận bố cục/pointer trên trình duyệt thật hay thiết bị cảm ứng. Không có test trình duyệt thật nào được ghi PASS.
- Các test hiện có về ảnh đề, SVG, TikZ và chức năng cũ đã chạy; không sửa mã xuất Word/PNG hoặc tổ chức lại UI. Không kiểm thử Microsoft Word/OBS hay thao tác tải tệp bằng trình duyệt thật trong phiên này.

## Tệp sửa (13)

- `package.json`
- `src/App.tsx`
- `src/ai/adapter/geometrySpecificationAdapter.ts`
- `src/ai/parser/normalizeExplicitConstructions.ts`
- `src/ai/parser/vietnameseGeometryParser.ts`
- `src/ai/types.ts`
- `src/components/EditorPanels/AIGeometryEditor.tsx`
- `src/components/EditorPanels/GeometryEditor.tsx`
- `src/renderers/GeometrySvg.tsx`
- `src/server/geminiGeometryService.ts`
- `src/types/index.ts`
- `src/utils/geometryMath.ts`
- `src/utils/resolveAuxiliaryPoints.ts`

## Tệp nguồn/kiểm thử thêm (8)

- `package-lock.json`
- `scripts/test_geometry_verification.ts`
- `scripts/test_geometry_dom.ts`
- `src/utils/minimizeGeometryConstraints.ts`
- `src/utils/geometrySceneCoordinates.ts`
- `src/ai/adapter/geometryVerificationState.ts`
- `src/ai/adapter/solveGeometryCoordinates.ts`
- `src/ai/adapter/verifyGeometryScene.ts`

## Nội dung gói đối chiếu

- Toàn bộ mã nguồn cuối cùng, cùng cấu trúc gốc của ZIP.
- PATCH_SO_VOI_ZIP_3.patch: bản diff so với đúng ZIP đính kèm, dùng để xem/đối chiếu. Không áp dụng patch này lên mã nguồn trong chính gói cuối, vì các thay đổi đã được tích hợp.
- SOURCE_MANIFEST.json: SHA-256 đầu vào và từng tệp nguồn cuối.
- VALIDATION/: log bộ cũ, toàn bộ test lần cuối, TypeScript và production build.

Hoàn thành bàn giao; dừng tại đây để người dùng đối chiếu. Chưa push main, merge hoặc deploy Production.
