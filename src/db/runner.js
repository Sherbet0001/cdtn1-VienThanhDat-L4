'use strict';
/**
 * Chạy các tệp .sql trong migrations/ hoặc seeds/ theo thứ tự tên (001_, 002_ ...).
 *
 *   npm run migrate   -> chạy migrations/, ghi tên tệp đã chạy vào bảng schema_migrations
 *   npm run seed      -> chạy seeds/, chạy lại mỗi lần (SQL tự chống trùng bằng ON CONFLICT)
 *
 * Mỗi tệp chạy trong MỘT giao dịch: lỗi giữa chừng thì tệp đó không để lại gì.
 * Hàm chạy nhận "client" bên ngoài để kiểm thử được mà không cần cơ sở dữ liệu thật.
 */
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.resolve(__dirname, '..', '..');

/** Đọc danh sách tệp .sql trong một thư mục, sắp theo tên. */
function listSqlFiles(dir) {
  return fs.readdirSync(dir)
    .filter((ten) => ten.endsWith('.sql'))
    .sort()
    .map((ten) => ({ name: ten, sql: fs.readFileSync(path.join(dir, ten), 'utf8') }));
}

/**
 * Chạy lần lượt các tệp. Nếu track = true thì bỏ qua tệp đã có trong schema_migrations.
 * Trả về { applied: [...], skipped: [...] }.
 */
async function applyFiles(client, files, { track }) {
  const applied = [];
  const skipped = [];
  let done = new Set();

  if (track) {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename   TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
    const r = await client.query('SELECT filename FROM schema_migrations');
    done = new Set(r.rows.map((x) => x.filename));
  }

  for (const f of files) {
    if (track && done.has(f.name)) { skipped.push(f.name); continue; }
    await client.query('BEGIN');
    try {
      await client.query(f.sql);
      if (track) {
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f.name]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      err.message = `${f.name}: ${err.message}`;
      throw err;
    }
    applied.push(f.name);
  }
  return { applied, skipped };
}

async function main(loai) {
  const cauHinh = { migrations: { dir: 'migrations', track: true },
                    seeds:      { dir: 'seeds',      track: false } }[loai];
  if (!cauHinh) {
    console.error('Cách dùng: node src/db/runner.js migrations|seeds');
    process.exit(2);
  }
  if (!process.env.DATABASE_URL) {
    console.error('Thiếu biến môi trường DATABASE_URL. Xem .env.example.');
    process.exit(1);
  }
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const files = listSqlFiles(path.join(GOC, cauHinh.dir));
    const kq = await applyFiles(client, files, { track: cauHinh.track });
    for (const t of kq.applied) console.log(`${loai}: đã chạy ${t}`);
    for (const t of kq.skipped) console.log(`${loai}: bỏ qua ${t} (đã chạy trước đó)`);
    console.log(`${loai}: xong (${kq.applied.length} chạy, ${kq.skipped.length} bỏ qua)`);
  } catch (err) {
    console.error(`Lỗi khi chạy ${loai}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = { listSqlFiles, applyFiles };

if (require.main === module) main(process.argv[2]);
