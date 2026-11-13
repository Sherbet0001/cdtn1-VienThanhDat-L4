'use strict';
// BT3 · Test Report TC-13..TC-14 (tầng API: HTTP thật vào ứng dụng Express + PostgreSQL THẬT): kiểm soát truy cập theo trung tâm
// (QT-14, OWASP A01) và mật khẩu lưu dạng băm (OWASP A02/A07). Cần TEST_DATABASE_URL.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { coCsdl, LY_DO_BO_QUA, taoPoolThu, dongPool, resetDb, themKhach, themKtv, themPhieu, themNguoiDung,
  BI_MAT_THU, MAT_KHAU_THU } = require('../helpers/db');

const opts = { skip: coCsdl ? false : LY_DO_BO_QUA };

let pool; let server; let goc;
test.before(async () => {
  if (!coCsdl) return;
  const { buildApp } = require('../../src/app');
  const { taoLogger } = require('../../src/logger');
  pool = await taoPoolThu();
  server = http.createServer(buildApp(pool, { logger: taoLogger({ level: 'error', write: () => {} }), jwtSecret: BI_MAT_THU }));
  await new Promise((xong) => server.listen(0, '127.0.0.1', xong));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) { server.closeAllConnections(); await new Promise((xong) => server.close(xong)); }
  if (pool) await dongPool(pool);
});
test.beforeEach(async () => { if (pool) await resetDb(pool); });

const goi = async (phuongThuc, duongDan, thanBody, token) => {
  const res = await fetch(goc + duongDan, {
    method: phuongThuc,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: thanBody === undefined ? undefined : JSON.stringify(thanBody),
  });
  return { status: res.status, body: await res.json() };
};
const dangNhap = async (username, matKhau = MAT_KHAU_THU) => goi('POST', '/api/auth/login', { username, password: matKhau });

test('TC-13 QT-14 bảo mật (OWASP A01): quản lý trung tâm 4 KHÔNG đọc, gán hay lọc được dữ liệu trung tâm 2 -> 403 và dữ liệu không đổi; đúng trung tâm và quản trị -> được', opts, async () => {
  const khach = await themKhach(pool);
  const ktv4 = await themKtv(pool, { center: 4, kyNang: { MAN_HINH: 4 } });
  const phieu4 = await themPhieu(pool, { khachId: khach, center: 4 });
  const phieu2 = await themPhieu(pool, { khachId: khach, center: 2 });
  await themNguoiDung(pool, { username: 'ql4', role: 'QUAN_LY', center: 4 });
  await themNguoiDung(pool, { username: 'admin', role: 'QUAN_TRI' });
  const tQl = (await dangNhap('ql4')).body.token;
  const tAdmin = (await dangNhap('admin')).body.token;

  // Phiếu trung tâm khác: đọc và gán đều bị từ chối, không lộ dữ liệu, không đổi dữ liệu.
  const doc = await goi('GET', `/api/tickets/${phieu2}`, undefined, tQl);
  assert.equal(doc.status, 403);
  assert.equal(doc.body.error.code, 'FORBIDDEN');
  assert.ok(!JSON.stringify(doc.body).includes('iPhone'), 'phản hồi 403 lộ dữ liệu phiếu của trung tâm khác');
  const gan = await goi('POST', `/api/tickets/${phieu2}/assignment`, { technician_id: ktv4 }, tQl);
  assert.equal(gan.status, 403);
  const { rows } = await pool.query('SELECT status, technician_id FROM ticket WHERE ticket_id = $1', [phieu2]);
  assert.equal(rows[0].status, 'MOI', 'phiếu trung tâm khác bị đổi dù đã trả 403');
  assert.equal(rows[0].technician_id, null);

  // Danh sách: bị ép về trung tâm 4; cố hỏi trung tâm 2 thì 403.
  const ds = await goi('GET', '/api/tickets/unassigned', undefined, tQl);
  assert.equal(ds.status, 200);
  assert.deepEqual(ds.body.items.map((p) => p.center_id), [4]);
  assert.equal((await goi('GET', '/api/tickets/unassigned?center_id=2', undefined, tQl)).status, 403);

  // Đúng trung tâm: được. Quản trị: được mọi nơi.
  assert.equal((await goi('GET', `/api/tickets/${phieu4}`, undefined, tQl)).status, 200);
  assert.equal((await goi('GET', `/api/tickets/${phieu2}`, undefined, tAdmin)).status, 200);

  // Không token hoặc token giả -> 401.
  assert.equal((await goi('GET', `/api/tickets/${phieu4}`)).status, 401);
  assert.equal((await goi('GET', `/api/tickets/${phieu4}`, undefined, 'khong.phai.token')).status, 401);
});

test('TC-14 bảo mật (OWASP A02/A07): mật khẩu trong CSDL là chuỗi băm scrypt, đăng nhập đúng -> 200 và token, sai mật khẩu và tên lạ -> 401 cùng thông điệp', opts, async () => {
  await themNguoiDung(pool, { username: 'ql4', role: 'QUAN_LY', center: 4 });

  const { rows } = await pool.query("SELECT password_hash FROM app_user WHERE username = 'ql4'");
  assert.match(rows[0].password_hash, /^scrypt\$\d+\$\d+\$\d+\$/, 'mật khẩu không được lưu dạng gốc');
  assert.ok(!rows[0].password_hash.includes(MAT_KHAU_THU), 'chuỗi lưu trong CSDL chứa mật khẩu gốc');
  await assert.rejects(
    pool.query("INSERT INTO app_user (username, password_hash, full_name, role, center_id) VALUES ('x', 'matkhau-goc', 'X', 'QUAN_LY', 4)"),
    /ck_user_hash/, 'CSDL phải chặn việc lưu mật khẩu không phải chuỗi băm');

  const dung = await dangNhap('ql4');
  assert.equal(dung.status, 200);
  assert.equal(dung.body.token_type, 'Bearer');
  assert.equal(dung.body.user.role, 'QUAN_LY');
  assert.equal(dung.body.user.center_id, 4);
  assert.ok(!JSON.stringify(dung.body).includes('scrypt$'), 'phản hồi đăng nhập lộ chuỗi băm');

  const sai = await dangNhap('ql4', 'mat-khau-sai');
  const la = await dangNhap('khong-ton-tai');
  assert.equal(sai.status, 401);
  assert.equal(la.status, 401);
  assert.deepEqual(sai.body, la.body, 'phản hồi phải giống hệt nhau để không lộ tên đăng nhập nào có thật');
});

test('AUTH-01 TD-23 đã xử lý: assigned_by và changed_by là mã người đang đăng nhập, không còn là 0', opts, async () => {
  const khach = await themKhach(pool);
  const ktv = await themKtv(pool, { center: 4, kyNang: { MAN_HINH: 4 } });
  const phieu = await themPhieu(pool, { khachId: khach, center: 4 });
  const uid = await themNguoiDung(pool, { username: 'ql4', role: 'QUAN_LY', center: 4 });
  const token = (await dangNhap('ql4')).body.token;

  const r = await goi('POST', `/api/tickets/${phieu}/assignment`, { technician_id: ktv }, token);

  assert.equal(r.status, 201);
  assert.equal(r.body.assigned_by, uid);
  const { rows } = await pool.query('SELECT changed_by FROM ticket_status_log WHERE ticket_id = $1', [phieu]);
  assert.equal(Number(rows[0].changed_by), uid);
});

test('AUTH-02 tạo kỹ thuật viên: quản lý bỏ trống center_id thì mặc định trung tâm mình; ghi vào trung tâm khác -> 403 và không tạo dòng', opts, async () => {
  await themNguoiDung(pool, { username: 'ql4', role: 'QUAN_LY', center: 4 });
  const token = (await dangNhap('ql4')).body.token;

  const ok = await goi('POST', '/api/technicians', { full_name: 'Thử Nghiệm', level: 'SO_CAP' }, token);
  assert.equal(ok.status, 201);
  assert.equal(ok.body.center_id, 4);

  const chan = await goi('POST', '/api/technicians', { full_name: 'Thử Nghiệm 2', center_id: 2, level: 'SO_CAP' }, token);
  assert.equal(chan.status, 403);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM technician');
  assert.equal(rows[0].n, 1);
});
