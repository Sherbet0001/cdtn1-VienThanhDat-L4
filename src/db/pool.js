'use strict';
/**
 * Tạo Pool kết nối PostgreSQL và gắn bộ lắng nghe lỗi.
 * Khi CSDL bị tắt hoặc mất mạng, các kết nối RẢNH trong pool bị cắt và pool phát sự kiện 'error'.
 * Sự kiện 'error' không có người nghe sẽ làm CẢ TIẾN TRÌNH Node.js thoát (BUG-002), nên phải nghe ở đây:
 * ghi cảnh báo và để pool tự mở kết nối mới ở yêu cầu kế tiếp.
 * @param {new (cauHinh: object) => import('node:events').EventEmitter} PoolClass Lớp Pool của pg (truyền vào để kiểm thử bằng lớp giả).
 * @param {{connectionString: string, max?: number}} cauHinh
 * @param {{warn: Function}} logger
 */
function taoPool(PoolClass, cauHinh, logger) {
  const pool = new PoolClass({
    ...cauHinh,
    connectionTimeoutMillis: 3000,   // không để yêu cầu treo vô hạn khi không có kết nối
  });
  pool.on('error', (err) => {
    logger.warn('kết nối CSDL rảnh bị ngắt (CSDL tắt hoặc mất mạng); pool sẽ mở lại khi có yêu cầu', { err });
  });
  return pool;
}

module.exports = { taoPool };
