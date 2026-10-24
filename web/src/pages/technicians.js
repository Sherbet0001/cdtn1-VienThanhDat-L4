// Màn hình bổ sung: danh sách kỹ thuật viên (buổi 8–9), có phân trang.
import { listTechnicians } from '../api/technicians.api.js';
import { hienThiDuLieu } from '../components/DataState.js';
import { h } from '../components/dom.js';
import { NHAN_CAP, nhan } from '../lib/dinhDang.js';

const SO_DONG = 20;

export function trangKyThuatVien(goc) {
  let offset = 0;
  let trangThai = 'true';
  const ketQua = h('div');

  const tai = () => hienThiDuLieu(ketQua, {
    tai: () => listTechnicians({ is_active: trangThai, limit: SO_DONG, offset }),
    laRong: (kq) => kq.items.length === 0,
    thongBaoRong: () => (trangThai
      ? 'Không có kỹ thuật viên nào khớp bộ lọc. Thử chọn "Tất cả" để xem cả người đã nghỉ.'
      : 'Chưa có kỹ thuật viên nào. Chạy npm run seed để nạp dữ liệu mẫu.'),
    ve: (kq, el, taiLai) => el.append(
      h('table', {},
        h('thead', {}, h('tr', {}, ...['Mã', 'Họ tên', 'Trung tâm', 'Cấp', 'Trạng thái'].map((t) => h('th', {}, t)))),
        h('tbody', {}, ...kq.items.map((k) => h('tr', {},
          h('td', {}, String(k.technician_id)), h('td', {}, k.full_name), h('td', {}, `Trung tâm ${k.center_id}`),
          h('td', {}, nhan(NHAN_CAP, k.level)), h('td', {}, k.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'))))),
      h('p', { class: 'phan-trang' },
        h('button', { type: 'button', disabled: offset === 0, onclick: () => { offset -= SO_DONG; taiLai(); } }, '‹ Trước'),
        ` Dòng ${offset + 1}–${offset + kq.items.length} `,
        h('button', { type: 'button', disabled: kq.items.length < SO_DONG, onclick: () => { offset += SO_DONG; taiLai(); } }, 'Sau ›'))),
  });

  goc.replaceChildren(
    h('h1', {}, 'Kỹ thuật viên'),
    h('p', {}, 'Câu hỏi màn hình này trả lời: ', h('strong', {}, 'trung tâm nào đang có những kỹ thuật viên nào có thể nhận phiếu?')),
    h('label', {}, 'Trạng thái ',
      h('select', { id: 'loc', onchange: (e) => { trangThai = e.target.value; offset = 0; tai(); } },
        h('option', { value: '' }, 'Tất cả'),
        h('option', { value: 'true', selected: true }, 'Đang hoạt động'),
        h('option', { value: 'false' }, 'Ngừng hoạt động'))),
    ketQua);
  tai();
}
