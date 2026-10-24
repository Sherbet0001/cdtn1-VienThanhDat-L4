'use strict';
// Tích hợp routes -> service -> repository thật với db giả (stub) cho phiếu; thêm kiểm tra lỗi người dùng không bao giờ là 500.
const test = require('node:test');
const assert = require('node:assert/strict');
const TicketRepository = require('../src/repositories/ticket.repository');
const { TicketService } = require('../src/services/ticket.service');
const { makeHandlers } = require('../src/routes/ticket.routes');

const dong = (o = {}) => ({
  ticket_id: '1287', ticket_code: 'BH-001287/2026', customer_name: 'Nguyễn Văn An', customer_phone: '0901234567',
  device_name: 'iPhone 14', issue_category: 'MAN_HINH', priority: 'CAO', status: 'MOI', center_id: 2,
  technician_id: null, technician_name: null,
  received_at: new Date('2026-10-05T03:30:00Z'), due_date: new Date('2026-10-06T03:30:00Z'), ...o });

function taoDb({ phieu = dong(), tong = 12 } = {}) {
  return {
    query: async (sql) => {
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ tong }] };
      if (/^\s*WITH khach/.test(sql)) return { rows: [{ ticket_id: '1288' }] };
      return { rows: phieu ? [phieu] : [] };
    },
  };
}
function taoRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.status = (m) => { res.statusCode = m; return res; };
  res.location = (v) => { res.headers.Location = v; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
const noiTu = (db) => makeHandlers(new TicketService(new TicketRepository(db), () => new Date('2026-10-23T10:00:00+07:00')));

test('GET unassigned xuyên ba lớp: khung page/limit/total/items, mã là số, thời gian ISO +07:00', async () => {
  const res = taoRes();
  await noiTu(taoDb()).unassigned({ query: { limit: '5' } }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.deepEqual([res.body.page, res.body.limit, res.body.total], [1, 5, 12]);
  assert.strictEqual(res.body.items[0].ticket_id, 1287);
  assert.equal(res.body.items[0].due_date, '2026-10-06T10:30:00+07:00');
  assert.strictEqual(res.body.items[0].technician_id, null);
});

test('GET unassigned rỗng: 200 với items [] và total 0 (không phải lỗi)', async () => {
  const res = taoRes();
  await noiTu({ query: async (s) => (/COUNT/.test(s) ? { rows: [{ tong: 0 }] } : { rows: [] }) })
    .unassigned({ query: {} }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.deepEqual([res.body.items, res.body.total], [[], 0]);
});

test('POST tiếp nhận: 201, Location và phiếu MOI chưa có kỹ thuật viên', async () => {
  const res = taoRes();
  await noiTu(taoDb({ phieu: dong({ ticket_id: '1288' }) })).create(
    { body: { customer_name: 'Nguyễn Văn An', customer_phone: '090 123 4567', device_name: 'iPhone 14', issue_category: 'MAN_HINH', center_id: 2 } },
    res, assert.fail);
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers.Location, '/api/tickets/1288');
  assert.equal(res.body.status, 'MOI');
});

test('lỗi của NGƯỜI DÙNG trả 4xx, không bao giờ rơi vào xử lý lỗi 500', async () => {
  const h = noiTu(taoDb({ phieu: null }));
  const catChuyen = () => assert.fail('lỗi người dùng không được chuyển thành 500');
  const ca = [
    [h.get, { params: { id: 'abc' } }, 400],
    [h.get, { params: { id: '404' } }, 404],
    [h.unassigned, { query: { page: '0' } }, 400],
    [h.unassigned, { query: { limit: '1000' } }, 400],
    [h.create, { body: {} }, 400],
    [h.create, { body: { customer_name: 'A', customer_phone: '123', device_name: 'B', issue_category: 'MAN_HINH', center_id: 1 } }, 400],
  ];
  for (const [ham, req, mong] of ca) {
    const res = taoRes();
    await ham(req, res, catChuyen);
    assert.equal(res.statusCode, mong, JSON.stringify(req));
    assert.ok(res.body.error.code);
  }
});
