'use strict';
// BT3 · Test Report TC-10..TC-12 (tầng API: HTTP thật vào ứng dụng Express + PostgreSQL THẬT). Cần TEST_DATABASE_URL.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { coCsdl, LY_DO_BO_QUA, taoPoolThu, dongPool, resetDb, themKtv, demDong } = require('../helpers/db');

const opts = { skip: coCsdl ? false : LY_DO_BO_QUA };

let pool; let server; let goc;
test.before(async () => {
  if (!coCsdl) return;
  const { buildApp } = require('../../src/app');
  const { taoLogger } = require('../../src/logger');
  pool = await taoPoolThu();
  const app = buildApp(pool, { logger: taoLogger({ level: 'error', write: () => {} }) });
  server = http.createServer(app);
  await new Promise((xong) => server.listen(0, '127.0.0.1', xong));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) { server.closeAllConnections(); await new Promise((xong) => server.close(xong)); }
  if (pool) await dongPool(pool);
});
test.beforeEach(async () => { if (pool) await resetDb(pool); });

const goi = async (phuongThuc, duongDan, thanBody) => {
  const res = await fetch(goc + duongDan, {
    method: phuongThuc,
    headers: { 'Content-Type': 'application/json' },
    body: thanBody === undefined ? undefined : JSON.stringify(thanBody),
  });
  return { status: res.status, body: await res.json() };
};

const laChuNhatVN = (iso) => new Date(new Date(iso).getTime() + 7 * 3600 * 1000).getUTCDay() === 0;

test('TC-10 QT-04 luồng đúng: POST /api/tickets hợp lệ -> 201, mã BH-xxxxxx/năm, MOI, ưu tiên CAO, hạn 24-48 giờ không rơi Chủ nhật, +1 dòng', opts, async () => {
  const truoc = await demDong(pool, 'ticket');
  const r = await goi('POST', '/api/tickets',
    { customer_name: 'An', customer_phone: '0901234567', device_name: 'iPhone 15', issue_category: 'MAN_HINH', center_id: 4 });

  assert.equal(r.status, 201);
  assert.match(r.body.ticket_code, /^BH-\d{6}\/\d{4}$/);
  assert.equal(r.body.status, 'MOI');
  assert.equal(r.body.priority, 'CAO');
  assert.equal(r.body.technician_id, null);
  const gio = (new Date(r.body.due_date) - new Date(r.body.received_at)) / 3600000;
  assert.ok(gio === 24 || gio === 48, `hạn cam kết cách ngày nhận ${gio} giờ (kỳ vọng 24, hoặc 48 khi phải bỏ Chủ nhật)`);
  assert.equal(laChuNhatVN(r.body.due_date), false, 'hạn cam kết rơi vào Chủ nhật (vi phạm QT-04)');
  assert.equal(await demDong(pool, 'ticket'), truoc + 1);
});

test('TC-11 dữ liệu sai: POST /api/tickets thiếu trường bắt buộc -> 400 VALIDATION_ERROR nêu tên trường, không ghi dòng nào', opts, async () => {
  const truoc = await demDong(pool, 'ticket');
  const r = await goi('POST', '/api/tickets', { customer_name: 'An' });

  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'VALIDATION_ERROR');
  const cacTruong = r.body.error.fields.map((f) => f.field).sort();
  assert.deepEqual(cacTruong, ['center_id', 'customer_phone', 'device_name', 'issue_category']);
  assert.ok(!/at .*\.js|node_modules|stack/i.test(JSON.stringify(r.body)), 'phản hồi lộ vết ngăn xếp');
  assert.equal(await demDong(pool, 'ticket'), truoc, 'có dòng được ghi dù yêu cầu bị từ chối');
});

test('TC-12 QT-13 luồng đúng: DELETE /api/technicians/:id là xóa mềm -> 200, dòng vẫn còn, is_active = false', opts, async () => {
  const ktv = await themKtv(pool, { center: 4, kyNang: { MAN_HINH: 4 } });

  const r = await goi('DELETE', `/api/technicians/${ktv}`);

  assert.equal(r.status, 200);
  const { rows } = await pool.query('SELECT is_active FROM technician WHERE technician_id = $1', [ktv]);
  assert.equal(rows.length, 1, 'dòng KTV bị xóa vật lý (vi phạm QT-13)');
  assert.equal(rows[0].is_active, false);
});

test('BUG-003 (hồi quy qua API): ký tự NUL trong customer_name -> 400 VALIDATION_ERROR tại customer_name, không phải 500, không ghi dòng nào', opts, async () => {
  const truoc = await demDong(pool, 'ticket');
  const r = await goi('POST', '/api/tickets',
    { customer_name: 'An\u0000', customer_phone: '0901234567', device_name: 'iPhone 15', issue_category: 'MAN_HINH', center_id: 4 });

  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(r.body.error.fields.map((f) => f.field), ['customer_name']);
  assert.equal(await demDong(pool, 'ticket'), truoc);
});
