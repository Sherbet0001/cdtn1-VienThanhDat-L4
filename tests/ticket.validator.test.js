'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketCreate, validateUnassignedQuery } = require('../src/validators/ticket.validator');
const { ValidationError } = require('../src/errors/AppError');

const hopLe = { customer_name: ' Nguyễn Văn An ', customer_phone: '+84901234567', device_name: 'iPhone 14',
  issue_category: 'MAN_HINH', center_id: 2 };

test('tiếp nhận hợp lệ: cắt khoảng trắng, chuẩn hóa số điện thoại, priority null khi không gửi', () => {
  const v = validateTicketCreate(hopLe);
  assert.equal(v.customerName, 'Nguyễn Văn An');
  assert.equal(v.customerPhone, '0901234567');
  assert.equal(v.priority, null);
});

test('tiếp nhận thiếu hết trường: fields liệt kê đủ năm trường bắt buộc, theo thứ tự', () => {
  assert.throws(() => validateTicketCreate({}), (e) => e instanceof ValidationError
    && e.fields.map((f) => f.field).join() === 'customer_name,device_name,customer_phone,issue_category,center_id');
});

test('tiếp nhận: số điện thoại 9 số, nhóm sự cố lạ, ưu tiên lạ, center_id = 0 đều bị báo đúng trường', () => {
  assert.throws(() => validateTicketCreate({ ...hopLe, customer_phone: '090123456', issue_category: 'X', priority: 'GAP', center_id: 0 }),
    (e) => e.fields.map((f) => f.field).join() === 'customer_phone,issue_category,priority,center_id');
});

test('tiếp nhận: tên 101 ký tự bị từ chối, 100 ký tự được nhận (biên)', () => {
  assert.throws(() => validateTicketCreate({ ...hopLe, customer_name: 'A'.repeat(101) }), ValidationError);
  assert.equal(validateTicketCreate({ ...hopLe, customer_name: 'A'.repeat(100) }).customerName.length, 100);
});

test('danh sách: mặc định page 1, limit 20; biên limit 100 được, 101 và 0 bị từ chối', () => {
  assert.deepEqual(validateUnassignedQuery({}), { page: 1, limit: 20, centerId: null });
  assert.equal(validateUnassignedQuery({ limit: '100' }).limit, 100);
  for (const limit of ['101', '0', 'abc', '-1']) assert.throws(() => validateUnassignedQuery({ limit }), ValidationError);
  assert.throws(() => validateUnassignedQuery({ page: '0' }), ValidationError);
});

test('phân công: technician_id phải là số nguyên dương; thiếu, chuỗi, 0, số thực đều bị báo đúng trường', () => {
  const { validateAssignment } = require('../src/validators/ticket.validator');
  assert.equal(validateAssignment({ technician_id: 12 }), 12);
  for (const body of [{}, { technician_id: '12' }, { technician_id: 0 }, { technician_id: 1.5 }, null, []]) {
    assert.throws(() => validateAssignment(body), ValidationError, JSON.stringify(body));
  }
});
