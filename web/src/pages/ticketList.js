// Màn hình 1: danh sách phiếu chưa phân công (UC1, FR1). Bấm mã phiếu để sang màn chi tiết và phân công.
import { listUnassigned } from '../api/tickets.api.js';
import { hienThiDuLieu } from '../components/DataState.js';
import { h } from '../components/dom.js';
import { NHAN_NHOM_LOI, NHAN_UU_TIEN, daQuaHan, ngayGio, nhan } from '../lib/dinhDang.js';

const SO_DONG = 10;
const CAC_COT = ['Mã phiếu', 'Khách hàng', 'Thiết bị', 'Nhóm sự cố', 'Ưu tiên', 'Hạn cam kết'];

/** Một dòng bảng; hạn cam kết đã qua thì ghi "quá hạn" bằng chữ (không chỉ bằng màu). */
function dongPhieu(p) {
  return h('tr', {},
    h('td', {}, h('a', { href: `#/tickets/${p.ticket_id}` }, p.ticket_code)),
    h('td', {}, p.customer_name),
    h('td', {}, p.device_name),
    h('td', {}, nhan(NHAN_NHOM_LOI, p.issue_category)),
    h('td', {}, h('span', { class: `uu-tien ${p.priority.toLowerCase()}` }, nhan(NHAN_UU_TIEN, p.priority))),
    h('td', {}, ngayGio(p.due_date), daQuaHan(p.due_date) ? h('span', { class: 'qua-han' }, ' · quá hạn') : null));
}

export function trangDanhSach(goc) {
  let trang = 1;
  let trungTam = '';
  const ketQua = h('div');

  const tai = () => hienThiDuLieu(ketQua, {
    tai: () => listUnassigned({ page: trang, limit: SO_DONG, center_id: trungTam }),
    laRong: (kq) => kq.items.length === 0,
    thongBaoRong: () => (trungTam
      ? `Không có phiếu chưa phân công nào ở trung tâm ${trungTam}. Thử chọn "Tất cả trung tâm".`
      : 'Không có phiếu nào đang chờ phân công. Phiếu mới sẽ xuất hiện sau khi tiếp nhận.'),
    ve: (kq, el, taiLai) => {
      const tongTrang = Math.max(1, Math.ceil(kq.total / kq.limit));
      el.append(
        h('table', {}, h('thead', {}, h('tr', {}, ...CAC_COT.map((t) => h('th', {}, t)))), h('tbody', {}, ...kq.items.map(dongPhieu))),
        h('p', { class: 'phan-trang' },
          h('button', { type: 'button', disabled: kq.page <= 1, onclick: () => { trang -= 1; taiLai(); } }, '‹ Trước'),
          ` Trang ${kq.page}/${tongTrang} · ${kq.total} phiếu `,
          h('button', { type: 'button', disabled: kq.page >= tongTrang, onclick: () => { trang += 1; taiLai(); } }, 'Sau ›')));
    },
  });

  goc.replaceChildren(
    h('h1', {}, 'Phiếu chưa phân công'),
    h('p', {}, 'Câu hỏi màn hình này trả lời: ', h('strong', {}, 'phiếu nào đang chờ giao cho kỹ thuật viên, hạn cam kết ra sao?')),
    h('label', {}, 'Trung tâm ',
      h('select', { id: 'loc-trung-tam', onchange: (e) => { trungTam = e.target.value; trang = 1; tai(); } },
        h('option', { value: '' }, 'Tất cả trung tâm'),
        ...[1, 2, 3, 4, 5, 6].map((n) => h('option', { value: String(n) }, `Trung tâm ${n}`)))),
    ketQua);
  tai();
}
