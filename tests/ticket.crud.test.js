'use strict';
// Sửa và hủy phiếu (phần U và D của CRUD thực thể Ticket): validator, service với repository giả có giao dịch, routes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketUpdate, validateCancel } = require('../src/validators/ticket.validator');
const { TicketService } = require('../src/services/ticket.service');
const { makeHandlers } = require('../src/routes/ticket.routes');
const { AppError } = require('../src/errors/AppError');

const phieu = (o = {}) => ({ ticketId: 7, ticketCode: 'BH-000007/2026', status: 'MOI', technicianId: null, centerId: 1,
  issueCategory: 'PIN', priority: 'TRUNG_BINH', deviceName: 'iPhone 14', customerName: 'An', customerPhone: '0901234567',
  technicianName: null, receivedAt: new Date('2026-10-23T03:00:00Z'), dueDate: new Date('2026-10-26T03:00:00Z'), ...o });

/** Repository giả: lưu phiếu trong bộ nhớ, ghi lại các bước để kiểm tra log và rollback. */
function taoRepo(hienTai) {
  const st = { p: hienTai, buoc: [], logs: [] };
  const tx = {
    lockById: async () => st.p,
    updateFields: async (id, c) => { st.buoc.push('updateFields'); st.capNhat = c; st.p = { ...st.p, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)) }; },
    setStatus: async (id, s) => { st.buoc.push('setStatus'); st.p = { ...st.p, status: s }; },
    insertLog: async (l) => { st.logs.push(l); },
  };
  return Object.assign(st, { findById: async () => st.p, runInTransaction: async (fn) => fn(tx) });
}
const loi = (ma) => (e) => e instanceof AppError && e.code === ma;
const dongHo = () => new Date('2026-10-23T03:00:00Z');

/* ---- validator: luồng đúng, biên, dữ liệu sai ---- */

test('validateTicketUpdate luồng đúng: chỉ trả trường được gửi, tên máy được cắt khoảng trắng', () => {
  assert.deepEqual(validateTicketUpdate({ device_name: '  Galaxy S23 ', priority: 'CAO' }), { deviceName: 'Galaxy S23', priority: 'CAO' });
});

test('validateTicketUpdate dữ liệu sai: body rỗng, trường lạ (status), giá trị ngoài danh sách đều bị 400 và liệt kê mọi trường sai', () => {
  const sai = (b) => { try { validateTicketUpdate(b); } catch (e) { return e.fields.map((f) => f.field); } return null; };
  assert.deepEqual(sai({}), ['body']);
  assert.deepEqual(sai({ status: 'DA_HUY' }), ['status']);
  assert.deepEqual(sai({ priority: 'GAP', issue_category: 'LOA' }), ['issue_category', 'priority']);
  assert.deepEqual(sai({ device_name: '   ' }), ['device_name']);
  assert.deepEqual(sai([]), ['body']);
});

test('validateTicketUpdate biên: tên máy đúng 100 ký tự được, 101 ký tự bị từ chối', () => {
  assert.equal(validateTicketUpdate({ device_name: 'a'.repeat(100) }).deviceName.length, 100);
  assert.throws(() => validateTicketUpdate({ device_name: 'a'.repeat(101) }), /device_name/);
});

test('validateCancel: lý do tùy chọn, mặc định có sẵn, tối đa 255 ký tự', () => {
  assert.equal(validateCancel(undefined), 'Hủy theo yêu cầu');
  assert.equal(validateCancel({}), 'Hủy theo yêu cầu');
  assert.equal(validateCancel({ reason: ' Khách đổi ý ' }), 'Khách đổi ý');
  assert.equal(validateCancel({ reason: 'x'.repeat(255) }).length, 255);
  assert.throws(() => validateCancel({ reason: 'x'.repeat(256) }), /reason/);
  assert.throws(() => validateCancel({ reason: 5 }), /reason/);
});

/* ---- service ---- */

test('sửa phiếu MOI: đổi mức ưu tiên thì hạn cam kết tính lại từ lúc tiếp nhận (CAO = 24 giờ, QT-04)', async () => {
  const repo = taoRepo(phieu());
  const kq = await new TicketService(repo, dongHo).update(7, { priority: 'CAO' });
  assert.equal(kq.priority, 'CAO');
  assert.equal(repo.capNhat.dueDate.toISOString(), '2026-10-24T03:00:00.000Z');
});

test('sửa phiếu MOI: không đổi mức ưu tiên thì KHÔNG tính lại hạn cam kết', async () => {
  const repo = taoRepo(phieu());
  await new TicketService(repo, dongHo).update(7, { deviceName: 'Pixel 8' });
  assert.equal(repo.capNhat.dueDate, undefined);
  assert.equal(repo.p.deviceName, 'Pixel 8');
});

test('sửa phiếu không tồn tại: TICKET_NOT_FOUND; phiếu đã phân công: TICKET_NOT_EDITABLE và không ghi gì', async () => {
  await assert.rejects(new TicketService(taoRepo(null)).update(9, { deviceName: 'x' }), loi('TICKET_NOT_FOUND'));
  const repo = taoRepo(phieu({ status: 'DA_PHAN_CONG', technicianId: 5 }));
  await assert.rejects(new TicketService(repo).update(7, { deviceName: 'x' }), loi('TICKET_NOT_EDITABLE'));
  assert.deepEqual(repo.buoc, []);
});

test('hủy phiếu MOI: chuyển DA_HUY và ghi đúng MỘT dòng log (QT-06) kèm lý do', async () => {
  const repo = taoRepo(phieu());
  const kq = await new TicketService(repo).cancel(7, 'Khách đổi ý', 3);
  assert.equal(kq.status, 'DA_HUY');
  assert.equal(repo.logs.length, 1);
  assert.deepEqual([repo.logs[0].oldStatus, repo.logs[0].newStatus, repo.logs[0].reason, repo.logs[0].changedBy], ['MOI', 'DA_HUY', 'Khách đổi ý', 3]);
});

test('hủy phiếu DA_PHAN_CONG được và giữ kỹ thuật viên trong log; phiếu đang xử lý hoặc đã hủy thì TICKET_NOT_CANCELLABLE', async () => {
  const repo = taoRepo(phieu({ status: 'DA_PHAN_CONG', technicianId: 5 }));
  await new TicketService(repo).cancel(7, 'x');
  assert.equal(repo.logs[0].oldTechnicianId, 5);
  for (const status of ['DANG_XU_LY', 'DA_HUY', 'HOAN_TAT']) {
    const r = taoRepo(phieu({ status }));
    await assert.rejects(new TicketService(r).cancel(7, 'x'), loi('TICKET_NOT_CANCELLABLE'));
    assert.deepEqual(r.logs, []);
  }
});

/* ---- routes: mã HTTP và khung lỗi ---- */

function taoRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (m) => { res.statusCode = m; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
const chay = async (h, req) => { const res = taoRes(); await h(req, res, assert.fail); return res; };

test('PATCH và DELETE qua routes: 200 đúng, 400 dữ liệu sai, 404 không có phiếu, 409 sai trạng thái; lỗi người dùng không bao giờ 500', async () => {
  const h = makeHandlers(new TicketService(taoRepo(phieu()), dongHo));
  const ok = await chay(h.update, { params: { id: '7' }, body: { priority: 'CAO' } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.priority, 'CAO');
  assert.equal((await chay(h.update, { params: { id: '7' }, body: {} })).statusCode, 400);
  assert.equal((await chay(h.update, { params: { id: 'abc' }, body: { priority: 'CAO' } })).statusCode, 400);
  assert.equal((await chay(makeHandlers(new TicketService(taoRepo(null))).update, { params: { id: '9' }, body: { priority: 'CAO' } })).statusCode, 404);
  const huy = await chay(h.remove, { params: { id: '7' }, body: { reason: 'Khách đổi ý' } });
  assert.equal(huy.statusCode, 200);
  assert.equal(huy.body.status, 'DA_HUY');
  const lai = await chay(h.remove, { params: { id: '7' }, body: undefined });
  assert.equal(lai.statusCode, 409);
  assert.equal(lai.body.error.code, 'TICKET_NOT_CANCELLABLE');
  assert.equal((await chay(h.update, { params: { id: '7' }, body: { device_name: 'x' } })).statusCode, 409);
});
