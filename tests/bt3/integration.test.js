'use strict';
// BT3 · Test Report TC-07..TC-09 (tầng INTEGRATION: service + repository + PostgreSQL THẬT). Cần TEST_DATABASE_URL (xem tests/helpers/db.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const TicketRepository = require('../../src/repositories/ticket.repository');
const { TicketService } = require('../../src/services/ticket.service');
const { listSqlFiles, applyFiles } = require('../../src/db/runner');
const { coCsdl, LY_DO_BO_QUA, taoPoolThu, dongPool, resetDb, themKhach, themKtv, themPhieu, demDong } = require('../helpers/db');

const GOC = path.resolve(__dirname, '..', '..');
const opts = { skip: coCsdl ? false : LY_DO_BO_QUA };

let pool;
test.before(async () => { if (coCsdl) pool = await taoPoolThu(); });
test.after(async () => { if (pool) await dongPool(pool); });
test.beforeEach(async () => { if (pool) await resetDb(pool); });

const dichVu = () => new TicketService(new TicketRepository(pool));
const logCua = async (ticketId) => (await pool.query(
  'SELECT old_status, new_status, old_technician_id, new_technician_id, changed_by FROM ticket_status_log WHERE ticket_id = $1 ORDER BY log_id',
  [ticketId])).rows;

test('TC-07 QT-06/QT-07 luồng đúng: gán KTV đủ điều kiện -> DA_PHAN_CONG, đúng một dòng log MOI -> DA_PHAN_CONG', opts, async () => {
  const khach = await themKhach(pool);
  const ktv = await themKtv(pool, { center: 4, kyNang: { MAN_HINH: 4 } });
  const phieu = await themPhieu(pool, { khachId: khach, center: 4, nhom: 'MAN_HINH' });

  const kq = await dichVu().assign(phieu, ktv, 0);

  assert.equal(kq.status, 'DA_PHAN_CONG');
  const { rows } = await pool.query('SELECT status, technician_id FROM ticket WHERE ticket_id = $1', [phieu]);
  assert.equal(rows[0].status, 'DA_PHAN_CONG');
  assert.equal(Number(rows[0].technician_id), ktv);
  const log = await logCua(phieu);
  assert.equal(log.length, 1);
  assert.equal(log[0].old_status, 'MOI');
  assert.equal(log[0].new_status, 'DA_PHAN_CONG');
  assert.equal(Number(log[0].new_technician_id), ktv);
});

test('TC-08 QT-07 dữ liệu sai: gán lại phiếu đã có KTV -> TICKET_ALREADY_ASSIGNED, KTV cũ giữ nguyên, không ghi thêm log', opts, async () => {
  const khach = await themKhach(pool);
  const ktv1 = await themKtv(pool, { ten: 'KTV Một', center: 4, kyNang: { MAN_HINH: 4 } });
  const ktv2 = await themKtv(pool, { ten: 'KTV Hai', center: 4, kyNang: { MAN_HINH: 5 } });
  const phieu = await themPhieu(pool, { khachId: khach, center: 4, nhom: 'MAN_HINH' });
  await dichVu().assign(phieu, ktv1, 0);

  await assert.rejects(() => dichVu().assign(phieu, ktv2, 0), (err) => {
    assert.equal(err.code, 'TICKET_ALREADY_ASSIGNED');
    return true;
  });

  const { rows } = await pool.query('SELECT technician_id FROM ticket WHERE ticket_id = $1', [phieu]);
  assert.equal(Number(rows[0].technician_id), ktv1, 'phiếu bị ghi đè sang KTV thứ hai');
  assert.equal((await logCua(phieu)).length, 1, 'có dòng log thừa sau lần gán bị từ chối');
});

test('TC-09 tái lập: chạy lại migration và seed lần hai không lỗi, số dòng không đổi (38 KTV, 159 kỹ năng)', opts, async () => {
  const client = await pool.connect();
  try {
    const migrations = listSqlFiles(path.join(GOC, 'migrations'));
    const seeds = listSqlFiles(path.join(GOC, 'seeds'));
    await applyFiles(client, seeds, { track: false });
    const truoc = {
      technician: await demDong(pool, 'technician'), technician_skill: await demDong(pool, 'technician_skill'),
      customer: await demDong(pool, 'customer'), ticket: await demDong(pool, 'ticket'),
    };
    assert.equal(truoc.technician, 38);
    assert.equal(truoc.technician_skill, 159);

    const m2 = await applyFiles(client, migrations, { track: true });
    await applyFiles(client, seeds, { track: false });

    assert.deepEqual(m2.applied, [], 'migration đã chạy lại thay vì bỏ qua');
    assert.deepEqual(m2.skipped, migrations.map((f) => f.name));
    const sau = {
      technician: await demDong(pool, 'technician'), technician_skill: await demDong(pool, 'technician_skill'),
      customer: await demDong(pool, 'customer'), ticket: await demDong(pool, 'ticket'),
    };
    assert.deepEqual(sau, truoc, 'chạy seed lần hai làm đổi số dòng (nhân đôi dữ liệu)');
  } finally {
    client.release();
  }
});
