// Logic THUẦN của ba trạng thái (đang tải / rỗng / lỗi) — không chạm DOM nên kiểm thử được bằng node --test.

/**
 * Quyết định màn hình đang ở trạng thái nào.
 * @param {{loading:boolean, error:Error|null, data:unknown}} s
 * @param {(data:unknown)=>boolean} [laRong] Mặc định: mảng rỗng hoặc không có dữ liệu.
 * @returns {'loading'|'error'|'empty'|'ready'} Lỗi được ưu tiên hơn rỗng; rỗng KHÁC với đang tải.
 */
export function layTrangThai({ loading, error, data }, laRong = (d) => !d || (Array.isArray(d) && d.length === 0)) {
  if (loading) return 'loading';
  if (error) return 'error';
  return laRong(data) ? 'empty' : 'ready';
}

/**
 * Thông báo lỗi cho người dùng: chuyện gì · vì sao · làm gì tiếp. KHÔNG lộ mã kỹ thuật, tên bảng hay câu SQL.
 * @param {{status?:number, message?:string, network?:boolean}|null} err Lỗi đã chuẩn hóa bởi lớp client (ApiError).
 * @returns {{tieuDe:string, chiTiet:string}}
 */
export function thongBaoLoi(err) {
  if (!err || err.network) {
    return { tieuDe: 'Không kết nối được tới hệ thống.', chiTiet: 'Kiểm tra mạng hoặc máy chủ đã chạy chưa, rồi bấm Thử lại.' };
  }
  if (err.status >= 400 && err.status < 500) {
    return { tieuDe: 'Yêu cầu chưa hợp lệ.', chiTiet: err.message || 'Hãy kiểm tra lại thông tin rồi thử lại.' };
  }
  return { tieuDe: 'Hệ thống đang gặp sự cố.', chiTiet: 'Vui lòng thử lại sau ít phút.' };
}
