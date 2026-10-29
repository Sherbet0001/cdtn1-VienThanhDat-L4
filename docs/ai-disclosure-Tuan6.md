# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – Tuần 6

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 2 – Buổi 11 và buổi 12 (tích hợp hệ thống, xử lý lỗi, hoàn thiện nộp bài)  
**Phạm vi:** Công việc của buổi 11 (các commit ngày 28/10/2026) và buổi 12 (29/10/2026).

---

## I. THÔNG TIN SINH VIÊN

- **Họ và tên:** Viên Thành Đạt
- **Mã số sinh viên:** 2374802010107
- **Chuyên ngành (Track):** [x] SE  [ ] DA  [ ] AI
- **Luồng nghiệp vụ đã chọn:** L4 – Phân công kỹ thuật viên và lịch hẹn

---

## II. BẢNG KHAI BÁO CHI TIẾT

| Công cụ AI | Dùng vào việc gì | Áp dụng ở phần nào (File / Mục) | Đã kiểm chứng & Chỉnh sửa thế nào |
|---|---|---|---|
| **Claude (Anthropic)** | Khóa phiên bản runtime (`.nvmrc`, `engines`), chuyển hướng dẫn cài sang `npm ci`. | **File:** `.nvmrc`, `package.json`, `README.md` mục 2–3. **Commit:** `fc6c1e2`. | Sinh viên kiểm tra `git log --all --oneline -- .env` không có kết quả và chạy lại `npm test`. |
| **Claude (Anthropic)** | Viết logger JSON ra stdout (mức log, múi giờ +07:00, `requestId`, che dữ liệu nhạy cảm) và test. | **File:** `src/logger.js`, `src/server.js`, `src/app.js`, `.env.example`, `tests/logger.test.js`. **Commit:** `9aa2369`. | Sinh viên đối chiếu các trường bị che với quy tắc QT-15 và bài giảng buổi 11; chạy `npm test`. |
| **Claude (Anthropic)** | Viết bộ xử lý lỗi duy nhất (log một lần, mã tra cứu, 503 khi mất kết nối CSDL), cập nhật hợp đồng API, TD-25 và giao diện hiện mã tra cứu. | **File:** `src/middleware/xuLyLoi.js`, `src/routes/http.js`, `web/src/api/client.js`, `web/src/lib/dataState.js`, `docs/api-contract.md`, `docs/thay-doi-thiet-ke.md`, `tests/xuLyLoi.test.js`. **Commit:** `2052d5e`. | Sinh viên đọc luồng lỗi qua các lớp, xác nhận mỗi sự cố chỉ ghi một dòng ERROR và phản hồi 5xx không lộ câu SQL; chạy `npm test`. |
| **Claude (Anthropic)** | Tìm và gỡ lỗi BUG-001 (`center_id` vượt kiểu INT gây 500) theo bốn bước, viết test hồi quy và mục Bug Log. | **File:** `src/validators/ticket.validator.js`, `src/validators/technician.validator.js`, `tests/bug-center-id.test.js`, `docs/bug-log.md`. **Commit:** `06cd4c7`. | Sinh viên xác nhận lỗi bằng câu lệnh PostgreSQL trong mục tái lập và chạy test hồi quy; điền link commit vào Bug Log. |
| **Claude (Anthropic)** | Viết bằng chứng tự kiểm buổi 11 và README mục 7. | **File:** `docs/bang-chung-buoi11.md`, `README.md`. **Commit:** `c2cb03c`. | Sinh viên chạy lại các lệnh `grep` trong checklist và đối chiếu kết quả. |
| **Claude (Anthropic)** | Viết thêm sửa phiếu (PATCH) và hủy mềm (DELETE) để thực thể Ticket đủ CRUD, kèm test và TD-26. | `src/services/ticket.service.js`, `src/repositories/ticket.repository.js`, `src/routes/ticket.routes.js`, `src/validators/ticket.validator.js`, `docs/api-contract.md`, `tests/ticket.crud.test.js`. **Commit:** `1a693e1`. | Sinh viên chạy `npm test`, đọc luồng khóa dòng và ghi log trạng thái trong cùng giao dịch để giải thích được. |
| **Claude (Anthropic)** | Viết tài liệu kiến trúc thực tế, bản khai báo AI tổng hợp BT2 và tài liệu chuẩn bị vấn đáp, kịch bản demo 3 phút. | `docs/architecture-thuc-te.md` (+ `.png`, `.mmd`), `docs/ai-disclosure-BT2.md`, `docs/cau-hoi-van-dap.md`. **Commit:** `7cdf07a`, `749ae6b`, `9cf0648`. | Sinh viên đối chiếu sơ đồ với mã nguồn thật; số kỹ thuật viên seed đã được sửa lại thành 38 sau khi kiểm tra bằng dữ liệu. |
| **Claude (Anthropic)** | Đóng gói Docker: Dockerfile nhiều giai đoạn, docker-compose (db và api có healthcheck), `.dockerignore`; chỉnh log `/health` ở mức debug. | `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.gitattributes`, `.env.example`, `README.md` mục 3.1, `docs/bang-chung-docker.md`. **Commit:** `79d210f`, `4c79f25`, `a3ea389`. | Sinh viên tự chạy `docker compose up -d --build` trên máy mình, chụp `docker compose ps` ở trạng thái healthy và giao diện hiện 12 phiếu. |
| **Claude (Anthropic)** | Gỡ lỗi BUG-002 (kết nối CSDL rảnh bị ngắt làm máy chủ thoát khi dừng CSDL) bằng bốn bước, viết test hồi quy. | `src/db/pool.js`, `src/server.js`, `tests/bug-pool-error.test.js`, `docs/bug-log.md`, `docs/bang-chung-buoi11.md`. **Commit:** `cab541a`, `105a4de`. | Sinh viên tái lập bằng `docker compose stop db`, chụp ảnh trước và sau khi sửa; chạy `npm test` (111 test PASS). |
| **Claude (Anthropic)** | Dựng PDF Bài tập 2 và bổ sung ảnh trạng thái đang tải, trạng thái rỗng, kết quả `npm test`. | `BT2_2374802010107_VienThanhDat.pdf`, `docs/anh/`. **Commit:** `138a137`, `04ce4ea`. | Sinh viên tự chụp các ảnh trên máy, đọc lại toàn bộ PDF và gắn tag `v0.2`. |

### Ghi chú

- Công cụ AI được dùng làm trợ lý viết mã và tài liệu; sinh viên quyết định phạm vi từng buổi, đọc và chạy lại kết quả, rồi tự commit và đẩy lên GitHub (phiên làm việc với AI chỉ có quyền đọc repo).
- Sinh viên có trách nhiệm giải thích được từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 29/10/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
