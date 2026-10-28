# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – BÀI TẬP 2

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 2 – Hệ thống tích hợp chạy được (repo tag `v0.2`)  
**Phạm vi:** Tổng hợp công việc từ buổi 7 đến buổi 12. Chi tiết theo từng tuần và mã commit nằm ở `docs/ai-disclosure-Tuan4.md`, `docs/ai-disclosure-Tuan5.md`, `docs/ai-disclosure-Tuan6.md`.

---

## I. THÔNG TIN SINH VIÊN

- **Họ và tên:** Viên Thành Đạt
- **Mã số sinh viên:** 2374802010107
- **Chuyên ngành (Track):** [x] SE  [ ] DA  [ ] AI
- **Luồng nghiệp vụ đã chọn:** L4 – Phân công kỹ thuật viên và lịch hẹn

---

## II. BẢNG KHAI BÁO CHI TIẾT

Công cụ AI duy nhất dùng trong BT2 là **Claude (Anthropic)**, làm trợ lý viết mã và tài liệu. Sinh viên quyết định phạm vi từng buổi, chạy lại kết quả trên máy mình, tự commit và đẩy lên GitHub.

| Công cụ AI | Dùng vào việc gì | Áp dụng ở phần nào (File / Hàm) | Đã kiểm chứng & Chỉnh sửa thế nào |
|---|---|---|---|
| **Claude (Anthropic)** | Dựng khung dự án tách ba lớp; viết migration, seed và bộ chạy migration/seed chạy lại được (buổi 7–8). | `src/routes/`, `src/services/`, `src/repositories/`, `src/validators/`, `src/errors/`; `migrations/001_init.sql`, `seeds/001–004`, `src/db/runner.js`, `scripts/tao-seed-phieu.py`. | Sinh viên đối chiếu khung với sơ đồ kiến trúc BT1, chạy `npm run migrate` và `npm run seed` hai lần trên PostgreSQL của máy mình, đối chiếu số dòng (38 kỹ thuật viên từ seed, 159 kỹ năng; bảng có 39 dòng sau khi thử tạo một kỹ thuật viên qua API) và kiểm tra không nhân đôi dữ liệu (`docs/bang-chung-chay-thuc-te.md`). |
| **Claude (Anthropic)** | Viết CRUD kỹ thuật viên và CRUD phiếu (tạo, đọc, sửa `PATCH`, hủy mềm `DELETE`) qua ba lớp. | `src/services/technician.service.js`, `src/services/ticket.service.js` (`create`, `update`, `cancel`); `src/repositories/*.js`; `src/routes/*.routes.js`; `src/validators/*.validator.js`. | Sinh viên đọc từng lớp để xác nhận service không dùng `req`, `res` hay mã HTTP; đối chiếu các quy tắc QT-02, QT-04, QT-13, TD-16 với SRS; chạy `npm test`; gọi thử API bằng `curl.exe`. |
| **Claude (Anthropic)** | Viết quy tắc phân công: danh sách kỹ thuật viên đủ điều kiện (QT-08), gán trong một giao dịch có khóa dòng `FOR UPDATE`, ghi `ticket_status_log` (QT-06, QT-07). | `src/services/ticket.service.js` (`listEligible`, `assign`); `src/services/ticket.rules.js`; `src/repositories/ticket.repository.js` (`lockById`, `runInTransaction`, `setAssignment`, `insertLog`). | Sinh viên chạy luồng phân công trên giao diện thật và chụp ảnh phân công thành công (`docs/anh/`); đọc câu SQL khóa dòng; chạy `npm test` (`tests/ticket.assign.test.js`). |
| **Claude (Anthropic)** | Viết hợp đồng dữ liệu, khung lỗi thống nhất có `error.fields`, bộ xử lý lỗi duy nhất kèm mã tra cứu, logger JSON che dữ liệu nhạy cảm. | `src/contracts/`, `src/errors/AppError.js`, `src/routes/http.js`, `src/middleware/xuLyLoi.js`, `src/logger.js`, `docs/api-contract.md`. | Sinh viên đối chiếu hợp đồng với phản hồi thực tế; kiểm tra log không chứa số điện thoại (QT-15) và mỗi sự cố chỉ có một dòng ERROR; chạy `npm test` (`tests/*.contract.test.js`, `tests/logger.test.js`, `tests/xuLyLoi.test.js`). |
| **Claude (Anthropic)** | Viết giao diện web không cần bước build: lớp client API, thành phần DataState ba trạng thái, bốn màn hình. | `web/src/api/`, `web/src/components/DataState.js`, `web/src/lib/`, `web/src/pages/`. | Sinh viên mở giao diện trên máy mình, thử các trạng thái đang tải, rỗng và lỗi, và tự chụp ảnh đưa vào `docs/anh/` (`docs/bang-chung-luong-chinh.md`). |
| **Claude (Anthropic)** | Viết bộ kiểm thử `node --test` (luồng đúng, biên, dữ liệu sai, hợp đồng, tích hợp) và test hồi quy cho BUG-001. | `tests/*.test.js`, `tests/bug-center-id.test.js`. | Sinh viên chạy `npm test` bằng một lệnh; đọc từng test để giải thích được test bảo vệ điều gì; BUG-001 được xác nhận bằng câu lệnh PostgreSQL trong `docs/bug-log.md`. |
| **Claude (Anthropic)** | Viết tài liệu: README, nhật ký thay đổi thiết kế (TD-15 đến TD-26), bằng chứng chạy thực tế, Bug Log, các bản khai báo AI theo tuần. | `README.md`, `docs/thay-doi-thiet-ke.md`, `docs/bang-chung-*.md`, `docs/bug-log.md`, `docs/ai-disclosure-Tuan4–6.md`. | Sinh viên đọc, đối chiếu với mã nguồn và với kết quả chạy thực tế; làm theo README trên máy mình. |

### Thư viện do AI gợi ý

Dự án chỉ dùng hai thư viện chạy: `express` 4.21.2 và `pg` 8.13.1 (ghim chính xác trong `package.json`, khóa trong `package-lock.json`). Cả hai là thư viện phổ biến, đúng với stack Node.js/Express/PostgreSQL mà sinh viên đã chọn ở BT1; không thêm thư viện nào khác (logger và bộ xử lý lỗi tự viết).

### Ghi chú

- Công cụ AI được dùng với vai trò hỗ trợ viết mã, gợi ý và rà soát; sinh viên chịu trách nhiệm kiểm tra, đối chiếu và chỉnh sửa trước khi đưa vào bài nộp.
- Sinh viên có thể giải thích từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.
- Công việc của buổi 12 (tài liệu kiến trúc thực tế, đóng gói, PDF, tag `v0.2`) sẽ được bổ sung vào bảng khi hoàn thành.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 28/10/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
