'use strict';
// Tích hợp TĂNG DẦN hai mối nối liền kề: routes -> service -> repository thật, chỉ thay CSDL bằng db giả (stub).
// Db giả trả dòng ĐÚNG HÌNH DẠNG của pg (BIGINT là chuỗi), nên bắt được lỗi hợp đồng giữa repository và routes.
const test = require('node:test');
const assert = require('node:assert/strict');
const TechnicianRepository = require('../src/repositories/technician.repository');
const { TechnicianService } = require('../src/services/technician.service');
const { makeHandlers } = require('../src/routes/technician.routes');

const dong = (o = {}) => ({ technician_id: '7', full_name: 'Trần Hoài Giang', center_id: 4, level: 'TRUNG_CAP', is_active: true, ...o });

/** db giả phân biệt câu SQL theo từ khóa; ghi lại các câu đã chạy. */
function taoDb({ ktv = dong(), soPhieu = 0, skills = [] } = {}) {
  const daChay = [];
  return {
    daChay,
    query: async (sql) => {
      daChay.push(sql.replace(/\s+/g, ' ').trim().split(' ')[0]);
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ so_phieu: soPhieu }] };
      if (/FROM technician_skill/.test(sql)) return { rows: skills };
      if (/^\s*UPDATE/.test(sql)) return { rows: ktv ? [{ ...ktv, is_active: false }] : [] };
      if (/^\s*INSERT/.test(sql)) return { rows: [dong({ technician_id: '99' })] };
      return { rows: ktv ? [ktv] : [] };
    },
  };
}

function taoRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.status = (ma) => { res.statusCode = ma; return res; };
  res.location = (v) => { res.headers.Location = v; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
const noiTu = (db) => makeHandlers(new TechnicianService(new TechnicianRepository(db)));

test('GET chi tiết xuyên ba lớp: BIGINT dạng chuỗi ra JSON là số, có skills snake_case', async () => {
  const h = noiTu(taoDb({ skills: [{ issue_category: 'MAN_HINH', proficiency: 4 }] }));
  const res = taoRes();
  await h.get({ params: { id: '7' } }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.strictEqual(res.body.technician_id, 7);
  assert.deepEqual(res.body.skills, [{ issue_category: 'MAN_HINH', proficiency: 4 }]);
});

test('POST xuyên ba lớp: trả 201, Location và mã mới là số', async () => {
  const h = noiTu(taoDb());
  const res = taoRes();
  await h.create({ body: { full_name: 'Nguyễn Thị Mai', center_id: 2, level: 'SO_CAP' } }, res, assert.fail);
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers.Location, '/api/technicians/99');
  assert.strictEqual(res.body.technician_id, 99);
});

test('DELETE khi còn phiếu mở: 409 TECHNICIAN_HAS_OPEN_TICKETS và KHÔNG chạy câu UPDATE', async () => {
  const db = taoDb({ soPhieu: 2 });
  const res = taoRes();
  await noiTu(db).remove({ params: { id: '7' } }, res, assert.fail);
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body.error.details, { so_phieu: 2 });
  assert.equal(db.daChay.includes('UPDATE'), false);
});

test('DELETE khi không còn phiếu: xóa mềm, trả is_active = false', async () => {
  const res = taoRes();
  await noiTu(taoDb()).remove({ params: { id: '7' } }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.is_active, false);
});

test('PUT chuyển sang ngừng hoạt động cũng bị chặn khi còn phiếu mở (không có cửa hậu)', async () => {
  const res = taoRes();
  await noiTu(taoDb({ soPhieu: 1 })).update(
    { params: { id: '7' }, body: { full_name: 'Trần Hoài Giang', center_id: 4, level: 'TRUNG_CAP', is_active: false } },
    res, assert.fail);
  assert.equal(res.statusCode, 409);
});

test('mọi lỗi của NGƯỜI DÙNG trả 4xx, không bao giờ rơi vào bộ xử lý lỗi 500', async () => {
  const h = noiTu(taoDb({ ktv: null }));
  const catChuyen = () => assert.fail('lỗi người dùng không được chuyển thành 500');
  const ca = [
    [h.get, { params: { id: 'abc' } }, 400],
    [h.get, { params: { id: '123' } }, 404],
    [h.get, { params: { id: '99999999999999999999' } }, 400],
    [h.list, { query: { limit: '0' } }, 400],
    [h.list, { query: { is_active: 'yes' } }, 400],
    [h.create, { body: null }, 400],
    [h.create, { body: [] }, 400],
    [h.create, { body: { full_name: 'A'.repeat(101), center_id: 1, level: 'SO_CAP' } }, 400],
    [h.update, { params: { id: '123' }, body: { full_name: 'A', center_id: 1, level: 'SO_CAP' } }, 404],
    [h.remove, { params: { id: '123' } }, 404],
  ];
  for (const [ham, req, mong] of ca) {
    const res = taoRes();
    await ham(req, res, catChuyen);
    assert.equal(res.statusCode, mong, JSON.stringify(req));
    assert.ok(res.body.error.code && res.body.error.message);
  }
});

test('lỗi hệ thống (CSDL mất kết nối) được chuyển đi, không lộ nội dung lỗi trong phản hồi', async () => {
  const h = noiTu({ query: async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:5432'); } });
  const res = taoRes();
  let loi;
  await h.get({ params: { id: '7' } }, res, (e) => { loi = e; });
  assert.ok(loi);
  assert.equal(res.body, undefined);
});
