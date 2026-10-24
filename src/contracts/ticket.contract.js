'use strict';
/**
 * HỢP ĐỒNG DỮ LIỆU — phiếu bảo hành đi từ lớp nghiệp vụ ra API (/api/tickets).
 *
 * HÌNH DẠNG (một phiếu):
 *   ticket_id, center_id : số nguyên >= 1
 *   ticket_code          : chuỗi dạng BH-000123/2026
 *   customer_name        : chuỗi
 *   customer_phone       : chuỗi 10 số bắt đầu bằng 0 (đầy đủ vì chỉ vai trò quản lý gọi; QT-15 che với vai trò khác)
 *   device_name          : chuỗi
 *   issue_category       : MAN_HINH | PIN | SAC | PHAN_MEM | NUOC_VAO | KHAC
 *   priority             : CAO | TRUNG_BINH | THAP
 *   status               : MOI | DA_PHAN_CONG | DANG_XU_LY | CHO_LINH_KIEN | HOAN_TAT | DA_DONG | DA_HUY
 *   technician_id        : số HOẶC null khi chưa phân công
 *   technician_name      : chuỗi HOẶC null khi chưa phân công
 *   received_at, due_date: ISO 8601 có múi giờ +07:00, luôn có
 *
 * Ý NGHĨA: due_date là hạn cam kết (QT-04, không tính Chủ nhật). technician_id = null là "chưa có người", không phải 0.
 *
 * KHI SAI: không tìm thấy phiếu -> TICKET_NOT_FOUND (404); dữ liệu vào sai -> VALIDATION_ERROR (400).
 */
const LECH_VN_MS = 7 * 3600 * 1000;
const hai = (n) => String(n).padStart(2, '0');

/**
 * Đổi mốc thời gian sang chuỗi ISO 8601 giờ Việt Nam (+07:00).
 * @param {Date|string} v Date từ thư viện pg, hoặc chuỗi ISO.
 */
function isoVN(v) {
  const d = new Date(new Date(v).getTime() + LECH_VN_MS);
  return `${d.getUTCFullYear()}-${hai(d.getUTCMonth() + 1)}-${hai(d.getUTCDate())}`
    + `T${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())}:${hai(d.getUTCSeconds())}+07:00`;
}

/** Đối tượng nghiệp vụ (camelCase) -> JSON của API (snake_case). */
function toTicketView(t) {
  return {
    ticket_id: t.ticketId,
    ticket_code: t.ticketCode,
    customer_name: t.customerName,
    customer_phone: t.customerPhone,
    device_name: t.deviceName,
    issue_category: t.issueCategory,
    priority: t.priority,
    status: t.status,
    center_id: t.centerId,
    technician_id: t.technicianId === undefined ? null : t.technicianId,
    technician_name: t.technicianName === undefined ? null : t.technicianName,
    received_at: isoVN(t.receivedAt),
    due_date: isoVN(t.dueDate),
  };
}

/**
 * Danh sách kỹ thuật viên đủ điều kiện của một phiếu (GET .../eligible-technicians).
 * HÌNH DẠNG: { ticket_id, issue_category, technicians: [{ technician_id, full_name, level, proficiency, open_tickets }] }.
 * technicians = [] khi không ai đủ điều kiện (luồng 3a của UC3); open_tickets là số nguyên >= 0.
 */
function toEligibleView(phieu, ktvs) {
  return {
    ticket_id: phieu.ticketId,
    issue_category: phieu.issueCategory,
    technicians: ktvs.map((k) => ({
      technician_id: k.technicianId, full_name: k.fullName, level: k.level,
      proficiency: k.proficiency, open_tickets: k.openTickets,
    })),
  };
}

/** Kết quả phân công (POST .../assignment): { ticket_id, ticket_code, status, technician_id, assigned_at, assigned_by }. */
function toAssignmentView(a) {
  return {
    ticket_id: a.ticketId, ticket_code: a.ticketCode, status: a.status,
    technician_id: a.technicianId, assigned_at: isoVN(a.assignedAt), assigned_by: a.assignedBy,
  };
}

const TICKET_VIEW_FIELDS = Object.freeze([
  'ticket_id', 'ticket_code', 'customer_name', 'customer_phone', 'device_name', 'issue_category', 'priority',
  'status', 'center_id', 'technician_id', 'technician_name', 'received_at', 'due_date']);

module.exports = { toTicketView, toEligibleView, toAssignmentView, isoVN, TICKET_VIEW_FIELDS };
