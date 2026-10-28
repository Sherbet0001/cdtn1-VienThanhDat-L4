# Bằng chứng luồng chính chạy trên dữ liệu thật (buổi 10)

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Chụp ngày 28/10/2026 trên máy sinh viên: `npm start` với PostgreSQL cục bộ đã `migrate` và `seed` (README mục 3), mở `http://localhost:3000/` bằng trình duyệt trong trình soạn thảo mã.

Luồng chính (UC3): danh sách phiếu `MOI` chưa phân công → chi tiết phiếu và kỹ thuật viên đủ điều kiện → xác nhận phân công. Phiếu `MOI` đến từ dữ liệu seed (12 phiếu, TD-21) hoặc từ màn hình tiếp nhận.

## 1. Danh sách phiếu chưa phân công (màn 1, FR1)

![Danh sách phiếu chưa phân công](anh/Screenshot%202026-10-28%20125540.png)

- Dữ liệu là phiếu thật từ bộ dữ liệu Mekong Mobile (mã dạng `BH-000212/2026`, thiết bị và khách hàng lấy từ dataset), không phải ba dòng tự gõ.
- Sắp theo hạn cam kết tăng dần (từ 18/07/2026 trở đi) đúng hợp đồng API mục 2.1.
- Hạn cam kết đã qua được ghi bằng chữ "quá hạn" (không chỉ bằng màu). Toàn bộ phiếu hiện quá hạn vì dữ liệu mẫu có ngày nhận từ năm 2026 và không được sửa ngày để giữ dữ liệu thật (TD-21).
- Phiếu `BH-000113/2026` (Hoàng Quang Nam, vivo C2, màn hình) là phiếu dùng trong các lệnh `curl.exe` ở README mục 4.

## 2. Tiếp nhận phiếu mới (màn 3)

![Màn hình tiếp nhận phiếu mới](anh/Screenshot%202026-10-28%20125737.png)

Biểu mẫu sáu trường: họ tên khách, số điện thoại (nhận dạng `090…` hoặc `+84…`, chuẩn hóa theo QT-02), thiết bị, nhóm sự cố, mức ưu tiên (mặc định theo nhóm sự cố), trung tâm nhận. Gửi thiếu hoặc sai trường thì lỗi hiện ngay dưới đúng ô sai (`error.fields`, TD-19).

## 3. Danh sách kỹ thuật viên

![Danh sách kỹ thuật viên](anh/Screenshot%202026-10-28%20125749.png)

Lọc mặc định "Đang hoạt động": mã 1 và 11 vắng vì đã nghỉ trong dữ liệu mẫu. Bảng có phân trang 20 dòng.

## 4. Kết quả chạy lệnh đã ghi bằng văn bản

Kết quả `migrate` hai lần, `seed` hai lần, đếm dòng và năm lệnh `curl.exe` của module kỹ thuật viên nằm ở `docs/bang-chung-chay-thuc-te.md`.

## 5. Chưa có ảnh

- Màn chi tiết phiếu với danh sách kỹ thuật viên đủ điều kiện và nút "Xác nhận phân công".
- Thông báo phân công thành công và phiếu chuyển sang "Đã phân công".
- Kết quả các lệnh `curl.exe` của luồng phân công (README mục 4: 400 `TECH_NOT_ELIGIBLE`, 201, 409 `TICKET_ALREADY_ASSIGNED`).

Ba mục này được kiểm thử bằng test tích hợp (`tests/ticket.assign.test.js`) và chạy thử trong trình duyệt với máy chủ giả; cần bổ sung ảnh chụp từ máy sinh viên để hoàn tất minh chứng.
