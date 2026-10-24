// Định dạng hiển thị THUẦN (không DOM): nhãn tiếng Việt cho mã trong hợp đồng và định dạng thời gian.

export const NHAN_UU_TIEN = Object.freeze({ CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' });
export const NHAN_NHOM_LOI = Object.freeze({
  MAN_HINH: 'Màn hình', PIN: 'Pin', SAC: 'Sạc', PHAN_MEM: 'Phần mềm', NUOC_VAO: 'Nước vào', KHAC: 'Khác' });
export const NHAN_CAP = Object.freeze({ SO_CAP: 'Sơ cấp', TRUNG_CAP: 'Trung cấp', CAO_CAP: 'Cao cấp' });
export const NHAN_TRANG_THAI = Object.freeze({
  MOI: 'Mới', DA_PHAN_CONG: 'Đã phân công', DANG_XU_LY: 'Đang xử lý', CHO_LINH_KIEN: 'Chờ linh kiện',
  HOAN_TAT: 'Hoàn tất', DA_DONG: 'Đã đóng', DA_HUY: 'Đã hủy' });

/** Nhãn cho một mã; mã lạ giữ nguyên (không để lộ "undefined" lên màn hình). */
export const nhan = (bang, ma) => bang[ma] || String(ma);

/**
 * "2026-10-06T10:30:00+07:00" -> "06/10/2026 10:30". Đọc thẳng từ chuỗi nên không lệch múi giờ theo máy người xem.
 * @param {string|null} iso
 */
export function ngayGio(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : '—';
}

/** Hạn cam kết đã qua so với thời điểm `bayGio` (mặc định bây giờ). */
export const daQuaHan = (iso, bayGio = new Date()) => new Date(iso).getTime() < bayGio.getTime();
