'use strict';
// Test hợp đồng ở ranh giới: kiểm tra HÌNH DẠNG và Ý NGHĨA đặc biệt, không kiểm tra giá trị nghiệp vụ.
const test = require('node:test');
const assert = require('node:assert/strict');
const { toTechnicianView, TECHNICIAN_VIEW_FIELDS } = require('../src/contracts/technician.contract');

const mau = { technicianId: 7, fullName: 'Trần Hoài Giang', centerId: 4, level: 'TRUNG_CAP', isActive: true };

test('đúng và đủ các trường của hợp đồng, toàn bộ snake_case', () => {
  const v = toTechnicianView(mau);
  assert.deepEqual(Object.keys(v).sort(), [...TECHNICIAN_VIEW_FIELDS].sort());
  assert.ok(Object.keys(v).every((k) => /^[a-z]+(_[a-z]+)*$/.test(k)));
});

test('mã là số (không phải chuỗi) và is_active là boolean', () => {
  const v = toTechnicianView(mau);
  assert.equal(typeof v.technician_id, 'number');
  assert.equal(typeof v.center_id, 'number');
  assert.equal(typeof v.is_active, 'boolean');
});

test('skills chỉ xuất hiện khi có; mảng rỗng vẫn giữ là mảng rỗng', () => {
  assert.equal('skills' in toTechnicianView(mau), false);
  assert.deepEqual(toTechnicianView({ ...mau, skills: [] }).skills, []);
  assert.deepEqual(
    toTechnicianView({ ...mau, skills: [{ issueCategory: 'MAN_HINH', proficiency: 3 }] }).skills,
    [{ issue_category: 'MAN_HINH', proficiency: 3 }]);
});
