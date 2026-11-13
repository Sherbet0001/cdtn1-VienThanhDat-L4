'use strict';
// Quy tắc kiểm soát truy cập theo trung tâm (QT-14, OWASP A01): thuần hàm, mặc định từ chối.
const test = require('node:test');
const assert = require('node:assert/strict');
const { kiemTraTrungTam, trungTamDeLoc } = require('../src/auth/phanQuyen');

const QUAN_LY_4 = { id: 5, role: 'QUAN_LY', centerId: 4 };
const QUAN_TRI = { id: 1, role: 'QUAN_TRI', centerId: null };

test('quản lý: đúng trung tâm của mình thì qua, trung tâm khác thì FORBIDDEN', () => {
  assert.doesNotThrow(() => kiemTraTrungTam(QUAN_LY_4, 4));
  assert.throws(() => kiemTraTrungTam(QUAN_LY_4, 2), (e) => e.code === 'FORBIDDEN');
});

test('quản trị qua mọi trung tâm', () => {
  for (const c of [1, 4, 6]) assert.doesNotThrow(() => kiemTraTrungTam(QUAN_TRI, c));
});

test('chưa đăng nhập -> UNAUTHENTICATED; vai trò lạ hoặc trung tâm không phải số -> FORBIDDEN (mặc định từ chối)', () => {
  assert.throws(() => kiemTraTrungTam(undefined, 4), (e) => e.code === 'UNAUTHENTICATED');
  assert.throws(() => kiemTraTrungTam({ id: 9, role: 'KHACH', centerId: 4 }, 4), (e) => e.code === 'FORBIDDEN');
  assert.throws(() => kiemTraTrungTam(QUAN_LY_4, undefined), (e) => e.code === 'FORBIDDEN');
  assert.throws(() => kiemTraTrungTam(QUAN_LY_4, '4'), (e) => e.code === 'FORBIDDEN');
});

test('lọc danh sách: quản lý bị ép về trung tâm mình; hỏi trung tâm khác thì FORBIDDEN; quản trị giữ nguyên giá trị hỏi', () => {
  assert.equal(trungTamDeLoc(QUAN_LY_4, undefined), '4');
  assert.equal(trungTamDeLoc(QUAN_LY_4, ''), '4');
  assert.equal(trungTamDeLoc(QUAN_LY_4, '4'), '4');
  assert.throws(() => trungTamDeLoc(QUAN_LY_4, '2'), (e) => e.code === 'FORBIDDEN');
  assert.throws(() => trungTamDeLoc(QUAN_LY_4, "4' OR '1'='1"), (e) => e.code === 'FORBIDDEN');
  assert.equal(trungTamDeLoc(QUAN_TRI, undefined), undefined);
  assert.equal(trungTamDeLoc(QUAN_TRI, '2'), '2');
  assert.throws(() => trungTamDeLoc(undefined, '4'), (e) => e.code === 'UNAUTHENTICATED');
});
