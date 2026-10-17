'use strict';
// Kiểm thử lớp routes bằng req/res GIẢ và service giả: không cần Express, máy chủ web hay cơ sở dữ liệu.
const test = require('node:test');
const assert = require('node:assert/strict');
const technicianRoutes = require('../src/routes/technician.routes');
const { AppError } = require('../src/errors/AppError');

const { makeHandlers } = technicianRoutes;

/** res giả ghi lại mã trạng thái, header và nội dung JSON được gửi đi. */
function taoRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.status = (ma) => { res.statusCode = ma; return res; };
  res.location = (v) => { res.headers.Location = v; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

const ktv = { technicianId: 7, fullName: 'Trần Hoài Giang', centerId: 4, level: 'TRUNG_CAP', isActive: true };

test('POST hợp lệ: trả 201, header Location và trường snake_case', async () => {
  const h = makeHandlers({ create: async (d) => ({ technicianId: 99, ...d }) });
  const res = taoRes();
  await h.create({ body: { full_name: 'Nguyễn Thị Mai', center_id: 2, level: 'TRUNG_CAP' } }, res, assert.fail);
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers.Location, '/api/technicians/99');
  assert.deepEqual(res.body,
    { technician_id: 99, full_name: 'Nguyễn Thị Mai', center_id: 2, level: 'TRUNG_CAP', is_active: true });
});

test('GET danh sách: limit mặc định 20, trả items và không có trường camelCase', async () => {
  let boLoc;
  const h = makeHandlers({ list: async (b) => { boLoc = b; return [ktv]; } });
  const res = taoRes();
  await h.list({ query: {} }, res, assert.fail);
  assert.equal(boLoc.limit, 20);
  assert.equal(res.body.items[0].technician_id, 7);
  assert.equal(res.body.items[0].technicianId, undefined);
});

test('POST thiếu trường bắt buộc: trả 400, error.field là trường đầu tiên thiếu, không gọi service', async () => {
  const h = makeHandlers({ create: async () => assert.fail('không được gọi service') });
  const res = taoRes();
  await h.create({ body: {} }, res, assert.fail);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.error.field, 'full_name');
  assert.deepEqual(res.body.error.details.cac_truong.map((x) => x.truong), ['full_name', 'center_id', 'level']);
});

test('mã trong đường dẫn không hợp lệ ("abc"): trả 400, không chạm service', async () => {
  const h = makeHandlers({ get: async () => assert.fail('không được gọi service') });
  const res = taoRes();
  await h.get({ params: { id: 'abc' } }, res, assert.fail);
  assert.equal(res.statusCode, 400);
});

test('lỗi nghiệp vụ được dịch sang mã HTTP: không tồn tại -> 404, đang giữ phiếu -> 409', async () => {
  const h = makeHandlers({
    get: async () => { throw new AppError('TECHNICIAN_NOT_FOUND', 'không có', undefined, 'technician_id'); },
    deactivate: async () => {
      throw new AppError('TECHNICIAN_HAS_OPEN_TICKETS', 'đang giữ 2 phiếu', { so_phieu: 2 }, 'is_active');
    },
  });
  const r404 = taoRes();
  await h.get({ params: { id: '404' } }, r404, assert.fail);
  assert.equal(r404.statusCode, 404);
  assert.equal(r404.body.error.code, 'TECHNICIAN_NOT_FOUND');

  const r409 = taoRes();
  await h.remove({ params: { id: '7' } }, r409, assert.fail);
  assert.equal(r409.statusCode, 409);
  assert.deepEqual(r409.body.error.details, { so_phieu: 2 });
});

test('lỗi lạ (không có mã đã biết) được chuyển cho bộ xử lý lỗi cuối, không tự trả lỗi thô', async () => {
  const h = makeHandlers({ get: async () => { throw new Error('mất kết nối'); } });
  const res = taoRes();
  let daChuyen = null;
  await h.get({ params: { id: '7' } }, res, (e) => { daChuyen = e; });
  assert.equal(daChuyen.message, 'mất kết nối');
  assert.equal(res.body, undefined);
});
