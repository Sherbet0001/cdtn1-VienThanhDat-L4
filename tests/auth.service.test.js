'use strict';
// Dịch vụ đăng nhập: không lộ tên đăng nhập có thật hay không, không trả chuỗi băm, kiểm định dạng, tài khoản bị khóa.
const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../src/services/auth.service');
const { bamMatKhau } = require('../src/auth/password');
const { xacMinhToken } = require('../src/auth/token');

const BI_MAT = 'khoa-ky-token-chi-dung-trong-kiem-thu-dai-hon-32';
const NHANH = { N: 1024, r: 8, p: 1 };
const T0 = Date.UTC(2026, 10, 13, 3, 0, 0);

async function dung() {
  const hash = await bamMatKhau('Mekong@2026', NHANH);
  const nguoi = (o) => ({ userId: 7, username: 'quanly_tt4', passwordHash: hash, fullName: 'Quản lý trung tâm 4', role: 'QUAN_LY', centerId: 4, isActive: true, ...o });
  const goi = [];
  const repo = (n) => ({ findByUsername: async (ten) => { goi.push(ten); return n; } });
  const svc = (n) => new AuthService(repo(n), { bimat: BI_MAT, bayGio: () => T0 });
  return { nguoi, svc, goi };
}

test('đăng nhập đúng: trả token Bearer xác minh được, thông tin người dùng, KHÔNG có chuỗi băm', async () => {
  const { nguoi, svc } = await dung();
  const kq = await svc(nguoi()).login({ username: 'quanly_tt4', password: 'Mekong@2026' });
  assert.equal(kq.token_type, 'Bearer');
  assert.equal(kq.expires_in, 3600);
  assert.deepEqual(xacMinhToken(kq.token, BI_MAT, T0), { userId: 7, role: 'QUAN_LY', centerId: 4 });
  assert.deepEqual(kq.user, { user_id: 7, username: 'quanly_tt4', full_name: 'Quản lý trung tâm 4', role: 'QUAN_LY', center_id: 4 });
  assert.ok(!JSON.stringify(kq).includes('scrypt$'), 'phản hồi lộ chuỗi băm mật khẩu');
});

test('sai mật khẩu, tên không tồn tại, tài khoản bị khóa: CÙNG mã lỗi và CÙNG thông điệp (không lộ tên có thật)', async () => {
  const { nguoi, svc } = await dung();
  const lan = [];
  for (const [n, mk] of [[nguoi(), 'sai-mat-khau'], [null, 'Mekong@2026'], [nguoi({ isActive: false }), 'Mekong@2026']]) {
    try { await svc(n).login({ username: 'quanly_tt4', password: mk }); assert.fail('phải bị từ chối'); } catch (e) { lan.push([e.code, e.message]); }
  }
  assert.equal(lan.length, 3);
  for (const l of lan) assert.deepEqual(l, ['INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng.']);
});

test('thân yêu cầu sai: không phải đối tượng, thiếu trường, sai kiểu, quá dài -> VALIDATION_ERROR kèm đúng trường, chưa chạm CSDL', async () => {
  const { nguoi, svc, goi } = await dung();
  const s = svc(nguoi());
  for (const b of [null, 'x', [], 7]) await assert.rejects(s.login(b), (e) => e.code === 'VALIDATION_ERROR' && e.field === 'body');
  await assert.rejects(s.login({}), (e) => e.code === 'VALIDATION_ERROR' && e.fields.map((f) => f.field).join() === 'username,password');
  await assert.rejects(s.login({ username: 123, password: ['a'] }), (e) => e.fields.length === 2);
  await assert.rejects(s.login({ username: 'a'.repeat(51), password: 'x' }), (e) => e.field === 'username');
  await assert.rejects(s.login({ username: 'a', password: 'x'.repeat(129) }), (e) => e.field === 'password');
  assert.equal(goi.length, 0, 'dữ liệu sai định dạng không được tới lớp CSDL');
});

test("chuỗi tấn công ' OR '1'='1 làm tên đăng nhập: chỉ được truyền NGUYÊN VĂN làm tham số tìm kiếm và bị từ chối như tên không tồn tại", async () => {
  const { svc, goi } = await dung();
  await assert.rejects(svc(null).login({ username: "' OR '1'='1", password: 'x' }), (e) => e.code === 'INVALID_CREDENTIALS');
  assert.deepEqual(goi, ["' OR '1'='1"]);
});
