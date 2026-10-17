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
  const ten = cacTruong.map((x) => x.truong).join(', ');
  throw new ValidationError(`Dữ liệu không hợp lệ ở trường: ${ten}.`, cacTruong);
}

const laSoNguyenDuong = (v) => Number.isInteger(v) && v >= 1;

/** Dùng cho POST (tạo) và PUT (sửa toàn bộ). */
function validateTechnician(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return nem([{ truong: 'body', ly_do: 'phải là một đối tượng JSON' }]);
  }
  const loi = [];

  const ten = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  if (body.full_name === undefined || body.full_name === null) {
    loi.push({ truong: 'full_name', ly_do: 'bắt buộc' });
  } else if (typeof body.full_name !== 'string') {
    loi.push({ truong: 'full_name', ly_do: 'phải là chuỗi' });
  } else if (ten === '') {
    loi.push({ truong: 'full_name', ly_do: 'không được để trống' });
  } else if (ten.length > TEN_TOI_DA) {
    loi.push({ truong: 'full_name', ly_do: `tối đa ${TEN_TOI_DA} ký tự` });
  }

  if (body.center_id === undefined || body.center_id === null) {
    loi.push({ truong: 'center_id', ly_do: 'bắt buộc' });
  } else if (!laSoNguyenDuong(body.center_id)) {
    loi.push({ truong: 'center_id', ly_do: 'phải là số nguyên dương' });
  }

  if (body.level === undefined || body.level === null) {
    loi.push({ truong: 'level', ly_do: 'bắt buộc' });
  } else if (!LEVELS.includes(body.level)) {
    loi.push({ truong: 'level', ly_do: `phải là một trong ${LEVELS.join(', ')}` });
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    loi.push({ truong: 'is_active', ly_do: 'phải là true hoặc false' });
  }

  if (loi.length > 0) nem(loi);
  return {
    fullName: ten,
    centerId: body.center_id,
    level: body.level,
    isActive: body.is_active === undefined ? true : body.is_active,
  };
}

/** Mã trong đường dẫn /technicians/:id. Giới hạn 15 chữ số để không vượt độ chính xác của số trong JS. */
function validateId(raw) {
  if (!/^[1-9][0-9]{0,14}$/.test(String(raw))) {
    return nem([{ truong: 'id', ly_do: 'phải là số nguyên dương' }]);
  }
  return Number(raw);
}

/** Tham số lọc và phân trang của GET /technicians. */
function validateListQuery(q = {}) {
  const loi = [];
  const kq = { centerId: null, isActive: null, limit: LIMIT_MAC_DINH, offset: 0 };

  if (q.center_id !== undefined) {
    if (!/^[1-9][0-9]{0,8}$/.test(String(q.center_id))) {
      loi.push({ truong: 'center_id', ly_do: 'phải là số nguyên dương' });
    } else kq.centerId = Number(q.center_id);
  }
  if (q.is_active !== undefined) {
    if (q.is_active !== 'true' && q.is_active !== 'false') {
      loi.push({ truong: 'is_active', ly_do: 'phải là true hoặc false' });
    } else kq.isActive = q.is_active === 'true';
  }
  if (q.limit !== undefined) {
    const n = Number(q.limit);
    if (!/^[0-9]+$/.test(String(q.limit)) || n < 1 || n > LIMIT_TOI_DA) {
      loi.push({ truong: 'limit', ly_do: `phải từ 1 đến ${LIMIT_TOI_DA}` });
    } else kq.limit = n;
  }
  if (q.offset !== undefined) {
    if (!/^[0-9]{1,9}$/.test(String(q.offset))) {
      loi.push({ truong: 'offset', ly_do: 'phải là số nguyên không âm' });
    } else kq.offset = Number(q.offset);
  }

  if (loi.length > 0) nem(loi);
  return kq;
}

module.exports = { validateTechnician, validateId, validateListQuery, LEVELS, TEN_TOI_DA };
