# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – Tuần 6

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 2 – Buổi 11 và buổi 12 (tích hợp hệ thống, xử lý lỗi, hoàn thiện nộp bài)  
**Phạm vi:** Công việc của buổi 11 (các commit ngày 28/10/2026). Phần buổi 12 được bổ sung vào bảng khi hoàn thành.

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
| **Claude (Anthropic)** | **Buổi 12 (bổ sung khi hoàn thành):** hoàn thiện CRUD, tài liệu kiến trúc thực tế, khai báo AI, PDF nộp bài, tag `v0.2`. | _Sẽ điền sau khi hoàn thành các việc của buổi 12._ | _Sẽ điền._ |

### Ghi chú

- Công cụ AI được dùng làm trợ lý viết mã và tài liệu; sinh viên quyết định phạm vi từng buổi, đọc và chạy lại kết quả, rồi tự commit và đẩy lên GitHub (phiên làm việc với AI chỉ có quyền đọc repo).
- Sinh viên có trách nhiệm giải thích được từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.
- Bảng này sẽ được cập nhật lại khi buổi 12 hoàn tất; dòng cuối là chỗ giữ cho phần việc đó.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 28/10/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
