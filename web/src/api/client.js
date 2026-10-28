// LỚP CLIENT API — nơi DUY NHẤT trong frontend được gọi fetch (kiểm tra: grep "fetch(" web/src/pages web/src/components phải trống).
// Đổi base URL, thêm token (TD-18) hay xử lý 401 chỉ phải sửa ở đây.
const BASE = (typeof window !== 'undefined' && window.API_BASE_URL) || '';

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
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError({ message: 'Không kết nối được tới máy chủ.', network: true });
  }
  const noiDung = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) khiChuaDangNhap();
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
