'use strict';
/**
 * Phần HTTP dùng chung của mọi router. Bảng HTTP_THEO_MA là chỗ DUY NHẤT trong dự án đổi mã lỗi nghiệp vụ sang mã HTTP.
 * Khung lỗi duy nhất của API: { error: { code, message, field?, fields?, details? } } (TD-19).
 */
const HTTP_THEO_MA = Object.freeze({
  VALIDATION_ERROR: 400,
  TECHNICIAN_NOT_FOUND: 404,
  TICKET_NOT_FOUND: 404,
  TECHNICIAN_HAS_OPEN_TICKETS: 409,   // xung đột với trạng thái hiện tại của dữ liệu
  TICKET_ALREADY_ASSIGNED: 409,       // phiếu đã có người hoặc không còn MOI (QT-06, QT-07)
  TECH_NOT_ELIGIBLE: 400,             // vi phạm QT-08: dữ liệu chọn sai, theo hợp đồng API mục 2.3
});

/** Lỗi đã biết -> thân JSON của khung lỗi. */
function loiJson(e) {
  const error = { code: e.code, message: e.message };
  if (e.field !== undefined) error.field = e.field;
  if (e.fields) error.fields = e.fields;
  if (e.chiTiet) error.details = e.chiTiet;
  return { error };
}

/** Bọc hàm xử lý bất đồng bộ: lỗi đã biết -> JSON có mã HTTP; lỗi lạ -> chuyển cho bộ xử lý lỗi cuối (500). */
const boc = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    const ma = e && e.code && HTTP_THEO_MA[e.code];
    if (!ma) return next(e);   // lỗi hệ thống: để bộ xử lý lỗi cuối ghi ERROR (đúng một lần)
    // Lỗi nghiệp vụ là chuyện bình thường: INFO, chỉ ghi mã và trường sai, không ghi giá trị người dùng nhập.
    if (req.logger) req.logger.info('yêu cầu bị từ chối theo quy tắc nghiệp vụ', { requestId: req.requestId, ma_loi: e.code, field: e.field });
    return res.status(ma).json(loiJson(e));
  }
};

module.exports = { HTTP_THEO_MA, loiJson, boc };
