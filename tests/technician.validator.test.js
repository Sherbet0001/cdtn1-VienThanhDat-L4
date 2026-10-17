'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateTechnician, validateId, validateListQuery, TEN_TOI_DA,
} = require('../src/validators/technician.validator');
const { ValidationError } = require('../src/errors/AppError');

const hopLe = { full_name: '  Phạm Minh Quyên ', center_id: 1, level: 'CAO_CAP' };

/* ---- Luồng đúng ---- */
test('dữ liệu hợp lệ: cắt khoảng trắng đầu cuối và mặc định is_active = true', () => {
  assert.deepEqual(validateTechnician(hopLe),
    { fullName: 'Phạm Minh Quyên', centerId: 1, level: 'CAO_CAP', isActive: true });
});

/* ---- Giá trị biên ---- */
test('tên dài đúng 100 ký tự được nhận, 101 ký tự bị từ chối', () => {
  assert.equal(validateTechnician({ ...hopLe, full_name: 'a'.repeat(TEN_TOI_DA) }).fullName.length, 100);
  assert.throws(() => validateTechnician({ ...hopLe, full_name: 'a'.repeat(TEN_TOI_DA + 1) }),
    (e) => e instanceof ValidationError && e.chiTiet.cac_truong[0].truong === 'full_name');
});

test('center_id: 1 được nhận, 0 bị từ chối', () => {
  assert.equal(validateTechnician({ ...hopLe, center_id: 1 }).centerId, 1);
  assert.throws(() => validateTechnician({ ...hopLe, center_id: 0 }), ValidationError);
});

/* ---- Dữ liệu sai ---- */
test('thiếu trường bắt buộc: báo đủ tên các trường thiếu', () => {
  assert.throws(() => validateTechnician({}), (e) => {
    const ten = e.chiTiet.cac_truong.map((x) => x.truong);
    assert.deepEqual(ten, ['full_name', 'center_id', 'level']);
    assert.match(e.message, /full_name, center_id, level/);
    return e.code === 'VALIDATION_ERROR';
  });
});

test('sai kiểu và sai giá trị: level lạ, tên toàn dấu cách, is_active là chuỗi', () => {
  assert.throws(
    () => validateTechnician({ full_name: '   ', center_id: '2', level: 'GIOI', is_active: 'yes' }),
    (e) => e.chiTiet.cac_truong.map((x) => x.truong).join() === 'full_name,center_id,level,is_active');
});

test('body không phải đối tượng JSON thì bị từ chối', () => {
  for (const x of [null, [], 'abc', 42]) {
    assert.throws(() => validateTechnician(x), ValidationError);
  }
});

test('mã trong đường dẫn: "7" hợp lệ; "0", "-1", "abc", "1.5" bị từ chối', () => {
  assert.equal(validateId('7'), 7);
  for (const x of ['0', '-1', 'abc', '1.5', '', '1234567890123456']) {
    assert.throws(() => validateId(x), ValidationError, x);
  }
});

test('tham số lọc: mặc định limit 20, offset 0; sai thì từ chối', () => {
  assert.deepEqual(validateListQuery({}), { centerId: null, isActive: null, limit: 20, offset: 0 });
  assert.deepEqual(validateListQuery({ center_id: '3', is_active: 'false', limit: '100', offset: '5' }),
    { centerId: 3, isActive: false, limit: 100, offset: 5 });
  assert.throws(() => validateListQuery({ limit: '101' }), ValidationError);
  assert.throws(() => validateListQuery({ is_active: 'maybe' }), ValidationError);
});
