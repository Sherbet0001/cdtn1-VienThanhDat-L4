// Kiểm tra "test có khả năng thất bại" (tiêu chí 5 của Test Plan): cố tình sửa mã nguồn, chạy bộ test,
// phải thấy test chuyển sang FAIL; sau mỗi lần sửa tệp được khôi phục NGUYÊN VẸN. Chạy: npm run kiem-test
const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const DOT_BIEN = [
  { ma: 'M1', quyTac: 'QT-08', tep: 'src/services/ticket.rules.js',
    tu: 'ktv.proficiency < THANH_THAO_TOI_THIEU', thanh: 'ktv.proficiency <= THANH_THAO_TOI_THIEU',
    moTa: 'đổi "thành thạo < 3" thành "<= 3" (biên QT-08)' },
  { ma: 'M2', quyTac: 'QT-04', tep: 'src/services/ticket.rules.js',
    tu: 'while (laChuNhatVN(han))', thanh: 'while (false && laChuNhatVN(han))',
    moTa: 'bỏ qua việc lùi khi hạn rơi vào Chủ nhật' },
  { ma: 'M3', quyTac: 'QT-15', tep: 'src/validators/phone.js',
    tu: 'sdt.slice(-3)', thanh: 'sdt.slice(-4)',
    moTa: 'che số điện thoại sai (lộ 4 số cuối thay vì 3)' },
];

function chay() {
  const kq = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd: GOC, encoding: 'utf8' });
  const o = kq.stdout || '';
  const lay = (k) => Number((o.match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [])[1] || 0);
  const hong = [...o.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
  return { pass: lay('pass'), fail: lay('fail'), hong };
}

const goc = chay();
console.log(`Bản gốc (chưa sửa): ${goc.pass} PASS, ${goc.fail} FAIL`);
if (goc.fail > 0) { console.error('Bản gốc đang có test FAIL: sửa trước khi kiểm tra đột biến.'); process.exit(1); }

let bat = 0;
for (const d of DOT_BIEN) {
  const tep = path.join(GOC, d.tep);
  const noiDung = readFileSync(tep, 'utf8');
  if (!noiDung.includes(d.tu)) { console.error(`${d.ma}: không tìm thấy đoạn mã cần sửa trong ${d.tep}`); process.exit(1); }
  try {
    writeFileSync(tep, noiDung.replace(d.tu, d.thanh));
    const r = chay();
    const bi = r.fail > 0;
    if (bi) bat += 1;
    console.log(`\n${d.ma} [${d.quyTac}] ${d.moTa}\n  -> ${r.pass} PASS, ${r.fail} FAIL ${bi ? '(test PHÁT HIỆN được lỗi)' : '(KHÔNG test nào phát hiện: test yếu!)'}`);
    r.hong.slice(0, 3).forEach((t) => console.log(`     ✖ ${t}`));
  } finally {
    writeFileSync(tep, noiDung);
  }
}
const sau = chay();
console.log(`\nĐã khôi phục mã nguồn: ${sau.pass} PASS, ${sau.fail} FAIL. Phát hiện ${bat}/${DOT_BIEN.length} lần sửa cố ý.`);
process.exit(bat === DOT_BIEN.length && sau.fail === 0 ? 0 : 1);
