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

class TechnicianService {
  constructor(technicianRepo) {
    this.repo = technicianRepo;
  }

  list(boLoc) {
    return this.repo.list(boLoc);
  }

  async get(id) {
    const t = await this.repo.findById(id);
    if (!t) {
      throw new AppError('TECHNICIAN_NOT_FOUND', `Không tìm thấy kỹ thuật viên có mã ${id}.`, undefined, 'technician_id');
    }
    return t;
  }

  create(input) {
    return this.repo.insert(input);
  }

  async update(id, input) {
    const hienTai = await this.get(id);
    if (hienTai.isActive && input.isActive === false) {
      await this.kiemTraKhongGiuPhieu(id);
    }
    return this.repo.update(id, input);
  }

  /** Xóa mềm. Gọi lại trên KTV đã ngừng hoạt động thì không đổi gì. */
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
