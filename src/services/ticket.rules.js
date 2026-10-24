'use strict';
/** Quy tắc nghiệp vụ THUẦN của phiếu (không CSDL, không HTTP) nên kiểm thử đơn vị được ngay. */

/** Số giờ cam kết theo mức ưu tiên (QT-04). */
const GIO_CAM_KET = Object.freeze({ CAO: 24, TRUNG_BINH: 72, THAP: 120 });

/** Mức ưu tiên mặc định theo nhóm sự cố (issue_categories.csv: default_priority). */
const UU_TIEN_MAC_DINH = Object.freeze({
  MAN_HINH: 'CAO', NUOC_VAO: 'CAO', PIN: 'TRUNG_BINH', SAC: 'TRUNG_BINH', KHAC: 'TRUNG_BINH', PHAN_MEM: 'THAP',
});

const MS_NGAY = 24 * 3600 * 1000;
const LECH_VN = 7 * 3600 * 1000;               // giờ Việt Nam là UTC+7, không có giờ mùa hè
const laChuNhatVN = (d) => new Date(d.getTime() + LECH_VN).getUTCDay() === 0;

/**
 * Hạn cam kết (QT-04): cộng số ngày theo mức ưu tiên, KHÔNG tính Chủ nhật (làm việc thứ Hai–thứ Bảy).
 * Mỗi ngày cộng thêm mà rơi vào Chủ nhật thì lùi sang ngày kế tiếp.
 * @param {Date} nhanLuc Thời điểm tiếp nhận.
 * @param {'CAO'|'TRUNG_BINH'|'THAP'} uuTien
 * @returns {Date}
 * @throws {RangeError} Khi uuTien không thuộc ba mức (lỗi lập trình, không phải lỗi người dùng: validator đã chặn trước).
 */
function hanCamKet(nhanLuc, uuTien) {
  const gio = GIO_CAM_KET[uuTien];
  if (gio === undefined) throw new RangeError(`Mức ưu tiên không hợp lệ: ${uuTien}`);
  let han = new Date(nhanLuc.getTime());
  for (let i = 0; i < gio / 24; i += 1) {
    han = new Date(han.getTime() + MS_NGAY);
    while (laChuNhatVN(han)) han = new Date(han.getTime() + MS_NGAY);
  }
  return han;
}

/** Mức thành thạo tối thiểu để được phân công (QT-08). */
const THANH_THAO_TOI_THIEU = 3;

/**
 * Kiểm tra QT-08: kỹ thuật viên cùng trung tâm với phiếu, đang hoạt động và thành thạo >= 3 với nhóm sự cố của phiếu.
 * @param {{centerId:number, issueCategory:string}} phieu
 * @param {{centerId:number, isActive:boolean, proficiency:number|null}} ktv proficiency null = chưa có kỹ năng này.
 * @returns {string|null} Lý do từ chối (đã viết cho người đọc), hoặc null nếu đủ điều kiện.
 */
function lyDoKhongDuDieuKien(phieu, ktv) {
  if (!ktv.isActive) return 'Kỹ thuật viên đã ngừng hoạt động.';
  if (ktv.centerId !== phieu.centerId) return 'Kỹ thuật viên thuộc trung tâm khác với phiếu.';
  if (ktv.proficiency === null || ktv.proficiency < THANH_THAO_TOI_THIEU) {
    return `Kỹ thuật viên chưa đạt mức thành thạo ≥ ${THANH_THAO_TOI_THIEU} với nhóm sự cố ${phieu.issueCategory}.`;
  }
  return null;
}

module.exports = { GIO_CAM_KET, UU_TIEN_MAC_DINH, THANH_THAO_TOI_THIEU, hanCamKet, lyDoKhongDuDieuKien };
