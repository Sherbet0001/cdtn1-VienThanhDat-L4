# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – Tuần 4

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 2 – Buổi 7 và buổi 8 (khung dự án, CSDL, CRUD Technician)  
**Phạm vi:** Công việc của buổi 7 và buổi 8 (các commit ngày 17/10/2026): kế hoạch BT2, khung `src/`, migration và seed, CRUD kỹ thuật viên, kiểm thử.

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
| **Claude (Anthropic)** | Lập kế hoạch BT2 theo bảng tiêu chí và chia thành các checkpoint nhỏ; dựng khung thư mục `src/` theo sơ đồ kiến trúc BT1. | **File:** `src/routes/`, `src/services/`, `src/repositories/`, `src/validators/`, `src/errors/`. **Commit:** `7a0092d`. | Sinh viên đối chiếu khung với sơ đồ kiến trúc `docs/architecture.drawio` và yêu cầu tách ba lớp của đề BT2; tự commit từng checkpoint. |
| **Claude (Anthropic)** | Viết migration `001_init.sql` theo DDL của BT1, seed kỹ thuật viên từ dữ liệu mẫu Mekong Mobile và bộ chạy migration/seed chạy lại được. | **File:** `migrations/001_init.sql`, `seeds/001_technicians.sql`, `seeds/002_technician_skills.sql`, `src/db/runner.js`. **Commit:** `6ca987b`. | Sinh viên đối chiếu số kỹ thuật viên và kỹ năng với tệp dữ liệu mẫu; việc cài PostgreSQL và chạy `npm run migrate` / `npm run seed` trên máy sinh viên được thực hiện ở tuần 5 (kết quả ở `docs/bang-chung-chay-thuc-te.md`). |
| **Claude (Anthropic)** | Viết CRUD kỹ thuật viên qua ba lớp, kèm kiểm thử service, validator, routes bằng đối tượng giả. | **File:** `src/routes/technician.routes.js`, `src/services/technician.service.js`, `src/repositories/technician.repository.js`, `src/validators/technician.validator.js`, `tests/technician.*.test.js`. **Commit:** `5ffecc5`, `aa924bd`. | Sinh viên đọc từng lớp để xác nhận service không dùng `req`, `res` hay mã HTTP, và đối chiếu các quy tắc (QT-13 xóa mềm, TD-16 kỹ thuật viên đang giữ phiếu) với SRS; chạy `npm test`. |
| **Claude (Anthropic)** | Ghi nhật ký thay đổi thiết kế và cập nhật README. | **File:** `docs/thay-doi-thiet-ke.md` (TD-15 đến TD-18), `README.md` mục 2 và 6. **Commit:** `0b74d29`, `0bc5de9`. | Sinh viên rà các điểm khác thiết kế BT1 và xác nhận lý do ghi trong từng mục TD. |

### Ghi chú

- Công cụ AI được dùng làm trợ lý viết mã và tài liệu; sinh viên quyết định phạm vi từng buổi, đọc và chạy lại kết quả, rồi tự commit và đẩy lên GitHub (phiên làm việc với AI chỉ có quyền đọc repo).
- Sinh viên có trách nhiệm giải thích được từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 17/10/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
