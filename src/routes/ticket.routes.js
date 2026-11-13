'use strict';
/** Lớp routes của phiếu: dịch giữa HTTP và nghiệp vụ. Hình dạng dữ liệu do src/contracts/ticket.contract.js quyết định. */
const {
  validateTicketCreate, validateUnassignedQuery, validateAssignment, validateTicketUpdate, validateCancel,
} = require('../validators/ticket.validator');
const { validateId } = require('../validators/technician.validator');
const { toTicketView, toEligibleView, toAssignmentView } = require('../contracts/ticket.contract');
const { boc } = require('./http');
const { locTheoTrungTam, chanTheoMa, chanTrungTamTrongThan } = require('../middleware/baoVe');

/** Các hàm xử lý yêu cầu; tách khỏi Express để kiểm thử bằng req/res giả. */
function makeHandlers(service) {
  return {
    unassigned: boc(async (req, res) => {
      const r = await service.listUnassigned(validateUnassignedQuery(req.query));
      res.json({ page: r.page, limit: r.limit, total: r.total, items: r.items.map(toTicketView) });
    }),
    get: boc(async (req, res) => {
      res.json(toTicketView(await service.get(validateId(req.params.id))));
    }),
    create: boc(async (req, res) => {
      const t = await service.create(validateTicketCreate(req.body));
      res.status(201).location(`/api/tickets/${t.ticketId}`).json(toTicketView(t));
    }),
    update: boc(async (req, res) => {
      const id = validateId(req.params.id);
      res.json(toTicketView(await service.update(id, validateTicketUpdate(req.body))));
    }),
    // Xóa mềm: phiếu chuyển sang DA_HUY, dòng dữ liệu và lịch sử vẫn còn (QT-13).
    remove: boc(async (req, res) => {
      const id = validateId(req.params.id);
      const lyDo = validateCancel(req.body);
      res.json(toTicketView(await service.cancel(id, lyDo, req.user ? req.user.id : 0)));
    }),
    eligible: boc(async (req, res) => {
      const { phieu, ktvs } = await service.listEligible(validateId(req.params.id));
      res.json(toEligibleView(phieu, ktvs));
    }),
    // req.user do middleware xác thực đặt (TD-34): assigned_by là mã người đang đăng nhập; 0 chỉ xảy ra khi gọi hàm xử lý trực tiếp trong test.
    assign: boc(async (req, res) => {
      const ticketId = validateId(req.params.id);
      const technicianId = validateAssignment(req.body);
      const kq = await service.assign(ticketId, technicianId, req.user ? req.user.id : 0);
      res.status(201).json(toAssignmentView(kq));
    }),
  };
}

function ticketRoutes(service) {
  const express = require('express');
  const h = makeHandlers(service);
  const r = express.Router();
  // Phân quyền theo trung tâm (QT-14, OWASP A01): quản lý chỉ thao tác trên phiếu của trung tâm mình, quản trị mọi nơi.
  const cungTrungTam = chanTheoMa(service);
  r.get('/unassigned', locTheoTrungTam, h.unassigned);   // đặt TRƯỚC /:id để "unassigned" không bị hiểu là mã phiếu
  r.get('/:id', cungTrungTam, h.get);
  r.post('/', chanTrungTamTrongThan, h.create);
  r.patch('/:id', cungTrungTam, h.update);
  r.delete('/:id', cungTrungTam, h.remove);
  r.get('/:id/eligible-technicians', cungTrungTam, h.eligible);
  r.post('/:id/assignment', cungTrungTam, h.assign);
  return r;
}

module.exports = ticketRoutes;
module.exports.makeHandlers = makeHandlers;
