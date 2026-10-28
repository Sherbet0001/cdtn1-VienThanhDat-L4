'use strict';
/** Kiểm tra ĐỊNH DẠNG dữ liệu vào của phiếu (tầng 1). Quy tắc nghiệp vụ nằm ở service. */
const { ValidationError } = require('../errors/AppError');
const { chuanHoaSdt } = require('./phone');

const CATEGORIES = Object.freeze(['MAN_HINH', 'PIN', 'SAC', 'PHAN_MEM', 'NUOC_VAO', 'KHAC']);
const PRIORITIES = Object.freeze(['CAO', 'TRUNG_BINH', 'THAP']);
const INT_TOI_DA = 2147483647;   // center_id là cột INT của PostgreSQL (BUG-001)

function nem(cacTruong) {
  throw new ValidationError(`Dữ liệu không hợp lệ ở trường: ${cacTruong.map((x) => x.field).join(', ')}.`, cacTruong);
}

function chuoi(body, ten, toiDa, loi) {
  const v = body[ten];
  if (v === undefined || v === null) { loi.push({ field: ten, reason: 'bắt buộc' }); return ''; }
  if (typeof v !== 'string') { loi.push({ field: ten, reason: 'phải là chuỗi' }); return ''; }
  const t = v.trim();
  if (t === '') loi.push({ field: ten, reason: 'không được để trống' });
  else if (t.length > toiDa) loi.push({ field: ten, reason: `tối đa ${toiDa} ký tự` });
  return t;
}

/**
 * Kiểm tra thân POST /api/tickets (tiếp nhận phiếu mới).
 * @param {unknown} body Thân JSON, snake_case.
 * @returns {{customerName:string, customerPhone:string, deviceName:string, issueCategory:string,
 *            priority:string|null, centerId:number}} customerPhone đã chuẩn hóa QT-02; priority null = dùng mặc định theo nhóm sự cố.
 * @throws {ValidationError} fields liệt kê MỌI trường sai.
 */
function validateTicketCreate(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return nem([{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
  }
  const loi = [];
  const customerName = chuoi(body, 'customer_name', 100, loi);
  const deviceName = chuoi(body, 'device_name', 100, loi);

  let customerPhone = '';
  if (body.customer_phone === undefined || body.customer_phone === null) {
    loi.push({ field: 'customer_phone', reason: 'bắt buộc' });
  } else {
    customerPhone = chuanHoaSdt(body.customer_phone);
    if (!customerPhone) loi.push({ field: 'customer_phone', reason: 'phải là số điện thoại 10 chữ số bắt đầu bằng 0 (hoặc +84)' });
  }

  if (body.issue_category === undefined || body.issue_category === null) {
    loi.push({ field: 'issue_category', reason: 'bắt buộc' });
  } else if (!CATEGORIES.includes(body.issue_category)) {
    loi.push({ field: 'issue_category', reason: `phải là một trong ${CATEGORIES.join(', ')}` });
  }

  if (body.priority !== undefined && body.priority !== null && !PRIORITIES.includes(body.priority)) {
    loi.push({ field: 'priority', reason: `phải là một trong ${PRIORITIES.join(', ')}` });
  }

  if (body.center_id === undefined || body.center_id === null) {
    loi.push({ field: 'center_id', reason: 'bắt buộc' });
  } else if (!Number.isInteger(body.center_id) || body.center_id < 1 || body.center_id > INT_TOI_DA) {
    loi.push({ field: 'center_id', reason: 'phải là số nguyên dương' });
  }

  if (loi.length > 0) nem(loi);
  return {
    customerName, customerPhone, deviceName,
    issueCategory: body.issue_category,
    priority: body.priority === undefined ? null : body.priority,
    centerId: body.center_id,
  };
}

/**
 * Kiểm tra tham số của GET /api/tickets/unassigned.
 * @param {Record<string,string>} [q] page (>= 1, mặc định 1), limit (1–100, mặc định 20), center_id (tùy chọn).
 * @returns {{page:number, limit:number, centerId:number|null}}
 * @throws {ValidationError}
 */
function validateUnassignedQuery(q = {}) {
  const loi = [];
  const kq = { page: 1, limit: 20, centerId: null };
  if (q.page !== undefined) {
    if (!/^[1-9][0-9]{0,6}$/.test(String(q.page))) loi.push({ field: 'page', reason: 'phải là số nguyên từ 1' });
    else kq.page = Number(q.page);
  }
  if (q.limit !== undefined) {
    const n = Number(q.limit);
    if (!/^[0-9]+$/.test(String(q.limit)) || n < 1 || n > 100) loi.push({ field: 'limit', reason: 'phải từ 1 đến 100' });
    else kq.limit = n;
  }
  if (q.center_id !== undefined) {
    if (!/^[1-9][0-9]{0,8}$/.test(String(q.center_id))) loi.push({ field: 'center_id', reason: 'phải là số nguyên dương' });
    else kq.centerId = Number(q.center_id);
  }
  if (loi.length > 0) nem(loi);
  return kq;
}

/**
 * Kiểm tra thân POST /api/tickets/{id}/assignment.
 * @param {unknown} body { technician_id: số nguyên dương }.
 * @returns {number} technician_id.
 * @throws {ValidationError} field = 'technician_id' (hoặc 'body').
 */
function validateAssignment(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return nem([{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
  }
  if (body.technician_id === undefined || body.technician_id === null) {
    return nem([{ field: 'technician_id', reason: 'bắt buộc' }]);
  }
  if (!Number.isInteger(body.technician_id) || body.technician_id < 1) {
    return nem([{ field: 'technician_id', reason: 'phải là số nguyên dương' }]);
  }
  return body.technician_id;
}

/**
 * Kiểm tra thân PATCH /api/tickets/{id} (sửa phiếu chưa phân công). Chỉ được sửa device_name, issue_category, priority;
 * phải có ít nhất một trường; trường lạ (ví dụ status, technician_id) bị từ chối thay vì âm thầm bỏ qua.
 * @param {unknown} body
 * @returns {{deviceName?:string, issueCategory?:string, priority?:string}} chỉ chứa trường được gửi.
 * @throws {ValidationError} fields liệt kê MỌI trường sai.
 */
function validateTicketUpdate(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return nem([{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
  }
  const loi = [];
  const kq = {};
  const choPhep = ['device_name', 'issue_category', 'priority'];
  for (const k of Object.keys(body)) {
    if (!choPhep.includes(k)) loi.push({ field: k, reason: 'không được sửa trường này' });
  }
  if (body.device_name !== undefined) {
    const t = chuoi(body, 'device_name', 100, loi);
    if (t) kq.deviceName = t;
  }
  if (body.issue_category !== undefined) {
    if (!CATEGORIES.includes(body.issue_category)) loi.push({ field: 'issue_category', reason: `phải là một trong ${CATEGORIES.join(', ')}` });
    else kq.issueCategory = body.issue_category;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) loi.push({ field: 'priority', reason: `phải là một trong ${PRIORITIES.join(', ')}` });
    else kq.priority = body.priority;
  }
  if (loi.length === 0 && Object.keys(kq).length === 0) loi.push({ field: 'body', reason: 'cần ít nhất một trường để sửa' });
  if (loi.length > 0) nem(loi);
  return kq;
}

/**
 * Kiểm tra thân DELETE /api/tickets/{id} (hủy phiếu): reason là tùy chọn, tối đa 255 ký tự.
 * @param {unknown} body Có thể là undefined hoặc {}.
 * @returns {string} Lý do hủy (mặc định "Hủy theo yêu cầu").
 */
function validateCancel(body) {
  const MAC_DINH = 'Hủy theo yêu cầu';
  if (body === undefined || body === null) return MAC_DINH;
  if (typeof body !== 'object' || Array.isArray(body)) return nem([{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
  if (body.reason === undefined || body.reason === null) return MAC_DINH;
  if (typeof body.reason !== 'string') return nem([{ field: 'reason', reason: 'phải là chuỗi' }]);
  const t = body.reason.trim();
  if (t.length > 255) return nem([{ field: 'reason', reason: 'tối đa 255 ký tự' }]);
  return t || MAC_DINH;
}

module.exports = { validateTicketUpdate, validateCancel, validateTicketCreate, validateUnassignedQuery, validateAssignment, CATEGORIES, PRIORITIES };
