// Chạy RIÊNG một test case của Test Report để chụp ảnh minh chứng: npm run tc -- TC-05
// Dùng reporter "spec" để thấy rõ tên test case, kết quả (✔/✖) và thời gian chạy.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ma = (process.argv[2] || '').toUpperCase();
if (!/^TC-\d{2}$/.test(ma)) {
  console.error('Cách dùng: npm run tc -- TC-05   (mã TC-01 .. TC-12)');
  process.exit(2);
}
// Chỉ chạy đúng tệp chứa test case đó: các tệp tầng integration/API cùng giữ khóa CSDL, chạy chung dễ chờ khóa nhau.
const so = Number(ma.slice(3));
const ten = so <= 6 ? 'unit' : so <= 9 ? 'integration' : 'api';
const tep = [path.join('tests', 'bt3', `${ten}.test.js`)];

console.log(`> node --test --test-reporter=spec --test-name-pattern="^${ma} " ${tep.join(' ')}\n`);
const kq = spawnSync(
  process.execPath,
  ['--test', '--test-reporter=spec', `--test-name-pattern=^${ma} `, ...tep],
  { stdio: 'inherit', cwd: path.join(__dirname, '..') },
);
process.exit(kq.status ?? 1);
