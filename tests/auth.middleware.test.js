'use strict';
// Middleware xác thực, các chốt chặn phân quyền theo trung tâm (OWASP A01) và giới hạn đăng nhập sai (OWASP A07).
const test = require('node:test');
const assert = require('node:assert/strict');
const { taoXacThuc } = require('../src/middleware/xacThuc');
const { chanTheoMa, locTheoTrungTam, chanTrungTamTrongThan } = require('../src/middleware/baoVe');
const { taoGioiHan } = require('../src/middleware/gioiHanDangNhap');
const { makeHandlers: authHandlers } = require('../src/routes/auth.routes');
const { kyToken } = require('../src/auth/token');
const { AppError } = require('../src/errors/AppError');

const BI_MAT = 'khoa-ky-token-chi-dung-trong-kiem-thu-dai-hon-32';
const T0 = Date.UTC(2026, 10, 13, 3, 0, 0);

function gia(req = {}) {
  const res = { statusCode: 200, body: null, headers: {},
    status(m) { this.statusCode = m; return this; }, json(b) { this.body = b; return this; },
    setHeader(k, v) { this.headers[k] = v; } };
  return { req: { headers: {}, query: {}, params: {}, body: undefined, ...req }, res };
}
async function chay(mw, req) {
  const { req: r, res } = gia(req);
  let da = false; let loi = null;
  await mw(r, res, (e) => { da = true; loi = e || null; });
  return { r, res, daQuaChot: da && !loi, loi };
}

const QUAN_LY_4 = { id: 5, role: 'QUAN_LY', centerId: 4 };
const QUAN_TRI = { id: 1, role: 'QUAN_TRI', centerId: null };

// ---------- xác thực ----------
const xt = taoXacThuc(BI_MAT, { bayGio: () => T0 + 1000 });
const tokenQL = kyToken({ userId: 5, role: 'QUAN_LY', centerId: 4 }, BI_MAT, { bayGio: T0 });

test('không có header Authorization -> 401 UNAUTHENTICATED, có WWW-Authenticate, không gọi tiếp', async () => {
  const k = await chay(xt, {});
  assert.equal(k.daQuaChot, false);
  assert.equal(k.res.statusCode, 401);
  assert.equal(k.res.body.error.code, 'UNAUTHENTICATED');
  assert.equal(k.res.headers['WWW-Authenticate'], 'Bearer');
});

test('sai kiểu (Basic), token rác, token hết hạn, ký bằng khóa khác -> 401', async () => {
  const het = taoXacThuc(BI_MAT, { bayGio: () => T0 + 7200 * 1000 });
  const khac = kyToken({ userId: 5, role: 'QUAN_LY', centerId: 4 }, 'khoa-khac-hoan-toan-dai-hon-32-ky-tu-nhe', { bayGio: T0 });
  for (const [mw, h] of [[xt, 'Basic abc'], [xt, 'Bearer rac'], [xt, `Bearer ${tokenQL} x`], [het, `Bearer ${tokenQL}`], [xt, `Bearer ${khac}`]]) {
    const k = await chay(mw, { headers: { authorization: h } });
    assert.equal(k.res.statusCode, 401, h.slice(0, 20));
    assert.equal(k.daQuaChot, false);
  }
});

test('token hợp lệ -> đặt req.user {id, role, centerId} và cho đi tiếp', async () => {
  const k = await chay(xt, { headers: { authorization: `Bearer ${tokenQL}` } });
  assert.equal(k.daQuaChot, true);
  assert.deepEqual(k.r.user, QUAN_LY_4);
});

// ---------- chốt chặn theo mã trong đường dẫn ----------
const dichVu = (tai) => ({ get: async (id) => { if (!tai[id]) throw new AppError('TICKET_NOT_FOUND', 'x', undefined, 'ticket_id'); return tai[id]; } });

test('chanTheoMa: cùng trung tâm đi tiếp; khác trung tâm -> 403 và không lộ dữ liệu; quản trị đi tiếp; không tồn tại -> 404; mã sai -> 400', async () => {
  const mw = chanTheoMa(dichVu({ 10: { centerId: 4, deviceName: 'bí mật' }, 20: { centerId: 2, deviceName: 'bí mật' } }));
  assert.equal((await chay(mw, { user: QUAN_LY_4, params: { id: '10' } })).daQuaChot, true);
  const k = await chay(mw, { user: QUAN_LY_4, params: { id: '20' } });
  assert.equal(k.daQuaChot, false);
  assert.equal(k.res.statusCode, 403);
  assert.equal(k.res.body.error.code, 'FORBIDDEN');
  assert.ok(!JSON.stringify(k.res.body).includes('bí mật'), 'phản hồi 403 lộ dữ liệu của trung tâm khác');
  assert.equal((await chay(mw, { user: QUAN_TRI, params: { id: '20' } })).daQuaChot, true);
  assert.equal((await chay(mw, { user: QUAN_TRI, params: { id: '999' } })).res.statusCode, 404);
  const sai = await chay(mw, { user: QUAN_TRI, params: { id: '1 OR 1=1' } });
  assert.equal(sai.res.statusCode, 400);
});

test('chanTheoMa: không có người dùng -> 401 (mặc định từ chối)', async () => {
  const mw = chanTheoMa(dichVu({ 10: { centerId: 4 } }));
  assert.equal((await chay(mw, { params: { id: '10' } })).res.statusCode, 401);
});

test('locTheoTrungTam: quản lý bị ép center_id về trung tâm mình, hỏi trung tâm khác -> 403; quản trị giữ nguyên', async () => {
  let k = await chay(locTheoTrungTam, { user: QUAN_LY_4, query: {} });
  assert.equal(k.r.query.center_id, '4');
  k = await chay(locTheoTrungTam, { user: QUAN_LY_4, query: { center_id: '2' } });
  assert.equal(k.res.statusCode, 403);
  k = await chay(locTheoTrungTam, { user: QUAN_TRI, query: { center_id: '2' } });
  assert.equal(k.r.query.center_id, '2');
  k = await chay(locTheoTrungTam, { user: QUAN_TRI, query: {} });
  assert.equal(k.r.query.center_id, undefined);
});

test('chanTrungTamTrongThan: quản lý bỏ trống center_id thì mặc định trung tâm mình; ghi vào trung tâm khác -> 403; quản trị tự chọn', async () => {
  let k = await chay(chanTrungTamTrongThan, { user: QUAN_LY_4, body: { full_name: 'A' } });
  assert.equal(k.r.body.center_id, 4);
  k = await chay(chanTrungTamTrongThan, { user: QUAN_LY_4, body: { center_id: 2 } });
  assert.equal(k.res.statusCode, 403);
  k = await chay(chanTrungTamTrongThan, { user: QUAN_LY_4, body: { center_id: 4 } });
  assert.equal(k.daQuaChot, true);
  k = await chay(chanTrungTamTrongThan, { user: QUAN_TRI, body: { center_id: 2 } });
  assert.equal(k.daQuaChot, true);
  k = await chay(chanTrungTamTrongThan, { user: QUAN_LY_4, body: { center_id: "4' OR '1'='1" } });
  assert.equal(k.daQuaChot, true, 'giá trị không phải số nguyên được để validator trả 400');
  k = await chay(chanTrungTamTrongThan, { body: { center_id: 4 } });
  assert.equal(k.res.statusCode, 401);
});

// ---------- giới hạn đăng nhập sai ----------
test('giới hạn: sai quá 3 lần thì bị chặn, hết cửa sổ thì được thử lại, đăng nhập đúng xóa bộ đếm', () => {
  let t = 0;
  const g = taoGioiHan({ toiDa: 3, cuaSoMs: 60000, bayGio: () => t });
  for (let i = 0; i < 2; i += 1) g.ghiSai('k');
  assert.equal(g.biChan('k'), 0);
  g.ghiSai('k');
  assert.equal(g.biChan('k'), 60);
  assert.equal(g.biChan('khac'), 0, 'khóa khác không bị ảnh hưởng');
  t = 59000;
  assert.equal(g.biChan('k'), 1);
  t = 60000;
  assert.equal(g.biChan('k'), 0);
  g.ghiSai('k'); g.ghiSai('k'); g.ghiSai('k');
  g.xoa('k');
  assert.equal(g.biChan('k'), 0);
});

test('POST /api/auth/login: đúng -> 200 và xóa đếm; sai -> 401 và tăng đếm; bị chặn -> 429 kèm Retry-After, không gọi dịch vụ', async () => {
  const lan = []; let kq = 'dung';
  const dv = { login: async () => { lan.push(1); if (kq === 'sai') throw new AppError('INVALID_CREDENTIALS', 'sai'); return { token: 't', user: { user_id: 1, role: 'QUAN_TRI' } }; } };
  const g = taoGioiHan({ toiDa: 2, cuaSoMs: 60000, bayGio: () => 0 });
  const { login } = authHandlers(dv, g);
  const goi = async () => { const { req, res } = gia({ body: { username: 'A', password: 'x' }, ip: '1.2.3.4' }); await login(req, res, () => {}); return res; };

  assert.equal((await goi()).statusCode, 200);
  kq = 'sai';
  assert.equal((await goi()).statusCode, 401);
  assert.equal((await goi()).statusCode, 401);
  const chan = await goi();
  assert.equal(chan.statusCode, 429);
  assert.equal(chan.body.error.code, 'TOO_MANY_REQUESTS');
  assert.equal(chan.headers['Retry-After'], '60');
  assert.equal(lan.length, 3, 'yêu cầu bị chặn không được tới dịch vụ đăng nhập');
});
