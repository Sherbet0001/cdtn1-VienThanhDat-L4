'use strict';
// Hồi quy BUG-001 (docs/bug-log.md): center_id vượt kiểu INT của PostgreSQL phải bị validator chặn bằng 400, không được rơi xuống CSDL gây 500.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketCreate } = require('../src/validators/ticket.validator');
const { validateTechnician } = require('../src/validators/technician.validator');

const phieu = (centerId) => ({ customer_name: 'An', customer_phone: '0901234567', device_name: 'iPhone 14',
  issue_category: 'PIN', center_id: centerId });
const ktv = (centerId) => ({ full_name: 'Bình', center_id: centerId, level: 'TRUNG_CAP' });

function truongSai(fn, v) {
  try { fn(v); } catch (e) { return e.fields && e.fields.map((f) => f.field); }
  return null;
}

test('BUG-001: tạo phiếu với center_id = 99999999999 bị từ chối 400 tại trường center_id', () => {
  assert.deepEqual(truongSai(validateTicketCreate, phieu(99999999999)), ['center_id']);
});

test('BUG-001: giá trị lớn nhất của INT (2147483647) vẫn được nhận, 2147483648 thì bị từ chối', () => {
  assert.equal(truongSai(validateTicketCreate, phieu(2147483647)), null);
  assert.deepEqual(truongSai(validateTicketCreate, phieu(2147483648)), ['center_id']);
});

test('BUG-001: thêm kỹ thuật viên với center_id vượt INT cũng bị từ chối 400', () => {
  assert.deepEqual(truongSai(validateTechnician, ktv(99999999999)), ['center_id']);
});
