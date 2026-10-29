'use strict';
/**
 * Logger có cấu trúc: mỗi sự kiện một dòng JSON ghi ra STDOUT (đọc được bằng `docker compose logs`).
 * Mỗi dòng có: thời điểm (ISO, có múi giờ), mức, thông điệp, ngữ cảnh (requestId, mã đối tượng...).
 * KHÔNG ghi: mật khẩu, token, chuỗi kết nối, số điện thoại khách (QT-15) - các trường này bị che thành '***'.
 * Mức lấy từ biến môi trường LOG_LEVEL (debug | info | warn | error), mặc định info.
 */
const { randomUUID } = require('node:crypto');

const MUC = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

/** Tên trường (không phân biệt hoa thường, chỉ cần CHỨA) bị che trong log. */
const TRUONG_CHE = ['password', 'mat_khau', 'token', 'jwt', 'authorization', 'secret',
  'database_url', 'connectionstring', 'phone', 'so_dien_thoai', 'sodienthoai', 'sdt'];

const LECH_MUI_GIO_VN_PHUT = 7 * 60;   // phút

/** Thời điểm ISO có múi giờ +07:00 (khớp ví dụ trong slide: 2026-10-26T14:30:00+07:00). */
function thoiDiemVn(d = new Date()) {
  const vn = new Date(d.getTime() + LECH_MUI_GIO_VN_PHUT * 60000);
  return vn.toISOString().replace('Z', '').replace(/\.\d{3}$/, '') + '+07:00';
}

/** Sao chép đối tượng, che trường nhạy cảm; Error -> {loai, thong_diep, stack}. */
function che(v, sau = 0) {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Error) {
    return { loai: v.name, thong_diep: v.message, ...(v.code ? { ma: v.code } : {}), stack: v.stack };
  }
  if (sau > 5) return '[quá sâu]';
  const out = Array.isArray(v) ? [] : {};
  for (const [k, g] of Object.entries(v)) {
    out[k] = TRUONG_CHE.some((t) => k.toLowerCase().includes(t)) ? '***' : che(g, sau + 1);
  }
  return out;
}

/**
 * @param {{level?: string, write?: (dong: string) => void, now?: () => Date}} [tuyChon]
 * @returns {{debug: Function, info: Function, warn: Function, error: Function}}  (thongDiep, ngucanh?)
 */
function taoLogger({ level = process.env.LOG_LEVEL || 'info',
  write = (s) => process.stdout.write(s), now = () => new Date() } = {}) {
  const toiThieu = MUC[String(level).toLowerCase()] || MUC.info;
  const ghi = (muc) => (thongDiep, ngucanh = {}) => {
    if (MUC[muc] < toiThieu) return;
    write(JSON.stringify({ thoi_diem: thoiDiemVn(now()), muc, thong_diep: thongDiep, ...che(ngucanh) }) + '\n');
  };
  return { debug: ghi('debug'), info: ghi('info'), warn: ghi('warn'), error: ghi('error') };
}

/** Gán requestId cho mỗi yêu cầu (nhận X-Request-Id nếu hợp lệ), trả lại trong header, log khi hoàn tất. */
function ganRequestId(logger) {
  return (req, res, next) => {
    const co = req.headers['x-request-id'];
    req.requestId = typeof co === 'string' && /^[\w-]{1,64}$/.test(co) ? co : randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    req.logger = logger;   // để lớp routes ghi log lỗi nghiệp vụ mà không phải import logger
    const t0 = Date.now();
    res.on('finish', () => {
      // /health do Docker gọi mỗi 10 giây: ghi ở mức debug để không làm ngập log; lỗi (không phải 2xx) vẫn ghi INFO.
      const laKiemTraSucKhoe = (req.originalUrl || req.url || '').split('?')[0] === '/health' && res.statusCode < 400;
      logger[laKiemTraSucKhoe ? 'debug' : 'info']('yêu cầu hoàn tất', { requestId: req.requestId, phuong_thuc: req.method,
        duong_dan: (req.originalUrl || req.url).split('?')[0], ma_trang_thai: res.statusCode, thoi_gian_ms: Date.now() - t0 });
    });
    next();
  };
}

module.exports = { taoLogger, ganRequestId, che, thoiDiemVn, MUC };
