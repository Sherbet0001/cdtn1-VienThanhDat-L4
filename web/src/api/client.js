// LỚP CLIENT API — nơi DUY NHẤT trong frontend được gọi fetch (kiểm tra: grep "fetch(" web/src/pages web/src/components phải trống).
// Đổi base URL, gắn token đăng nhập (TD-34) hay xử lý 401 chỉ phải sửa ở đây.
const BASE = (typeof window !== 'undefined' && window.API_BASE_URL) || '';

// Phiên đăng nhập {token, user} lưu trong sessionStorage: mất khi đóng thẻ trình duyệt, không tồn tại giữa các thẻ. Bọc try/catch vì
// trình duyệt có thể chặn kho lưu trữ; khi đó người dùng phải đăng nhập lại mỗi lần tải trang nhưng ứng dụng vẫn chạy.
const KHOA_PHIEN = 'phien-dang-nhap';
let phienTrongBoNho = null;
export function layPhien() {
  if (phienTrongBoNho) return phienTrongBoNho;
  try {
    const p = JSON.parse(globalThis.sessionStorage?.getItem(KHOA_PHIEN) || 'null');
    return p && typeof p.token === 'string' ? p : null;
  } catch { return null; }
}
export function luuPhien(phien) {
  phienTrongBoNho = phien;
  try { globalThis.sessionStorage?.setItem(KHOA_PHIEN, JSON.stringify(phien)); } catch { /* kho bị chặn: giữ trong bộ nhớ */ }
}
export function xoaPhien() {
  phienTrongBoNho = null;
  try { globalThis.sessionStorage?.removeItem(KHOA_PHIEN); } catch { /* bỏ qua */ }
}

/** Lỗi gọi API đã chuẩn hóa theo khung lỗi { error: { code, message, field, fields } }. network=true khi không tới được máy chủ. */
export class ApiError extends Error {
  constructor({ status = 0, code = 'NETWORK_ERROR', message, field, fields = [], details, requestId, network = false }) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
    this.fields = fields;
    this.details = details;
    this.requestId = requestId;   // mã tra cứu của lỗi 5xx, để người dùng báo lại
    this.network = network;
  }
}

let khiChuaDangNhap = () => {};
/** Đăng ký hàm chạy khi API trả 401 (xóa token, về trang đăng nhập). */
export function dangKyXuLy401(fn) { khiChuaDangNhap = fn; }

/**
 * Gọi API và trả JSON; mọi lỗi đều thành ApiError.
 * @param {string} path Đường dẫn bắt đầu bằng /api.
 * @param {{method?:string, body?:object}} [tuyChon]
 * @throws {ApiError}
 */
export async function goi(path, { method = 'GET', body } = {}) {
  let res;
  const phien = layPhien();
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(phien ? { Authorization: `Bearer ${phien.token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError({ message: 'Không kết nối được tới máy chủ.', network: true });
  }
  const noiDung = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login') khiChuaDangNhap();   // sai mật khẩu ở form đăng nhập không phải "hết phiên"
    const e = (noiDung && noiDung.error) || {};
    throw new ApiError({ status: res.status, code: e.code || 'HTTP_ERROR', message: e.message, field: e.field, fields: e.fields, details: e.details,
      requestId: e.requestId || res.headers?.get?.('X-Request-Id') || undefined });
  }
  return noiDung;
}

/** Chuỗi query từ đối tượng, bỏ giá trị rỗng/undefined. */
export function taoQuery(tham) {
  const q = new URLSearchParams();
  Object.entries(tham).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, v); });
  const s = q.toString();
  return s ? `?${s}` : '';
}
