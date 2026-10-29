'use strict';
// Hồi quy BUG-002 (docs/bug-log.md): CSDL tắt giữa chừng không được làm sập tiến trình máy chủ.
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { taoPool } = require('../src/db/pool');

/** Pool giả: như pg.Pool, là một EventEmitter. Phát 'error' mà không ai nghe thì Node ném lỗi và thoát. */
class PoolGia extends EventEmitter {
  constructor(cauHinh) { super(); this.cauHinh = cauHinh; }
}

test('BUG-002: pool phát lỗi kết nối rảnh (CSDL tắt) thì chỉ ghi cảnh báo, KHÔNG ném lỗi làm sập tiến trình', () => {
  const canhBao = [];
  const pool = taoPool(PoolGia, { connectionString: 'postgres://u:p@db/x' }, { warn: (m, c) => canhBao.push([m, c]) });
  const loi = Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' });
  assert.doesNotThrow(() => pool.emit('error', loi));
  assert.equal(canhBao.length, 1);
  assert.equal(canhBao[0][1].err.code, '57P01');
});

test('taoPool giữ cấu hình và đặt thời gian chờ kết nối 3 giây', () => {
  const pool = taoPool(PoolGia, { connectionString: 'x', max: 4 }, { warn() {} });
  assert.equal(pool.cauHinh.max, 4);
  assert.equal(pool.cauHinh.connectionTimeoutMillis, 3000);
});

test('đối chứng: pool KHÔNG có bộ lắng nghe thì phát lỗi làm Node ném (đúng cơ chế gây BUG-002)', () => {
  const tran = new PoolGia({});
  assert.throws(() => tran.emit('error', new Error('mất kết nối')), /mất kết nối/);
});
