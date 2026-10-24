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

/**
 * Dữ liệu vào sai định dạng.
 * @param {string} message Câu thông báo chung.
 * @param {Array<{field:string, reason:string}>} fields Mọi trường sai (hợp đồng lỗi: error.fields).
 * Thuộc tính `field` lấy trường sai đầu tiên để bên gọi đơn giản vẫn có chỗ bám.
 */
class ValidationError extends AppError {
  constructor(message, fields) {
    super('VALIDATION_ERROR', message, undefined, fields[0] && fields[0].field);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

module.exports = { AppError, ValidationError };
