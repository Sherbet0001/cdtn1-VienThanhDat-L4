// Màn hình đăng nhập (TD-34). Lỗi hiện bằng thông điệp chung của API: không cho biết tên đăng nhập có tồn tại hay không.
import { ApiError, luuPhien } from '../api/client.js';
import { dangNhap } from '../api/auth.api.js';
import { h } from '../components/dom.js';

export function trangDangNhap(goc, khiThanhCong) {
  const ten = h('input', { type: 'text', id: 'username', name: 'username', autocomplete: 'username', maxLength: 50, required: true });
  const matKhau = h('input', { type: 'password', id: 'password', name: 'password', autocomplete: 'current-password', maxLength: 128, required: true });
  const loi = h('p', { class: 'thong-bao loi', role: 'alert', hidden: true });
  const nut = h('button', { type: 'submit' }, 'Đăng nhập');

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    loi.hidden = true;
    nut.disabled = true;                                   // chống bấm hai lần
    try {
      const kq = await dangNhap(ten.value, matKhau.value);
      matKhau.value = '';
      luuPhien({ token: kq.token, user: kq.user });
      khiThanhCong(kq.user);
    } catch (e2) {
      loi.textContent = e2 instanceof ApiError && !e2.network && e2.message
        ? e2.message : 'Không kết nối được tới hệ thống. Kiểm tra mạng rồi bấm Đăng nhập lại.';
      loi.hidden = false;
      matKhau.value = '';
      matKhau.focus();
    } finally {
      nut.disabled = false;
    }
  } },
  h('div', { class: 'truong' }, h('label', { for: 'username' }, 'Tên đăng nhập'), ten),
  h('div', { class: 'truong' }, h('label', { for: 'password' }, 'Mật khẩu'), matKhau),
  nut, loi);

  goc.replaceChildren(h('h1', {}, 'Đăng nhập'), h('p', {}, 'Quản lý chỉ thấy phiếu và kỹ thuật viên của trung tâm mình; quản trị thấy mọi trung tâm.'), form);
  ten.focus();
}
