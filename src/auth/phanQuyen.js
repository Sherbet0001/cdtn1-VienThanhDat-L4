'use strict';
/**
 * Quy tắc kiểm soát truy cập theo trung tâm (QT-14, NFR4, OWASP A01), thuần hàm, không biết gì về HTTP.
 * Mặc định TỪ CHỐI: chỉ vai trò và trung tâm được liệt kê rõ mới qua.
 *   QUAN_TRI : mọi trung tâm.
 *   QUAN_LY  : chỉ trung tâm của chính mình.
 * @typedef {{id:number, role:string, centerId:number|null}} NguoiDung
 */
const { AppError } = require('../errors/AppError');

const chuaDangNhap = () => new AppError('UNAUTHENTICATED', 'Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
const khongCoQuyen = (field = 'center_id') => new AppError('FORBIDDEN',
  'Bạn không có quyền truy cập dữ liệu của trung tâm này.', undefined, field);

/**
 * @param {NguoiDung|undefined} nguoi
 * @param {number} centerId Trung tâm sở hữu dữ liệu
 * @throws {AppError} UNAUTHENTICATED (không có người dùng) hoặc FORBIDDEN (khác trung tâm)
 */
function kiemTraTrungTam(nguoi, centerId) {
  if (!nguoi) throw chuaDangNhap();
  if (nguoi.role === 'QUAN_TRI') return;
  if (nguoi.role === 'QUAN_LY' && Number.isInteger(centerId) && nguoi.centerId === centerId) return;
  throw khongCoQuyen();
}

/**
 * Giá trị center_id dùng để lọc danh sách: quản lý luôn bị ép về trung tâm của mình (hỏi trung tâm khác thì bị từ chối),
 * quản trị dùng đúng giá trị đã hỏi (rỗng = tất cả).
 * @param {NguoiDung|undefined} nguoi
 * @param {string|number|undefined} hoi Giá trị center_id người dùng gửi lên (chuỗi query)
 * @returns {string|number|undefined}
 */
function trungTamDeLoc(nguoi, hoi) {
  if (!nguoi) throw chuaDangNhap();
  if (nguoi.role === 'QUAN_TRI') return hoi;
  if (nguoi.role !== 'QUAN_LY') throw khongCoQuyen();
  if (hoi !== undefined && hoi !== '' && String(hoi) !== String(nguoi.centerId)) throw khongCoQuyen();
  return String(nguoi.centerId);
}

module.exports = { kiemTraTrungTam, trungTamDeLoc, chuaDangNhap, khongCoQuyen };
