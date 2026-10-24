'use strict';
// Kiểm thử phần THUẦN của frontend (web/src): ba trạng thái, định dạng, lớp client. Module ES nạp bằng import() động.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const WEB = path.join(__dirname, '..', 'web', 'src');
const nap = (f) => import(pathToFileURL(path.join(WEB, f)).href);

test('bốn trạng thái: tải > lỗi > rỗng > sẵn sàng; mảng rỗng KHÁC đang tải', async () => {
  const { layTrangThai } = await nap('lib/dataState.js');
  assert.equal(layTrangThai({ loading: true, error: null, data: null }), 'loading');
  assert.equal(layTrangThai({ loading: false, error: new Error('x'), data: null }), 'error');
  assert.equal(layTrangThai({ loading: false, error: null, data: [] }), 'empty');
  assert.equal(layTrangThai({ loading: false, error: null, data: [{ a: 1 }] }), 'ready');
  assert.equal(layTrangThai({ loading: false, error: null, data: { items: [] } }, (d) => d.items.length === 0), 'empty');
});

test('lỗi mạng: nói rõ chuyện gì và làm gì tiếp, không lộ chuỗi kỹ thuật', async () => {
  const { thongBaoLoi } = await nap('lib/dataState.js');
  const m = thongBaoLoi({ network: true, message: 'TypeError: Failed to fetch' });
  assert.match(m.chiTiet, /Thử lại/);
  assert.doesNotMatch(JSON.stringify(m), /TypeError|fetch|SQL|500/);
});

test('lỗi 500 không hiện thông điệp kỹ thuật của máy chủ; lỗi 4xx hiện thông điệp của API', async () => {
  const { thongBaoLoi } = await nap('lib/dataState.js');
  assert.doesNotMatch(JSON.stringify(thongBaoLoi({ status: 500, message: 'duplicate key tickets_pkey' })), /tickets_pkey/);
  assert.match(thongBaoLoi({ status: 409, message: 'Phiếu đã có kỹ thuật viên' }).chiTiet, /đã có kỹ thuật viên/);
});

test('định dạng thời gian đọc thẳng từ chuỗi ISO (không lệch múi giờ) và mã lạ không thành "undefined"', async () => {
  const { ngayGio, nhan, NHAN_TRANG_THAI, daQuaHan } = await nap('lib/dinhDang.js');
  assert.equal(ngayGio('2026-10-06T10:30:00+07:00'), '06/10/2026 10:30');
  assert.equal(ngayGio(null), '—');
  assert.equal(nhan(NHAN_TRANG_THAI, 'DA_PHAN_CONG'), 'Đã phân công');
  assert.equal(nhan(NHAN_TRANG_THAI, 'MOI_LA'), 'MOI_LA');
  assert.equal(daQuaHan('2026-10-06T10:30:00+07:00', new Date('2026-10-07T00:00:00Z')), true);
  assert.equal(daQuaHan('2026-10-06T10:30:00+07:00', new Date('2026-10-06T03:29:59Z')), false);   // biên: 1 giây trước hạn
});

test('lớp client: mạng đứt -> ApiError.network; lỗi 400 giữ code/field/fields; 401 gọi hàm xử lý; thành công trả JSON', async () => {
  const { goi, ApiError, dangKyXuLy401, taoQuery } = await nap('api/client.js');
  const that = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(goi('/api/x'), (e) => e instanceof ApiError && e.network === true);

    globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: {
      code: 'VALIDATION_ERROR', message: 'sai', field: 'a', fields: [{ field: 'a', reason: 'bắt buộc' }] } }) });
    await assert.rejects(goi('/api/x'), (e) => e.status === 400 && e.code === 'VALIDATION_ERROR' && e.fields[0].field === 'a');

    let goiLai = 0;
    dangKyXuLy401(() => { goiLai += 1; });
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => null });
    await assert.rejects(goi('/api/x'), (e) => e.status === 401);
    assert.equal(goiLai, 1);

    globalThis.fetch = async (url, opt) => ({ ok: true, status: 201, json: async () => ({ url, method: opt.method, body: opt.body }) });
    const kq = await goi('/api/x', { method: 'POST', body: { a: 1 } });
    assert.deepEqual([kq.method, kq.body], ['POST', '{"a":1}']);
  } finally {
    globalThis.fetch = that;
  }
  assert.equal(taoQuery({ page: 2, center_id: '', limit: undefined, is_active: false }), '?page=2&is_active=false');
});

test('phép thử 30 giây: không có fetch( hay axios ngoài lớp client (pages và components phải sạch)', () => {
  for (const thuMuc of ['pages', 'components']) {
    for (const f of fs.readdirSync(path.join(WEB, thuMuc))) {
      assert.doesNotMatch(fs.readFileSync(path.join(WEB, thuMuc, f), 'utf8'), /\bfetch\(|axios/, `${thuMuc}/${f}`);
    }
  }
});

test('không có dữ liệu API nào được chèn bằng innerHTML (chống chèn mã HTML)', () => {
  for (const thuMuc of ['pages', 'components']) {
    for (const f of fs.readdirSync(path.join(WEB, thuMuc))) {
      assert.doesNotMatch(fs.readFileSync(path.join(WEB, thuMuc, f), 'utf8'), /innerHTML|insertAdjacentHTML/, `${thuMuc}/${f}`);
    }
  }
});
