'use strict';
/**
 * Giới hạn số lần đăng nhập sai (OWASP A07, chống dò mật khẩu): quá `toiDa` lần sai trong `cuaSoMs` thì chặn khóa đó
 * (khóa = địa chỉ + tên đăng nhập) cho tới hết cửa sổ. Đăng nhập đúng thì xóa bộ đếm. Lưu trong bộ nhớ một tiến trình:
 * đủ cho prototype một máy chủ; nhiều máy chủ cần kho dùng chung (Redis), thuộc phạm vi Chuyên đề tốt nghiệp 2.
 */
function taoGioiHan({ toiDa = 10, cuaSoMs = 5 * 60 * 1000, bayGio = Date.now } = {}) {
  const dem = new Map();   // khóa -> { so, hetHan }
  const donDep = (t) => { if (dem.size > 1000) for (const [k, v] of dem) if (v.hetHan <= t) dem.delete(k); };
  return {
    /** @returns {number} số giây phải chờ nếu đang bị chặn, 0 nếu được phép thử */
    biChan(khoa) {
      const t = bayGio();
      const v = dem.get(khoa);
      if (!v || v.hetHan <= t) return 0;
      return v.so >= toiDa ? Math.ceil((v.hetHan - t) / 1000) : 0;
    },
    ghiSai(khoa) {
      const t = bayGio();
      donDep(t);
      const v = dem.get(khoa);
      if (!v || v.hetHan <= t) dem.set(khoa, { so: 1, hetHan: t + cuaSoMs });
      else v.so += 1;
    },
    xoa(khoa) { dem.delete(khoa); },
  };
}

module.exports = { taoGioiHan };
