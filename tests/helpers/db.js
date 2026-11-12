'use strict';
/**
 * Hạ tầng cho các test chạy trên PostgreSQL THẬT (integration và API).
 *
 * - Cần biến môi trường TEST_DATABASE_URL trỏ tới một CSDL có tên kết thúc bằng "_test".
 *   Tên kết thúc bằng "_test" là rào chắn an toàn: resetDb() xóa sạch dữ liệu nên KHÔNG BAO GIỜ được chạy trên l4_dev.
 * - Tiền điều kiện do MÃ dựng (resetDb + các hàm them*), không dựa vào dữ liệu có sẵn trên máy.
 * - Chưa đặt TEST_DATABASE_URL thì các test cần CSDL được BỎ QUA kèm lý do (không im lặng PASS).
 */
const path = require('node:path');

const URL_THU = process.env.TEST_DATABASE_URL || '';
const coCsdl = URL_THU !== '';
const LY_DO_BO_QUA = 'Chưa đặt TEST_DATABASE_URL (CSDL PostgreSQL có tên kết thúc bằng _test); xem README mục "Chạy kiểm thử".';

const GOC = path.resolve(__dirname, '..', '..');

/** Tên CSDL trong chuỗi kết nối. */
function tenCsdl(url) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
}

/** Từ chối chạy trên CSDL không phải CSDL thử. */
function kiemTraAnToan(url) {
  if (!/_test$/.test(tenCsdl(url))) {
    throw new Error(`TEST_DATABASE_URL phải trỏ tới CSDL có tên kết thúc bằng "_test" (đang là "${tenCsdl(url)}"). ` +
      'Từ chối chạy vì resetDb() xóa sạch dữ liệu.');
  }
}

const KHOA_TAO_CSDL = 424243;   // khóa tư vấn riêng cho bước tạo CSDL thử
const KHOA_DOC = 424242;   // khóa tư vấn: mỗi lần chỉ MỘT tệp test dùng CSDL thử (node --test chạy các tệp song song)

/**
 * Tạo CSDL thử nếu máy chủ chưa có (kết nối tới CSDL "postgres" của cùng máy chủ).
 * Cần để `docker compose exec api npm test` chạy được trên máy chỉ vừa dựng xong, không phải tạo tay.
 * Chỉ được gọi sau kiemTraAnToan(), nên tên luôn kết thúc bằng "_test".
 */
async function baoDamCsdlThu(url) {
  const { Client } = require('pg');
  const ten = tenCsdl(url);
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const kn = new Client({ connectionString: admin.toString(), connectionTimeoutMillis: 8000 });
  await kn.connect();
  try {
    // Khóa tư vấn: hai tệp test chạy song song không được cùng CREATE DATABASE (sẽ báo trùng khóa chính của pg_database)
    await kn.query('SELECT pg_advisory_lock($1)', [KHOA_TAO_CSDL]);
    try {
      const co = await kn.query('SELECT 1 FROM pg_database WHERE datname = $1', [ten]);
      if (co.rowCount === 0) {
        try {
          await kn.query(`CREATE DATABASE "${ten.replace(/"/g, '""')}"`);
        } catch (loi) {
          // 42P04 = CSDL đã tồn tại; 23505 = trùng khóa duy nhất của pg_database (cùng nguyên nhân, do tạo đồng thời)
          if (loi.code !== '42P04' && loi.code !== '23505') throw loi;
        }
      }
    } finally {
      await kn.query('SELECT pg_advisory_unlock($1)', [KHOA_TAO_CSDL]);
    }
  } finally {
    await kn.end();
  }
}

/**
 * Tạo pool tới CSDL thử, giữ khóa độc quyền, rồi áp dụng migrations/ (bỏ qua tệp đã chạy).
 * Phải gọi dongPool(pool) ở cuối để nhả khóa.
 */
async function taoPoolThu() {
  kiemTraAnToan(URL_THU);
  await baoDamCsdlThu(URL_THU);
  const { Pool } = require('pg');
  const { listSqlFiles, applyFiles } = require('../../src/db/runner');
  const pool = new Pool({ connectionString: URL_THU, max: 4, connectionTimeoutMillis: 8000 });
  pool.khoa = await pool.connect();
  await pool.khoa.query('SELECT pg_advisory_lock($1)', [KHOA_DOC]);
  await applyFiles(pool.khoa, listSqlFiles(path.join(GOC, 'migrations')), { track: true });
  return pool;
}

/** Nhả khóa độc quyền và đóng pool. */
async function dongPool(pool) {
  await pool.khoa.query('SELECT pg_advisory_unlock($1)', [KHOA_DOC]);
  pool.khoa.release();
  await pool.end();
}

/** Xóa sạch dữ liệu của mọi bảng nghiệp vụ và đặt lại bộ đếm id (giữ nguyên cấu trúc bảng). */
async function resetDb(pool) {
  await pool.query(
    'TRUNCATE ticket_status_log, appointment, ticket, technician_skill, technician, customer RESTART IDENTITY CASCADE');
}

let demMa = 900000;   // mã phiếu dựng sẵn bắt đầu từ BH-900001 để không đụng mã do API sinh (BH-000001...)

/** @returns {Promise<number>} customer_id */
async function themKhach(pool, { ten = 'Khách Thử', sdt = '0901234567' } = {}) {
  const { rows } = await pool.query('INSERT INTO customer (full_name, phone) VALUES ($1, $2) RETURNING customer_id', [ten, sdt]);
  return Number(rows[0].customer_id);
}

/**
 * @param {{ten?:string, center?:number, hoatDong?:boolean, kyNang?:Record<string, number>}} o
 *   kyNang: { MAN_HINH: 4 } nghĩa là thành thạo nhóm MAN_HINH mức 4.
 * @returns {Promise<number>} technician_id
 */
async function themKtv(pool, { ten = 'KTV Thử', center = 4, hoatDong = true, kyNang = {} } = {}) {
  const { rows } = await pool.query(
    "INSERT INTO technician (full_name, center_id, level, is_active) VALUES ($1, $2, 'TRUNG_CAP', $3) RETURNING technician_id",
    [ten, center, hoatDong]);
  const id = Number(rows[0].technician_id);
  for (const [nhom, muc] of Object.entries(kyNang)) {
    await pool.query('INSERT INTO technician_skill (technician_id, issue_category, proficiency) VALUES ($1, $2, $3)', [id, nhom, muc]);
  }
  return id;
}

/** @returns {Promise<number>} ticket_id */
async function themPhieu(pool, { khachId, center = 4, nhom = 'MAN_HINH', uuTien = 'CAO', trangThai = 'MOI', ktvId = null } = {}) {
  demMa += 1;
  const { rows } = await pool.query(
    `INSERT INTO ticket (ticket_code, customer_id, center_id, device_name, issue_category, priority, status, technician_id,
                         received_at, due_date)
     VALUES ($1, $2, $3, 'iPhone 15', $4, $5, $6, $7, '2026-11-02T09:00:00+07:00', '2026-11-03T09:00:00+07:00')
     RETURNING ticket_id`,
    [`BH-${demMa}/2026`, khachId, center, nhom, uuTien, trangThai, ktvId]);
  return Number(rows[0].ticket_id);
}

/** Đếm số dòng của một bảng (tên bảng do test truyền, không phải dữ liệu người dùng). */
async function demDong(pool, bang) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${bang}`);
  return rows[0].n;
}

module.exports = { coCsdl, LY_DO_BO_QUA, taoPoolThu, dongPool, resetDb, themKhach, themKtv, themPhieu, demDong };
