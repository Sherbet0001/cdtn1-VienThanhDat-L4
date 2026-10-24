'use strict';
// Kiểm thử quy tắc THUẦN: QT-04 (hạn cam kết) và QT-02 (số điện thoại). Ba loại: luồng đúng, giá trị biên, dữ liệu sai.
const test = require('node:test');
const assert = require('node:assert/strict');
const { hanCamKet, UU_TIEN_MAC_DINH } = require('../src/services/ticket.rules');
const { chuanHoaSdt, cheSdt } = require('../src/validators/phone');

const luc = (s) => new Date(s);                 // 2026-10-23 là thứ Sáu, 24 là thứ Bảy, 25 là Chủ nhật, 26 là thứ Hai
const iso = (d) => d.toISOString();

test('QT-04 luồng đúng: ưu tiên CAO nhận thứ Hai 10:00 thì hạn là thứ Ba 10:00 (24h)', () => {
  assert.equal(iso(hanCamKet(luc('2026-10-19T10:00:00+07:00'), 'CAO')), iso(luc('2026-10-20T10:00:00+07:00')));
});

test('QT-04 luồng đúng: TRUNG_BINH 72h và THAP 120h khi không gặp Chủ nhật', () => {
  assert.equal(iso(hanCamKet(luc('2026-10-19T09:00:00+07:00'), 'TRUNG_BINH')), iso(luc('2026-10-22T09:00:00+07:00')));
  assert.equal(iso(hanCamKet(luc('2026-10-19T09:00:00+07:00'), 'THAP')), iso(luc('2026-10-24T09:00:00+07:00')));
});

test('QT-04 BIÊN: thứ Bảy + 24h rơi vào Chủ nhật thì lùi sang thứ Hai cùng giờ', () => {
  assert.equal(iso(hanCamKet(luc('2026-10-24T10:00:00+07:00'), 'CAO')), iso(luc('2026-10-26T10:00:00+07:00')));
});

test('QT-04 BIÊN: thứ Sáu + 24h là thứ Bảy (thứ Bảy vẫn là ngày làm việc)', () => {
  assert.equal(iso(hanCamKet(luc('2026-10-23T10:00:00+07:00'), 'CAO')), iso(luc('2026-10-24T10:00:00+07:00')));
});

test('QT-04 BIÊN: Chủ nhật được tính theo giờ Việt Nam, không theo UTC (23:30 thứ Bảy VN còn là thứ Bảy UTC+0 16:30)', () => {
  // 2026-10-24T23:30+07:00 + 24h = Chủ nhật 23:30 VN -> lùi sang thứ Hai 23:30 VN
  assert.equal(iso(hanCamKet(luc('2026-10-24T23:30:00+07:00'), 'CAO')), iso(luc('2026-10-26T23:30:00+07:00')));
});

test('QT-04 THAP nhận thứ Ba: 5 ngày làm việc, bỏ qua Chủ nhật nên hạn là thứ Hai', () => {
  assert.equal(iso(hanCamKet(luc('2026-10-20T10:00:00+07:00'), 'THAP')), iso(luc('2026-10-26T10:00:00+07:00')));
});

test('QT-04 dữ liệu sai: mức ưu tiên lạ là lỗi lập trình, ném RangeError', () => {
  assert.throws(() => hanCamKet(new Date(), 'KHAN_CAP'), RangeError);
});

test('ưu tiên mặc định theo nhóm sự cố khớp issue_categories.csv', () => {
  assert.equal(UU_TIEN_MAC_DINH.MAN_HINH, 'CAO');
  assert.equal(UU_TIEN_MAC_DINH.NUOC_VAO, 'CAO');
  assert.equal(UU_TIEN_MAC_DINH.PHAN_MEM, 'THAP');
  assert.equal(UU_TIEN_MAC_DINH.PIN, 'TRUNG_BINH');
});

test('QT-02 luồng đúng: mọi dạng viết quy về 10 số bắt đầu bằng 0', () => {
  for (const dang of ['0901234567', '090 123 4567', '090.123.4567', '+84901234567', '84901234567', ' 0901-234-567 ']) {
    assert.equal(chuanHoaSdt(dang), '0901234567', dang);
  }
});

test('QT-02 BIÊN: 9 số, 11 số, +84 thừa hoặc thiếu số đều bị từ chối', () => {
  for (const sai of ['090123456', '09012345678', '+8490123456', '+849012345678', '1901234567']) {
    assert.equal(chuanHoaSdt(sai), null, sai);
  }
});

test('QT-02 dữ liệu sai: chữ, rỗng, không phải chuỗi đều trả null, không ném lỗi', () => {
  for (const sai of ['', 'abc', '09o1234567', null, undefined, 901234567, '0901+234567']) {
    assert.equal(chuanHoaSdt(sai), null, String(sai));
  }
});

test('QT-15 che số điện thoại: giữ ba số đầu và ba số cuối', () => {
  assert.equal(cheSdt('0901234567'), '090****567');
});
