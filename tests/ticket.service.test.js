'use strict';
// Kiểm thử lớp nghiệp vụ Phiếu bằng repository GIẢ và đồng hồ GIẢ: kết quả không phụ thuộc giờ chạy test.
const test = require('node:test');
const assert = require('node:assert/strict');
const { TicketService } = require('../src/services/ticket.service');
const { AppError } = require('../src/errors/AppError');

const THU_SAU = new Date('2026-10-23T10:00:00+07:00');

function taoRepoGia({ phieu = null } = {}) {
  const goi = [];
  return {
    goi,
    listUnassigned: async (p) => { goi.push(['list', p]); return { items: [], total: 0 }; },
    findById: async (id) => (phieu ? { ...phieu, ticketId: id } : null),
    insert: async (d) => { goi.push(['insert', d]); return 99; },
  };
}
const dauVao = { customerName: 'Nguyễn Văn An', customerPhone: '0901234567', deviceName: 'iPhone 14',
  issueCategory: 'MAN_HINH', priority: null, centerId: 2 };

test('tạo phiếu: ưu tiên mặc định theo nhóm sự cố và hạn cam kết theo QT-04 (MAN_HINH -> CAO -> +24h)', async () => {
  const repo = taoRepoGia({ phieu: { status: 'MOI' } });
  await new TicketService(repo, () => THU_SAU).create(dauVao);
  const [, d] = repo.goi.find((g) => g[0] === 'insert');
  assert.equal(d.priority, 'CAO');
  assert.equal(d.dueDate.toISOString(), new Date('2026-10-24T10:00:00+07:00').toISOString());
  assert.equal(d.receivedAt, THU_SAU);
});

test('tạo phiếu: ưu tiên người dùng chọn được giữ nguyên, không bị ghi đè bằng mặc định', async () => {
  const repo = taoRepoGia({ phieu: { status: 'MOI' } });
  await new TicketService(repo, () => THU_SAU).create({ ...dauVao, priority: 'THAP' });
  assert.equal(repo.goi.find((g) => g[0] === 'insert')[1].priority, 'THAP');
});

test('danh sách chưa phân công: trang 3, limit 20 -> bỏ qua 40 dòng, trả kèm page/limit/total', async () => {
  const repo = taoRepoGia();
  const kq = await new TicketService(repo).listUnassigned({ page: 3, limit: 20, centerId: 4 });
  assert.deepEqual(repo.goi[0][1], { centerId: 4, limit: 20, offset: 40 });
  assert.deepEqual([kq.page, kq.limit, kq.total, kq.items], [3, 20, 0, []]);
});

test('lấy phiếu không tồn tại: ném TICKET_NOT_FOUND kèm field ticket_id', async () => {
  await assert.rejects(new TicketService(taoRepoGia()).get(5),
    (e) => e instanceof AppError && e.code === 'TICKET_NOT_FOUND' && e.field === 'ticket_id');
});
