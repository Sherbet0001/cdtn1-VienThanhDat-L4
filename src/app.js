'use strict';
const express = require('express');
const TechnicianRepository = require('./repositories/technician.repository');
const { TechnicianService } = require('./services/technician.service');
const technicianRoutes = require('./routes/technician.routes');

/** Ghép các lớp lại với nhau. Nhận pool để kiểm thử được bằng đối tượng giả. */
function buildApp(pool) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'không kết nối được' });
    }
  });

  const technicianService = new TechnicianService(new TechnicianRepository(pool));
  app.use('/api/technicians', technicianRoutes(technicianService));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Đường dẫn không tồn tại.' } });
  });

  // Bộ xử lý lỗi cuối: không bao giờ trả vết ngăn xếp hay lỗi thô của thư viện cho người gọi.
  app.use((err, _req, res, _next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Nội dung gửi lên không phải JSON hợp lệ.', field: 'body' } });
    }
    console.error('Lỗi không lường trước:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau.' } });
  });

  return app;
}

module.exports = { buildApp };
