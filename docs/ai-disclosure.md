# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – BÀI TẬP 3

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 3 – Kiểm thử, đóng gói và tài liệu kỹ thuật (repo tag `v1.0`)  
**Phạm vi:** Công việc từ buổi 13 đến buổi 16. Khai báo của Bài tập 1 và 2 nằm ở `docs/ai-disclosure-BT1-SauKhiSuaLoi.md` và `docs/ai-disclosure-BT2.md`.

---

## I. THÔNG TIN SINH VIÊN

- **Họ và tên:** Viên Thành Đạt
- **Mã số sinh viên:** 2374802010107
- **Chuyên ngành (Track):** [x] SE  [ ] DA  [ ] AI
- **Luồng nghiệp vụ đã chọn:** L4 – Phân công kỹ thuật viên và lịch hẹn

---

## II. BẢNG KHAI BÁO CHI TIẾT

Công cụ AI duy nhất dùng trong BT3 là **Claude (Anthropic)**, làm trợ lý viết mã, kiểm thử và tài liệu. Do phiên làm việc của Claude chỉ có quyền đọc repo, Claude không đẩy mã lên GitHub: sinh viên nhận tệp, chạy lại, tự commit và tự đẩy. Mọi ảnh chụp minh chứng do sinh viên chụp trên máy mình.

| Công cụ AI | Dùng vào việc gì | Áp dụng ở phần nào (File / Hàm) | Đã kiểm chứng & Chỉnh sửa thế nào |
|---|---|---|---|
| **Claude (Anthropic)** | Soạn Test Plan, Test Report 12 test case đủ tám cột, và mã kiểm thử tương ứng; script chạy riêng từng test case. | `docs/test-plan.md`, `docs/test-report.md`, `tests/bt3/unit.test.js`, `integration.test.js`, `api.test.js`, `tests/helpers/db.js`, `scripts/chay-tc.js`. | Sinh viên chạy `npm run tc -- TC-xx` cho cả 12 ca trên PostgreSQL thật và chụp ảnh `docs/screenshots/TC-01.png` … `TC-12.png`. Khi TC-07 bị treo, sinh viên gửi kết quả chẩn đoán; nguyên nhân (một tệp test giữ khóa không nhả) được sửa và chạy lại. |
| **Claude (Anthropic)** | Viết script cố ý sửa 3 quy tắc để kiểm chứng bộ test có khả năng thất bại. | `scripts/kiem-test-that-bai.js`, mục "Kiểm tra test có khả năng thất bại" trong `docs/test-report.md`. | Sinh viên chạy `npm run kiem-test`: cả 3 lần sửa đều bị test phát hiện, tệp được khôi phục (ảnh `docs/screenshots/kiem-test-that-bai.png`). Kết quả ghi trung thực: lần sửa M1 không bị TC-04 phát hiện mà do test biên QT-08 riêng. |
| **Claude (Anthropic)** | Phân tích và sửa BUG-003 (ký tự NUL trong văn bản nhập trả 500) và viết test hồi quy; soạn Bug Log. | `src/validators/text.js`, `src/validators/*.validator.js`, `tests/bug-nul-char.test.js`, `docs/bug-log.md`. | Sinh viên tái hiện lỗi, chạy lại test, tự commit từng bug riêng và kiểm tra các link commit mở được trong cửa sổ ẩn danh. |
| **Claude (Anthropic)** | Đóng gói: đưa bộ test vào image, tự tạo CSDL thử có khóa tư vấn, gọn `.env.example`. | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `tests/helpers/db.js`, `.env.example`. | Lần chạy đầu trong container có 4 test lỗi; sinh viên gửi kết quả, Claude tìm ra nguyên nhân là hai tiến trình cùng tạo CSDL, sửa bằng khóa tư vấn. Sinh viên chạy `docker compose down -v`, `up -d --build`, `exec api npm test` từ trạng thái sạch và chụp ảnh `docs/screenshots/b15-test-trong-container.png`. |
| **Claude (Anthropic)** | Soạn Deployment Guide tiếng Anh (năm mục, thêm Troubleshooting và hướng dẫn triển khai thật). | `docs/deployment-guide.md`, `docs/huong-dan-csdl-bt1.md` (bản BT1 đổi tên), `README.md`. | Sinh viên làm theo Guide trên một thư mục sạch và đối chiếu từng kết quả mong đợi (`docker compose ps`, `/health`, `total: 12`, `pass`). |
| **Claude (Anthropic)** | Soạn checklist bảo mật bảy mục và các lệnh lấy minh chứng; viết 6 test chèn mã độc; đề xuất cách xử lý cảnh báo `npm audit`. | `docs/checklist-bao-mat.md`, `tests/bao-mat-injection.test.js`, `package.json`, `package-lock.json`. | Sinh viên tự chạy mọi lệnh kiểm tra và chụp ảnh `docs/screenshots/sec-1.png` … `sec-7.png`. `npm audit` báo 4 lỗ hổng; sinh viên nâng `express` lên 4.22.3, chạy lại `npm audit` (0 lỗ hổng) và `npm test` (toàn bộ PASS). Mục 3 và 4 được ghi trung thực là KHÔNG ÁP DỤNG / CHƯA LÀM. |
| **Claude (Anthropic)** | Đề xuất và viết đăng nhập mức prototype: mật khẩu băm scrypt, token JWT, phân quyền theo trung tâm, màn hình đăng nhập, 2 test case TC-13/TC-14 và các test đơn vị; cập nhật tài liệu liên quan (TD-34). | `src/auth/*`, `src/middleware/xacThuc.js`, `baoVe.js`, `gioiHanDangNhap.js`, `src/routes/*`, `migrations/002_app_user.sql`, `web/src/pages/login.js`, `tests/bt3/auth.test.js`, `docs/api.md`, `docs/checklist-bao-mat.md` | Em quyết định làm sau khi đối chiếu tiêu chí track SE của đề; chạy `docker compose exec api npm test` được 168 test PASS và chạy riêng TC-13, TC-14 (ảnh `docs/screenshots/`); thử tay đăng nhập trên trình duyệt. Claude sửa lỗi YAML ở `docker-compose.yml` sau khi em báo lỗi `docker compose`. Phần Claude không tự kiểm chứng được (CSDL thật, giao diện) do em chạy trên máy. |
| **Claude (Anthropic)** | Soạn API Reference tiếng Anh cho toàn bộ endpoint và script gọi mọi endpoint để lấy ví dụ thật. | `docs/api.md`, `docs/api-vi-du-chay-that.md`, `scripts/sinh-vi-du-api.js`. | Sinh viên chạy script trên hệ thống thật; mọi ví dụ request/response trong `docs/api.md` được lấy từ kết quả này, không viết tay; sinh viên đối chiếu số endpoint trong tài liệu (13) với số route trong mã. |
| **Claude (Anthropic)** | Ghi nhận phản hồi BT2 và các thay đổi của BT3 vào nhật ký thiết kế; soạn PDF nộp bài. | `docs/thay-doi-thiet-ke.md` (TD-28 … TD-33), `BT3_2374802010107_VienThanhDat.pdf`. | Sinh viên đọc lại nội dung, đối chiếu với repo và ảnh chụp trước khi nộp. |

### Thư viện do AI gợi ý

Không thêm thư viện mới ở BT3. Chỉ nâng `express` từ 4.21.2 lên 4.22.3 để vá cảnh báo `npm audit` (TD-32); `pg` giữ 8.13.1. Cả hai được ghim chính xác trong `package.json` và khóa trong `package-lock.json`.

### Ghi chú

- Công cụ AI được dùng với vai trò hỗ trợ viết mã, kiểm thử và tài liệu; sinh viên chịu trách nhiệm kiểm tra, chạy lại và chỉnh sửa trước khi đưa vào bài nộp.
- Những phần cố ý chưa làm (đăng nhập, phân quyền, mã hóa số điện thoại, đổi kỹ thuật viên, lịch hẹn) được ghi trung thực trong `docs/checklist-bao-mat.md` và `docs/thay-doi-thiet-ke.md`, không được trình bày là đã làm.
- Sinh viên có thể giải thích từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 13/11/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
