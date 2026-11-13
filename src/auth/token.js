'use strict';
/**
 * Token JWT HS256 (RFC 7519) viết bằng module crypto có sẵn của Node.
 * Chỉ chấp nhận đúng thuật toán HS256 (không nhận "none" hay thuật toán khác), so chữ ký bằng phép so sánh thời gian
 * cố định, kiểm tra hạn dùng (exp). Mọi lý do từ chối đều trả CÙNG một thông điệp để không giúp kẻ tấn công đoán.
 * Nội dung token (claims): sub = mã người dùng, role, cid = mã trung tâm (null với quản trị), iat, exp (giây).
 */
const crypto = require('node:crypto');
const { AppError } = require('../errors/AppError');

const VAI_TRO = Object.freeze(['QUAN_LY', 'QUAN_TRI']);
const TIEU_DE = { alg: 'HS256', typ: 'JWT' };
const b64u = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

const tuChoi = () => new AppError('UNAUTHENTICATED', 'Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');

function chuKy(phanTruoc, bimat) {
  return crypto.createHmac('sha256', bimat).update(phanTruoc).digest('base64url');
}

/**
 * @param {{userId:number, role:string, centerId:number|null}} nguoi
 * @param {string} bimat Khóa ký (biến môi trường JWT_SECRET)
 * @param {{ttlGiay?:number, bayGio?:number}} [tuyChon] bayGio: mili giây hiện tại (để kiểm thử)
 * @returns {string} token dạng tieuDe.noiDung.chuKy
 */
function kyToken(nguoi, bimat, { ttlGiay = 3600, bayGio = Date.now() } = {}) {
  const iat = Math.floor(bayGio / 1000);
  const phanTruoc = `${b64u(TIEU_DE)}.${b64u({ sub: String(nguoi.userId), role: nguoi.role, cid: nguoi.centerId ?? null, iat, exp: iat + ttlGiay })}`;
  return `${phanTruoc}.${chuKy(phanTruoc, bimat)}`;
}

/**
 * @returns {{userId:number, role:string, centerId:number|null}}
 * @throws {AppError} UNAUTHENTICATED khi token sai, bị sửa, hết hạn hoặc dùng thuật toán khác.
 */
function xacMinhToken(token, bimat, bayGio = Date.now()) {
  if (typeof token !== 'string' || token.length > 2048) throw tuChoi();
  const phan = token.split('.');
  if (phan.length !== 3) throw tuChoi();
  let tieuDe; let noiDung;
  try {
    tieuDe = JSON.parse(Buffer.from(phan[0], 'base64url').toString('utf8'));
    noiDung = JSON.parse(Buffer.from(phan[1], 'base64url').toString('utf8'));
  } catch {
    throw tuChoi();
  }
  if (!tieuDe || tieuDe.alg !== 'HS256') throw tuChoi();
  const mong = Buffer.from(chuKy(`${phan[0]}.${phan[1]}`, bimat));
  const co = Buffer.from(phan[2]);
  if (mong.length !== co.length || !crypto.timingSafeEqual(mong, co)) throw tuChoi();
  if (!noiDung || !Number.isFinite(noiDung.exp) || noiDung.exp <= Math.floor(bayGio / 1000)) throw tuChoi();
  const userId = Number(noiDung.sub);
  if (!Number.isInteger(userId) || userId < 1 || !VAI_TRO.includes(noiDung.role)) throw tuChoi();
  const centerId = noiDung.cid === null || noiDung.cid === undefined ? null : Number(noiDung.cid);
  if (centerId !== null && (!Number.isInteger(centerId) || centerId < 1)) throw tuChoi();
  return { userId, role: noiDung.role, centerId };
}

module.exports = { kyToken, xacMinhToken, VAI_TRO };
