// LỚP CLIENT API — nơi DUY NHẤT trong frontend được gọi fetch (kiểm tra: grep "fetch(" web/pages web/main.mjs phải trống).
// Đổi base URL, thêm token (TD-18) hay xử lý 401 chỉ phải sửa ở đây.
const BASE = (typeof window !== 'undefined' && window.API_BASE_URL) || '';

/** Lỗi gọi API đã chuẩn hóa. network=true khi không tới được máy chủ. */
export class ApiError extends Error {
  constructor({ status = 0, code = 'NETWORK_ERROR', message, fields = [], network = false }) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.network = network;
  }
}

async function goi(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, ...options });
  } catch {
    throw new ApiError({ message: 'Không kết nối được tới máy chủ.', network: true });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (body && body.error) || {};
    throw new ApiError({ status: res.status, code: e.code || 'HTTP_ERROR', message: e.message, fields: e.fields });
  }
  return body;
}

/**
 * Danh sách kỹ thuật viên (GET /api/technicians, hợp đồng ở docs/api-contract.md mục 2.8).
 * @param {{is_active?:boolean, center_id?:number, limit?:number, offset?:number}} [boLoc]
 * @returns {Promise<{items:object[], limit:number, offset:number}>}
 * @throws {ApiError}
 */
export function listTechnicians(boLoc = {}) {
  const q = new URLSearchParams(Object.entries(boLoc).filter(([, v]) => v !== undefined && v !== ''));
  return goi(`/api/technicians${q.size ? `?${q}` : ''}`);
}
