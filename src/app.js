'use strict';
const path = require('node:path');
const express = require('express');
const TechnicianRepository = require('./repositories/technician.repository');
const { TechnicianService } = require('./services/technician.service');
const technicianRoutes = require('./routes/technician.routes');
const TicketRepository = require('./repositories/ticket.repository');
const { TicketService } = require('./services/ticket.service');
const ticketRoutes = require('./routes/ticket.routes');
const { taoLogger, ganRequestId } = require('./logger');
const { taoXuLyLoi } = require('./middleware/xuLyLoi');
const UserRepository = require('./repositories/user.repository');
const { AuthService } = require('./services/auth.service');
const authRoutes = require('./routes/auth.routes');
const { taoXacThuc } = require('./middleware/xacThuc');
const { taoGioiHan } = require('./middleware/gioiHanDangNhap');

const DO_DAI_BI_MAT_TOI_THIEU = 32;   // khóa ký token ngắn thì dò được; bắt buộc đủ dài ngay từ lúc khởi động

/**
 * Ghép các lớp lại với nhau. Nhận pool để kiểm thử được bằng đối tượng giả.
 * @param {object} pool
 * @param {{logger?:object, jwtSecret:string, tokenTtlGiay?:number}} tuyChon jwtSecret bắt buộc (từ biến môi trường JWT_SECRET).
 */
function buildApp(pool, { logger = taoLogger(), jwtSecret, tokenTtlGiay = 3600 } = {}) {
  if (typeof jwtSecret !== 'string' || jwtSecret.length < DO_DAI_BI_MAT_TOI_THIEU) {
    throw new Error(`Thiếu JWT_SECRET hoặc quá ngắn (cần ít nhất ${DO_DAI_BI_MAT_TOI_THIEU} ký tự). Xem .env.example.`);
  }
  const app = express();
  app.use(ganRequestId(logger));   // đầu tiên: mọi dòng log của một yêu cầu cùng một requestId
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch (err) {
      logger.warn('kiểm tra sức khỏe: không kết nối được cơ sở dữ liệu', { requestId: req.requestId, err });
      res.status(503).json({ status: 'degraded', db: 'không kết nối được' });
    }
  });

  // Đăng nhập là đường công khai duy nhất của /api; mọi đường còn lại phải có token hợp lệ (TD-34, OWASP A07).
  const authService = new AuthService(new UserRepository(pool), { bimat: jwtSecret, ttlGiay: tokenTtlGiay });
  app.use('/api/auth', authRoutes(authService, taoGioiHan()));
  app.use('/api', taoXacThuc(jwtSecret));

  const technicianService = new TechnicianService(new TechnicianRepository(pool));
  app.use('/api/technicians', technicianRoutes(technicianService));
  app.use('/api/tickets', ticketRoutes(new TicketService(new TicketRepository(pool))));

  // Giao diện tĩnh (thư mục web/). Đặt SAU /api để đường dẫn API không bị file tĩnh che; không cần bước build.
  app.use(express.static(path.join(__dirname, '..', 'web')));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Đường dẫn không tồn tại.' } });
  });

  // Bộ xử lý lỗi cuối (src/middleware/xuLyLoi.js): ghi log một lần, trả mã tra cứu, không lộ chi tiết kỹ thuật.
  app.use(taoXuLyLoi(logger));

  return app;
}

module.exports = { buildApp };
