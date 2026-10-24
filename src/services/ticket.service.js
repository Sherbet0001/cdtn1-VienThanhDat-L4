'use strict';
/**
 * Lớp nghiệp vụ của phiếu. KHÔNG có dấu vết HTTP. Quy tắc hiện thực ở đây hoặc ở ticket.rules.js:
 *  - QT-04: hạn cam kết sinh theo mức ưu tiên (CAO 24h, TRUNG_BINH 72h, THAP 120h), không tính Chủ nhật.
 *  - TICKET_NOT_FOUND: thao tác trên phiếu không có trong hệ thống.
 */
const { AppError } = require('../errors/AppError');
const { UU_TIEN_MAC_DINH, hanCamKet } = require('./ticket.rules');

class TicketService {
  /**
   * @param {import('../repositories/ticket.repository')} ticketRepo
   * @param {() => Date} [dongHo] Nguồn thời gian; tiêm hàm giả khi kiểm thử để kết quả không phụ thuộc giờ chạy.
   */
  constructor(ticketRepo, dongHo = () => new Date()) {
    this.repo = ticketRepo;
    this.dongHo = dongHo;
  }

  /** @param {{page:number, limit:number, centerId:number|null}} q Đã qua validateUnassignedQuery. */
  async listUnassigned({ page, limit, centerId }) {
    const { items, total } = await this.repo.listUnassigned({ centerId, limit, offset: (page - 1) * limit });
    return { items, page, limit, total };
  }

  /** @throws {AppError} TICKET_NOT_FOUND. */
  async get(id) {
    const t = await this.repo.findById(id);
    if (!t) throw new AppError('TICKET_NOT_FOUND', `Không tìm thấy phiếu có mã ${id}.`, undefined, 'ticket_id');
    return t;
  }

  /**
   * Tiếp nhận phiếu mới: ưu tiên mặc định theo nhóm sự cố nếu không chọn, hạn cam kết theo QT-04.
   * @param {object} input Đã qua validateTicketCreate.
   * @returns {Promise<object>} Phiếu vừa tạo (trạng thái MOI, technicianId = null).
   */
  async create(input) {
    const receivedAt = this.dongHo();
    const priority = input.priority || UU_TIEN_MAC_DINH[input.issueCategory];
    const id = await this.repo.insert({ ...input, priority, receivedAt, dueDate: hanCamKet(receivedAt, priority) });
    return this.get(id);
  }
}

module.exports = { TicketService };
