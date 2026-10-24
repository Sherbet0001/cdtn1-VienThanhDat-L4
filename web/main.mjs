import { listTechnicians } from './api/client.mjs';
import { layTrangThai, thongBaoLoi, thongBaoRong } from './lib/dataState.mjs';

const $ = (id) => document.getElementById(id);
const CAP = { SO_CAP: 'Sơ cấp', TRUNG_CAP: 'Trung cấp', CAO_CAP: 'Cao cấp' };

/** Vẽ đúng MỘT trong bốn trạng thái; dùng textContent nên dữ liệu không thể chèn mã HTML. */
function ve(state, boLoc) {
  const t = layTrangThai(state);
  $('trang-thai').hidden = t === 'ready';
  $('bang').hidden = t !== 'ready';
  $('thu-lai').hidden = t !== 'error';
  if (t === 'loading') $('trang-thai').textContent = 'Đang tải dữ liệu…';
  if (t === 'empty') $('trang-thai').textContent = thongBaoRong(boLoc);
  if (t === 'error') {
    const m = thongBaoLoi(state.error);
    $('trang-thai').textContent = `${m.tieuDe} ${m.chiTiet}`;
  }
  if (t === 'ready') {
    const tbody = $('bang').querySelector('tbody');
    tbody.replaceChildren(...state.data.map((k) => {
      const tr = document.createElement('tr');
      [k.technician_id, k.full_name, `Trung tâm ${k.center_id}`, CAP[k.level] || k.level,
        k.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động']
        .forEach((v) => { const td = document.createElement('td'); td.textContent = v; tr.append(td); });
      return tr;
    }));
  }
}

async function tai() {
  const v = $('loc').value;
  const boLoc = v === '' ? {} : { is_active: v };
  ve({ loading: true, error: null, data: null }, boLoc);
  try {
    const kq = await listTechnicians(boLoc);
    ve({ loading: false, error: null, data: kq.items }, boLoc);
  } catch (error) {
    ve({ loading: false, error, data: null }, boLoc);
  }
}

$('loc').addEventListener('change', tai);
$('thu-lai').addEventListener('click', tai);
tai();
