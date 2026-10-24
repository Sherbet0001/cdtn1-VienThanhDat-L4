// Các lệnh gọi API phiếu (hợp đồng: docs/api-contract.md mục 2.1, 2.2, 2.3, 2.9).
import { goi, taoQuery } from './client.js';

/** Phiếu MOI chưa phân công. @returns {Promise<{page:number, limit:number, total:number, items:object[]}>} */
export const listUnassigned = (tham = {}) => goi(`/api/tickets/unassigned${taoQuery(tham)}`);

/** Chi tiết một phiếu. */
export const getTicket = (id) => goi(`/api/tickets/${id}`);

/** Kỹ thuật viên đủ điều kiện (QT-08). @returns {Promise<{ticket_id:number, issue_category:string, technicians:object[]}>} */
export const listEligible = (id) => goi(`/api/tickets/${id}/eligible-technicians`);

/** Gán kỹ thuật viên cho phiếu MOI. */
export const assign = (id, technicianId) =>
  goi(`/api/tickets/${id}/assignment`, { method: 'POST', body: { technician_id: technicianId } });

/** Tiếp nhận phiếu mới. */
export const createTicket = (body) => goi('/api/tickets', { method: 'POST', body });
