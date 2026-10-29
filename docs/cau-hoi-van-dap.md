# Chuẩn bị vấn đáp BT2: bộ ba câu hỏi cho ba hàm chính

Giảng viên chọn ngẫu nhiên một hàm và hỏi: (1) vì sao chọn cách này, (2) nếu dữ liệu tăng gấp mười thì chỗ nào hỏng trước, (3) chỉ dòng mã chịu trách nhiệm. Số dòng dưới đây tính theo phiên bản `v0.2`; nếu mở tệp thấy lệch vài dòng thì tìm theo tên hàm.

## Hàm 1: `TicketService.assign` (`src/services/ticket.service.js`, dòng 71 trở đi)

**1. Vì sao chọn cách này?** Cả bước đọc phiếu, kiểm tra và ghi nằm trong MỘT giao dịch (`runInTransaction`, dòng 71) và phiếu bị khóa dòng ngay đầu giao dịch (`lockById`, dòng 72; câu SQL `FOR UPDATE OF t` ở `src/repositories/ticket.repository.js`, dòng 92). Nhờ vậy nếu hai quản lý cùng gán một phiếu thì người thứ hai phải đợi, rồi thấy phiếu không còn `MOI` và nhận 409 `TICKET_ALREADY_ASSIGNED` (QT-07), thay vì ghi đè. Phương án khác: không khóa mà dùng `UPDATE ... WHERE status = 'MOI'` rồi kiểm số dòng bị ảnh hưởng (lạc quan, không giữ khóa lâu). Em chọn khóa dòng vì còn phải kiểm QT-08 giữa chừng và muốn các bước đọc nhất quán; nhược điểm là giữ khóa trong lúc kiểm tra.

**2. Dữ liệu tăng gấp mười thì chỗ nào hỏng trước?** Khóa dòng chỉ khóa MỘT phiếu nên nhiều người gán các phiếu khác nhau không chặn nhau. Chỗ chật trước là số kết nối của Pool (`DB_POOL_MAX`, mặc định 10): mỗi lần gán giữ một kết nối suốt giao dịch. Cách đo: chạy nhiều yêu cầu gán song song và xem thời gian chờ lấy kết nối; ở phía CSDL dùng `pg_stat_activity` xem số phiên đang chờ khóa.

**3. Dòng mã chịu trách nhiệm.** Việc chống gán trùng: `ticket.service.js` dòng 72 (khóa) và dòng 74–75 (kiểm `status !== 'MOI'`, ném `TICKET_ALREADY_ASSIGNED`). Việc kiểm tay nghề: dòng 83 gọi `lyDoKhongDuDieuKien` ở `ticket.rules.js`. Việc ghi lịch sử: dòng 86–87 (`setAssignment`, `insertLog`) cùng giao dịch (QT-06). Test tương ứng: `tests/ticket.assign.test.js`, các test "gán thành công", "phiếu đã có người ... KHÔNG ghi đè", "ghi log lỗi giữa chừng" và hai test `runInTransaction` COMMIT/ROLLBACK.

*Điều cần nói thật:* test tự động dùng repository giả nên chưa chứng minh được khóa dòng của PostgreSQL; em đã chạy riêng hai phiên song song trên PostgreSQL 16 và thấy phiên thứ hai đợi rồi bị từ chối (ghi ở TD-23), còn test đồng thời tự động TC-11 là việc chưa làm (TD-08).

## Hàm 2: `hanCamKet` (`src/services/ticket.rules.js`, dòng 24)

**1. Vì sao chọn cách này?** Hàm thuần (không CSDL, không HTTP, giờ hiện tại được truyền vào) nên kiểm thử đơn vị được ngay với một mốc thời gian cố định. QT-04: Cao 24 giờ, Trung bình 72 giờ, Thấp 120 giờ, không tính Chủ nhật. Em cộng từng ngày một (vòng lặp) và mỗi lần rơi vào Chủ nhật theo giờ Việt Nam thì cộng thêm (dòng 30). Phương án khác: tính bằng công thức chia tuần; em chọn vòng lặp vì số ngày tối đa chỉ 5, dễ đọc và dễ chứng minh đúng.

**2. Dữ liệu tăng gấp mười thì chỗ nào hỏng trước?** Hàm này không phụ thuộc lượng dữ liệu (tối đa 5 lần lặp), nên không phải điểm nghẽn. Điểm cần chú ý là múi giờ: hàm dùng độ lệch cố định +7 vì Việt Nam không có giờ mùa hè; nếu mở rộng sang nước khác thì phải đổi.

**3. Dòng mã chịu trách nhiệm.** Bảng giờ cam kết: `GIO_CAM_KET` (đầu tệp); vòng lặp cộng ngày: dòng 28–31; bỏ Chủ nhật: dòng 30 và hàm `laChuNhatVN`. Nơi gọi: `TicketService.create` (hạn tính lúc tiếp nhận) và `TicketService.update` (tính lại khi đổi mức ưu tiên). Test: `tests/ticket.rules.test.js`.

## Hàm 3: `listUnassigned` (`src/repositories/ticket.repository.js`) và `validateUnassignedQuery`

**1. Vì sao chọn cách này?** Danh sách phiếu chưa phân công phân trang ở CSDL (`LIMIT`/`OFFSET`, tối đa 100 dòng mỗi trang, kiểm ở `validateUnassignedQuery`), sắp theo hạn cam kết để phiếu gấp lên đầu (FR1). Không tải hết phiếu về rồi cắt ở Node vì dữ liệu mẫu đã có hơn một nghìn phiếu. Chỉ mục riêng `ix_ticket_unassigned ON ticket (center_id, due_date) WHERE status = 'MOI'` (`migrations/001_init.sql`, dòng 72) chỉ chứa phiếu Mới nên nhỏ và đúng thứ tự cần sắp.

**2. Dữ liệu tăng gấp mười thì chỗ nào hỏng trước?** Hai chỗ: (a) `OFFSET` lớn phải đọc rồi bỏ qua nhiều dòng, trang càng sâu càng chậm (có thể đổi sang phân trang theo khóa `due_date, ticket_id`); (b) câu `COUNT(*)` tổng số phiếu chạy mỗi lần gọi. Danh sách kỹ thuật viên đủ điều kiện (`listEligible`) còn đếm số phiếu đang giữ bằng truy vấn con cho từng kỹ thuật viên; chỉ mục `ix_ticket_technician` phục vụ việc này. Em chưa đo; cách đo là `EXPLAIN ANALYZE` hai câu trên với dữ liệu nhân mười.

**3. Dòng mã chịu trách nhiệm.** Điều kiện chỉ lấy phiếu Mới chưa có người: hằng `dieuKien` trong `listUnassigned`; giới hạn trang: `validateUnassignedQuery` (`src/validators/ticket.validator.js`); đổi sang JSON API: `toTicketView` (`src/contracts/ticket.contract.js`). Test: `tests/ticket.routes.test.js`, `tests/ticket.validator.test.js`.

## Kịch bản demo 3 phút

1. **Luồng chính (khoảng 1 phút):** mở `http://localhost:3000/`, vào "Phiếu chưa phân công", mở một phiếu, chọn kỹ thuật viên đủ điều kiện, bấm Xác nhận, thấy phiếu sang "Đã phân công".
2. **Một lỗi được xử lý đúng (khoảng 30 giây):** vào "Tiếp nhận phiếu", gửi số điện thoại sai; lỗi hiện ngay dưới đúng ô. Hoặc gọi `curl.exe -X POST` với `data/mau/tiep-nhan-thieu-truong.json` và cho xem khung lỗi `fields`.
3. **Test (khoảng 30 giây):** chạy `npm test`, cho thấy số test PASS và chỉ ra ba loại (luồng đúng, biên, dữ liệu sai).
4. **Một lỗi đã gỡ (khoảng 1 phút):** mở `docs/bug-log.md`, kể BUG-001 theo bốn bước: tái lập (`center_id` quá lớn trả 500) → khoanh vùng (validator cho qua, CSDL từ chối) → sửa nguyên nhân (giới hạn `INT` ở validator) → xác nhận (test hồi quy FAIL trước, PASS sau).
