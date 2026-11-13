'use strict';
// Token JWT HS256 (OWASP A07): ký, kiểm chữ ký, hạn dùng, chặn thuật toán "none", chặn nội dung bị sửa.
const test = require('node:test');
const assert = require('node:assert/strict');
const { kyToken, xacMinhToken } = require('../src/auth/token');

const BI_MAT = 'khoa-ky-token-chi-dung-trong-kiem-thu-dai-hon-32';
const NGUOI = { userId: 7, role: 'QUAN_LY', centerId: 4 };
const T0 = Date.UTC(2026, 10, 13, 3, 0, 0);

const b64u = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');

test('ký rồi xác minh: trả lại đúng mã người dùng, vai trò, trung tâm', () => {
  const t = kyToken(NGUOI, BI_MAT, { bayGio: T0 });
  assert.equal(t.split('.').length, 3);
  assert.deepEqual(xacMinhToken(t, BI_MAT, T0 + 1000), NGUOI);
});

test('quản trị không có trung tâm: centerId = null', () => {
  const t = kyToken({ userId: 1, role: 'QUAN_TRI', centerId: null }, BI_MAT, { bayGio: T0 });
  assert.deepEqual(xacMinhToken(t, BI_MAT, T0), { userId: 1, role: 'QUAN_TRI', centerId: null });
});

test('biên hạn dùng: còn 1 giây thì hợp lệ, đúng thời điểm hết hạn thì bị từ chối', () => {
  const t = kyToken(NGUOI, BI_MAT, { ttlGiay: 3600, bayGio: T0 });
  assert.doesNotThrow(() => xacMinhToken(t, BI_MAT, T0 + 3599 * 1000));
  assert.throws(() => xacMinhToken(t, BI_MAT, T0 + 3600 * 1000), (e) => e.code === 'UNAUTHENTICATED');
});

test('sai khóa ký bị từ chối', () => {
  const t = kyToken(NGUOI, BI_MAT, { bayGio: T0 });
  assert.throws(() => xacMinhToken(t, BI_MAT + 'x', T0), (e) => e.code === 'UNAUTHENTICATED');
});

test('sửa nội dung (nâng vai trò lên QUAN_TRI, giữ nguyên chữ ký cũ) bị từ chối', () => {
  const t = kyToken(NGUOI, BI_MAT, { bayGio: T0 });
  const [h, , s] = t.split('.');
  const gia = `${h}.${b64u({ sub: '7', role: 'QUAN_TRI', cid: null, iat: T0 / 1000, exp: T0 / 1000 + 99999 })}.${s}`;
  assert.throws(() => xacMinhToken(gia, BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
});

test('thuật toán "none" (không chữ ký) và thuật toán lạ bị từ chối', () => {
  const nd = b64u({ sub: '1', role: 'QUAN_TRI', cid: null, iat: 1, exp: 9999999999 });
  assert.throws(() => xacMinhToken(`${b64u({ alg: 'none', typ: 'JWT' })}.${nd}.`, BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
  assert.throws(() => xacMinhToken(`${b64u({ alg: 'HS512', typ: 'JWT' })}.${nd}.abc`, BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
});

test('chuỗi rác, rỗng, quá dài, không phải chuỗi đều bị từ chối bằng cùng một thông điệp', () => {
  const thongDiep = new Set();
  for (const x of ['', 'abc', 'a.b', 'a.b.c', '....', 'x'.repeat(3000), undefined, null, 123, {}]) {
    try { xacMinhToken(x, BI_MAT, T0); assert.fail('phải bị từ chối'); } catch (e) { assert.equal(e.code, 'UNAUTHENTICATED'); thongDiep.add(e.message); }
  }
  assert.equal(thongDiep.size, 1, 'mọi lý do từ chối phải cùng một thông điệp');
});

test('vai trò lạ hoặc mã người dùng sai kiểu trong token đã ký đúng vẫn bị từ chối', () => {
  const dung = (nd) => {
    const p = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u(nd)}`;
    return `${p}.${require('node:crypto').createHmac('sha256', BI_MAT).update(p).digest('base64url')}`;
  };
  const co = { iat: T0 / 1000, exp: T0 / 1000 + 100 };
  assert.throws(() => xacMinhToken(dung({ ...co, sub: '1', role: 'ROOT', cid: null }), BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
  assert.throws(() => xacMinhToken(dung({ ...co, sub: 'abc', role: 'QUAN_TRI', cid: null }), BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
  assert.throws(() => xacMinhToken(dung({ ...co, sub: '1', role: 'QUAN_LY', cid: 'x' }), BI_MAT, T0), (e) => e.code === 'UNAUTHENTICATED');
});
