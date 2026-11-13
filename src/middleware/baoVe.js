'use strict';
/**
 * Các "chốt chặn" phân quyền gắn vào từng route TRƯỚC hàm xử lý. Quy tắc nằm ở src/auth/phanQuyen.js; ở đây chỉ nối
 * quy tắc với yêu cầu HTTP và đổi lỗi nghiệp vụ thành 401/403/404 theo bảng HTTP_THEO_MA (một chỗ duy nhất).
 */
const { HTTP_THEO_MA, loiJson } = require('../routes/http');
const { kiemTraTrungTam, trungTamDeLoc } = require('../auth/phanQuyen');
const { validateId } = require('../validators/technician.validator');

/** Bọc hàm kiểm tra (đồng bộ hoặc không): ném lỗi đã biết -> JSON có mã HTTP; lỗi lạ -> bộ xử lý lỗi cuối. */
const chan = (kiem) => async (req, res, next) => {
  try {
    await kiem(req);
    next();
  } catch (e) {
    const ma = e && e.code && HTTP_THEO_MA[e.code];
    if (!ma) return next(e);
    if (req.logger) req.logger.info('yêu cầu bị từ chối theo quy tắc truy cập', { requestId: req.requestId, ma_loi: e.code, field: e.field });
    return res.status(ma).json(loiJson(e));
  }
};

/** Danh sách: ép tham số center_id theo người dùng (quản lý chỉ thấy trung tâm của mình). */
const locTheoTrungTam = chan((req) => {
  const loc = trungTamDeLoc(req.user, req.query.center_id);
  if (loc !== undefined) req.query.center_id = loc;
});

/**
 * Tài nguyên có mã trong đường dẫn (/:id): đọc đối tượng bằng service.get rồi kiểm trung tâm sở hữu.
 * Mã sai định dạng -> 400, không tồn tại -> 404 (từ service), khác trung tâm -> 403.
 */
const chanTheoMa = (service) => chan(async (req) => {
  const doiTuong = await service.get(validateId(req.params.id));
  kiemTraTrungTam(req.user, doiTuong.centerId);
});

/**
 * Thân yêu cầu có center_id (tạo mới, sửa toàn bộ): quản lý chỉ được ghi vào trung tâm của mình; nếu bỏ trống thì mặc định
 * là trung tâm của mình. Giá trị không phải số nguyên để validator trả 400.
 */
const chanTrungTamTrongThan = chan((req) => {
  if (!req.user) kiemTraTrungTam(req.user, 0);
  const than = req.body;
  if (than === null || typeof than !== 'object' || Array.isArray(than)) return;
  if (req.user.role === 'QUAN_LY' && (than.center_id === undefined || than.center_id === null)) {
    than.center_id = req.user.centerId;
    return;
  }
  if (Number.isInteger(than.center_id)) kiemTraTrungTam(req.user, than.center_id);
});

module.exports = { chan, locTheoTrungTam, chanTheoMa, chanTrungTamTrongThan };
