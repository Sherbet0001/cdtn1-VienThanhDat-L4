'use strict';
/**
 * Kiểm thử chèn mã (checklist bảo mật mục 2, OWASP A05 Injection). Không cần CSDL.
 * Mỗi ca đưa chuỗi tấn công vào đúng cổng vào của API và khẳng định: bị validator từ chối (400, VALIDATION_ERROR)
 * VÀ lớp nghiệp vụ/CSDL KHÔNG bao giờ được gọi. Nếu ai đó bỏ validator, dịch vụ giả sẽ ném lỗi và test thất bại.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const technicianRoutes = require('../src/routes/technician.routes');
const ticketRoutes = require('../src/routes/ticket.routes');

const CHUOI_TAN_CONG = "' OR '1'='1";

/** Dịch vụ giả: bất kỳ lời gọi nào cũng làm test thất bại (dữ liệu độc không được phép tới đây). */
const dichVuCam = new Proxy({}, {
  get: (_, ten) => () => { throw new Error(`dịch vụ "${String(ten)}" bị gọi với dữ liệu tấn công`); },
});

function gia(req) {
  const res = { statusCode: 200, body: null,
    status(m) { this.statusCode = m; return this; }, json(b) { this.body = b; return this; },
    location() { return this; } };
  return { req: { query: {}, params: {}, body: undefined, ...req }, res };
}

async function chay(handler, req) {
  const { req: r, res } = gia(req);
  let loiLa = null;
  await handler(r, res, (e) => { loiLa = e; });
  assert.equal(loiLa, null, 'không được có lỗi hệ thống (500) khi gặp dữ liệu tấn công');
  return res;
}

const ktv = technicianRoutes.makeHandlers(dichVuCam);
const phieu = ticketRoutes.makeHandlers(dichVuCam);

function khang400(res, truong) {
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.error.field, truong);
}

test('SEC-01 chèn SQL qua customer_phone khi tiếp nhận phiếu -> 400, không chạm nghiệp vụ', async () => {
  const res = await chay(phieu.create, { body: {
    customer_name: 'A', customer_phone: CHUOI_TAN_CONG, device_name: 'B', issue_category: 'PIN', center_id: 5 } });
  khang400(res, 'customer_phone');
});

test('SEC-02 chèn SQL qua center_id trong danh sách kỹ thuật viên -> 400', async () => {
  khang400(await chay(ktv.list, { query: { center_id: "1' OR '1'='1" } }), 'center_id');
});

test('SEC-03 chèn SQL qua center_id trong danh sách phiếu chưa phân công -> 400', async () => {
  khang400(await chay(phieu.unassigned, { query: { center_id: "1' OR '1'='1" } }), 'center_id');
});

test('SEC-04 chèn SQL qua mã phiếu và mã kỹ thuật viên trong đường dẫn -> 400', async () => {
  khang400(await chay(phieu.get, { params: { id: '1 OR 1=1' } }), 'id');
  khang400(await chay(ktv.get, { params: { id: '1; DROP TABLE ticket;--' } }), 'id');
});

test('SEC-05 technician_id không phải số nguyên khi phân công -> 400', async () => {
  const res = await chay(phieu.assign, { params: { id: '1' }, body: { technician_id: '1 OR 1=1' } });
  khang400(res, 'technician_id');
});

test('SEC-06 tham số phân trang chứa mã độc (limit, page, offset) -> 400', async () => {
  khang400(await chay(phieu.unassigned, { query: { limit: '1; DELETE FROM ticket' } }), 'limit');
  khang400(await chay(phieu.unassigned, { query: { page: "1' --" } }), 'page');
  khang400(await chay(ktv.list, { query: { offset: '0 UNION SELECT 1' } }), 'offset');
});
