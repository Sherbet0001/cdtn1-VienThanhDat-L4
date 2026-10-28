# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – Tuần 5

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Bài nộp:** Bài tập 2 – Buổi 9 và buổi 10 (hợp đồng dữ liệu, lỗi thống nhất, giao diện, luồng phân công)  
**Phạm vi:** Công việc của buổi 9 và buổi 10 (các commit ngày 24/10/2026) và ảnh minh chứng bổ sung ngày 28/10/2026.

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
| **Claude (Anthropic)** | Tách hợp đồng dữ liệu, khung lỗi thống nhất có `error.fields`, JSDoc bốn phần, test hợp đồng và test tích hợp. | **File:** `src/contracts/`, `src/errors/AppError.js`, `src/routes/http.js`, `docs/api-contract.md`, `tests/*.contract.test.js`, `tests/technician.integration.test.js`. **Commit:** `d781466`, `9a16ec5`, `01ff999`, `5f1daf6`. | Sinh viên đọc hợp đồng và đối chiếu với phản hồi thực tế; chạy `npm test` và các lệnh `curl.exe` trên máy mình (kết quả ở `docs/bang-chung-chay-thuc-te.md`). |
| **Claude (Anthropic)** | Viết trang kỹ thuật viên và giao diện `web/src` (lớp client API, thành phần DataState ba trạng thái, màn danh sách phiếu, chi tiết phân công, tiếp nhận phiếu, danh sách kỹ thuật viên). | **File:** `web/index.html`, `web/src/api/`, `web/src/components/`, `web/src/pages/`, `tests/web.test.js`. **Commit:** `9a97abf`, `ac73e41`, `f375f58`. | Sinh viên mở giao diện trên máy mình, thử các trạng thái đang tải, rỗng và lỗi, và tự chụp ảnh màn hình đưa vào `docs/anh/`. |
| **Claude (Anthropic)** | Viết seed khách hàng và phiếu từ dataset (có 12 phiếu ở trạng thái MOI) và script sinh seed. | **File:** `seeds/003_customers.sql`, `seeds/004_tickets.sql`, `scripts/tao-seed-phieu.py`. **Commit:** `e063b94`. | Sinh viên chạy `npm run seed` hai lần trên máy mình, đối chiếu số dòng và kiểm tra không nhân đôi dữ liệu. |
| **Claude (Anthropic)** | Viết backend phiếu (danh sách chưa phân công, chi tiết, tiếp nhận) và phân công kỹ thuật viên trong một giao dịch có khóa dòng, ghi lịch sử trạng thái. | **File:** `src/routes/ticket.routes.js`, `src/services/ticket.service.js`, `src/services/ticket.rules.js`, `src/repositories/ticket.repository.js`, `src/validators/ticket.validator.js`, `tests/ticket.*.test.js`. **Commit:** `3fdd355`, `3119c92`. | Sinh viên chạy luồng phân công trên giao diện và chụp ảnh phân công thành công; đối chiếu quy tắc QT-02, QT-04, QT-06, QT-07, QT-08 với SRS và đọc câu SQL khóa dòng `FOR UPDATE`. |
| **Claude (Anthropic)** | Viết README mục 3 (các bước chạy), bằng chứng luồng chính và tệp JSON mẫu. | **File:** `README.md`, `docs/bang-chung-luong-chinh.md`, `data/mau/*.json`. **Commit:** `384ba7f`, `f9afd56`, `e8d3f36`. | Sinh viên làm theo README trên máy mình; phép thử clone vào thư mục trống được lên kế hoạch ở buổi 12. |

### Ghi chú

- Công cụ AI được dùng làm trợ lý viết mã và tài liệu; sinh viên quyết định phạm vi từng buổi, đọc và chạy lại kết quả, rồi tự commit và đẩy lên GitHub (phiên làm việc với AI chỉ có quyền đọc repo).
- Sinh viên có trách nhiệm giải thích được từng hàm và từng quyết định thiết kế trong các tệp liệt kê ở trên khi giảng viên yêu cầu.

---

## III. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> **“Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp bài này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”**

- **Chữ ký / Họ tên sinh viên:** Viên Thành Đạt
- **Ngày khai báo:** 28/10/2026

---

**Sinh viên xác nhận**

**Viên Thành Đạt**
