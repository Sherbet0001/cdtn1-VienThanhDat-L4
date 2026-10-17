'use strict';
// Kiểm thử lớp nghiệp vụ Technician bằng repository GIẢ: không cần cơ sở dữ liệu, không cần máy chủ web.
const test = require('node:test');
const assert = require('node:assert/strict');
const { TechnicianService } = require('../src/services/technician.service');
const { AppError } = require('../src/errors/AppError');

/** Repository giả: chỉ trả đúng dữ liệu bài kiểm thử cần. */
function taoRepoGia({ ktv = null, soPhieu = 0 } = {}) {
  const goi = [];
  return {
    goi,
    list: async () => [],
    findById: async () => ktv,
    insert: async (d) => { goi.push('insert'); return { technicianId: 99, ...d }; },
    update: async (id, d) => { goi.push('update'); return { technicianId: id, ...d }; },
    deactivate: async (id) => { goi.push('deactivate'); return { ...ktv, technicianId: id, isActive: false }; },
    countOpenTickets: async () => soPhieu,
  };
}
const ktvDangLam = { technicianId: 7, fullName: 'Trần Hoài Giang', centerId: 4, level: 'TRUNG_CAP', isActive: true, skills: [] };
const ktvNghi = { ...ktvDangLam, isActive: false };
const dauVao = { fullName: 'Nguyễn Văn A', centerId: 2, level: 'SO_CAP', isActive: true };

/* ================= LOẠI 1: LUỒNG ĐÚNG ================= */

test('tạo kỹ thuật viên hợp lệ thì trả về bản ghi mới', async () => {
  const repo = taoRepoGia();
  const kq = await new TechnicianService(repo).create(dauVao);
  assert.equal(kq.technicianId, 99);
  assert.equal(kq.fullName, 'Nguyễn Văn A');
  assert.deepEqual(repo.goi, ['insert']);
});

test('ngừng hoạt động KTV không giữ phiếu nào thì xóa mềm được', async () => {
  const repo = taoRepoGia({ ktv: ktvDangLam, soPhieu: 0 });
  const kq = await new TechnicianService(repo).deactivate(7);
  assert.equal(kq.isActive, false);
  assert.deepEqual(repo.goi, ['deactivate']);
});

/* ================= LOẠI 2: GIÁ TRỊ BIÊN ================= */

test('biên của quy tắc: giữ 0 phiếu thì cho ngừng, giữ đúng 1 phiếu thì chặn', async () => {
  const cho = taoRepoGia({ ktv: ktvDangLam, soPhieu: 0 });
  await new TechnicianService(cho).deactivate(7);

  const chan = taoRepoGia({ ktv: ktvDangLam, soPhieu: 1 });
  await assert.rejects(
    new TechnicianService(chan).deactivate(7),
    (e) => e instanceof AppError && e.code === 'TECHNICIAN_HAS_OPEN_TICKETS' && e.chiTiet.so_phieu === 1);
  assert.deepEqual(chan.goi, [], 'bị chặn thì không được ghi gì vào cơ sở dữ liệu');
});

test('ngừng hoạt động KTV đã ngừng từ trước: không đổi gì, không kiểm tra phiếu', async () => {
  const repo = taoRepoGia({ ktv: ktvNghi, soPhieu: 5 });
  const kq = await new TechnicianService(repo).deactivate(7);
  assert.equal(kq.isActive, false);
  assert.deepEqual(repo.goi, []);
});

/* ================= LOẠI 3: DỮ LIỆU SAI / TỪ CHỐI ĐÚNG CÁCH ================= */

test('thao tác trên KTV không tồn tại thì báo TECHNICIAN_NOT_FOUND, không ném lỗi thô', async () => {
  const svc = new TechnicianService(taoRepoGia({ ktv: null }));
  for (const lamViec of [() => svc.get(404), () => svc.update(404, dauVao), () => svc.deactivate(404)]) {
    await assert.rejects(lamViec(), (e) => e instanceof AppError && e.code === 'TECHNICIAN_NOT_FOUND');
  }
});

test('sửa KTV đang giữ phiếu sang ngừng hoạt động thì bị chặn; sửa tên thì vẫn được', async () => {
  const repo = taoRepoGia({ ktv: ktvDangLam, soPhieu: 3 });
  const svc = new TechnicianService(repo);
  await assert.rejects(
    svc.update(7, { ...dauVao, isActive: false }),
    (e) => e.code === 'TECHNICIAN_HAS_OPEN_TICKETS');
  const kq = await svc.update(7, { ...dauVao, isActive: true, fullName: 'Tên mới' });
  assert.equal(kq.fullName, 'Tên mới');
});
