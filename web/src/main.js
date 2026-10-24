// Bộ định tuyến theo #hash: không cần máy chủ cấu hình thêm. Mỗi trang tự vẽ vào #app.
import { trangChiTiet } from './pages/ticketDetail.js';
import { trangDanhSach } from './pages/ticketList.js';
import { trangKyThuatVien } from './pages/technicians.js';

const goc = document.getElementById('app');

const CAC_TRANG = [
  [/^#\/?$/, () => trangDanhSach(goc), '#/'],
  [/^#\/tickets\/(\d+)$/, (m) => trangChiTiet(goc, Number(m[1])), '#/'],
  [/^#\/technicians$/, () => trangKyThuatVien(goc), '#/technicians'],
];

function dieuHuong() {
  const hash = window.location.hash || '#/';
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
