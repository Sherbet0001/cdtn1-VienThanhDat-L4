'use strict';
/**
 * Gọi lần lượt MỌI endpoint của API đang chạy và ghi yêu cầu + phản hồi THẬT vào docs/api-vi-du-chay-that.md.
 * Dùng để lấy ví dụ cho docs/api.md (không viết tay). Không cần thư viện ngoài (Node >= 20, có sẵn fetch).
 * Chạy:  node scripts/sinh-vi-du-api.js            (mặc định http://localhost:3000)
 *        node scripts/sinh-vi-du-api.js http://localhost:3001
 * Script đăng nhập bằng tài khoản mẫu `admin` (xem seeds/005_app_users.sql); đổi mật khẩu bằng biến môi trường MAT_KHAU_MAU.
 * LƯU Ý: script tạo và đổi dữ liệu thử (1 KTV, 1 phiếu, 1 phân công). Sau khi chạy nên đặt lại:
 *        docker compose down -v && docker compose up -d --build
 */
const fs = require('node:fs');
const path = require('node:path');

const GOC = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const RA = path.join(__dirname, '..', 'docs', 'api-vi-du-chay-that.md');
const nhat = [];
let dem = 0;
let token = null;   // token đăng nhập; mọi lệnh gọi sau khi đăng nhập đều kèm Authorization: Bearer
const che = (b) => (b && typeof b === 'object' && b.token ? { ...b, token: b.token.slice(0, 20) + '…(rút gọn)' } : b);

/** Gọi API, ghi nhật ký, trả { status, body }. `dungToken` = false để gọi KHÔNG kèm token (thử 401), hoặc chuỗi token khác. */
async function goi(tieuDe, phuongThuc, duong, body, dungToken = true) {
  const tuyChon = { method: phuongThuc, headers: {} };
  const tokenDung = dungToken === true ? token : dungToken;
  if (tokenDung) tuyChon.headers.Authorization = `Bearer ${tokenDung}`;
  if (body !== undefined) {
    tuyChon.headers['Content-Type'] = 'application/json';
    tuyChon.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const r = await fetch(GOC + duong, tuyChon);
  const chu = await r.text();
  let json = null;
  try { json = JSON.parse(chu); } catch { /* không phải JSON */ }
  dem += 1;
  nhat.push([
    `### ${dem}. ${tieuDe}`, '',
    '```http', `${phuongThuc} ${duong}`,
    ...(tokenDung ? ['Authorization: Bearer <token>'] : []),
    ...(body !== undefined ? ['Content-Type: application/json', '', typeof body === 'string' ? body : JSON.stringify(body, null, 2)] : []),
    '```', '',
    `Phản hồi: **${r.status}**`, '',
    '```json', json ? JSON.stringify(che(json), null, 2) : chu, '```', '',
  ].join('\n'));
  console.log(`${String(dem).padStart(2)}. ${r.status} ${phuongThuc} ${duong}`);
  return { status: r.status, body: json };
}

(async () => {
  await goi('Kiểm tra sức khỏe (công khai)', 'GET', '/health');

  // ---- Đăng nhập và các lỗi truy cập ----
  const MK = process.env.MAT_KHAU_MAU || 'Mekong@2026';   // mật khẩu của tài khoản mẫu trong seeds/005_app_users.sql (dữ liệu mẫu, không phải bí mật)
  await goi('Lỗi: gọi API khi chưa đăng nhập', 'GET', '/api/technicians?limit=1', undefined, false);
  await goi('Lỗi: đăng nhập sai mật khẩu', 'POST', '/api/auth/login', { username: 'admin', password: 'sai-mat-khau' }, false);
  await goi('Lỗi: đăng nhập tên không tồn tại (cùng thông điệp với sai mật khẩu)', 'POST', '/api/auth/login', { username: 'khong_co_ai', password: 'sai-mat-khau' }, false);
  const dn = await goi('Đăng nhập (quản trị)', 'POST', '/api/auth/login', { username: 'admin', password: MK }, false);
  token = dn.body.token;
  const dnQl = await fetch(GOC + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'quanly_tt1', password: MK }) });
  const tokenQl = (await dnQl.json()).token;
  await goi('Lỗi: quản lý trung tâm 1 xem kỹ thuật viên của trung tâm 2 (403)', 'GET', '/api/technicians?center_id=2', undefined, tokenQl);

  // ---- Kỹ thuật viên ----
  const dsKtv = await goi('Danh sách kỹ thuật viên (lọc theo trung tâm, phân trang)', 'GET', '/api/technicians?limit=2');
  if (!dsKtv.body || !dsKtv.body.items) throw new Error('Không lấy được danh sách: kiểm tra đã nạp seeds/005 và mật khẩu mẫu (biến MAT_KHAU_MAU).');
  const ktv1 = dsKtv.body.items[0];
  await goi('Chi tiết một kỹ thuật viên (kèm kỹ năng)', 'GET', `/api/technicians/${ktv1.technician_id}`);
  const moi = await goi('Tạo kỹ thuật viên', 'POST', '/api/technicians',
    { full_name: 'Nguyễn Văn Thử Nghiệm', center_id: ktv1.center_id, level: 'TRUNG_CAP' });
  const idMoi = moi.body.technician_id;
  await goi('Sửa toàn bộ kỹ thuật viên (PUT)', 'PUT', `/api/technicians/${idMoi}`,
    { full_name: 'Nguyễn Văn Thử Nghiệm', center_id: ktv1.center_id, level: 'CAO_CAP', is_active: true });
  await goi('Ngừng hoạt động kỹ thuật viên (xóa mềm)', 'DELETE', `/api/technicians/${idMoi}`);
  await goi('Lỗi: tạo kỹ thuật viên sai dữ liệu', 'POST', '/api/technicians', { full_name: '', level: 'GIOI' });
  await goi('Lỗi: kỹ thuật viên không tồn tại', 'GET', '/api/technicians/999999999');

  // ---- Phiếu ----
  const ds = await goi('Danh sách phiếu chưa phân công', 'GET', '/api/tickets/unassigned?limit=2');
  const phieu = ds.body.items[0];
  await goi('Chi tiết một phiếu', 'GET', `/api/tickets/${phieu.ticket_id}`);
  const dk = await goi('Kỹ thuật viên đủ điều kiện của phiếu', 'GET', `/api/tickets/${phieu.ticket_id}/eligible-technicians`);
  const duDk = dk.body.technicians || [];

  // KTV KHÔNG đủ điều kiện (lấy từ danh sách lớn, loại những người đủ điều kiện)
  const tatCa = await goi('Danh sách kỹ thuật viên (tối đa 100, để chọn người không đủ điều kiện)', 'GET', '/api/technicians?limit=100');
  const khongDu = tatCa.body.items.find((k) => !duDk.some((d) => d.technician_id === k.technician_id));
  if (khongDu) {
    await goi('Lỗi: phân công kỹ thuật viên không đủ điều kiện', 'POST', `/api/tickets/${phieu.ticket_id}/assignment`, { technician_id: khongDu.technician_id });
  }
  await goi('Lỗi: phân công thiếu technician_id', 'POST', `/api/tickets/${phieu.ticket_id}/assignment`, {});

  if (duDk.length > 0) {
    const chon = duDk[0].technician_id;
    await goi('Phân công kỹ thuật viên cho phiếu', 'POST', `/api/tickets/${phieu.ticket_id}/assignment`, { technician_id: chon });
    await goi('Lỗi: phân công lần hai cho phiếu đã có người', 'POST', `/api/tickets/${phieu.ticket_id}/assignment`, { technician_id: chon });
    await goi('Lỗi: ngừng hoạt động kỹ thuật viên còn phiếu mở', 'DELETE', `/api/technicians/${chon}`);
  }

  const tao = await goi('Tiếp nhận phiếu mới', 'POST', '/api/tickets', {
    customer_name: 'Khách Thử Nghiệm', customer_phone: '0900000001', device_name: 'Điện thoại thử nghiệm',
    issue_category: 'PIN', center_id: phieu.center_id });
  const idPhieu = tao.body.ticket_id;
  await goi('Sửa phiếu chưa phân công (PATCH)', 'PATCH', `/api/tickets/${idPhieu}`, { priority: 'CAO', device_name: 'Điện thoại thử nghiệm (đã sửa)' });
  await goi('Hủy phiếu (xóa mềm)', 'DELETE', `/api/tickets/${idPhieu}`, { reason: 'Khách đổi ý' });
  await goi('Lỗi: phiếu không tồn tại', 'GET', '/api/tickets/999999999');
  await goi('Lỗi: tiếp nhận phiếu thiếu dữ liệu', 'POST', '/api/tickets', {});
  await goi('Lỗi: JSON không hợp lệ', 'POST', '/api/tickets', '{bad json');

  // ---- Thử tấn công chèn mã (mục 2 của checklist bảo mật) ----
  await goi('Chèn SQL qua số điện thoại', 'POST', '/api/tickets', {
    customer_name: 'A', customer_phone: "' OR '1'='1", device_name: 'B', issue_category: 'PIN', center_id: phieu.center_id });
  await goi('Chèn SQL qua tham số center_id (kỹ thuật viên)', 'GET', "/api/technicians?center_id=" + encodeURIComponent("1' OR '1'='1"));
  await goi('Chèn SQL qua tham số center_id (phiếu)', 'GET', "/api/tickets/unassigned?center_id=" + encodeURIComponent("1' OR '1'='1"));
  await goi('Chèn SQL qua mã trong đường dẫn', 'GET', '/api/tickets/' + encodeURIComponent("1 OR 1=1"));

  const dau = [`# Ví dụ API chạy thật`, '',
    `Sinh tự động bởi \`scripts/sinh-vi-du-api.js\` ngày ${new Date().toISOString()} trên ${GOC}. Mọi phản hồi dưới đây là kết quả thật, không viết tay.`, ''];
  fs.writeFileSync(RA, dau.concat(nhat).join('\n'), 'utf8');
  console.log(`\nĐã ghi ${dem} ví dụ vào docs/api-vi-du-chay-that.md`);
})().catch((e) => { console.error('Lỗi khi chạy:', e.message); process.exit(1); });
