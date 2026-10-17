'use strict';
/**
 * Lớp routes: dịch giữa HTTP và nghiệp vụ. KHÔNG chứa quy tắc nghiệp vụ.
 * Bảng HTTP_THEO_MA dưới đây là chỗ DUY NHẤT trong dự án đổi mã lỗi nghiệp vụ sang mã HTTP.
 * Định dạng phản hồi theo docs/api-contract.md: trường snake_case, lỗi dạng { error: { code, message, field } }.
 */
const {
  validateTechnician, validateId, validateListQuery,
} = require('../validators/technician.validator');

const HTTP_THEO_MA = Object.freeze({
  VALIDATION_ERROR: 400,
  TECHNICIAN_NOT_FOUND: 404,
  TECHNICIAN_HAS_OPEN_TICKETS: 409,   // xung đột với trạng thái hiện tại của dữ liệu
});

/** Đối tượng nghiệp vụ (camelCase) -> JSON của API (snake_case). */
function toJson(t) {
  const kq = {
    technician_id: t.technicianId,
    full_name: t.fullName,
    center_id: t.centerId,
    level: t.level,
    is_active: t.isActive,
  };
  if (t.skills) {
    kq.skills = t.skills.map((s) => ({ issue_category: s.issueCategory, proficiency: s.proficiency }));
  }
  return kq;
}

/** Lỗi đã biết -> { error: { code, message, field, details } }. */
function loiJson(e) {
  const error = { code: e.code, message: e.message };
  if (e.field !== undefined) error.field = e.field;
  if (e.chiTiet) error.details = e.chiTiet;
  return { error };
}

/** Bọc hàm xử lý bất đồng bộ: lỗi đã biết -> JSON có mã HTTP; lỗi lạ -> chuyển cho bộ xử lý lỗi cuối (500). */
const boc = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    const ma = e && e.code && HTTP_THEO_MA[e.code];
    if (!ma) return next(e);
    return res.status(ma).json(loiJson(e));
  }
};

/** Các hàm xử lý yêu cầu. Tách khỏi Express để kiểm thử được bằng req/res giả. */
function makeHandlers(service) {
  return {
    list: boc(async (req, res) => {
      const boLoc = validateListQuery(req.query);
      const items = await service.list(boLoc);
      res.json({ items: items.map(toJson), limit: boLoc.limit, offset: boLoc.offset });
    }),
    get: boc(async (req, res) => {
      res.json(toJson(await service.get(validateId(req.params.id))));
    }),
    create: boc(async (req, res) => {
      const t = await service.create(validateTechnician(req.body));
      res.status(201).location(`/api/technicians/${t.technicianId}`).json(toJson(t));
    }),
    update: boc(async (req, res) => {
      const id = validateId(req.params.id);
      res.json(toJson(await service.update(id, validateTechnician(req.body))));
    }),
    // Xóa mềm: kỹ thuật viên chuyển sang ngừng hoạt động, dòng dữ liệu vẫn còn.
    remove: boc(async (req, res) => {
      res.json(toJson(await service.deactivate(validateId(req.params.id))));
    }),
  };
}

function technicianRoutes(service) {
  const express = require('express');
  const h = makeHandlers(service);
  const r = express.Router();
  r.get('/', h.list);
  r.get('/:id', h.get);
  r.post('/', h.create);
  r.put('/:id', h.update);
  r.delete('/:id', h.remove);
  return r;
}

module.exports = technicianRoutes;
module.exports.makeHandlers = makeHandlers;
module.exports.toJson = toJson;
module.exports.HTTP_THEO_MA = HTTP_THEO_MA;
