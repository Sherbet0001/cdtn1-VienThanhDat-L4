'use strict';
/** Lớp routes của phiếu: dịch giữa HTTP và nghiệp vụ. Hình dạng dữ liệu do src/contracts/ticket.contract.js quyết định. */
const { validateTicketCreate, validateUnassignedQuery } = require('../validators/ticket.validator');
const { validateId } = require('../validators/technician.validator');
const { toTicketView } = require('../contracts/ticket.contract');
const { boc } = require('./http');

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
  };
}

function ticketRoutes(service) {
  const express = require('express');
  const h = makeHandlers(service);
  const r = express.Router();
  r.get('/unassigned', h.unassigned);   // đặt TRƯỚC /:id để "unassigned" không bị hiểu là mã phiếu
  r.get('/:id', h.get);
  r.post('/', h.create);
  return r;
}

module.exports = ticketRoutes;
module.exports.makeHandlers = makeHandlers;
