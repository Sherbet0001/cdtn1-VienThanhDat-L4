'use strict';
/**
 * Chuẩn hóa số điện thoại (QT-02): 10 chữ số bắt đầu bằng 0.
 * Chấp nhận "0901234567", "090 123 4567", "090.123.4567", "+84901234567", "84901234567".
 * @param {unknown} raw Giá trị người dùng nhập.
 * @returns {string|null} Số chuẩn, hoặc null khi không hợp lệ (thiếu số, thừa số, không bắt đầu bằng 0 sau khi đổi 84).
 */
function chuanHoaSdt(raw) {
  if (typeof raw !== 'string') return null;
  let so = raw.replace(/[\s.\-()]/g, '');
  if (/[^0-9+]/.test(so) || (so.includes('+') && !so.startsWith('+'))) return null;
  so = so.replace(/^\+/, '');
  if (so.startsWith('84') && so.length === 11) so = `0${so.slice(2)}`;
  return /^0[0-9]{9}$/.test(so) ? so : null;
}

/** Che số điện thoại cho vai trò không phải quản lý (QT-15): giữ 3 số đầu và 3 số cuối. */
function cheSdt(sdt) {
  return /^0[0-9]{9}$/.test(sdt) ? `${sdt.slice(0, 3)}****${sdt.slice(-3)}` : sdt;
}

module.exports = { chuanHoaSdt, cheSdt };
