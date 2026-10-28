'use strict';
/**
 * Bộ xử lý lỗi CUỐI CÙNG của ứng dụng (đăng ký sau mọi route). Lỗi nghiệp vụ đã được routes/http.js (boc) đổi
 * thành 4xx và ghi INFO; mọi thứ lọt tới đây là lỗi HỆ THỐNG: ghi ERROR đúng MỘT lần (kèm ngăn xếp và requestId),
 * trả thông điệp chung + mã tra cứu (= requestId), KHÔNG bao giờ trả err.stack, câu SQL hay tên bảng.
 */
const MA_MAT_KET_NOI = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN',
  '57P01', '57P03', '08000', '08001', '08003', '08006']);

/** Lỗi do không nói chuyện được với cơ sở dữ liệu (không phải lỗi logic)? Gồm cả AggregateError của Node 20+. */
function laLoiMatKetNoi(err) {
  if (!err) return false;
  if (MA_MAT_KET_NOI.has(err.code)) return true;
  if (Array.isArray(err.errors) && err.errors.some(laLoiMatKetNoi)) return true;
  return /timeout exceeded when trying to connect|Connection terminated|connect ECONNREFUSED/i.test(err.message || '');
}

function taoXuLyLoi(logger) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    const requestId = req.requestId || '-';
    if (err && err.type === 'entity.parse.failed') {
      logger.info('thân yêu cầu không phải JSON hợp lệ', { requestId });
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Nội dung gửi lên không phải JSON hợp lệ.', field: 'body' } });
    }
    if (err && err.type === 'entity.too.large') {
      logger.info('thân yêu cầu quá lớn', { requestId });
      return res.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Nội dung gửi lên quá lớn.' } });
    }
    const matKetNoi = laLoiMatKetNoi(err);
    logger.error(matKetNoi ? 'không kết nối được cơ sở dữ liệu' : 'lỗi hệ thống không lường trước',
      { requestId, phuong_thuc: req.method, duong_dan: (req.originalUrl || req.url || '').split('?')[0], err });
    return res.status(matKetNoi ? 503 : 500).json({ error: {
      code: matKetNoi ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
      message: `Hệ thống đang gặp sự cố. Vui lòng thử lại sau. Mã tra cứu: ${requestId}`,
      requestId } });
  };
}

module.exports = { taoXuLyLoi, laLoiMatKetNoi };
