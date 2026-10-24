'use strict';
/**
 * Lớp truy cập dữ liệu của Technician: chỉ đọc và ghi bảng, KHÔNG chứa quy tắc nghiệp vụ.
 * "db" là bất kỳ đối tượng nào có hàm query(sql, params) (Pool của thư viện pg).
 * Lưu ý: cột BIGINT được thư viện pg trả về dạng chuỗi, nên mọi dòng đi qua toTechnician để đổi sang số.
 */

/** Trạng thái phiếu coi là "đang giữ" một kỹ thuật viên (FR2, TD-10); phiếu đã HOAN_TAT trở đi không tính. */
const TRANG_THAI_DANG_GIU = ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN'];

/** Dòng CSDL (snake_case, BIGINT là chuỗi) -> đối tượng nghiệp vụ (camelCase, số). */
function toTechnician(row) {
  return {
    technicianId: Number(row.technician_id),
    fullName: row.full_name,
    centerId: row.center_id,
    level: row.level,
    isActive: row.is_active,
  };
}

class TechnicianRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * @param {{centerId:number|null, isActive:boolean|null, limit:number, offset:number}} boLoc null = không lọc.
   * @returns {Promise<object[]>} Sắp theo technician_id để phân trang ổn định giữa các lần gọi.
   */
  async list({ centerId, isActive, limit, offset }) {
    const { rows } = await this.db.query(
      `SELECT technician_id, full_name, center_id, level, is_active
         FROM technician
        WHERE ($1::int IS NULL OR center_id = $1)
          AND ($2::boolean IS NULL OR is_active = $2)
        ORDER BY technician_id
        LIMIT $3 OFFSET $4`,
      [centerId, isActive, limit, offset]);
    return rows.map(toTechnician);
  }

  /** Trả về kỹ thuật viên kèm danh sách tay nghề, hoặc null nếu không có. */
  async findById(id) {
    const { rows } = await this.db.query(
      `SELECT technician_id, full_name, center_id, level, is_active
         FROM technician WHERE technician_id = $1`, [id]);
    if (rows.length === 0) return null;
    const skills = await this.db.query(
      `SELECT issue_category, proficiency
         FROM technician_skill WHERE technician_id = $1
        ORDER BY issue_category`, [id]);
    return {
      ...toTechnician(rows[0]),
      skills: skills.rows.map((s) => ({
        issueCategory: s.issue_category, proficiency: s.proficiency })),
    };
  }

  /** @returns {Promise<object>} Dòng vừa chèn (RETURNING, không cần truy vấn lần hai). */
  async insert({ fullName, centerId, level, isActive }) {
    const { rows } = await this.db.query(
      `INSERT INTO technician (full_name, center_id, level, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING technician_id, full_name, center_id, level, is_active`,
      [fullName, centerId, level, isActive]);
    return toTechnician(rows[0]);
  }

  /** Sửa các trường cho phép sửa; trả về null nếu không có dòng nào. */
  async update(id, { fullName, centerId, level, isActive }) {
    const { rows } = await this.db.query(
      `UPDATE technician
          SET full_name = $2, center_id = $3, level = $4, is_active = $5
        WHERE technician_id = $1
        RETURNING technician_id, full_name, center_id, level, is_active`,
      [id, fullName, centerId, level, isActive]);
    return rows.length === 0 ? null : toTechnician(rows[0]);
  }

  /** Xóa mềm: không xóa dòng (QT-13), chỉ đặt is_active = false. */
  async deactivate(id) {
    const { rows } = await this.db.query(
      `UPDATE technician SET is_active = FALSE
        WHERE technician_id = $1
        RETURNING technician_id, full_name, center_id, level, is_active`, [id]);
    return rows.length === 0 ? null : toTechnician(rows[0]);
  }

  /** Số phiếu kỹ thuật viên đang giữ, tính theo TRANG_THAI_DANG_GIU (TD-10). @returns {Promise<number>} */
  async countOpenTickets(id) {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS so_phieu
         FROM ticket
        WHERE technician_id = $1 AND status = ANY($2::text[])`,
      [id, TRANG_THAI_DANG_GIU]);
    return rows[0].so_phieu;
  }
}

module.exports = TechnicianRepository;
module.exports.TRANG_THAI_DANG_GIU = TRANG_THAI_DANG_GIU;
