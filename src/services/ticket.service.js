'use strict';
/**
 * Lớp nghiệp vụ của phiếu. KHÔNG có dấu vết HTTP. Quy tắc hiện thực ở đây hoặc ở ticket.rules.js:
 *  - QT-04: hạn cam kết sinh theo mức ưu tiên (CAO 24h, TRUNG_BINH 72h, THAP 120h), không tính Chủ nhật.
 *  - QT-06: mọi lần chuyển trạng thái ghi một dòng ticket_status_log, cùng giao dịch với việc đổi trạng thái.
 *  - QT-07: một phiếu chỉ có một kỹ thuật viên; phiếu đã gán hoặc không còn MOI thì từ chối, không ghi đè.
 *  - QT-08: chỉ gán kỹ thuật viên cùng trung tâm, đang hoạt động, thành thạo >= 3 với nhóm sự cố.
 *  - TICKET_NOT_FOUND / TECHNICIAN_NOT_FOUND: thao tác trên đối tượng không có trong hệ thống.
 */
const { AppError } = require('../errors/AppError');
const { UU_TIEN_MAC_DINH, THANH_THAO_TOI_THIEU, hanCamKet, lyDoKhongDuDieuKien } = require('./ticket.rules');

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

  /**
   * Kỹ thuật viên đủ điều kiện (QT-08) của một phiếu, ít phiếu đang giữ nhất trước (FR2).
   * @returns {Promise<{phieu:object, ktvs:object[]}>} ktvs = [] khi không ai đủ điều kiện (không phải lỗi).
   * @throws {AppError} TICKET_NOT_FOUND.
   */
  async listEligible(ticketId) {
    const phieu = await this.get(ticketId);
    const ktvs = await this.repo.listEligible({
      centerId: phieu.centerId, issueCategory: phieu.issueCategory, toiThieu: THANH_THAO_TOI_THIEU });
    return { phieu, ktvs };
  }

  /**
   * Gán kỹ thuật viên cho phiếu MOI (UC3, FR3/FR4). Toàn bộ trong MỘT giao dịch và khóa dòng phiếu, nên hai quản lý
   * cùng gán một phiếu thì chỉ một người thành công (NFR3).
   * @param {number} ticketId
   * @param {number} technicianId
   * @param {number} [nguoiThucHien] Mã nhân viên thao tác; 0 khi chưa có đăng nhập (TD-18).
   * @returns {Promise<{ticketId:number, ticketCode:string, status:string, technicianId:number, assignedAt:Date, assignedBy:number}>}
   * @throws {AppError} TICKET_NOT_FOUND (404); TICKET_ALREADY_ASSIGNED (409); TECHNICIAN_NOT_FOUND (404);
   *   TECH_NOT_ELIGIBLE (400, vi phạm QT-08). Lỗi bất kỳ làm hoàn tác giao dịch, phiếu giữ nguyên MOI.
   */
  assign(ticketId, technicianId, nguoiThucHien = 0) {
    return this.repo.runInTransaction(async (tx) => {
      const phieu = await tx.lockById(ticketId);
      if (!phieu) throw new AppError('TICKET_NOT_FOUND', `Không tìm thấy phiếu có mã ${ticketId}.`, undefined, 'ticket_id');
      if (phieu.status !== 'MOI' || phieu.technicianId !== null) {
        throw new AppError('TICKET_ALREADY_ASSIGNED',
          'Phiếu đã có kỹ thuật viên hoặc không còn ở trạng thái MOI; hãy tải lại để xem người đang phụ trách.',
          { status: phieu.status, technician_id: phieu.technicianId }, 'ticket_id');
      }
      const ktv = await tx.findTechnicianForCheck(technicianId, phieu.issueCategory);
      if (!ktv) {
        throw new AppError('TECHNICIAN_NOT_FOUND', `Không tìm thấy kỹ thuật viên có mã ${technicianId}.`, undefined, 'technician_id');
      }
      const lyDo = lyDoKhongDuDieuKien(phieu, ktv);
      if (lyDo) throw new AppError('TECH_NOT_ELIGIBLE', lyDo, undefined, 'technician_id');

      const assignedAt = await tx.setAssignment(ticketId, technicianId);
      await tx.insertLog({
        ticketId, oldStatus: 'MOI', newStatus: 'DA_PHAN_CONG', oldTechnicianId: null,
        newTechnicianId: technicianId, reason: null, changedBy: nguoiThucHien });
      return { ticketId, ticketCode: phieu.ticketCode, status: 'DA_PHAN_CONG', technicianId, assignedAt, assignedBy: nguoiThucHien };
    });
  }

  /**
   * Sửa thông tin phiếu CHƯA phân công (UC2 mở rộng). Đổi mức ưu tiên thì hạn cam kết tính lại từ thời điểm tiếp nhận (QT-04).
   * @param {number} ticketId
   * @param {{deviceName?:string, issueCategory?:string, priority?:string}} thayDoi Đã qua validateTicketUpdate.
   * @returns {Promise<object>} Phiếu sau khi sửa.
   * @throws {AppError} TICKET_NOT_FOUND (404); TICKET_NOT_EDITABLE (409) khi phiếu không còn ở trạng thái MOI.
   */
  async update(ticketId, thayDoi) {
    await this.repo.runInTransaction(async (tx) => {
      const phieu = await tx.lockById(ticketId);
      if (!phieu) throw new AppError('TICKET_NOT_FOUND', `Không tìm thấy phiếu có mã ${ticketId}.`, undefined, 'ticket_id');
      if (phieu.status !== 'MOI') {
        throw new AppError('TICKET_NOT_EDITABLE',
          'Chỉ sửa được phiếu ở trạng thái Mới; phiếu này đã được xử lý tiếp.', { status: phieu.status }, 'ticket_id');
      }
      const dueDate = thayDoi.priority && thayDoi.priority !== phieu.priority
        ? hanCamKet(new Date(phieu.receivedAt), thayDoi.priority) : undefined;
      await tx.updateFields(ticketId, { ...thayDoi, dueDate });
    });
    return this.get(ticketId);
  }

  /**
   * Hủy phiếu (xóa mềm, QT-13): chuyển sang DA_HUY và ghi ticket_status_log (QT-06) trong cùng giao dịch.
   * Chỉ hủy được phiếu MOI hoặc DA_PHAN_CONG (chưa bắt đầu xử lý).
   * @param {number} ticketId
   * @param {string} lyDo Lý do hủy, đã qua validateCancel.
   * @param {number} [nguoiThucHien] 0 khi chưa có đăng nhập (TD-23).
   * @throws {AppError} TICKET_NOT_FOUND (404); TICKET_NOT_CANCELLABLE (409).
   */
  async cancel(ticketId, lyDo, nguoiThucHien = 0) {
    await this.repo.runInTransaction(async (tx) => {
      const phieu = await tx.lockById(ticketId);
      if (!phieu) throw new AppError('TICKET_NOT_FOUND', `Không tìm thấy phiếu có mã ${ticketId}.`, undefined, 'ticket_id');
      if (!['MOI', 'DA_PHAN_CONG'].includes(phieu.status)) {
        throw new AppError('TICKET_NOT_CANCELLABLE',
          'Chỉ hủy được phiếu ở trạng thái Mới hoặc Đã phân công.', { status: phieu.status }, 'ticket_id');
      }
      await tx.setStatus(ticketId, 'DA_HUY');
      await tx.insertLog({ ticketId, oldStatus: phieu.status, newStatus: 'DA_HUY', oldTechnicianId: phieu.technicianId,
        newTechnicianId: phieu.technicianId, reason: lyDo, changedBy: nguoiThucHien });
    });
    return this.get(ticketId);
  }
}

module.exports = { TicketService };
