/**
 * =========================================================================
 * CÔNG TẮC CẤU HÌNH DÙNG THỬ (TRIAL LIMIT CONFIGURATION)
 * =========================================================================
 * - ENABLE_TRIAL_LIMIT = false: TẠM THỜI TẮT cơ chế giới hạn dùng thử.
 *   + Tất cả người dùng (mới hoặc cũ, kể cả tài khoản đã quá hạn) được sử dụng
 *     ứng dụng MIỄN PHÍ HOÀN TOÀN, không giới hạn thời gian.
 *   + Không kiểm tra hết hạn, không khóa ứng dụng khi hết ngày.
 *   + Không hiển thị cảnh báo "hết thời gian dùng thử" hay màn hình ép nâng cấp.
 *   + Giữ nguyên toàn bộ logic cũ và dữ liệu hiện tại.
 *
 * - ENABLE_TRIAL_LIMIT = true : BẬT LẠI cơ chế dùng thử giới hạn 30 ngày cũ.
 *   + Sau này chỉ cần đổi giá trị thành true là cơ chế trial 30 ngày sẽ hoạt động
 *     lại bình thường ngay lập tức mà không cần viết lại mã nguồn.
 * =========================================================================
 */
export const ENABLE_TRIAL_LIMIT = false;

/**
 * Số ngày dùng thử mặc định khi bật lại cơ chế dùng thử (30 ngày)
 */
export const TRIAL_DAYS_COUNT = 30;
