'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { taoLogger, ganRequestId } = require('../src/logger');
const { taoXuLyLoi, laLoiMatKetNoi } = require('../src/middleware/xuLyLoi');
const { boc } = require('../src/routes/http');
const { AppError } = require('../src/errors/AppError');

/** Máy chủ nhỏ: route ném lỗi theo đường dẫn, qua đúng chuỗi middleware của app thật. */
async function dung(route) {
  const dong = [];
  const logger = taoLogger({ level: 'debug', write: (s) => dong.push(JSON.parse(s)) });
  const mw = ganRequestId(logger);
  const xl = taoXuLyLoi(logger);
  const server = http.createServer((req, res) => {
    // Bổ sung status()/json() như Express để dùng đúng boc và middleware lỗi thật mà không cần cài express.
    res.status = (m) => { res.statusCode = m; return res; };
    res.json = (b) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(b)); return res; };
    mw(req, res, () => {
      const lenh = boc(route);
      lenh(req, res, (err) => xl(err, req, res, () => {}));
    });
  });
  await new Promise((r) => server.listen(0, r));
  const goi = async (path = '/') => {
    const r = await fetch(`http://localhost:${server.address().port}${path}`, { headers: { 'x-request-id': 'req-77' } });
    return { status: r.status, body: await r.json() };
  };
  return { goi, dong, dong_server: () => new Promise((r) => { server.close(r); server.closeAllConnections(); }) };
}

test('lỗi hệ thống: 500 + mã tra cứu = requestId, ghi ERROR đúng MỘT lần, không lộ SQL/ngăn xếp', async () => {
  const s = await dung(async () => { throw new Error('relation "ticket" does not exist: SELECT * FROM ticket'); });
  const r = await s.goi();
  await s.dong_server();
  assert.equal(r.status, 500);
  assert.equal(r.body.error.code, 'INTERNAL_ERROR');
  assert.equal(r.body.error.requestId, 'req-77');
  assert.match(r.body.error.message, /Mã tra cứu: req-77/);
  assert.doesNotMatch(JSON.stringify(r.body), /SELECT|relation|stack|at /);
  const loi = s.dong.filter((d) => d.muc === 'error');
  assert.equal(loi.length, 1);                       // log đúng một lần
  assert.equal(loi[0].requestId, 'req-77');          // kỹ sư tra theo mã này
  assert.match(loi[0].err.stack, /Error/);           // ngăn xếp chỉ nằm trong log
});

test('mất kết nối CSDL: 503 SERVICE_UNAVAILABLE, không phải 500', async () => {
  const e = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
  const s = await dung(async () => { throw new AggregateError([e], ''); });
  const r = await s.goi();
  await s.dong_server();
  assert.equal(r.status, 503);
  assert.equal(r.body.error.code, 'SERVICE_UNAVAILABLE');
  assert.equal(s.dong.filter((d) => d.muc === 'error').length, 1);
});

test('lỗi nghiệp vụ: 4xx, ghi INFO (không phải ERROR), không ghi giá trị người dùng nhập', async () => {
  const s = await dung(async () => { throw new AppError('TICKET_NOT_FOUND', 'Không tìm thấy phiếu 0901234567.', undefined, 'id'); });
  const r = await s.goi();
  await s.dong_server();
  assert.equal(r.status, 404);
  assert.equal(s.dong.filter((d) => d.muc === 'error').length, 0);
  const info = s.dong.find((d) => d.ma_loi === 'TICKET_NOT_FOUND');
  assert.ok(info && info.muc === 'info');
  assert.ok(!JSON.stringify(s.dong).includes('0901234567'));
});

test('laLoiMatKetNoi nhận ra mã mạng, mã PostgreSQL 57P01 và lỗi hết thời gian chờ kết nối', () => {
  assert.ok(laLoiMatKetNoi({ code: 'ETIMEDOUT' }));
  assert.ok(laLoiMatKetNoi({ code: '57P01' }));
  assert.ok(laLoiMatKetNoi(new Error('timeout exceeded when trying to connect')));
  assert.ok(!laLoiMatKetNoi(new Error('lỗi logic')));
  assert.ok(!laLoiMatKetNoi(null));
});

test('giao diện: lỗi 5xx hiện mã tra cứu, không hiện thông điệp kỹ thuật', async () => {
  const { thongBaoLoi } = await import('../web/src/lib/dataState.js');
  const m = thongBaoLoi({ status: 500, message: 'duplicate key tickets_pkey', requestId: 'req-77' });
  assert.match(m.chiTiet, /Mã tra cứu: req-77/);
  assert.doesNotMatch(JSON.stringify(m), /tickets_pkey/);
});
