'use strict';
/** POST /api/auth/login: công khai (không cần token). Giới hạn số lần sai (src/middleware/gioiHanDangNhap.js). */
const { AppError } = require('../errors/AppError');
const { boc } = require('./http');

function makeHandlers(service, gioiHan) {
  return {
    login: boc(async (req, res) => {
      const ten = req.body && typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase().slice(0, 50) : '';
      const khoa = `${req.ip || 'khong-ro'}|${ten}`;
      const cho = gioiHan.biChan(khoa);
      if (cho > 0) {
        res.setHeader('Retry-After', String(cho));
        throw new AppError('TOO_MANY_REQUESTS', `Đăng nhập sai quá nhiều lần. Thử lại sau ${cho} giây.`);
      }
      try {
        const kq = await service.login(req.body);
        gioiHan.xoa(khoa);
        if (req.logger) req.logger.info('đăng nhập thành công', { requestId: req.requestId, user_id: kq.user.user_id, role: kq.user.role });
        res.json(kq);
      } catch (e) {
        if (e && e.code === 'INVALID_CREDENTIALS') gioiHan.ghiSai(khoa);
        throw e;
      }
    }),
  };
}

function authRoutes(service, gioiHan) {
  const express = require('express');
  const r = express.Router();
  r.post('/login', makeHandlers(service, gioiHan).login);
  return r;
}

module.exports = authRoutes;
module.exports.makeHandlers = makeHandlers;
