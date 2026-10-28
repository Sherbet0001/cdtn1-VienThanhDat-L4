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

const { TRANG_THAI_DANG_GIU } = require('./technician.repository');

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

/**
 * Khóa dòng phiếu (FOR UPDATE) rồi đọc: người thứ hai cùng gán một phiếu phải ĐỢI người thứ nhất xong,
 * và khi được đọc sẽ thấy phiếu đã DA_PHAN_CONG nên bị từ chối (QT-07), không ghi đè.
 * Chỉ gọi bên trong runInTransaction.
 * @returns {Promise<object|null>}
 */
TicketRepository.prototype.lockById = async function lockById(id) {
  const { rows } = await this.db.query(
    `${SELECT_PHIEU} WHERE t.ticket_id = $1 FOR UPDATE OF t`, [id]);
  return rows.length === 0 ? null : toTicket(rows[0]);
};

/**
 * Kỹ thuật viên đủ điều kiện QT-08 cho một trung tâm và nhóm sự cố, kèm số phiếu đang giữ, ít phiếu nhất trước (FR2).
 * @returns {Promise<Array<{technicianId:number, fullName:string, level:string, proficiency:number, openTickets:number}>>}
 */
TicketRepository.prototype.listEligible = async function listEligible({ centerId, issueCategory, toiThieu }) {
  const { rows } = await this.db.query(
    `SELECT k.technician_id, k.full_name, k.level, s.proficiency,
            (SELECT COUNT(*)::int FROM ticket x
              WHERE x.technician_id = k.technician_id AND x.status = ANY($4::text[])) AS open_tickets
       FROM technician k
       JOIN technician_skill s ON s.technician_id = k.technician_id AND s.issue_category = $2
      WHERE k.center_id = $1 AND k.is_active AND s.proficiency >= $3
      ORDER BY open_tickets, k.technician_id`,
    [centerId, issueCategory, toiThieu, TRANG_THAI_DANG_GIU]);
  return rows.map((r) => ({
    technicianId: Number(r.technician_id), fullName: r.full_name, level: r.level,
    proficiency: r.proficiency, openTickets: r.open_tickets,
  }));
};

/** Thông tin để kiểm QT-08 cho MỘT kỹ thuật viên; proficiency null khi chưa có kỹ năng nhóm này. null nếu không có kỹ thuật viên. */
TicketRepository.prototype.findTechnicianForCheck = async function findTechnicianForCheck(id, issueCategory) {
  const { rows } = await this.db.query(
    `SELECT k.technician_id, k.center_id, k.is_active, s.proficiency
       FROM technician k
       LEFT JOIN technician_skill s ON s.technician_id = k.technician_id AND s.issue_category = $2
      WHERE k.technician_id = $1`, [id, issueCategory]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return { technicianId: Number(r.technician_id), centerId: r.center_id, isActive: r.is_active,
    proficiency: r.proficiency === null ? null : r.proficiency };
};

/** Ghi kỹ thuật viên và đổi trạng thái sang DA_PHAN_CONG. Chỉ gọi bên trong runInTransaction. */
TicketRepository.prototype.setAssignment = async function setAssignment(ticketId, technicianId) {
  const { rows } = await this.db.query(
    `UPDATE ticket SET technician_id = $2, status = 'DA_PHAN_CONG' WHERE ticket_id = $1 RETURNING now() AS luc`,
    [ticketId, technicianId]);
  return rows[0].luc;
};

/**
 * Cập nhật các trường được gửi (trường undefined giữ nguyên). Chỉ gọi bên trong runInTransaction.
 * @param {number} id
 * @param {{deviceName?:string, issueCategory?:string, priority?:string, dueDate?:Date}} c
 */
TicketRepository.prototype.updateFields = async function updateFields(id, c) {
  await this.db.query(
    `UPDATE ticket SET device_name = COALESCE($2, device_name), issue_category = COALESCE($3, issue_category),
                       priority = COALESCE($4, priority), due_date = COALESCE($5, due_date)
      WHERE ticket_id = $1`,
    [id, c.deviceName ?? null, c.issueCategory ?? null, c.priority ?? null, c.dueDate ?? null]);
};

/** Đổi trạng thái phiếu (giữ nguyên kỹ thuật viên). Chỉ gọi bên trong runInTransaction. */
TicketRepository.prototype.setStatus = async function setStatus(id, status) {
  await this.db.query(`UPDATE ticket SET status = $2 WHERE ticket_id = $1`, [id, status]);
};

/** Ghi một dòng ticket_status_log (QT-06: mọi lần chuyển trạng thái phải có log). */
TicketRepository.prototype.insertLog = async function insertLog(l) {
  await this.db.query(
    `INSERT INTO ticket_status_log (ticket_id, old_status, new_status, old_technician_id, new_technician_id, reason, changed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [l.ticketId, l.oldStatus, l.newStatus, l.oldTechnicianId, l.newTechnicianId, l.reason, l.changedBy]);
};

/**
 * Chạy fn trong MỘT giao dịch: lỗi ở bất kỳ bước nào thì ROLLBACK, phiếu giữ nguyên (luồng ngoại lệ 7a của UC3).
 * @param {(tx: TicketRepository) => Promise<any>} fn Nhận một repository gắn với kết nối của giao dịch.
 */
TicketRepository.prototype.runInTransaction = async function runInTransaction(fn) {
  const client = await this.db.connect();
  try {
    await client.query('BEGIN');
    const kq = await fn(new TicketRepository(client));
    await client.query('COMMIT');
    return kq;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
};

module.exports = TicketRepository;
module.exports.toTicket = toTicket;
