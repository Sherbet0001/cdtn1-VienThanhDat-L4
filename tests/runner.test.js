'use strict';
// Kiểm thử bộ chạy migration bằng "client giả": không cần PostgreSQL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyFiles } = require('../src/db/runner');

/** Client giả: ghi lại mọi câu lệnh và giả lập bảng schema_migrations. */
function taoClientGia({ loiKhiChay = null } = {}) {
  const daChay = new Set();
  const nhatKy = [];
  return {
    nhatKy,
    async query(sql, tham) {
      nhatKy.push(sql.trim().split('\n')[0].trim());
      if (/^SELECT filename FROM schema_migrations/.test(sql)) {
        return { rows: [...daChay].map((filename) => ({ filename })) };
      }
      if (/^INSERT INTO schema_migrations/.test(sql)) daChay.add(tham[0]);
      if (loiKhiChay && sql.includes(loiKhiChay)) throw new Error('lỗi giả lập');
      return { rows: [] };
    },
  };
}

const tep = [
  { name: '001_a.sql', sql: 'SELECT 1' },
  { name: '002_b.sql', sql: 'SELECT 2' },
];

test('migration chạy lần đầu: chạy đủ các tệp theo thứ tự', async () => {
  const c = taoClientGia();
  const kq = await applyFiles(c, tep, { track: true });
  assert.deepEqual(kq.applied, ['001_a.sql', '002_b.sql']);
  assert.deepEqual(kq.skipped, []);
});

test('migration chạy lần hai: bỏ qua tệp đã chạy, không chạy lại SQL', async () => {
  const c = taoClientGia();
  await applyFiles(c, tep, { track: true });
  const truoc = c.nhatKy.filter((x) => x === 'SELECT 1').length;
  const kq = await applyFiles(c, tep, { track: true });
  assert.deepEqual(kq.applied, []);
  assert.deepEqual(kq.skipped, ['001_a.sql', '002_b.sql']);
  assert.equal(c.nhatKy.filter((x) => x === 'SELECT 1').length, truoc);
});

test('tệp lỗi: hoàn tác giao dịch, báo tên tệp, không ghi vào schema_migrations', async () => {
  const c = taoClientGia({ loiKhiChay: 'SELECT 2' });
  await assert.rejects(applyFiles(c, tep, { track: true }), /002_b\.sql: lỗi giả lập/);
  assert.ok(c.nhatKy.includes('ROLLBACK'));
  const kq = await applyFiles(taoClientGia(), tep.slice(0, 1), { track: true });
  assert.deepEqual(kq.applied, ['001_a.sql']);
});

test('seed (track = false) chạy lại mọi tệp mỗi lần', async () => {
  const c = taoClientGia();
  await applyFiles(c, tep, { track: false });
  const kq = await applyFiles(c, tep, { track: false });
  assert.deepEqual(kq.applied, ['001_a.sql', '002_b.sql']);
});

test('lỗi kết nối rỗng thông điệp (AggregateError): vẫn hiện mã lỗi và gợi ý', () => {
  const { moTaLoi } = require('../src/db/runner');
  const e1 = Object.assign(new Error('connect ECONNREFUSED ::1:5432'), { code: 'ECONNREFUSED' });
  const e2 = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
  const tong = new AggregateError([e1, e2], '');
  const chu = moTaLoi(tong);
  assert.match(chu, /ECONNREFUSED: connect ECONNREFUSED ::1:5432/);
  assert.match(chu, /PostgreSQL chưa chạy/);
});
