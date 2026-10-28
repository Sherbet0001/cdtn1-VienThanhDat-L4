'use strict';
/**
 * Lớp kiểm tra ĐỊNH DẠNG dữ liệu vào của Technician (tầng 1 của ba lớp kiểm tra).
 * Chỉ trả dữ liệu đã làm sạch hoặc ném ValidationError kèm TÊN TRƯỜNG sai.
 * Quy tắc nghiệp vụ (ví dụ "đang giữ phiếu thì không ngừng hoạt động") nằm ở service, không ở đây.
 */
const { ValidationError } = require('../errors/AppError');

const LEVELS = Object.freeze(['SO_CAP', 'TRUNG_CAP', 'CAO_CAP']);
const TEN_TOI_DA = 100;
const LIMIT_MAC_DINH = 20;
const LIMIT_TOI_DA = 100;

function nem(cacTruong) {
  const ten = cacTruong.map((x) => x.field).join(', ');
  throw new ValidationError(`Dữ liệu không hợp lệ ở trường: ${ten}.`, cacTruong);
}

/** center_id là cột INT của PostgreSQL: lớn hơn giá trị này thì CSDL báo lỗi, nên phải chặn ngay ở validator (BUG-001). */
const INT_TOI_DA = 2147483647;
const laSoNguyenDuong = (v) => Number.isInteger(v) && v >= 1 && v <= INT_TOI_DA;

/**
 * Kiểm tra thân yêu cầu POST (tạo) và PUT (sửa toàn bộ) và đổi sang dạng nghiệp vụ.
 * @param {unknown} body Thân JSON nhận từ HTTP, snake_case; có thể là bất kỳ thứ gì.
 * @returns {{fullName:string, centerId:number, level:string, isActive:boolean}}
 *   fullName đã cắt khoảng trắng hai đầu; isActive mặc định true khi thiếu.
 * @throws {ValidationError} Khi body không phải đối tượng hoặc sai một trường; fields liệt kê MỌI trường sai.
 */
function validateTechnician(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return nem([{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
  }
  const loi = [];

  const ten = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  if (body.full_name === undefined || body.full_name === null) {
    loi.push({ field: 'full_name', reason: 'bắt buộc' });
  } else if (typeof body.full_name !== 'string') {
    loi.push({ field: 'full_name', reason: 'phải là chuỗi' });
  } else if (ten === '') {
    loi.push({ field: 'full_name', reason: 'không được để trống' });
  } else if (ten.length > TEN_TOI_DA) {
    loi.push({ field: 'full_name', reason: `tối đa ${TEN_TOI_DA} ký tự` });
  }

  if (body.center_id === undefined || body.center_id === null) {
    loi.push({ field: 'center_id', reason: 'bắt buộc' });
  } else if (!laSoNguyenDuong(body.center_id)) {
    loi.push({ field: 'center_id', reason: 'phải là số nguyên dương' });
  }

  if (body.level === undefined || body.level === null) {
    loi.push({ field: 'level', reason: 'bắt buộc' });
  } else if (!LEVELS.includes(body.level)) {
    loi.push({ field: 'level', reason: `phải là một trong ${LEVELS.join(', ')}` });
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    loi.push({ field: 'is_active', reason: 'phải là true hoặc false' });
  }

  if (loi.length > 0) nem(loi);
  return {
    fullName: ten,
    centerId: body.center_id,
    level: body.level,
    isActive: body.is_active === undefined ? true : body.is_active,
  };
}

/**
 * Kiểm tra mã trong đường dẫn /technicians/:id.
 * Giới hạn 15 chữ số vì số nguyên JS chỉ chính xác tới 2^53 (khoảng 9×10^15); mã dài hơn sẽ bị làm tròn âm thầm.
 * @param {string|number} raw Giá trị thô lấy từ req.params.
 * @returns {number} Số nguyên dương.
 * @throws {ValidationError} Khi không phải số nguyên dương (field = 'id').
 */
function validateId(raw) {
  if (!/^[1-9][0-9]{0,14}$/.test(String(raw))) {
    return nem([{ field: 'id', reason: 'phải là số nguyên dương' }]);
  }
  return Number(raw);
}

/**
 * Kiểm tra tham số lọc và phân trang của GET /technicians (chuỗi query luôn là chuỗi).
 * @param {Record<string,string>} [q] req.query: center_id, is_active ('true'|'false'), limit (1–100), offset (>= 0).
 * @returns {{centerId:number|null, isActive:boolean|null, limit:number, offset:number}}
 *   null nghĩa là "không lọc theo trường này"; limit mặc định 20, offset mặc định 0.
 * @throws {ValidationError} Khi một tham số sai; không âm thầm sửa thành giá trị mặc định.
 */
function validateListQuery(q = {}) {
  const loi = [];
  const kq = { centerId: null, isActive: null, limit: LIMIT_MAC_DINH, offset: 0 };

  if (q.center_id !== undefined) {
    if (!/^[1-9][0-9]{0,8}$/.test(String(q.center_id))) {
      loi.push({ field: 'center_id', reason: 'phải là số nguyên dương' });
    } else kq.centerId = Number(q.center_id);
  }
  if (q.is_active !== undefined) {
    if (q.is_active !== 'true' && q.is_active !== 'false') {
      loi.push({ field: 'is_active', reason: 'phải là true hoặc false' });
    } else kq.isActive = q.is_active === 'true';
  }
  if (q.limit !== undefined) {
    const n = Number(q.limit);
    if (!/^[0-9]+$/.test(String(q.limit)) || n < 1 || n > LIMIT_TOI_DA) {
      loi.push({ field: 'limit', reason: `phải từ 1 đến ${LIMIT_TOI_DA}` });
    } else kq.limit = n;
  }
  if (q.offset !== undefined) {
    if (!/^[0-9]{1,9}$/.test(String(q.offset))) {
      loi.push({ field: 'offset', reason: 'phải là số nguyên không âm' });
    } else kq.offset = Number(q.offset);
  }

  if (loi.length > 0) nem(loi);
  return kq;
}

module.exports = { validateTechnician, validateId, validateListQuery, LEVELS, TEN_TOI_DA };
