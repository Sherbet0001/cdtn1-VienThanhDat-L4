'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { toTicketView, isoVN, TICKET_VIEW_FIELDS } = require('../src/contracts/ticket.contract');

const mau = { ticketId: 1287, ticketCode: 'BH-001287/2026', customerName: 'Nguyễn Văn An', customerPhone: '0901234567',
  deviceName: 'iPhone 14', issueCategory: 'MAN_HINH', priority: 'CAO', status: 'MOI', centerId: 2,
  technicianId: null, technicianName: null,
  receivedAt: new Date('2026-10-05T03:30:00Z'), dueDate: new Date('2026-10-06T03:30:00Z') };

test('đúng và đủ các trường của hợp đồng, snake_case', () => {
  assert.deepEqual(Object.keys(toTicketView(mau)).sort(), [...TICKET_VIEW_FIELDS].sort());
});

test('thời gian là ISO 8601 giờ Việt Nam (+07:00), kể cả khi Date là UTC', () => {
  const v = toTicketView(mau);
  assert.equal(v.received_at, '2026-10-05T10:30:00+07:00');
  assert.match(v.due_date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/);
  assert.equal(isoVN('2026-12-31T20:00:00Z'), '2027-01-01T03:00:00+07:00');   // biên: qua nửa đêm sang năm mới
});

test('chưa phân công: technician_id và technician_name là null (không phải 0, không phải undefined)', () => {
  const v = toTicketView(mau);
  assert.strictEqual(v.technician_id, null);
  assert.strictEqual(v.technician_name, null);
  assert.equal(toTicketView({ ...mau, technicianId: 7, technicianName: 'Trần Hoài Giang' }).technician_id, 7);
});
