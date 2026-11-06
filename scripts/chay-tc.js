// Chạy RIÊNG một test case của Test Report để chụp ảnh minh chứng: npm run tc -- TC-05
// Dùng reporter "spec" để thấy rõ tên test case, kết quả (✔/✖) và thời gian chạy.
const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');

const ma = (process.argv[2] || '').toUpperCase();
if (!/^TC-\d{2}$/.test(ma)) {
  console.error('Cách dùng: npm run tc -- TC-05   (mã TC-01 .. TC-12)');
  process.exit(2);
}
const thuMuc = path.join(__dirname, '..', 'tests', 'bt3');
const tep = readdirSync(thuMuc).filter((f) => f.endsWith('.test.js')).map((f) => path.join('tests', 'bt3', f));

console.log(`> node --test --test-reporter=spec --test-name-pattern="^${ma} " ${tep.join(' ')}\n`);
const kq = spawnSync(
  process.execPath,
  ['--test', '--test-reporter=spec', `--test-name-pattern=^${ma} `, ...tep],
  { stdio: 'inherit', cwd: path.join(__dirname, '..') },
);
process.exit(kq.status ?? 1);
