// Các lệnh gọi API kỹ thuật viên (hợp đồng: docs/api-contract.md mục 2.8).
import { goi, taoQuery } from './client.js';

/** @returns {Promise<{items:object[], limit:number, offset:number}>} */
export const listTechnicians = (tham = {}) => goi(`/api/technicians${taoQuery(tham)}`);
