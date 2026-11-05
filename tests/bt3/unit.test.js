'use strict';
// BT3 · Test Report TC-01..TC-06 (tầng UNIT: hàm thuần, không CSDL, không mạng). Mô tả từng test case: docs/test-report.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { hanCamKet, lyDoKhongDuDieuKien } = require('../../src/services/ticket.rules');
const { validateTicketCreate } = require('../../src/validators/ticket.validator');
const { cheSdt } = require('../../src/validators/phone');
const { taoLogger } = require('../../src/logger');

const iso = (d) => d.toISOString();

test('TC-01 QT-04 luồng đúng: CAO nhận thứ Hai 09:00 thì hạn là thứ Ba 09:00 (24 giờ)', () => {
  const han = hanCamKet(new Date('2026-11-02T09:00:00+07:00'), 'CAO');
  assert.equal(iso(han), iso(new Date('2026-11-03T09:00:00+07:00')));
});

test('TC-02 QT-04 biên: CAO nhận thứ Bảy thì hạn rơi Chủ nhật nên lùi sang thứ Hai cùng giờ', () => {
  const han = hanCamKet(new Date('2026-11-07T15:00:00+07:00'), 'CAO');
  assert.equal(iso(han), iso(new Date('2026-11-09T15:00:00+07:00')));
});

test('TC-03 QT-04 biên: CAO nhận thứ Sáu thì hạn là thứ Bảy 15:00 (thứ Bảy vẫn là ngày làm việc)', () => {
  const han = hanCamKet(new Date('2026-11-06T15:00:00+07:00'), 'CAO');
  assert.equal(iso(han), iso(new Date('2026-11-07T15:00:00+07:00')));
});

test('TC-04 QT-08 luồng đúng: cùng trung tâm, đang hoạt động, thành thạo 4 thì đủ điều kiện (trả null)', () => {
  const phieu = { centerId: 4, issueCategory: 'MAN_HINH' };
  const ktv = { centerId: 4, isActive: true, proficiency: 4 };
  assert.equal(lyDoKhongDuDieuKien(phieu, ktv), null);
});

test('TC-05 QT-02 dữ liệu sai: số điện thoại 9 số bị từ chối, chỉ báo trường customer_phone kèm lý do', () => {
  const body = { customer_name: 'An', customer_phone: '090123456', device_name: 'iPhone 15', issue_category: 'MAN_HINH', center_id: 4 };
  assert.throws(() => validateTicketCreate(body), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    assert.equal(err.fields.length, 1);
    assert.equal(err.fields[0].field, 'customer_phone');
    assert.match(err.fields[0].reason, /10 chữ số/);
    return true;
  });
});

test('TC-06 QT-15 bảo mật: số điện thoại được che khi hiển thị và KHÔNG xuất hiện trong log', () => {
  assert.equal(cheSdt('0901234567'), '090****567');
  const dong = [];
  const logger = taoLogger({ level: 'debug', write: (s) => dong.push(s), now: () => new Date('2026-11-05T03:00:00Z') });
  logger.info('tiếp nhận phiếu', { requestId: 'r1', customer_phone: '0901234567' });
  assert.equal(dong.length, 1);
  assert.ok(!dong[0].includes('0901234567'), 'số điện thoại đầy đủ lộ trong log');
  assert.equal(JSON.parse(dong[0]).customer_phone, '***');
});
