'use strict';
// Hồi quy BUG-003: chuỗi chứa ký tự NUL (\u0000) lọt qua validator, PostgreSQL từ chối (22021) nên API trả 500 thay vì 400.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketCreate, validateTicketUpdate, validateCancel } = require('../src/validators/ticket.validator');
const { validateTechnician } = require('../src/validators/technician.validator');

const phieuHopLe = { customer_name: 'An', customer_phone: '0901234567', device_name: 'iPhone 15', issue_category: 'MAN_HINH', center_id: 4 };

function truongBaoLoi(fn) {
  try { fn(); } catch (e) { return { code: e.code, fields: (e.fields || []).map((f) => f.field) }; }
  return null;
}

test('BUG-003: tiếp nhận phiếu có NUL trong customer_name hoặc device_name bị từ chối 400 tại đúng trường', () => {
  assert.deepEqual(truongBaoLoi(() => validateTicketCreate({ ...phieuHopLe, customer_name: 'An\u0000' })),
    { code: 'VALIDATION_ERROR', fields: ['customer_name'] });
  assert.deepEqual(truongBaoLoi(() => validateTicketCreate({ ...phieuHopLe, device_name: 'iPhone\u0000 15' })),
    { code: 'VALIDATION_ERROR', fields: ['device_name'] });
});

test('BUG-003: sửa phiếu, thêm kỹ thuật viên, hủy phiếu có NUL cũng bị từ chối 400', () => {
  assert.deepEqual(truongBaoLoi(() => validateTicketUpdate({ device_name: 'x\u0000' })),
    { code: 'VALIDATION_ERROR', fields: ['device_name'] });
  assert.deepEqual(truongBaoLoi(() => validateTechnician({ full_name: 'Lê\u0000', center_id: 4, level: 'SO_CAP' })),
    { code: 'VALIDATION_ERROR', fields: ['full_name'] });
  assert.deepEqual(truongBaoLoi(() => validateCancel({ reason: 'khách đổi ý\u0000' })),
    { code: 'VALIDATION_ERROR', fields: ['reason'] });
});

test('BUG-003: văn bản bình thường (có dấu tiếng Việt, khoảng trắng đầu cuối) vẫn được nhận', () => {
  const kq = validateTicketCreate({ ...phieuHopLe, customer_name: '  Nguyễn Văn Ân  ', device_name: 'Galaxy S24 Ultra' });
  assert.equal(kq.customerName, 'Nguyễn Văn Ân');
  assert.equal(validateCancel({ reason: 'khách đổi ý' }), 'khách đổi ý');
});
