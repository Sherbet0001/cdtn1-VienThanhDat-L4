'use strict';
/**
 * Băm và kiểm tra mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện ngoài).
 * Định dạng lưu trong CSDL: scrypt$N$r$p$muối(base64)$băm(base64). Mỗi mật khẩu một muối ngẫu nhiên 16 byte, nên hai
 * người trùng mật khẩu vẫn có hai chuỗi băm khác nhau. Mật khẩu gốc KHÔNG được lưu và không thể suy ngược từ chuỗi băm.
 */
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const THAM_SO_MAC_DINH = Object.freeze({ N: 16384, r: 8, p: 1 });
const DO_DAI_BAM = 64;

/**
 * @param {string} matKhau
 * @param {{N:number, r:number, p:number}} [tham] Chỉ nên hạ thấp trong kiểm thử để chạy nhanh.
 * @returns {Promise<string>} chuỗi băm đầy đủ tham số để kiểm tra lại sau này
 */
async function bamMatKhau(matKhau, tham = THAM_SO_MAC_DINH) {
  const muoi = crypto.randomBytes(16);
  const bam = await scrypt(matKhau, muoi, DO_DAI_BAM, { N: tham.N, r: tham.r, p: tham.p });
  return `scrypt$${tham.N}$${tham.r}$${tham.p}$${muoi.toString('base64')}$${bam.toString('base64')}`;
}

/**
 * So khớp mật khẩu với chuỗi băm bằng phép so sánh thời gian cố định.
 * @returns {Promise<boolean>} false khi chuỗi băm sai định dạng thay vì ném lỗi.
 */
async function kiemTraMatKhau(matKhau, chuoiBam) {
  const phan = String(chuoiBam || '').split('$');
  if (phan.length !== 6 || phan[0] !== 'scrypt') return false;
  const [, N, r, p, muoi, bam] = phan;
  const goc = Buffer.from(bam, 'base64');
  const tham = { N: Number(N), r: Number(r), p: Number(p) };
  // Chặn tham số vô lý (chuỗi băm bị sửa) để không bị dùng làm đòn tiêu hao bộ nhớ.
  if (![tham.N, tham.r, tham.p].every(Number.isInteger) || tham.N < 2 || tham.N > 1048576 || tham.r < 1 || tham.r > 32
    || tham.p < 1 || tham.p > 16 || goc.length < 16) return false;
  let tinh;
  try {
    tinh = await scrypt(matKhau, Buffer.from(muoi, 'base64'), goc.length, tham);
  } catch {
    return false;
  }
  return tinh.length === goc.length && crypto.timingSafeEqual(tinh, goc);
}

module.exports = { bamMatKhau, kiemTraMatKhau, THAM_SO_MAC_DINH };
