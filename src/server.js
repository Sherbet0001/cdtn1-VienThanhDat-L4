'use strict';
const { Pool } = require('pg');
const { buildApp } = require('./app');

if (!process.env.DATABASE_URL) {
  console.error('Thiếu biến môi trường DATABASE_URL. Xem .env.example.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  connectionTimeoutMillis: 3000,   // không để yêu cầu treo vô hạn khi không có kết nối
});

const port = Number(process.env.PORT || 3000);
const server = buildApp(pool).listen(port, () => {
  console.log(`Máy chủ đang chạy tại http://localhost:${port}`);
});

// Dọn dẹp khi dừng: đóng cổng và trả kết nối về cơ sở dữ liệu trước khi thoát.
for (const tinHieu of ['SIGINT', 'SIGTERM']) {
  process.on(tinHieu, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
