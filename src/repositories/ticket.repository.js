'use strict';
/**
 * Lớp truy cập dữ liệu của phiếu: chỉ đọc và ghi bảng, KHÔNG chứa quy tắc nghiệp vụ.
 * "db" là đối tượng có query(sql, params) (Pool của pg). Cột BIGINT về dạng chuỗi nên mọi dòng đi qua toTicket.
 */
const SELECT_PHIEU = `
  SELECT t.ticket_id, t.ticket_code, c.full_name AS customer_name, c.phone AS customer_phone,
         t.device_name, t.issue_category, t.priority, t.status, t.center_id,
         t.technician_id, k.full_name AS technician_name, t.received_at, t.due_date
    FROM ticket t
    JOIN customer c ON c.customer_id = t.customer_id
    LEFT JOIN technician k ON k.technician_id = t.technician_id`;

/** Dòng CSDL -> đối tượng nghiệp vụ. technicianId là null (không phải 0) khi chưa phân công. */
function toTicket(r) {
  return {
    ticketId: Number(r.ticket_id),
    ticketCode: r.ticket_code,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    deviceName: r.device_name,
    issueCategory: r.issue_category,
    priority: r.priority,
    status: r.status,
    centerId: r.center_id,
    technicianId: r.technician_id === null ? null : Number(r.technician_id),
    technicianName: r.technician_name,
    receivedAt: r.received_at,
    dueDate: r.due_date,
  };
}

class TicketRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Phiếu MOI chưa có kỹ thuật viên, sắp theo hạn cam kết tăng dần (FR1).
   * @param {{centerId:number|null, limit:number, offset:number}} p null = mọi trung tâm.
   * @returns {Promise<{items:object[], total:number}>}
   */
  async listUnassigned({ centerId, limit, offset }) {
    const dieuKien = `t.status = 'MOI' AND t.technician_id IS NULL AND ($1::int IS NULL OR t.center_id = $1)`;
    const { rows } = await this.db.query(
      `${SELECT_PHIEU} WHERE ${dieuKien} ORDER BY t.due_date, t.ticket_id LIMIT $2 OFFSET $3`,
      [centerId, limit, offset]);
    const dem = await this.db.query(`SELECT COUNT(*)::int AS tong FROM ticket t WHERE ${dieuKien}`, [centerId]);
    return { items: rows.map(toTicket), total: dem.rows[0].tong };
  }

  /** @returns {Promise<object|null>} null khi không có phiếu. */
  async findById(id) {
    const { rows } = await this.db.query(`${SELECT_PHIEU} WHERE t.ticket_id = $1`, [id]);
    return rows.length === 0 ? null : toTicket(rows[0]);
  }

  /**
   * Tiếp nhận phiếu mới (trạng thái MOI) bằng MỘT câu SQL nên nguyên tử: tìm hoặc tạo khách theo số điện thoại
   * (khách đã có thì giữ nguyên họ tên), lấy mã phiếu từ sequence và sinh mã BH-xxxxxx/năm theo múi giờ Việt Nam.
   * @returns {Promise<number>} ticket_id vừa tạo.
   */
  async insert({ customerName, customerPhone, deviceName, issueCategory, priority, centerId, receivedAt, dueDate }) {
    const { rows } = await this.db.query(
      `WITH khach AS (
         INSERT INTO customer (full_name, phone) VALUES ($1, $2)
         ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
         RETURNING customer_id),
       moi AS (SELECT nextval(pg_get_serial_sequence('ticket', 'ticket_id')) AS id)
       INSERT INTO ticket (ticket_id, ticket_code, customer_id, center_id, device_name, issue_category, priority,
                           status, received_at, due_date)
       SELECT moi.id,
              'BH-' || lpad(moi.id::text, 6, '0') || '/' || to_char($7::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY'),
              khach.customer_id, $5, $3, $4, $6, 'MOI', $7, $8
         FROM moi, khach
       RETURNING ticket_id`,
      [customerName, customerPhone, deviceName, issueCategory, centerId, priority, receivedAt, dueDate]);
    return Number(rows[0].ticket_id);
  }
}

module.exports = TicketRepository;
module.exports.toTicket = toTicket;
