'use strict';
// Kiểm thử logic ba trạng thái của giao diện (module ES nạp bằng import() động).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const nap = () => import(pathToFileURL(path.join(__dirname, '..', 'web', 'lib', 'dataState.mjs')).href);

test('bốn trạng thái: tải > lỗi > rỗng > sẵn sàng; mảng rỗng KHÁC đang tải', async () => {
  const { layTrangThai } = await nap();
  assert.equal(layTrangThai({ loading: true, error: null, data: null }), 'loading');
  assert.equal(layTrangThai({ loading: false, error: new Error('x'), data: null }), 'error');
  assert.equal(layTrangThai({ loading: false, error: null, data: [] }), 'empty');
  assert.equal(layTrangThai({ loading: false, error: null, data: [{ a: 1 }] }), 'ready');
});

test('lỗi mạng: nói rõ chuyện gì và làm gì tiếp, không lộ chuỗi kỹ thuật', async () => {
  const { thongBaoLoi } = await nap();
  const m = thongBaoLoi({ network: true, message: 'TypeError: Failed to fetch' });
  assert.match(m.chiTiet, /Thử lại/);
  assert.doesNotMatch(JSON.stringify(m), /TypeError|fetch|SQL|500/);
});

test('lỗi 500 không hiện thông điệp kỹ thuật của máy chủ; lỗi 4xx hiện thông điệp của API', async () => {
  const { thongBaoLoi } = await nap();
  assert.doesNotMatch(JSON.stringify(thongBaoLoi({ status: 500, message: 'duplicate key tickets_pkey' })), /tickets_pkey/);
  assert.match(thongBaoLoi({ status: 400, message: 'limit phải từ 1 đến 100' }).chiTiet, /limit/);
});

test('không có fetch nào ngoài lớp client (phép thử 30 giây của tài liệu tự học)', () => {
  const fs = require('node:fs');
  const web = path.join(__dirname, '..', 'web');
  for (const f of ['main.mjs', 'index.html', 'lib/dataState.mjs']) {
    assert.doesNotMatch(fs.readFileSync(path.join(web, f), 'utf8'), /\bfetch\(|axios/, f);
  }
});
