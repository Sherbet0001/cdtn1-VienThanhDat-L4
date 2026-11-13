// Bộ định tuyến theo #hash: không cần máy chủ cấu hình thêm. Mỗi trang tự vẽ vào #app.
import { trangChiTiet } from './pages/ticketDetail.js';
import { trangTiepNhan } from './pages/intake.js';
import { trangDanhSach } from './pages/ticketList.js';
import { trangKyThuatVien } from './pages/technicians.js';
import { trangDangNhap } from './pages/login.js';
import { dangKyXuLy401, layPhien, xoaPhien } from './api/client.js';

const goc = document.getElementById('app');

const CAC_TRANG = [
  [/^#\/?$/, () => trangDanhSach(goc), '#/'],
  [/^#\/tickets\/(\d+)$/, (m) => trangChiTiet(goc, Number(m[1])), '#/'],
  [/^#\/intake$/, () => trangTiepNhan(goc), '#/intake'],
  [/^#\/technicians$/, () => trangKyThuatVien(goc), '#/technicians'],
];

const nutDangXuat = document.getElementById('dang-xuat');
const chuNguoiDung = document.getElementById('nguoi-dung');
const thanhDieuHuong = document.querySelector('nav');
const NHAN_VAI_TRO = { QUAN_TRI: 'Quản trị', QUAN_LY: 'Quản lý' };

/** Hiện tên người dùng, vai trò, trung tâm và nút đăng xuất; ẩn menu khi chưa đăng nhập. */
function veThanhTren() {
  const phien = layPhien();
  thanhDieuHuong.hidden = !phien;
  nutDangXuat.hidden = !phien;
  chuNguoiDung.textContent = phien
    ? `${phien.user.full_name} · ${NHAN_VAI_TRO[phien.user.role] || phien.user.role}${phien.user.center_id ? ` · Trung tâm ${phien.user.center_id}` : ''}` : '';
}

function veVeTrangDangNhap() {
  xoaPhien();
  window.location.hash = '#/login';
  dieuHuong();
}

dangKyXuLy401(veVeTrangDangNhap);   // API trả 401 (token hết hạn hoặc bị từ chối): xóa phiên và về trang đăng nhập
nutDangXuat.addEventListener('click', veVeTrangDangNhap);

function dieuHuong() {
  veThanhTren();
  const hash = window.location.hash || '#/';
  if (!layPhien()) {   // chưa đăng nhập: chỉ được thấy màn hình đăng nhập
    if (hash !== '#/login') { window.location.hash = '#/login'; return; }
    trangDangNhap(goc, () => { window.location.hash = '#/'; dieuHuong(); });
    return;
  }
  if (hash === '#/login') { window.location.hash = '#/'; return; }
  for (const [mau, ve, muc] of CAC_TRANG) {
    const m = mau.exec(hash);
    if (m) {
      document.querySelectorAll('nav a').forEach((a) => a.classList.toggle('dang-chon', a.getAttribute('href') === muc));
      ve(m);
      return;
    }
  }
  goc.textContent = 'Không tìm thấy trang. Về danh sách phiếu bằng liên kết ở trên.';
}

window.addEventListener('hashchange', dieuHuong);
dieuHuong();
