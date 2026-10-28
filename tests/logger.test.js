'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { taoLogger, che, thoiDiemVn } = require('../src/logger');

function ghiVao(level) {
  const dong = [];
  const logger = taoLogger({ level, write: (s) => dong.push(JSON.parse(s)), now: () => new Date('2026-10-26T07:30:00Z') });
  return { logger, dong };
}

test('mỗi dòng log có thời điểm có múi giờ, mức, thông điệp và ngữ cảnh', () => {
  const { logger, dong } = ghiVao('info');
  logger.info('đã phân công', { requestId: 'r1', ticketCode: 'BH-000212/2026' });
  assert.equal(dong[0].thoi_diem, '2026-10-26T14:30:00+07:00');
  assert.equal(dong[0].muc, 'info');
  assert.equal(dong[0].requestId, 'r1');
  assert.equal(dong[0].ticketCode, 'BH-000212/2026');
});

test('LOG_LEVEL=info bỏ qua debug; LOG_LEVEL=error chỉ giữ error', () => {
  const a = ghiVao('info'); a.logger.debug('x'); a.logger.warn('y');
  assert.deepEqual(a.dong.map((d) => d.muc), ['warn']);
  const b = ghiVao('error'); b.logger.info('x'); b.logger.error('z');
  assert.deepEqual(b.dong.map((d) => d.muc), ['error']);
});

test('che số điện thoại, mật khẩu, token, chuỗi kết nối - kể cả lồng sâu', () => {
  const { logger, dong } = ghiVao('debug');
  logger.info('thử', { customer: { id: 1024, phone: '0901234567', soDienThoai: '0901234567' },
    password: 'abc', Authorization: 'Bearer x', DATABASE_URL: 'postgres://u:p@h/db' });
  const s = JSON.stringify(dong[0]);
  assert.equal(dong[0].customer.id, 1024);
  for (const bi_mat of ['0901234567', 'abc', 'Bearer x', 'postgres://']) assert.ok(!s.includes(bi_mat), bi_mat);
});

test('Error được ghi kèm loại, thông điệp và ngăn xếp', () => {
  const r = che(new TypeError('hỏng'));
  assert.equal(r.loai, 'TypeError');
  assert.equal(r.thong_diep, 'hỏng');
  assert.match(r.stack, /TypeError/);
});

test('thoiDiemVn luôn kết thúc bằng +07:00', () => {
  assert.match(thoiDiemVn(), /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+07:00$/);
});

test('ganRequestId: gán mã, trả trong header X-Request-Id, log khi hoàn tất không chứa nội dung request', async () => {
  const http = require('node:http');
  const { ganRequestId } = require('../src/logger');
  const { logger, dong } = ghiVao('info');
  const mw = ganRequestId(logger);
  const server = http.createServer((req, res) => mw(req, res, () => res.end('ok')));
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  const r = await fetch(`http://localhost:${port}/api/x?phone=0901234567`, { headers: { 'x-request-id': 'abc-123' } });
  await r.text();
  const r2 = await fetch(`http://localhost:${port}/`, { headers: { 'x-request-id': 'bad id!' } });
  await r2.text();
  await new Promise((res) => server.close(res));
  assert.equal(r.headers.get('x-request-id'), 'abc-123');
  assert.match(r2.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);   // mã không hợp lệ bị thay bằng UUID
  assert.equal(dong[0].requestId, 'abc-123');
  assert.equal(dong[0].duong_dan, '/api/x');                          // không ghi query string (có thể chứa SĐT)
  assert.ok(!JSON.stringify(dong).includes('0901234567'));
});
