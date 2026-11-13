'use strict';
/**
 * Đăng nhập: kiểm định dạng, so mật khẩu với chuỗi băm, cấp token. Không biết gì về HTTP.
 * Sai tên đăng nhập, sai mật khẩu và tài khoản bị khóa đều trả CÙNG một lỗi INVALID_CREDENTIALS (không cho biết tên có tồn tại),
 * và luôn tốn một lần băm để thời gian phản hồi không lộ tên nào có thật.
 */
const { AppError, ValidationError } = require('../errors/AppError');
const { bamMatKhau, kiemTraMatKhau } = require('../auth/password');
const { kyToken } = require('../auth/token');

class AuthService {
  /** @param {{findByUsername:Function}} repo @param {{bimat:string, ttlGiay?:number, bayGio?:()=>number}} cauHinh */
  constructor(repo, { bimat, ttlGiay = 3600, bayGio = Date.now } = {}) {
    this.repo = repo;
    this.bimat = bimat;
    this.ttlGiay = ttlGiay;
    this.bayGio = bayGio;
    this.bamGia = null;   // chuỗi băm giả dùng khi tên đăng nhập không tồn tại
  }

  /**
   * @param {unknown} body { username: string (1–50), password: string (1–128) }
   * @returns {Promise<{token:string, token_type:string, expires_in:number, user:object}>}
   * @throws {ValidationError} thân sai định dạng; {AppError} INVALID_CREDENTIALS
   */
  async login(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('Dữ liệu không hợp lệ ở trường: body.', [{ field: 'body', reason: 'phải là một đối tượng JSON' }]);
    }
    const loi = [];
    if (typeof body.username !== 'string' || body.username.trim() === '') loi.push({ field: 'username', reason: 'bắt buộc' });
    else if (body.username.length > 50) loi.push({ field: 'username', reason: 'tối đa 50 ký tự' });
    if (typeof body.password !== 'string' || body.password === '') loi.push({ field: 'password', reason: 'bắt buộc' });
    else if (body.password.length > 128) loi.push({ field: 'password', reason: 'tối đa 128 ký tự' });
    if (loi.length > 0) throw new ValidationError(`Dữ liệu không hợp lệ ở trường: ${loi.map((x) => x.field).join(', ')}.`, loi);

    const nguoi = await this.repo.findByUsername(body.username.trim());
    if (!this.bamGia) this.bamGia = await bamMatKhau('mat-khau-gia-khong-ai-biet');
    const dung = await kiemTraMatKhau(body.password, nguoi ? nguoi.passwordHash : this.bamGia);
    if (!nguoi || !dung || !nguoi.isActive) {
      throw new AppError('INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng.');
    }
    const token = kyToken({ userId: nguoi.userId, role: nguoi.role, centerId: nguoi.centerId }, this.bimat,
      { ttlGiay: this.ttlGiay, bayGio: this.bayGio() });
    return {
      token, token_type: 'Bearer', expires_in: this.ttlGiay,
      user: { user_id: nguoi.userId, username: nguoi.username, full_name: nguoi.fullName, role: nguoi.role, center_id: nguoi.centerId },
    };
  }
}

module.exports = { AuthService };
