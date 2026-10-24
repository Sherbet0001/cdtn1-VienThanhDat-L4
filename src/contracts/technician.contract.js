'use strict';
/**
 * HỢP ĐỒNG DỮ LIỆU — kỹ thuật viên đi từ lớp nghiệp vụ ra ngoài qua API (/api/technicians).
 * Đây là chỗ DUY NHẤT biết tên trường JSON; đổi tên một trường chỉ sửa ở đây.
 *
 * HÌNH DẠNG (một kỹ thuật viên):
 *   technician_id : số nguyên >= 1, luôn có
 *   full_name     : chuỗi 1–100 ký tự, luôn có
 *   center_id     : số nguyên >= 1 (mã trung tâm bảo hành), luôn có
 *   level         : 'SO_CAP' | 'TRUNG_CAP' | 'CAO_CAP', luôn có
 *   is_active     : boolean; false = đã ngừng hoạt động (xóa mềm, TD-16)
 *   skills        : CHỈ có khi lấy chi tiết một KTV; mảng { issue_category, proficiency }, có thể rỗng
 *
 * Ý NGHĨA:
 *   - technician_id/center_id là số, không phải chuỗi (CSDL trả BIGINT dạng chuỗi, đã đổi ở repository).
 *   - is_active=false không có nghĩa là bị xóa: dòng vẫn còn để giữ lịch sử phiếu.
 *   - Không có trường nào chứa số điện thoại hay dữ liệu cá nhân của khách.
 *
 * KHI SAI:
 *   - Không tìm thấy -> TECHNICIAN_NOT_FOUND (404). Dữ liệu vào sai -> VALIDATION_ERROR (400).
 *   - Ngừng hoạt động KTV còn phiếu mở -> TECHNICIAN_HAS_OPEN_TICKETS (409).
 *   - Mọi lỗi dùng chung một khung: { error: { code, message, field?, fields?, details? } }.
 */

/**
 * Đổi đối tượng nghiệp vụ (camelCase) sang dạng API (snake_case).
 * @param {{technicianId:number, fullName:string, centerId:number, level:string, isActive:boolean,
 *          skills?: Array<{issueCategory:string, proficiency:number}>}} t
 * @returns {object} xem phần HÌNH DẠNG ở đầu tệp
 */
function toTechnicianView(t) {
  const view = {
    technician_id: t.technicianId,
    full_name: t.fullName,
    center_id: t.centerId,
    level: t.level,
    is_active: t.isActive,
  };
  if (t.skills) {
    view.skills = t.skills.map((s) => ({ issue_category: s.issueCategory, proficiency: s.proficiency }));
  }
  return view;
}

/** Các trường luôn có trong một kỹ thuật viên (dùng cho test hợp đồng). */
const TECHNICIAN_VIEW_FIELDS = Object.freeze(['technician_id', 'full_name', 'center_id', 'level', 'is_active']);

module.exports = { toTechnicianView, TECHNICIAN_VIEW_FIELDS };
