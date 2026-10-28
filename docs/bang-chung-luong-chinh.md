# Bằng chứng luồng chính chạy trên dữ liệu thật (buổi 10)

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Chụp ngày 28/10/2026 trên máy sinh viên: `npm start` với PostgreSQL cục bộ đã `migrate` và `seed` (README mục 3), mở `http://localhost:3000/` bằng trình duyệt trong trình soạn thảo mã.

Luồng chính (UC3): danh sách phiếu `MOI` chưa phân công → chi tiết phiếu và kỹ thuật viên đủ điều kiện → xác nhận phân công. Phiếu `MOI` đến từ dữ liệu seed (12 phiếu, TD-21) hoặc từ màn hình tiếp nhận.

## 1. Danh sách phiếu chưa phân công (màn 1, FR1)

![Danh sách phiếu chưa phân công](anh/Screenshot%202026-10-28%20125540.png)

- Dữ liệu là phiếu thật từ bộ dữ liệu Mekong Mobile (mã dạng `BH-000212/2026`, thiết bị và khách hàng lấy từ dataset), không phải ba dòng tự gõ.
- Sắp theo hạn cam kết tăng dần (từ 18/07/2026 trở đi) đúng hợp đồng API mục 2.1.
- Hạn cam kết đã qua được ghi bằng chữ "quá hạn" (không chỉ bằng màu). Toàn bộ phiếu hiện quá hạn vì dữ liệu mẫu có ngày nhận từ năm 2026 và không được sửa ngày để giữ dữ liệu thật (TD-21).
- Phiếu `BH-000113/2026` (Hoàng Quang Nam, vivo C2, màn hình) là phiếu dùng trong các lệnh `curl.exe` ở README mục 4.

## 2. Chi tiết phiếu và kỹ thuật viên đủ điều kiện (màn 2, FR2)

![Chi tiết phiếu BH-000212/2026 và kỹ thuật viên đủ điều kiện](anh/Screenshot%202026-10-28%20130108.png)

- Phiếu `BH-000212/2026` (nhóm sự cố Nước vào, ưu tiên Cao, trạng thái Mới, chưa phân công) mở từ liên kết ở màn 1.
- Bảng "Kỹ thuật viên đủ điều kiện" có hai người, sắp theo số phiếu đang giữ tăng dần: Đỗ Văn Thắng (Cao cấp, thành thạo 5, đang giữ 26) rồi Phạm Quang Hoa (Sơ cấp, thành thạo 4, đang giữ 35). Cả hai thành thạo từ 3 trở lên với nhóm sự cố của phiếu (QT-08).
- Nút "Xác nhận phân công" bị khóa cho đến khi chọn một kỹ thuật viên (chưa chọn trong ảnh).

## 3. Tiếp nhận phiếu mới (màn 3)

![Màn hình tiếp nhận phiếu mới](anh/Screenshot%202026-10-28%20125737.png)

Biểu mẫu sáu trường: họ tên khách, số điện thoại (nhận dạng `090…` hoặc `+84…`, chuẩn hóa theo QT-02), thiết bị, nhóm sự cố, mức ưu tiên (mặc định theo nhóm sự cố), trung tâm nhận. Gửi thiếu hoặc sai trường thì lỗi hiện ngay dưới đúng ô sai (`error.fields`, TD-19).

## 4. Danh sách kỹ thuật viên

![Danh sách kỹ thuật viên](anh/Screenshot%202026-10-28%20125749.png)

Lọc mặc định "Đang hoạt động": mã 1 và 11 vắng vì đã nghỉ trong dữ liệu mẫu. Bảng có phân trang 20 dòng.

## 5. Kết quả chạy lệnh đã ghi bằng văn bản

Kết quả `migrate` hai lần, `seed` hai lần, đếm dòng và năm lệnh `curl.exe` của module kỹ thuật viên nằm ở `docs/bang-chung-chay-thuc-te.md`.

## 6. Chưa có ảnh

- Thông báo phân công thành công và phiếu chuyển sang "Đã phân công" (sau khi chọn kỹ thuật viên và bấm Xác nhận ở màn chi tiết).

Bước này được kiểm thử bằng test tích hợp (`tests/ticket.assign.test.js`) và chạy thử trong trình duyệt với máy chủ giả; cần bổ sung ảnh chụp giao diện từ máy sinh viên để hoàn tất minh chứng. Minh chứng của luồng chính dùng ảnh giao diện; các lệnh `curl.exe` ở README mục 4 chỉ để tự kiểm tra, không bắt buộc chụp.
