'use strict';
/** Truy cập bảng app_user. "db" là đối tượng có query(sql, params) (Pool của pg). Luôn dùng tham số, không ghép chuỗi. */
class UserRepository {
  constructor(db) { this.db = db; }

  /** @returns {Promise<{userId:number, username:string, passwordHash:string, fullName:string, role:string, centerId:number|null, isActive:boolean}|null>} */
  async findByUsername(username) {
    const { rows } = await this.db.query(
      `SELECT user_id, username, password_hash, full_name, role, center_id, is_active
         FROM app_user WHERE lower(username) = lower($1)`, [username]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return { userId: Number(r.user_id), username: r.username, passwordHash: r.password_hash, fullName: r.full_name,
      role: r.role, centerId: r.center_id === null ? null : Number(r.center_id), isActive: r.is_active };
  }
}

module.exports = UserRepository;
