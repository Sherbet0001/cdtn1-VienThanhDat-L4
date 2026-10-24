// Màn hình 2: chi tiết phiếu + kỹ thuật viên đủ điều kiện + xác nhận phân công (UC3, FR2–FR4).
import { ApiError } from '../api/client.js';
import { assign, getTicket, listEligible } from '../api/tickets.api.js';
import { hienThiDuLieu } from '../components/DataState.js';
import { h } from '../components/dom.js';
import { NHAN_CAP, NHAN_NHOM_LOI, NHAN_TRANG_THAI, NHAN_UU_TIEN, daQuaHan, ngayGio, nhan } from '../lib/dinhDang.js';

const dong = (ten, giaTri) => [h('dt', {}, ten), h('dd', {}, giaTri)];

/** Bước 3 của UC3: chỉ phiếu MOI mới cần lấy danh sách kỹ thuật viên; phiếu khác chỉ xem. */
async function taiChiTiet(id) {
  const phieu = await getTicket(id);
  const dsKtv = phieu.status === 'MOI' ? await listEligible(id) : null;
  return { phieu, dsKtv };
}

export function trangChiTiet(goc, id) {
  const ketQua = h('div');
  let thongBao = null;          // kết quả lần phân công trước, hiện ở đầu bản vẽ kế tiếp

  const ve = ({ phieu, dsKtv }, el, taiLai) => {
    const thongTin = h('dl', { class: 'chi-tiet' },
      ...dong('Mã phiếu', phieu.ticket_code),
      ...dong('Trạng thái', nhan(NHAN_TRANG_THAI, phieu.status)),
      ...dong('Khách hàng', `${phieu.customer_name} · ${phieu.customer_phone}`),
      ...dong('Thiết bị', phieu.device_name),
      ...dong('Nhóm sự cố', nhan(NHAN_NHOM_LOI, phieu.issue_category)),
      ...dong('Ưu tiên', nhan(NHAN_UU_TIEN, phieu.priority)),
      ...dong('Hạn cam kết', `${ngayGio(phieu.due_date)}${daQuaHan(phieu.due_date) && phieu.status === 'MOI' ? ' (quá hạn)' : ''}`),
      ...dong('Kỹ thuật viên', phieu.technician_name ? `${phieu.technician_name} (mã ${phieu.technician_id})` : 'Chưa phân công'));
    if (thongBao) el.append(h('p', { class: `thong-bao ${thongBao.loai}`, role: 'status' }, thongBao.noiDung));
    el.append(thongTin);
    thongBao = null;

    if (!dsKtv) {                                         // phiếu không còn MOI: chỉ xem
      el.append(h('p', { class: 'trang-thai' }, 'Phiếu này không còn ở trạng thái Mới nên không phân công ở đây.'));
      return;
    }
    if (dsKtv.technicians.length === 0) {                 // luồng ngoại lệ 3a
      el.append(h('p', { class: 'trang-thai' },
        'Không có kỹ thuật viên phù hợp (cùng trung tâm, đang hoạt động, thành thạo từ 3 với nhóm sự cố này). Phiếu giữ nguyên trạng thái Mới; hãy xử lý ngoài hệ thống.'));
      return;
    }

    const nutXacNhan = h('button', { type: 'button', id: 'xac-nhan', disabled: true }, 'Xác nhận phân công');
    const loi = h('p', { class: 'thong-bao loi', role: 'alert', hidden: true });
    const dong_ = (k) => h('tr', {},
      h('td', {}, h('input', { type: 'radio', name: 'ktv', value: String(k.technician_id), 'aria-label': `Chọn ${k.full_name}`,
        onchange: () => { nutXacNhan.disabled = false; } })),
      h('td', {}, k.full_name), h('td', {}, nhan(NHAN_CAP, k.level)), h('td', {}, String(k.proficiency)), h('td', {}, String(k.open_tickets)));
    nutXacNhan.addEventListener('click', async () => {
      const chon = el.querySelector('input[name="ktv"]:checked');
      if (!chon) return;
      nutXacNhan.disabled = true;                         // chống bấm hai lần
      loi.hidden = true;
      try {
        const kq = await assign(id, Number(chon.value));
        thongBao = { loai: 'thanh-cong', noiDung: `Đã phân công phiếu ${kq.ticket_code} cho kỹ thuật viên mã ${kq.technician_id}.` };
        await taiLai();
      } catch (e) {
        if (e instanceof ApiError && e.code === 'TICKET_ALREADY_ASSIGNED') {   // luồng ngoại lệ 6a: tải lại, hiện người đang phụ trách
          thongBao = { loai: 'loi', noiDung: e.message };
          await taiLai();
          return;
        }
        loi.textContent = e instanceof ApiError && e.message && !e.network
          ? e.message : 'Chưa phân công được. Kiểm tra kết nối rồi bấm Xác nhận phân công lần nữa.';
        loi.hidden = false;
        nutXacNhan.disabled = false;
      }
    });
    el.append(
      h('h2', {}, 'Kỹ thuật viên đủ điều kiện (ít phiếu đang giữ nhất ở trên)'),
      h('table', {}, h('thead', {}, h('tr', {}, ...['', 'Họ tên', 'Cấp bậc', 'Thành thạo', 'Đang giữ'].map((t) => h('th', {}, t)))),
        h('tbody', {}, ...dsKtv.technicians.map(dong_))),
      loi, nutXacNhan);
  };

  goc.replaceChildren(h('p', {}, h('a', { href: '#/' }, '‹ Về danh sách phiếu')), h('h1', {}, 'Chi tiết phiếu'), ketQua);
  hienThiDuLieu(ketQua, { tai: () => taiChiTiet(id), laRong: () => false, ve });
}
