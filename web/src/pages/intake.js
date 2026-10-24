// Màn hình 3: tiếp nhận phiếu mới (tạo phiếu ở trạng thái Mới để đưa vào luồng phân công). Hợp đồng: api-contract mục 2.9.
import { ApiError } from '../api/client.js';
import { createTicket } from '../api/tickets.api.js';
import { h } from '../components/dom.js';
import { NHAN_NHOM_LOI, NHAN_UU_TIEN, ngayGio } from '../lib/dinhDang.js';

/** Một ô nhập: nhãn, điều khiển và chỗ hiện lỗi của riêng trường đó (gắn bằng aria-describedby). */
function truong(ten, nhanHienThi, dieuKhien) {
  const loi = h('p', { class: 'loi-truong', id: `loi-${ten}`, role: 'alert', hidden: true });
  dieuKhien.id = ten;
  dieuKhien.name = ten;
  dieuKhien.setAttribute('aria-describedby', loi.id);
  return { loi, dieuKhien, khung: h('div', { class: 'truong' }, h('label', { for: ten }, nhanHienThi), dieuKhien, loi) };
}

const chon = (cacMuc, macDinh) => h('select', {}, ...(macDinh ? [h('option', { value: '' }, macDinh)] : []),
  ...cacMuc.map(([giaTri, chu]) => h('option', { value: giaTri }, chu)));

export function trangTiepNhan(goc) {
  const o = {
    customer_name: truong('customer_name', 'Họ tên khách hàng', h('input', { type: 'text', maxLength: 100, autocomplete: 'off' })),
    customer_phone: truong('customer_phone', 'Số điện thoại (090…, +84…)', h('input', { type: 'text', inputMode: 'tel', autocomplete: 'off' })),
    device_name: truong('device_name', 'Thiết bị', h('input', { type: 'text', maxLength: 100, autocomplete: 'off' })),
    issue_category: truong('issue_category', 'Nhóm sự cố', chon(Object.entries(NHAN_NHOM_LOI), '— Chọn nhóm sự cố —')),
    priority: truong('priority', 'Mức ưu tiên', chon(Object.entries(NHAN_UU_TIEN), 'Theo nhóm sự cố (mặc định)')),
    center_id: truong('center_id', 'Trung tâm nhận', chon([1, 2, 3, 4, 5, 6].map((n) => [String(n), `Trung tâm ${n}`]), '— Chọn trung tâm —')),
  };
  const ketQua = h('div', { role: 'status' });
  const nut = h('button', { type: 'submit' }, 'Tiếp nhận phiếu');

  const xoaLoi = () => Object.values(o).forEach((t) => { t.loi.hidden = true; t.loi.textContent = ''; t.dieuKhien.removeAttribute('aria-invalid'); });
  const baoLoi = (ten, noiDung) => {
    const t = o[ten];
    if (!t) return false;
    t.loi.textContent = noiDung;
    t.loi.hidden = false;
    t.dieuKhien.setAttribute('aria-invalid', 'true');
    return true;
  };

  const form = h('form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    xoaLoi();
    ketQua.replaceChildren();
    const body = {
      customer_name: o.customer_name.dieuKhien.value,
      customer_phone: o.customer_phone.dieuKhien.value,
      device_name: o.device_name.dieuKhien.value,
      issue_category: o.issue_category.dieuKhien.value || undefined,
      priority: o.priority.dieuKhien.value || undefined,
      center_id: o.center_id.dieuKhien.value ? Number(o.center_id.dieuKhien.value) : undefined,
    };
    nut.disabled = true;                                   // chống bấm hai lần tạo hai phiếu
    try {
      const p = await createTicket(body);
      ketQua.replaceChildren(h('p', { class: 'thong-bao thanh-cong' },
        `Đã tiếp nhận phiếu ${p.ticket_code} (hạn cam kết ${ngayGio(p.due_date)}). `,
        h('a', { href: `#/tickets/${p.ticket_id}` }, 'Mở phiếu để phân công kỹ thuật viên')));
      form.reset();
    } catch (loi) {
      if (loi instanceof ApiError && loi.fields.length > 0) {                // lỗi theo từng trường: chỉ ngay vào ô sai
        loi.fields.forEach((f) => baoLoi(f.field, f.reason));
        const dau = form.querySelector('[aria-invalid="true"]');
        if (dau) dau.focus();
      } else {
        ketQua.replaceChildren(h('p', { class: 'thong-bao loi', role: 'alert' },
          loi instanceof ApiError && !loi.network && loi.message
            ? loi.message : 'Không kết nối được tới hệ thống. Dữ liệu đã nhập vẫn được giữ; kiểm tra mạng rồi bấm Tiếp nhận phiếu lần nữa.'));
      }
    } finally {
      nut.disabled = false;
    }
  } }, ...Object.values(o).map((t) => t.khung), nut);

  goc.replaceChildren(
    h('h1', {}, 'Tiếp nhận phiếu mới'),
    h('p', {}, 'Câu hỏi màn hình này trả lời: ', h('strong', {}, 'phiếu bảo hành mới nào vừa vào và hạn cam kết của nó là khi nào?')),
    form, ketQua);
}
