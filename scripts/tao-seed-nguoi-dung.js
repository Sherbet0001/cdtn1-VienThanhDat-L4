'use strict';
/**
 * Sinh seeds/005_app_users.sql: 1 tài khoản quản trị và 6 tài khoản quản lý (mỗi trung tâm 1 người).
 * Mật khẩu của TẤT CẢ tài khoản mẫu là một chuỗi mẫu công khai (xem docs/deployment-guide.md); trong CSDL chỉ có chuỗi băm
 * scrypt, mỗi tài khoản một muối ngẫu nhiên. Chạy:  node scripts/tao-seed-nguoi-dung.js
 * Đây là DỮ LIỆU MẪU để chạy thử, KHÔNG phải bí mật: khi triển khai thật phải đổi hết mật khẩu.
 */
const fs = require('node:fs');
const path = require('node:path');
const { bamMatKhau } = require('../src/auth/password');

const MAT_KHAU_MAU = 'Mekong@2026';
const TRUNG_TAM = [1, 2, 3, 4, 5, 6];

(async () => {
  const dong = [];
  const them = async (username, ten, role, centerId) => {
    const bam = await bamMatKhau(MAT_KHAU_MAU);
    dong.push(`  ('${username}', '${bam}', '${ten}', '${role}', ${centerId === null ? 'NULL' : centerId})`);
  };
  await them('admin', 'Quản trị hệ thống', 'QUAN_TRI', null);
  for (const c of TRUNG_TAM) await them(`quanly_tt${c}`, `Quản lý trung tâm ${c}`, 'QUAN_LY', c);

  const sql = [
    '-- Sinh bởi scripts/tao-seed-nguoi-dung.js (TD-34). Tài khoản mẫu để chạy thử; mật khẩu mẫu ghi ở docs/deployment-guide.md.',
    '-- Cột password_hash là chuỗi băm scrypt (muối riêng mỗi dòng), KHÔNG phải mật khẩu gốc. ON CONFLICT: chạy lại không nhân đôi.',
    'INSERT INTO app_user (username, password_hash, full_name, role, center_id) VALUES',
    dong.join(',\n'),
    'ON CONFLICT DO NOTHING;',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(__dirname, '..', 'seeds', '005_app_users.sql'), sql, 'utf8');
  console.log(`Đã ghi seeds/005_app_users.sql (${dong.length} tài khoản).`);
})();
