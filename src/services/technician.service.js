'use strict';
/**
 * Lớp nghiệp vụ của Technician. KHÔNG có dấu vết HTTP: không req, không res, không mã trạng thái.
 * Nhận và trả dữ liệu thuần, ném AppError có mã nghiệp vụ khi vi phạm quy tắc.
 *
 * Quy tắc nghiệp vụ hiện thực ở đây:
 *  - TECHNICIAN_NOT_FOUND: thao tác trên kỹ thuật viên không có trong hệ thống.
 *  - TECHNICIAN_HAS_OPEN_TICKETS: không cho ngừng hoạt động một kỹ thuật viên còn giữ phiếu chưa hoàn tất,
 *    vì phiếu sẽ không còn người xử lý (FR2: chỉ gán cho KTV đang hoạt động).
 */
const { AppError } = require('../errors/AppError');

/** Dịch vụ nghiệp vụ cho kỹ thuật viên; mọi hàm công khai dưới đây đều có thể ném AppError. */
class TechnicianService {
  /** @param {import('../repositories/technician.repository')} technicianRepo Nơi duy nhất chạm vào CSDL. */
  constructor(technicianRepo) {
    this.repo = technicianRepo;
  }

  /**
   * @param {{centerId:number|null, isActive:boolean|null, limit:number, offset:number}} boLoc Đã qua validateListQuery.
   * @returns {Promise<object[]>} Mảng rỗng khi không có ai khớp (không phải lỗi).
   */
  list(boLoc) {
    return this.repo.list(boLoc);
  }

  /**
   * @param {number} id Mã kỹ thuật viên.
   * @returns {Promise<object>} Kỹ thuật viên kèm skills (có thể rỗng).
   * @throws {AppError} TECHNICIAN_NOT_FOUND khi không có mã này.
   */
  async get(id) {
    const t = await this.repo.findById(id);
    if (!t) {
      throw new AppError('TECHNICIAN_NOT_FOUND', `Không tìm thấy kỹ thuật viên có mã ${id}.`, undefined, 'technician_id');
    }
    return t;
  }

  /**
   * @param {{fullName:string, centerId:number, level:string, isActive:boolean}} input Đã qua validateTechnician.
   * @returns {Promise<object>} Kỹ thuật viên vừa tạo, đã có technicianId.
   */
  create(input) {
    return this.repo.insert(input);
  }

  /**
   * Sửa toàn bộ. Chuyển từ đang hoạt động sang ngừng hoạt động cũng phải qua kiểm tra phiếu đang giữ,
   * nếu không PUT sẽ là cửa hậu vượt quy tắc của DELETE.
   * @throws {AppError} TECHNICIAN_NOT_FOUND; TECHNICIAN_HAS_OPEN_TICKETS (409).
   */
  async update(id, input) {
    const hienTai = await this.get(id);
    if (hienTai.isActive && input.isActive === false) {
      await this.kiemTraKhongGiuPhieu(id);
    }
    return this.repo.update(id, input);
  }

  /**
   * Xóa mềm (QT-13: không xóa vật lý). Gọi lại trên KTV đã ngừng hoạt động thì trả nguyên trạng, không lỗi (idempotent).
   * @throws {AppError} TECHNICIAN_NOT_FOUND; TECHNICIAN_HAS_OPEN_TICKETS (409).
   */
  async deactivate(id) {
    const hienTai = await this.get(id);
    if (!hienTai.isActive) return hienTai;
    await this.kiemTraKhongGiuPhieu(id);
    return this.repo.deactivate(id);
  }

  async kiemTraKhongGiuPhieu(id) {
    const soPhieu = await this.repo.countOpenTickets(id);
    if (soPhieu > 0) {
      throw new AppError(
        'TECHNICIAN_HAS_OPEN_TICKETS',
        `Kỹ thuật viên đang giữ ${soPhieu} phiếu chưa hoàn tất; hãy đổi người xử lý trước khi ngừng hoạt động.`,
        { so_phieu: soPhieu }, 'is_active');
    }
  }
}

module.exports = { TechnicianService };
