'use strict';
// Kiểm thử phân công (UC3, QT-06/07/08): service với repository giả có giao dịch giả, và quy tắc QT-08 thuần.
const test = require('node:test');
const assert = require('node:assert/strict');
const { TicketService } = require('../src/services/ticket.service');
const TicketRepository = require('../src/repositories/ticket.repository');
const { lyDoKhongDuDieuKien } = require('../src/services/ticket.rules');
const { AppError } = require('../src/errors/AppError');
const { toAssignmentView, toEligibleView } = require('../src/contracts/ticket.contract');

const phieuMoi = { ticketId: 1287, ticketCode: 'BH-001287/2026', status: 'MOI', technicianId: null, centerId: 2, issueCategory: 'MAN_HINH' };
const ktvDu = { technicianId: 12, centerId: 2, isActive: true, proficiency: 4 };

/** Repository giả có runInTransaction: ghi lại các bước để biết log có được ghi hay không. */
function taoRepoGia({ phieu = phieuMoi, ktv = ktvDu, loiKhiGhiLog = false } = {}) {
  const buoc = [];
  const tx = {
    lockById: async () => phieu,
    findTechnicianForCheck: async () => ktv,
    setAssignment: async () => { buoc.push('setAssignment'); return new Date('2026-10-05T04:02:15Z'); },
    insertLog: async (l) => { buoc.push(['insertLog', l]); if (loiKhiGhiLog) throw new Error('mất kết nối'); },
  };
  return { buoc, runInTransaction: async (fn) => fn(tx) };
}
const loi = (ma) => (e) => e instanceof AppError && e.code === ma;

/* ---- QT-08 thuần: luồng đúng, biên, sai ---- */

test('QT-08 luồng đúng: cùng trung tâm, đang hoạt động, thành thạo 4 thì đủ điều kiện', () => {
  assert.equal(lyDoKhongDuDieuKien(phieuMoi, ktvDu), null);
});

test('QT-08 BIÊN: thành thạo đúng 3 được, đúng 2 bị từ chối kèm tên nhóm sự cố', () => {
  assert.equal(lyDoKhongDuDieuKien(phieuMoi, { ...ktvDu, proficiency: 3 }), null);
  assert.match(lyDoKhongDuDieuKien(phieuMoi, { ...ktvDu, proficiency: 2 }), /≥ 3.*MAN_HINH/);
});

test('QT-08 sai: chưa có kỹ năng (null), khác trung tâm, ngừng hoạt động đều bị từ chối với lý do riêng', () => {
  assert.match(lyDoKhongDuDieuKien(phieuMoi, { ...ktvDu, proficiency: null }), /thành thạo/);
  assert.match(lyDoKhongDuDieuKien(phieuMoi, { ...ktvDu, centerId: 3 }), /trung tâm khác/);
  assert.match(lyDoKhongDuDieuKien(phieuMoi, { ...ktvDu, isActive: false }), /ngừng hoạt động/);
});

/* ---- Phân công ---- */

test('gán thành công: lưu kỹ thuật viên, ghi ĐÚNG MỘT dòng log MOI -> DA_PHAN_CONG kèm người thực hiện (QT-06)', async () => {
  const repo = taoRepoGia();
  const kq = await new TicketService(repo).assign(1287, 12, 3);
  assert.deepEqual([kq.status, kq.technicianId, kq.assignedBy], ['DA_PHAN_CONG', 12, 3]);
  const logs = repo.buoc.filter((b) => Array.isArray(b));
  assert.equal(logs.length, 1);
  assert.deepEqual(
    [logs[0][1].oldStatus, logs[0][1].newStatus, logs[0][1].newTechnicianId, logs[0][1].changedBy],
    ['MOI', 'DA_PHAN_CONG', 12, 3]);
});

test('phiếu đã có người hoặc không còn MOI: TICKET_ALREADY_ASSIGNED, KHÔNG ghi đè và không ghi log (QT-07)', async () => {
  for (const phieu of [{ ...phieuMoi, status: 'DA_PHAN_CONG', technicianId: 5 }, { ...phieuMoi, status: 'DA_HUY' }]) {
    const repo = taoRepoGia({ phieu });
    await assert.rejects(new TicketService(repo).assign(1287, 12), loi('TICKET_ALREADY_ASSIGNED'));
    assert.deepEqual(repo.buoc, []);
  }
});

test('kỹ thuật viên không đủ điều kiện: TECH_NOT_ELIGIBLE, phiếu giữ nguyên MOI (không có bước ghi nào)', async () => {
  const repo = taoRepoGia({ ktv: { ...ktvDu, proficiency: 2 } });
  await assert.rejects(new TicketService(repo).assign(1287, 12), loi('TECH_NOT_ELIGIBLE'));
  assert.deepEqual(repo.buoc, []);
});

test('không có phiếu hoặc không có kỹ thuật viên: 404 đúng mã lỗi', async () => {
  await assert.rejects(new TicketService(taoRepoGia({ phieu: null })).assign(9, 12), loi('TICKET_NOT_FOUND'));
  await assert.rejects(new TicketService(taoRepoGia({ ktv: null })).assign(1287, 99), loi('TECHNICIAN_NOT_FOUND'));
});

test('ghi log lỗi giữa chừng: lỗi được ném ra để giao dịch hoàn tác (luồng ngoại lệ 7a)', async () => {
  await assert.rejects(new TicketService(taoRepoGia({ loiKhiGhiLog: true })).assign(1287, 12), /mất kết nối/);
});

/* ---- Giao dịch thật của repository (kết nối giả) ---- */

function taoPoolGia() {
  const cau = [];
  const client = { query: async (s) => { cau.push(String(s).trim().split(/\s+/)[0]); return { rows: [] }; }, release: () => cau.push('release') };
  return { cau, connect: async () => client };
}

test('runInTransaction: thành công thì BEGIN, COMMIT rồi trả kết nối', async () => {
  const pool = taoPoolGia();
  assert.equal(await new TicketRepository(pool).runInTransaction(async () => 'xong'), 'xong');
  assert.deepEqual(pool.cau, ['BEGIN', 'COMMIT', 'release']);
});

test('runInTransaction: lỗi thì ROLLBACK (không COMMIT), ném lại lỗi gốc và vẫn trả kết nối', async () => {
  const pool = taoPoolGia();
  await assert.rejects(new TicketRepository(pool).runInTransaction(async () => { throw new Error('hỏng'); }), /hỏng/);
  assert.deepEqual(pool.cau, ['BEGIN', 'ROLLBACK', 'release']);
});

/* ---- Hợp đồng ---- */

test('hợp đồng kết quả phân công và danh sách đủ điều kiện (rỗng vẫn là mảng)', () => {
  const v = toAssignmentView({ ticketId: 1287, ticketCode: 'BH-001287/2026', status: 'DA_PHAN_CONG', technicianId: 12,
    assignedAt: new Date('2026-10-05T04:02:15Z'), assignedBy: 3 });
  assert.deepEqual(Object.keys(v).sort(), ['assigned_at', 'assigned_by', 'status', 'technician_id', 'ticket_code', 'ticket_id']);
  assert.equal(v.assigned_at, '2026-10-05T11:02:15+07:00');
  assert.deepEqual(toEligibleView(phieuMoi, []).technicians, []);
});
