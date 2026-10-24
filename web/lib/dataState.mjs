// Logic THUẦN của ba trạng thái (đang tải / rỗng / lỗi) — không chạm DOM nên kiểm thử được bằng node --test.

/**
 * Quyết định màn hình đang ở trạng thái nào.
 * @param {{loading:boolean, error:Error|null, data:Array|null}} s
 * @returns {'loading'|'error'|'empty'|'ready'} Lỗi được ưu tiên hơn rỗng; rỗng KHÁC với đang tải.
 */
export function layTrangThai({ loading, error, data }) {
  if (loading) return 'loading';
  if (error) return 'error';
  if (!data || data.length === 0) return 'empty';
  return 'ready';
}

/**
 * Thông báo lỗi cho người dùng: chuyện gì · vì sao · làm gì tiếp. KHÔNG lộ mã kỹ thuật, tên bảng hay câu SQL.
 * @param {{status?:number, code?:string, message?:string, network?:boolean}|null} err
 * @returns {{tieuDe:string, chiTiet:string}}
 */
export function thongBaoLoi(err) {
  if (!err || err.network) {
    return { tieuDe: 'Không kết nối được tới hệ thống.', chiTiet: 'Kiểm tra mạng hoặc máy chủ đã chạy chưa, rồi bấm Thử lại.' };
  }
  if (err.status >= 400 && err.status < 500) {
    return { tieuDe: 'Yêu cầu chưa hợp lệ.', chiTiet: err.message || 'Hãy kiểm tra lại bộ lọc rồi thử lại.' };
  }
  return { tieuDe: 'Hệ thống đang gặp sự cố.', chiTiet: 'Vui lòng thử lại sau ít phút.' };
}

/** Nội dung trạng thái rỗng: nói rõ vì sao rỗng và gợi ý bước tiếp theo. */
export function thongBaoRong(boLoc) {
  return boLoc && boLoc.is_active !== undefined
    ? 'Không có kỹ thuật viên nào khớp bộ lọc. Thử bỏ lọc "trạng thái" để xem tất cả.'
    : 'Chưa có kỹ thuật viên nào. Chạy npm run seed để nạp dữ liệu mẫu.';
}
