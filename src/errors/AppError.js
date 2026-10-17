'use strict';
/**
 * Lỗi nghiệp vụ có MÃ LỖI theo docs/api-contract.md (ví dụ TECHNICIAN_NOT_FOUND).
 * Tầng service và validator ném lỗi này; chỉ tầng routes mới đổi mã nghiệp vụ sang mã HTTP.
 * Nhờ vậy service không biết gì về HTTP và kiểm thử được mà không cần máy chủ web.
 */
class AppError extends Error {
  constructor(code, message, chiTiet = undefined, field = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (chiTiet !== undefined) this.chiTiet = chiTiet;
    if (field !== undefined) this.field = field;   // tên trường gây lỗi, khớp "field" trong hợp đồng API
  }
}

/** Dữ liệu vào sai định dạng; cacTruong là danh sách { truong, ly_do }, field là trường sai đầu tiên. */
class ValidationError extends AppError {
  constructor(message, cacTruong) {
    super('VALIDATION_ERROR', message, { cac_truong: cacTruong }, cacTruong[0] && cacTruong[0].truong);
    this.name = 'ValidationError';
  }
}

module.exports = { AppError, ValidationError };
