# Checklist bảo mật (7 mục bắt buộc) — L4 Phân công kỹ thuật viên, track SE

Tự đánh giá cho phiên bản `v1.0`. Mỗi mục: **ĐÃ LÀM / CHƯA LÀM / KHÔNG ÁP DỤNG** + minh chứng. Ảnh chụp nằm trong `docs/screenshots/` (`sec-N.png`).

| # | Mục | Trạng thái | Minh chứng (tóm tắt) |
|---|---|---|---|
| 1 | Không có secret trong repo | ĐÃ LÀM | `.env` nằm trong `.gitignore`; `git log --all -- .env` rỗng; ảnh `sec-1.png` |
| 2 | Kiểm tra dữ liệu vào ở tầng ứng dụng | ĐÃ LÀM | `src/validators/*`; kiểm thử injection và JSON hỏng; ảnh `sec-2.png` |
| 3 | Kiểm soát truy cập theo chủ sở hữu | ĐÃ LÀM | Đăng nhập + JWT; quản lý chỉ truy cập trung tâm của mình (403 nếu khác); test TC-13; ảnh `TC-13.png` |
| 4 | Mật khẩu và dữ liệu nhạy cảm được băm hoặc mã hoá | ĐÃ LÀM (mật khẩu); CHƯA LÀM (số điện thoại) | Mật khẩu băm scrypt + muối riêng; test TC-14; ảnh `TC-14.png`; số điện thoại khách còn ở dạng đọc được |
| 5 | Thông báo lỗi không lộ cấu trúc bên trong | ĐÃ LÀM | `src/middleware/xuLyLoi.js`; ảnh `sec-5a.png`, `sec-5b.png` |
| 6 | Nhật ký không ghi mật khẩu, token, dữ liệu cá nhân | ĐÃ LÀM | `src/logger.js` che trường nhạy cảm; `tests/logger.test.js`; ảnh `sec-6.png` |
| 7 | Phụ thuộc được ghim phiên bản, đã kiểm lỗ hổng | ĐÃ LÀM (đã phát hiện và xử lý 4 cảnh báo) | Ghim phiên bản + `package-lock.json`; `npm audit` trước và sau khi nâng `express`; ảnh `sec-7-truoc-khi-sua.png`, `sec-7.png` |

## 1. Không có secret trong repo — ĐÃ LÀM

- `.gitignore` loại `.env` và `.env.*` (chỉ giữ `.env.example`). `.env.example` chỉ chứa giá trị mẫu (`DB_PASSWORD=change_me`).
- Chuỗi kết nối trong `docker-compose.yml` được ghép từ biến `${DB_USER}`, `${DB_PASSWORD}`; khóa ký token lấy từ biến `${JWT_SECRET}` (không có mặc định trong mã, thiếu thì `docker compose` từ chối chạy). `.env.example` chỉ có giá trị mẫu cho cả hai.
- Còn lại hai chỗ có mật khẩu viết sẵn, cả hai chỉ là CSDL thử dùng một lần: `.github/workflows/ci.yml` và lệnh mẫu trong `README.md` (`postgres:test@...l4_test`). Không phải secret thật.
- Lệnh kiểm tra (kết quả phải rỗng):
  ```
  git log --all --oneline -- .env
  git grep -nEi "(api[_-]?key|secret|token)\s*[:=]\s*['\"][A-Za-z0-9]{12,}" $(git rev-list --all)
  ```
- Minh chứng: `docs/screenshots/sec-1.png`.

## 2. Kiểm tra dữ liệu vào — ĐÃ LÀM

- Mọi dữ liệu từ người dùng đi qua `src/validators/` (kiểu, độ dài, định dạng số điện thoại QT-02, `limit` 1–100, id số nguyên) trước khi tới service. Sai thì trả 400 `VALIDATION_ERROR` kèm danh sách trường sai.
- Mọi câu SQL dùng tham số (`$1`, `$2`) trong `src/repositories/`; không ghép chuỗi. Giao diện chỉ gán `textContent`, không dùng `innerHTML`.
- Thân yêu cầu giới hạn 256 KB (`express.json({ limit: '256kb' })`); JSON hỏng trả 400.
- Lệnh kiểm tra:
  ```
  git grep -nE "(SELECT|INSERT|UPDATE|DELETE).*(\+ *[a-zA-Z_]|\$\{)" -- src
  git grep -nE "innerHTML|dangerouslySetInnerHTML|v-html" -- src web
  git grep -nE "exec\(|execSync|spawn\(|os\.system|shell=True" -- src
  curl.exe -s -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{bad json"
  ```
- Kết quả thực tế (`sec-2.png`): lệnh thứ nhất khớp 2 dòng trong `src/repositories/ticket.repository.js` (dòng 48 và 50). Đây là việc ghép hai hằng số cố định trong mã (`SELECT_PHIEU` và `dieuKien`) vào câu truy vấn; giá trị do người dùng nhập luôn đi qua tham số `$1`, `$2`, `$3`, nên không phải SQL injection. Hai lệnh còn lại không khớp dòng nào (`exit=1`).
- Minh chứng: `docs/screenshots/sec-2.png`.

## 3. Kiểm soát truy cập theo chủ sở hữu — ĐÃ LÀM

- "Chủ sở hữu" ở đây là **trung tâm bảo hành**: tài khoản `QUAN_LY` gắn với đúng một trung tâm (`app_user.center_id`), tài khoản `QUAN_TRI` xem được mọi trung tâm. Mọi đường `/api` (trừ `POST /api/auth/login` và `/health`) bắt buộc có token, mặc định từ chối.
- Quy tắc nằm ở `src/auth/phanQuyen.js`, nối vào từng route bằng `src/middleware/baoVe.js` (kiểm tra trước khi hàm xử lý chạy): đọc, sửa, xóa, phân công phiếu hoặc kỹ thuật viên của trung tâm khác → **403 `FORBIDDEN`** và dữ liệu không đổi; mã không tồn tại → 404; danh sách bị ép về trung tâm của người gọi; tạo/sửa với `center_id` của trung tâm khác → 403.
- Kiểm thử: **TC-13** (`tests/bt3/auth.test.js`) chạy trên PostgreSQL thật: quản lý trung tâm 4 đọc và gán phiếu trung tâm 2 đều bị 403, không có dòng nào thay đổi; đúng trung tâm và quản trị thì thành công. Chạy một mình: `docker compose exec api npm run tc -- TC-13`. Ảnh: `docs/screenshots/TC-13.png`.
- Token: ký HS256 bằng khóa `JWT_SECRET` (≥ 32 ký tự, bắt buộc, không có trong mã), có hạn, từ chối thuật toán `none` và token bị sửa; mọi lỗi xác thực cùng một thông điệp. Có test đơn vị trong `tests/auth.*.test.js`.
- Hạn chế trung thực: không có đăng ký tài khoản, đổi mật khẩu hay thu hồi token trước hạn (đăng xuất chỉ xóa token ở trình duyệt); chỉ có hai vai trò. Đây là mức prototype (TD-34).

## 4. Mật khẩu và dữ liệu nhạy cảm — ĐÃ LÀM (mật khẩu), CHƯA LÀM (số điện thoại)

- Mật khẩu đăng nhập được băm bằng **scrypt** (`src/auth/password.js`: muối ngẫu nhiên riêng cho mỗi tài khoản, N=16384, so sánh bằng hàm chống đo thời gian). CSDL chỉ lưu chuỗi dạng `scrypt$16384$8$1$<muối>$<băm>`.
- Đăng nhập sai tên và sai mật khẩu cùng trả 401 `INVALID_CREDENTIALS` với cùng thông điệp, luôn tốn một lần băm (không lộ tên nào có thật); sai 10 lần trong 5 phút → 429.
- Kiểm thử: **TC-14** (`tests/bt3/auth.test.js`): chuỗi trong CSDL có dạng `scrypt$...` và không chứa mật khẩu gốc, đăng nhập đúng → 200 và có token, sai mật khẩu và tên lạ → 401 cùng thông điệp. Ảnh: `docs/screenshots/TC-14.png`.
- Mật khẩu mẫu `Mekong@2026` trong README và Deployment Guide là **dữ liệu mẫu** của 7 tài khoản chạy thử (`seeds/005_app_users.sql`, trong repo chỉ có chuỗi băm); phải đổi hoặc xóa khi triển khai thật. Khóa `JWT_SECRET` trong `.env.example` cũng là giá trị mẫu.
- CHƯA LÀM: số điện thoại khách hàng (dữ liệu cá nhân) vẫn lưu ở dạng đọc được trong PostgreSQL và trả đầy đủ cho người dùng đã đăng nhập; chỉ nhật ký được che số (QT-15). Cải tiến: che số theo vai trò, mã hoá cột hoặc mã hoá ổ đĩa.

## 5. Thông báo lỗi không lộ cấu trúc bên trong — ĐÃ LÀM

- Bộ xử lý lỗi cuối `src/middleware/xuLyLoi.js` ghi log một lần (kèm ngăn xếp), nhưng trả cho client chỉ thông điệp chung và mã tra cứu `requestId`; không trả `err.stack`, câu SQL, tên bảng hay chuỗi kết nối. `/health` khi mất CSDL chỉ trả `{"status":"degraded","db":"không kết nối được"}`.
- Lệnh kiểm tra:
  ```
  curl.exe -s -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{bad json"
  docker compose stop db
  curl.exe -s -i "http://localhost:3000/api/tickets/unassigned"
  docker compose start db
  ```
  Kết quả mong đợi: lần 1 → 400; lần 2 → 503 `SERVICE_UNAVAILABLE`, nội dung không có `pg`, `ECONNREFUSED`, `ticket`, `stack`.
- Minh chứng: `docs/screenshots/sec-5a.png` (JSON hỏng), `docs/screenshots/sec-5b.png` (mất CSDL).

## 6. Nhật ký không ghi dữ liệu nhạy cảm — ĐÃ LÀM

- `src/logger.js` che thành `***` mọi trường có tên chứa `password`, `token`, `jwt`, `authorization`, `secret`, `database_url`, `connectionstring`, `phone`, `sdt`. Kiểm thử tự động: `tests/logger.test.js`.
- Lệnh kiểm tra (không được ra số điện thoại, mật khẩu hay token):
  ```
  curl.exe -s -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{\"customer_phone\":\"0901234567\"}"
  docker compose logs api | Select-String -Pattern "password|token|0901234567|change_me"
  ```
- Kết quả thực tế (`sec-6.png`): `matches: 0`. Lưu ý trung thực: yêu cầu thử này bị từ chối 400 do thiếu các trường bắt buộc nên chưa tạo phiếu; việc che số điện thoại khi ghi log được chứng minh bằng kiểm thử tự động `tests/logger.test.js` (gửi số, mật khẩu, token, chuỗi kết nối vào logger rồi kiểm tra chúng không xuất hiện).
- Minh chứng: `docs/screenshots/sec-6.png`.

## 7. Phụ thuộc được ghim và đã kiểm lỗ hổng — ĐÃ LÀM

- `package.json` ghim đúng phiên bản (`express 4.21.2`, `pg 8.13.1`, không dùng `^`); `package-lock.json` được commit; Dockerfile dùng `npm ci --omit=dev`. Chỉ có 2 phụ thuộc chạy thật.
- Lệnh kiểm tra: `npm audit --omit=dev`.
- **Phát hiện (ảnh `sec-7-truoc-khi-sua.png`)**: với `express 4.21.2`, `npm audit` báo 4 lỗ hổng (3 mức high, 1 mức moderate) ở các gói gián tiếp `body-parser`, `path-to-regexp`, `qs`. Cả bốn đều là kiểu từ chối dịch vụ (DoS), không phải lộ dữ liệu.
- **Xử lý**: nâng `express` lên `4.22.3` (cùng dòng 4.x, vẫn ghim đúng phiên bản), cập nhật `package-lock.json`, chạy lại toàn bộ 127 kiểm thử và `npm audit`.
- Kết quả `npm audit --omit=dev` sau khi nâng `express` lên 4.22.3: `found 0 vulnerabilities` (ảnh `docs/screenshots/sec-7.png`, chụp cả lúc trước và sau khi nâng).

## Mười nhóm rủi ro OWASP: nhận biết (tóm tắt)

Hệ thống này đã xử lý rõ nhóm injection (SQL tham số hoá, `textContent`) và lộ thông tin qua thông báo lỗi. Kiểm soát truy cập (A01, mục 3) và xác thực (A02, A07, mục 4) đã có ở mức prototype và có test. Nhóm còn hở là bảo vệ dữ liệu cá nhân khi lưu trữ: số điện thoại khách chưa mã hoá (mục 4), chưa có đổi/thu hồi mật khẩu, và chưa chạy kiểm thử xâm nhập bên ngoài.
