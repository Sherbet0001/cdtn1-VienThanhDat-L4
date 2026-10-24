'use strict';
/**
 * Lớp routes: dịch giữa HTTP và nghiệp vụ. KHÔNG chứa quy tắc nghiệp vụ.
 * Bảng đổi mã lỗi nghiệp vụ sang mã HTTP nằm ở ./http.js (chỗ DUY NHẤT).
 * Hình dạng dữ liệu trả ra do src/contracts/technician.contract.js quyết định; lỗi dạng { error: { code, message, field } }.
 */
const {
  validateTechnician, validateId, validateListQuery,
} = require('../validators/technician.validator');
const { toTechnicianView: toJson } = require('../contracts/technician.contract');
const { HTTP_THEO_MA, boc } = require('./http');

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
