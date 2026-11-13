'use strict';
// Băm mật khẩu (OWASP A02, checklist bảo mật mục 4): chuỗi băm có muối riêng, không suy ngược được, so khớp đúng/sai.
const test = require('node:test');
const assert = require('node:assert/strict');
const { bamMatKhau, kiemTraMatKhau } = require('../src/auth/password');

const NHANH = { N: 1024, r: 8, p: 1 };   // hạ tham số để test chạy nhanh; mã thật dùng N=16384

test('băm: định dạng scrypt$N$r$p$muối$băm và KHÔNG chứa mật khẩu gốc', async () => {
  const b = await bamMatKhau('Mekong@2026', NHANH);
  assert.match(b, /^scrypt\$1024\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.ok(!b.includes('Mekong@2026'));
});

test('hai lần băm cùng một mật khẩu cho hai chuỗi khác nhau (muối ngẫu nhiên) nhưng cùng kiểm tra đúng', async () => {
  const a = await bamMatKhau('Mekong@2026', NHANH);
  const b = await bamMatKhau('Mekong@2026', NHANH);
  assert.notEqual(a, b);
  assert.equal(await kiemTraMatKhau('Mekong@2026', a), true);
  assert.equal(await kiemTraMatKhau('Mekong@2026', b), true);
});

test('sai mật khẩu, sai hoa thường, thừa một ký tự đều bị từ chối', async () => {
  const b = await bamMatKhau('Mekong@2026', NHANH);
  assert.equal(await kiemTraMatKhau('mekong@2026', b), false);
  assert.equal(await kiemTraMatKhau('Mekong@2026 ', b), false);
  assert.equal(await kiemTraMatKhau('', b), false);
});

test('chuỗi băm hỏng, rỗng, thiếu phần hoặc tham số vô lý -> false, không ném lỗi', async () => {
  for (const x of [undefined, null, '', 'plaintext', 'scrypt$1$2$3', 'bcrypt$1024$8$1$aaaa$bbbb',
    'scrypt$abc$8$1$aaaa$bbbb', 'scrypt$99999999999$8$1$aaaa$bbbb', 'scrypt$1024$8$1$aaaa$']) {
    assert.equal(await kiemTraMatKhau('x', x), false, String(x));
  }
});

test('chuỗi băm bị sửa một ký tự thì không còn khớp', async () => {
  const b = await bamMatKhau('Mekong@2026', NHANH);
  const hong = b.slice(0, -3) + (b.slice(-3) === 'AAA' ? 'BBB' : 'AAA');
  assert.equal(await kiemTraMatKhau('Mekong@2026', hong), false);
});

test('các tài khoản mẫu trong seeds/005_app_users.sql đều là chuỗi băm scrypt, không có mật khẩu gốc', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'seeds', '005_app_users.sql'), 'utf8');
  const bam = sql.match(/'scrypt\$[^']+'/g) || [];
  assert.equal(bam.length, 7, 'kỳ vọng 1 quản trị + 6 quản lý');
  assert.ok(!sql.includes('Mekong@2026'), 'mật khẩu gốc không được nằm trong seed');
  assert.equal(await kiemTraMatKhau('Mekong@2026', bam[0].slice(1, -1)), true, 'chuỗi băm mẫu phải khớp mật khẩu mẫu ghi trong tài liệu');
});
