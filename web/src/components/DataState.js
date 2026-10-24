// Thành phần DataState: bọc MỘT khối giao diện và lo đủ ba trạng thái đang tải / rỗng / lỗi (có nút Thử lại).
import { thongBaoLoi } from '../lib/dataState.js';
import { h } from './dom.js';

/**
 * @param {HTMLElement} goc Khối cần vẽ.
 * @param {object} tuyChon
 * @param {() => Promise<any>} tuyChon.tai Lấy dữ liệu (qua lớp client, không gọi fetch trực tiếp).
 * @param {(data:any) => boolean} [tuyChon.laRong] Dữ liệu rỗng? Mặc định: mảng rỗng.
 * @param {(data:any) => string} [tuyChon.thongBaoRong] Câu giải thích VÌ SAO rỗng và làm gì tiếp.
 * @param {(data:any, goc:HTMLElement, taiLai:() => Promise<void>) => void} tuyChon.ve Vẽ dữ liệu khi có.
 * @returns {Promise<void>}
 */
export async function hienThiDuLieu(goc, { tai, laRong = (d) => Array.isArray(d) && d.length === 0, thongBaoRong, ve }) {
  const taiLai = async () => {
    const lan = (goc.dataset.lan = String(Number(goc.dataset.lan || 0) + 1));   // bỏ qua phản hồi cũ đến muộn
    goc.replaceChildren(h('p', { class: 'trang-thai', role: 'status' }, 'Đang tải dữ liệu…'));
    try {
      const data = await tai();
      if (goc.dataset.lan !== lan) return;
      if (laRong(data)) {
        goc.replaceChildren(h('p', { class: 'trang-thai' }, thongBaoRong ? thongBaoRong(data) : 'Không có dữ liệu.'));
      } else {
        goc.replaceChildren();
        ve(data, goc, taiLai);
      }
    } catch (loi) {
      if (goc.dataset.lan !== lan) return;
      const m = thongBaoLoi(loi);
      goc.replaceChildren(h('div', { class: 'trang-thai loi', role: 'alert' },
        h('strong', {}, m.tieuDe), ' ', m.chiTiet, ' ', h('button', { type: 'button', onclick: taiLai }, 'Thử lại')));
    }
  };
  await taiLai();
}
