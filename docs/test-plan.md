# Test Plan — Luồng L4: Phân công kỹ thuật viên (track SE)

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Smart CRM – Mekong Mobile · Phạm vi: Bài tập 3.
Test Report chi tiết (tám cột, kết quả chạy thật) nằm ở `docs/test-report.md`; Bug Log ở `docs/bug-log.md`.

## 1. Phạm vi

**Kiểm:**
- Luồng chính UC3 phân công KTV: xem phiếu chưa phân công (FR1), KTV đủ điều kiện (FR2), gán KTV (FR3, FR4).
- Quy tắc nghiệp vụ đã hiện thực: QT-02 (chuẩn hóa số điện thoại), QT-04 (hạn cam kết, bỏ Chủ nhật), QT-06 (mỗi lần đổi trạng thái có một dòng log), QT-07 (một phiếu một KTV), QT-08 (cùng trung tâm, đang hoạt động, thành thạo ≥ 3), QT-13 (xóa mềm), QT-15 (che số điện thoại trong log). TD-16 và các luồng còn lại được kiểm thêm trong bộ `npm test` nhưng không nằm trong 12 test case của Test Report.
- CRUD Technician và Ticket qua API; xử lý lỗi: 400 (sai định dạng), 404, 409 (xung đột trạng thái nghiệp vụ), 500/503 không lộ chi tiết kỹ thuật.
- Tính tái lập: chạy migration và seed hai lần không lỗi, không nhân đôi dữ liệu.
- Xác thực và phân quyền (TD-34, track SE): đăng nhập, mật khẩu lưu dạng băm, token (hạn, bị sửa, thuật toán `none`), quản lý chỉ truy cập trung tâm của mình (QT-14, OWASP A01), thông điệp đăng nhập không lộ tên tài khoản (A07).

**CỐ Ý KHÔNG kiểm (kèm lý do):**
- Lịch hẹn giao – nhận máy (UC6, UC7, FR7–FR9) và đổi KTV (FR5): chưa hiện thực trong BT2.
- Hiệu năng, tải, giao diện cấu hình: thuộc Chuyên đề tốt nghiệp 2; màn hình cấu hình chỉ đọc, không có quy tắc nghiệp vụ.
- Kiểm thử tự động qua giao diện (trình duyệt): giao diện chỉ gọi API, được kiểm bằng ảnh chụp ba trạng thái (đang tải, rỗng, lỗi) và thử tay màn hình đăng nhập.
- Đổi mật khẩu, thu hồi token trước hạn, mã hoá số điện thoại: chưa hiện thực (ghi ở `docs/checklist-bao-mat.md`).

## 2. Loại test và số lượng

| Tầng | Số test case (Test Report) | Kiểm cái gì |
|---|---|---|
| Unit (service/rules, không CSDL, đồng hồ được tiêm vào) | 6 | QT-02, QT-04, QT-08, QT-15 |
| Integration (service + repository + PostgreSQL thật) | 3 | QT-06/07 trong giao dịch, khóa dòng, dữ liệu lưu đúng |
| API (HTTP qua Express, CSDL thật) | 3 | Mã trạng thái, nội dung thông báo, tác dụng phụ trên CSDL, QT-13 |
| **Tổng (12 test case chung)** | **12** | Hình kim tự tháp: đáy là unit, đỉnh là API |
| API bảo mật, track SE (đăng nhập và phân quyền, CSDL thật) | 2 | TC-13 quyền theo trung tâm (QT-14, A01), TC-14 mật khẩu băm và thông điệp đăng nhập (A02/A07) |

Cơ cấu theo năm loại BT3: luồng đúng × 5 · giá trị biên × 2 (hai bên cùng một ranh giới QT-04: thứ Sáu và thứ Bảy) · dữ liệu sai × 3 (kiểm cả mã trạng thái và thông báo) · bảo mật/chất lượng dữ liệu × 1 (số điện thoại không lộ trong log, QT-15) · tính tái lập × 1 (migration + seed hai lần). Mỗi quy tắc QT-02, 04, 06, 07, 08, 13, 15 có ít nhất một test case trong Test Report.

**Kỹ thuật chọn dữ liệu thử:**
- Phân vùng tương đương: mỗi nhóm đầu vào xử lý giống nhau thử một giá trị đại diện (ví dụ mức ưu tiên CAO/TRUNG_BINH/THAP; số điện thoại đúng định dạng/sai định dạng/rỗng).
- Giá trị biên: thử ngay tại và sát ranh giới. QT-04: nhận vào thứ Bảy mức CAO rơi đúng Chủ nhật thì lùi sang thứ Hai, và thứ Sáu + 24h (thứ Bảy, vẫn làm việc). QT-08: thành thạo 2 (từ chối) và 3 (chấp nhận). QT-02: số điện thoại 9, 10, 11 số.
- Nguồn sinh test case: tiêu chí chấp nhận GIVEN–WHEN–THEN ở BT1, luồng ngoại lệ trong đặc tả use case, quy tắc QT-xx, và mỗi bug đã sửa có một test hồi quy.
- Thời gian và CSDL được tiêm vào (đồng hồ giả, repository giả cho unit) để test xác định, chạy ở đâu cũng cho cùng kết quả.

## 3. Tiêu chí thành công (đặt trước khi chạy)

- 12/12 test case có kết quả thực tế cụ thể (bằng lời, kèm ảnh chụp lệnh chạy); test case FAIL được ghi trung thực, không đổi thành PASS.
- Mỗi quy tắc đã hiện thực (QT-02, 04, 06, 07, 08, 13, 15) có ít nhất một test; QT-04 và QT-08 có test biên.
- Không còn bug Critical đang mở; bug Major còn lại có lý do và hướng xử lý trong Bug Log.
- `npm test` chạy một lệnh, PASS toàn bộ, không phụ thuộc dữ liệu có sẵn trên máy; chạy lại hai lần cho cùng kết quả.
- Mỗi test có khả năng thất bại: cố tình sửa mã (đổi ≤ thành <, bỏ điều kiện) thì ít nhất một test chuyển sang FAIL.

## 4. Môi trường và dữ liệu thử

- Môi trường: Node.js 20, PostgreSQL 16 (container `db` của `docker-compose.yml`); unit test không cần CSDL.
- Dữ liệu: tiền điều kiện do mã dựng (hàm dựng/dọn dữ liệu chạy trước mỗi test), không dựa vào dữ liệu có sẵn trên máy; dữ liệu mẫu từ `seeds/` (38 KTV, 159 kỹ năng, 1.063 khách, 1.098 phiếu).
- Lệnh chạy: `npm test`.
- Chạy sạch: clone về thư mục trống, làm theo README (hai lệnh Docker hoặc tám bước npm).

> Ghi chú tiến độ: mục 2 là kế hoạch; số lượng thực tế và kết quả sẽ cập nhật trong `docs/test-report.md` sau khi chạy thật.
