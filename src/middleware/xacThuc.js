'use strict';
/** Middleware xác thực: đọc "Authorization: Bearer <token>", kiểm token, đặt req.user. Thiếu hoặc sai -> 401 (khung lỗi chung). */
const { xacMinhToken } = require('../auth/token');
const { HTTP_THEO_MA, loiJson } = require('../routes/http');
const { chuaDangNhap } = require('../auth/phanQuyen');

function taoXacThuc(bimat, { bayGio = Date.now } = {}) {
  return (req, res, next) => {
    const tieuDe = req.headers.authorization || '';
    const kq = /^Bearer ([A-Za-z0-9._-]+)$/.exec(tieuDe);
    try {
      if (!kq) throw chuaDangNhap();
      const t = xacMinhToken(kq[1], bimat, bayGio());
      req.user = { id: t.userId, role: t.role, centerId: t.centerId };
      return next();
    } catch (e) {
      if (!e || !HTTP_THEO_MA[e.code]) return next(e);
      if (req.logger) req.logger.info('yêu cầu bị từ chối: chưa xác thực', { requestId: req.requestId, ma_loi: e.code });
      res.setHeader('WWW-Authenticate', 'Bearer');
      return res.status(HTTP_THEO_MA[e.code]).json(loiJson(e));
    }
  };
}

module.exports = { taoXacThuc };
