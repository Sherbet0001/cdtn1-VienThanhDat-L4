# Bug Log

Mỗi mục là một lỗi đã thực sự gỡ theo bốn bước: tái lập → khoanh vùng → sửa nguyên nhân → xác nhận bằng test.

## BUG-001 · Major — Gửi `center_id` quá lớn làm API trả 500 thay vì 400

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-001 · Major (lỗi do người dùng nhập lại trả 500, vi phạm quy ước "lỗi người dùng không bao giờ là 500" của hợp đồng API; ảnh hưởng mọi endpoint nhận `center_id` trong thân yêu cầu) |
| 2. Phát hiện bởi | Rà soát giá trị biên của đầu vào ở buổi 11 (không phải test case có sẵn): thử các số lớn hơn kiểu cột của CSDL |
| 3. Triệu chứng | `POST /api/tickets` với `center_id` = 99999999999 trả 500 `INTERNAL_ERROR`; giao diện hiện "Hệ thống đang gặp sự cố" |
| 4. Cách tái lập | Đầu vào nhỏ nhất: `{"customer_name":"An","customer_phone":"0901234567","device_name":"iPhone 14","issue_category":"PIN","center_id":99999999999}`. Lệnh: `curl.exe -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "@bug001.json"` (5/5 lần đều lỗi). Với `center_id` = 2 thì thành công, nên chỗ khác biệt duy nhất là độ lớn của `center_id`. Chạy trực tiếp trên PostgreSQL 16: `PREPARE b AS SELECT ticket_id FROM ticket WHERE center_id = $1; EXECUTE b('99999999999');` báo `value "99999999999" is out of range for type integer` |
| 5. Nguyên nhân | Cột `center_id` kiểu `INT` (tối đa 2.147.483.647) nhưng validator chỉ kiểm "là số nguyên ≥ 1", nên 99999999999 qua được tầng kiểm tra định dạng, tới CSDL mới bị từ chối (lỗi PostgreSQL 22003) và rơi xuống bộ xử lý lỗi hệ thống. Chỗ vi phạm hợp đồng đầu tiên là `validateTicketCreate` và `validateTechnician`: ràng buộc của schema không được phản ánh ở lớp validator. (Tham số truy vấn `?center_id=` đã có giới hạn 9 chữ số nên không bị.) |
| 6. Cách sửa | Thêm giới hạn trên `INT_TOI_DA = 2147483647` cho `center_id` ở hai validator (`src/validators/ticket.validator.js`, `src/validators/technician.validator.js`), sửa ở lớp validator vì đó là nơi hợp đồng dữ liệu được kiểm; không bọc `try/catch` ở controller. Giá trị lớn nhất hợp lệ (2147483647) vẫn được nhận. |
| 7. Commit và xác nhận | Commit: `fix(validator): chặn center_id vượt kiểu INT, trả 400 thay vì 500` — link: https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4/commit/06cd4c7 · Test hồi quy `tests/bug-center-id.test.js` (3 test): chạy TRƯỚC khi sửa 3 FAIL, SAU khi sửa 3 PASS; toàn bộ bộ test 97/97 PASS |

## BUG-002 · Critical — Tắt cơ sở dữ liệu làm sập cả máy chủ API

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-002 · Critical (một thành phần phụ trợ ngừng làm cả hệ thống ngừng, không tự hồi phục) |
| 2. Phát hiện bởi | Phép thử suy giảm có kiểm soát của buổi 11–12: tắt CSDL khi hệ thống đang chạy bằng Docker |
| 3. Triệu chứng | Sau `docker compose stop db` (api sập: `Exited (1)`), tải lại `http://localhost:3000/` hiện "This site can't be reached - localhost refused to connect" (`ERR_CONNECTION_REFUSED`); đáng ra phải hiện giao diện báo lỗi có mã tra cứu và nút Thử lại |
| 4. Cách tái lập | Chạy `docker compose up -d --build`, mở trang để máy chủ có kết nối CSDL, rồi `docker compose stop db` và tải lại trang (lỗi xuất hiện mỗi lần). Chỉ cần dừng `db`, không cần dữ liệu đầu vào nào |
| 5. Nguyên nhân | `src/server.js` tạo `new Pool(...)` nhưng không lắng nghe sự kiện `'error'` của pool. Khi CSDL tắt, PostgreSQL cắt các kết nối rảnh trong pool (mã `57P01`), thư viện `pg` phát sự kiện `'error'` trên pool; trong Node.js một `EventEmitter` phát `'error'` mà không có người nghe sẽ ném lỗi và làm CẢ TIẾN TRÌNH thoát, nên container `api` dừng. Chỗ vi phạm đầu tiên: pool được tạo mà không có bộ xử lý lỗi (bộ xử lý lỗi của Express chỉ bắt lỗi trong yêu cầu, không bắt sự kiện của pool) |
| 6. Cách sửa | Tách việc tạo pool ra `src/db/pool.js` (`taoPool`) và gắn `pool.on('error', ...)` ghi cảnh báo, để pool tự mở kết nối mới khi CSDL trở lại; yêu cầu gọi lúc CSDL tắt sẽ đi qua bộ xử lý lỗi và trả 503 kèm mã tra cứu. Thêm `restart: unless-stopped` cho `api` trong `docker-compose.yml` như lớp bảo vệ thứ hai nếu tiến trình thoát vì lý do khác. Không bọc `try/catch` che triệu chứng |
| 7. Commit và xác nhận | Commit: `fix(db): lắng nghe lỗi của pool để tắt CSDL không làm sập máy chủ` — link: https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4/commit/cab541a · Test hồi quy `tests/bug-pool-error.test.js` (lớp pool giả phát `'error'`; không có bộ lắng nghe thì Node ném lỗi, có thì chỉ ghi cảnh báo); sau khi sửa, chạy lại phép thử `docker compose stop db` trên máy: trang vẫn mở được và hiện "Hệ thống đang gặp sự cố ... Mã tra cứu: ..." cùng nút Thử lại (ảnh `docs/anh/suy-giam-tat-db.png`). Bằng chứng trước khi sửa: `docker compose ps -a` cho `api` ở trạng thái `Exited (1)` và log kết thúc bằng thông tin lỗi chưa được xử lý của Node.js (ảnh `docs/anh/bug002-api-exited.png`) |

