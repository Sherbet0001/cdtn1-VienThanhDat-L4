'use strict';
const { Pool } = require('pg');
const { buildApp } = require('./app');
const { taoLogger } = require('./logger');
const { taoPool } = require('./db/pool');

const logger = taoLogger();

if (!process.env.DATABASE_URL) {
  logger.error('Thiếu biến môi trường DATABASE_URL. Xem .env.example.');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error('Thiếu JWT_SECRET hoặc quá ngắn (cần ít nhất 32 ký tự). Xem .env.example.');
  process.exit(1);
}

const pool = taoPool(Pool, {
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
}, logger);

const port = Number(process.env.PORT || 3000);
const server = buildApp(pool, { logger, jwtSecret: process.env.JWT_SECRET, tokenTtlGiay: Number(process.env.JWT_TTL_SECONDS || 3600) }).listen(port, () => {
  logger.info('máy chủ đã khởi động', { port, url: `http://localhost:${port}` });
});

// Dọn dẹp khi dừng: đóng cổng và trả kết nối về cơ sở dữ liệu trước khi thoát.
for (const tinHieu of ['SIGINT', 'SIGTERM']) {
  process.on(tinHieu, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
