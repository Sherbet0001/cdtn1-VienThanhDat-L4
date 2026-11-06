'use strict';
/**
 * Kiểm tra ký tự điều khiển trong văn bản người dùng nhập (BUG-003).
 * Ký tự NUL (\u0000) hợp lệ với JSON và với độ dài chuỗi, nhưng PostgreSQL từ chối (lỗi 22021),
 * nên nếu để lọt xuống tầng dữ liệu thì API trả 500 thay vì 400. Mọi ký tự điều khiển (\u0000-\u001f, \u007f)
 * đều không có chỗ trong tên, tên thiết bị, lý do hủy, nên bị từ chối ngay ở tầng định dạng.
 * Gọi SAU khi trim: xuống dòng hay tab ở hai đầu đã bị cắt bỏ.
 */
const KY_TU_DIEU_KHIEN = /[\u0000-\u001f\u007f]/;

/** @param {string} t Chuỗi đã trim. */
const coKyTuDieuKhien = (t) => KY_TU_DIEU_KHIEN.test(t);

const LY_DO_KY_TU_DIEU_KHIEN = 'không được chứa ký tự điều khiển';

module.exports = { coKyTuDieuKhien, LY_DO_KY_TU_DIEU_KHIEN };
