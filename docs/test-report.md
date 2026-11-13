# Test Report — Luồng L4: Phân công kỹ thuật viên (track SE)

Sinh viên: Viên Thành Đạt · MSSV 2374802010107. Kế hoạch: `docs/test-plan.md`. Bug phát hiện: `docs/bug-log.md`.

> **Đã chạy ngày 05/11/2026** trên máy sinh viên: `npm test` với PostgreSQL 16 thật (container `postgres:16-alpine`, CSDL `l4_test`): 123 test, 123 PASS, 0 FAIL, 0 bỏ qua. Ảnh chụp: `docs/anh/bt3-docker-run.png` (dựng CSDL thử), `docs/anh/bt3-npm-test-1.png` và `docs/anh/bt3-npm-test-2.png` (kết quả chạy cả bộ; TC-01..TC-12 nằm ở ảnh 1).
> **Minh chứng từng test case:** mỗi test case được chạy riêng bằng `npm run tc -- TC-xx` và chụp ảnh lưu ở `docs/screenshots/TC-xx.png` (chạy ngày 06/11/2026, cả 12 đều PASS, `pass 1 / fail 0`).
> Cả 12 test case đều PASS ở lần chạy này. Sau đó phát hiện BUG-003 (ký tự NUL trong văn bản nhập trả 500, xem `docs/bug-log.md`); sau khi sửa và thêm test hồi quy, chạy lại cho 127 test, 127 PASS, 0 FAIL, 0 bỏ qua (`docs/anh/bt3-npm-test-sau-bug003.png`).

Mỗi test case có đủ tám cột: (1) Mã · (2) Tiền điều kiện · (3) Các bước · (4) Dữ liệu thử · (5) Kết quả mong đợi · (6) Ưu tiên · (7) Kết quả thực tế · (8) PASS/FAIL.
Cách chạy riêng một test case: `npm run tc -- TC-05` (đổi mã; cần `TEST_DATABASE_URL` cho TC-07..TC-12). Chạy tất cả: `npm test`.

## Tổng hợp

| Mã | Loại | Tầng | Quy tắc | Tệp test | PASS/FAIL |
|---|---|---|---|---|---|
| TC-01 | Luồng đúng | Unit | QT-04 | tests/bt3/unit.test.js | PASS |
| TC-02 | Biên (bên Chủ nhật) | Unit | QT-04 | tests/bt3/unit.test.js | PASS |
| TC-03 | Biên (bên thứ Bảy) | Unit | QT-04 | tests/bt3/unit.test.js | PASS |
| TC-04 | Luồng đúng | Unit | QT-08 | tests/bt3/unit.test.js | PASS |
| TC-05 | Dữ liệu sai | Unit | QT-02 | tests/bt3/unit.test.js | PASS |
| TC-06 | Bảo mật / chất lượng dữ liệu | Unit | QT-15 | tests/bt3/unit.test.js | PASS |
| TC-07 | Luồng đúng | Integration (PostgreSQL thật) | QT-06, QT-07 | tests/bt3/integration.test.js | PASS |
| TC-08 | Dữ liệu sai | Integration (PostgreSQL thật) | QT-07 | tests/bt3/integration.test.js | PASS |
| TC-09 | Tái lập | Integration (PostgreSQL thật) | migration + seed | tests/bt3/integration.test.js | PASS |
| TC-10 | Luồng đúng | API | QT-04 | tests/bt3/api.test.js | PASS |
| TC-11 | Dữ liệu sai | API | validator | tests/bt3/api.test.js | PASS |
| TC-12 | Luồng đúng | API | QT-13 | tests/bt3/api.test.js | PASS |

Năm loại: luồng đúng 5 (TC-01, 04, 07, 10, 12) · biên 2 (TC-02, 03) · dữ liệu sai 3 (TC-05, 08, 11) · bảo mật/chất lượng dữ liệu 1 (TC-06) · tái lập 1 (TC-09).

## Chi tiết

### TC-01 · Luồng đúng · QT-04 hạn cam kết mức CAO
1. **Mã:** TC-01
2. **Tiền điều kiện:** không cần CSDL; hàm thuần `hanCamKet`.
3. **Các bước:** (1) Gọi `hanCamKet(nhanLuc, 'CAO')`.
4. **Dữ liệu thử:** nhanLuc = `2026-11-02T09:00:00+07:00` (thứ Hai), ưu tiên `CAO`.
5. **Kết quả mong đợi:** hạn = `2026-11-03T09:00:00+07:00` (thứ Ba, đúng 24 giờ).
6. **Ưu tiên:** Cao (quy tắc cốt lõi).
7. **Kết quả thực tế:** Hạn = 2026-11-03T09:00:00+07:00 (thứ Ba), khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-01.png`, chạy bằng `npm run tc -- TC-01`)

### TC-02 · Biên · QT-04, nhận thứ Bảy, hạn rơi vào Chủ nhật
1. **Mã:** TC-02
2. **Tiền điều kiện:** không cần CSDL.
3. **Các bước:** (1) Gọi `hanCamKet` với thời điểm nhận là thứ Bảy.
4. **Dữ liệu thử:** nhanLuc = `2026-11-07T15:00:00+07:00` (thứ Bảy), ưu tiên `CAO`.
5. **Kết quả mong đợi:** hạn = `2026-11-09T15:00:00+07:00` (thứ Hai, cùng giờ; Chủ nhật không được tính).
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Hạn = 2026-11-09T15:00:00+07:00 (thứ Hai), Chủ nhật 8/11 không được tính; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-02.png`, chạy bằng `npm run tc -- TC-02`)

### TC-03 · Biên · QT-04, nhận thứ Sáu, hạn rơi vào thứ Bảy (bên kia của cùng ranh giới)
1. **Mã:** TC-03
2. **Tiền điều kiện:** không cần CSDL.
3. **Các bước:** (1) Gọi `hanCamKet` với thời điểm nhận là thứ Sáu.
4. **Dữ liệu thử:** nhanLuc = `2026-11-06T15:00:00+07:00` (thứ Sáu), ưu tiên `CAO`.
5. **Kết quả mong đợi:** hạn = `2026-11-07T15:00:00+07:00` (thứ Bảy vẫn là ngày làm việc, không bị lùi).
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Hạn = 2026-11-07T15:00:00+07:00 (thứ Bảy), không bị lùi; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-03.png`, chạy bằng `npm run tc -- TC-03`)

### TC-04 · Luồng đúng · QT-08 KTV đủ điều kiện
1. **Mã:** TC-04
2. **Tiền điều kiện:** không cần CSDL; hàm thuần `lyDoKhongDuDieuKien`.
3. **Các bước:** (1) Gọi hàm với phiếu và KTV cùng trung tâm.
4. **Dữ liệu thử:** phiếu `{centerId: 4, issueCategory: 'MAN_HINH'}`; KTV `{centerId: 4, isActive: true, proficiency: 4}`.
5. **Kết quả mong đợi:** trả `null` (đủ điều kiện, không có lý do từ chối).
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Hàm trả null (đủ điều kiện); khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-04.png`, chạy bằng `npm run tc -- TC-04`)

### TC-05 · Dữ liệu sai · QT-02 số điện thoại 9 số
1. **Mã:** TC-05
2. **Tiền điều kiện:** không cần CSDL; `validateTicketCreate`.
3. **Các bước:** (1) Gọi `validateTicketCreate` với số điện thoại thiếu một chữ số.
4. **Dữ liệu thử:** `{customer_name:'An', customer_phone:'090123456', device_name:'iPhone 15', issue_category:'MAN_HINH', center_id:4}`.
5. **Kết quả mong đợi:** ném `ValidationError`, `fields` chứa `customer_phone` kèm lý do "phải là số điện thoại 10 chữ số bắt đầu bằng 0 (hoặc +84)"; không có lỗi ở trường khác.
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Ném VALIDATION_ERROR, fields có đúng 1 phần tử `customer_phone`, lý do chứa "10 chữ số"; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-05.png`, chạy bằng `npm run tc -- TC-05`)

### TC-06 · Bảo mật / chất lượng dữ liệu · QT-15 che số điện thoại
1. **Mã:** TC-06
2. **Tiền điều kiện:** không cần CSDL; logger ghi vào bộ nhớ.
3. **Các bước:** (1) Gọi `cheSdt('0901234567')`. (2) Ghi một dòng log có trường `customer_phone: '0901234567'`. (3) Tìm chuỗi số đầy đủ trong dòng log.
4. **Dữ liệu thử:** số điện thoại `0901234567`.
5. **Kết quả mong đợi:** `cheSdt` trả `090****567`; dòng log KHÔNG chứa `0901234567`, trường `customer_phone` là `***`.
6. **Ưu tiên:** Cao (số điện thoại lộ trong log là bug Critical).
7. **Kết quả thực tế:** cheSdt trả 090****567; dòng log không chứa 0901234567, trường customer_phone = "***"; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-06.png`, chạy bằng `npm run tc -- TC-06`)

### TC-07 · Luồng đúng · QT-06/QT-07 gán KTV thành công (PostgreSQL thật)
1. **Mã:** TC-07
2. **Tiền điều kiện:** CSDL thử rỗng (hàm dọn chạy trước test); do mã dựng: 1 trung tâm, 1 khách, 1 KTV (trung tâm 4, thành thạo MAN_HINH = 4, đang hoạt động), 1 phiếu MOI nhóm MAN_HINH trung tâm 4.
3. **Các bước:** (1) Gọi `TicketService.assign(ticketId, technicianId, nguoiThucHien)` với repository thật. (2) Đọc lại bảng `ticket` và `ticket_status_log`.
4. **Dữ liệu thử:** ticketId và technicianId do bước dựng sinh ra.
5. **Kết quả mong đợi:** `ticket.status = 'DA_PHAN_CONG'`, `technician_id` đúng KTV; `ticket_status_log` có ĐÚNG MỘT dòng cho phiếu: `old_status = 'MOI'`, `new_status = 'DA_PHAN_CONG'`.
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** ticket.status = DA_PHAN_CONG, technician_id đúng KTV; ticket_status_log có 1 dòng MOI -> DA_PHAN_CONG, new_technician_id đúng KTV; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-07.png`, chạy bằng `npm run tc -- TC-07`)

### TC-08 · Dữ liệu sai · QT-07 gán lại phiếu đã có KTV (PostgreSQL thật)
1. **Mã:** TC-08
2. **Tiền điều kiện:** như TC-07 nhưng phiếu đã gán cho KTV thứ nhất (DA_PHAN_CONG); có thêm KTV thứ hai đủ điều kiện.
3. **Các bước:** (1) Gọi `assign` với KTV thứ hai. (2) Đọc lại `ticket` và `ticket_status_log`.
4. **Dữ liệu thử:** KTV thứ hai (cùng trung tâm 4, thành thạo 5).
5. **Kết quả mong đợi:** ném lỗi `TICKET_ALREADY_ASSIGNED` (HTTP 409); `ticket.technician_id` vẫn là KTV thứ nhất; `ticket_status_log` vẫn đúng 1 dòng (không ghi thêm).
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Ném TICKET_ALREADY_ASSIGNED; technician_id vẫn là KTV thứ nhất; ticket_status_log vẫn 1 dòng; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-08.png`, chạy bằng `npm run tc -- TC-08`)

### TC-09 · Tái lập · migration và seed chạy lần hai (PostgreSQL thật)
1. **Mã:** TC-09
2. **Tiền điều kiện:** CSDL thử đã áp dụng `migrations/` (do mã dựng) và đã trống dữ liệu (hàm dọn chạy trước test).
3. **Các bước:** (1) Chạy `seeds/` lần một bằng `applyFiles` của `src/db/runner.js`, đếm số dòng các bảng. (2) Chạy lại `migrations/` rồi `seeds/`. (3) Đếm lại.
4. **Dữ liệu thử:** thư mục `migrations/` và `seeds/` của repo.
5. **Kết quả mong đợi:** lần hai không lỗi; `migrations/` được BỎ QUA hết (đã ghi trong `schema_migrations`), `seeds/` chạy lại mà không nhân đôi (`ON CONFLICT DO NOTHING`); số dòng `technician` (38), `technician_skill` (159), `customer` (1.063), `ticket` (1.098) không đổi sau lần hai.
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** Lần hai không lỗi; migrations được bỏ qua hết, seeds chạy lại; số dòng technician 38, technician_skill 159 và các bảng khác không đổi; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-09.png`, chạy bằng `npm run tc -- TC-09`)

### TC-10 · Luồng đúng · POST /api/tickets (API + PostgreSQL thật)
1. **Mã:** TC-10
2. **Tiền điều kiện:** CSDL thử có 1 trung tâm; bảng `ticket` rỗng; ứng dụng khởi động trên cổng ngẫu nhiên.
3. **Các bước:** (1) POST `/api/tickets` với thân hợp lệ. (2) Đếm dòng bảng `ticket`.
4. **Dữ liệu thử:** `{customer_name:'An', customer_phone:'0901234567', device_name:'iPhone 15', issue_category:'MAN_HINH', center_id:4}`.
5. **Kết quả mong đợi:** HTTP 201; `ticket_code` khớp `^BH-\d{6}/\d{4}$`; `status = 'MOI'`; `priority = 'CAO'` (mặc định của MAN_HINH); `due_date` = `received_at` + 24 giờ làm việc; bảng `ticket` tăng đúng 1 dòng.
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** HTTP 201; ticket_code đúng dạng BH-xxxxxx/năm; status MOI; priority CAO; technician_id null; hạn cách ngày nhận 24 hoặc 48 giờ, không rơi Chủ nhật; bảng ticket tăng 1 dòng; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-10.png`, chạy bằng `npm run tc -- TC-10`)

### TC-11 · Dữ liệu sai · POST /api/tickets thiếu trường bắt buộc (API + PostgreSQL thật)
1. **Mã:** TC-11
2. **Tiền điều kiện:** như TC-10; đếm sẵn số dòng `ticket` (= 0).
3. **Các bước:** (1) POST `/api/tickets` chỉ có `customer_name`. (2) Đếm lại bảng `ticket`.
4. **Dữ liệu thử:** `{customer_name:'An'}`.
5. **Kết quả mong đợi:** HTTP 400, `error.code = 'VALIDATION_ERROR'`, `error.fields` nêu đủ tên các trường thiếu (`customer_phone`, `device_name`, `issue_category`, `center_id`); thông báo không chứa vết ngăn xếp; bảng `ticket` KHÔNG có dòng mới (0 → 0).
6. **Ưu tiên:** Cao.
7. **Kết quả thực tế:** HTTP 400, VALIDATION_ERROR, fields đúng 4 trường center_id, customer_phone, device_name, issue_category; phản hồi không có vết ngăn xếp; bảng ticket không đổi số dòng; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-11.png`, chạy bằng `npm run tc -- TC-11`)

### TC-12 · Luồng đúng · QT-13 xóa mềm KTV (API + PostgreSQL thật)
1. **Mã:** TC-12
2. **Tiền điều kiện:** CSDL thử có 1 KTV đang hoạt động, không có phiếu mở.
3. **Các bước:** (1) DELETE `/api/technicians/{id}`. (2) Đọc lại dòng KTV trong bảng `technician`.
4. **Dữ liệu thử:** id của KTV vừa dựng.
5. **Kết quả mong đợi:** HTTP 2xx; dòng KTV VẪN còn trong bảng (không xóa vật lý) với `is_active = false`.
6. **Ưu tiên:** Trung bình.
7. **Kết quả thực tế:** HTTP 200; dòng KTV vẫn còn trong bảng technician (1 dòng); is_active = false; khớp mong đợi.
8. **PASS/FAIL:** PASS (ảnh `docs/screenshots/TC-12.png`, chạy bằng `npm run tc -- TC-12`)

## Kiểm thử chèn mã độc (buổi 15)

Bổ sung cho mục 2 của `docs/checklist-bao-mat.md`. Tệp `tests/bao-mat-injection.test.js` (6 test, không cần CSDL) đưa chuỗi tấn công kiểu `' OR '1'='1`, `1 OR 1=1`, `1; DROP TABLE ticket;--` vào số điện thoại, `center_id`, mã trong đường dẫn, `technician_id`, `limit`, `page`, `offset`. Mỗi ca khẳng định phản hồi là 400 `VALIDATION_ERROR` đúng trường, VÀ lớp nghiệp vụ không bao giờ được gọi (dịch vụ giả ném lỗi nếu bị gọi), tức là dữ liệu độc không tới được câu SQL. Chạy riêng: `node --test tests/bao-mat-injection.test.js`.

| Mã | Điểm vào | Kỳ vọng |
|---|---|---|
| SEC-01 | `customer_phone` khi POST /api/tickets | 400, field `customer_phone` |
| SEC-02 | `center_id` ở GET /api/technicians | 400, field `center_id` |
| SEC-03 | `center_id` ở GET /api/tickets/unassigned | 400, field `center_id` |
| SEC-04 | mã `id` trong đường dẫn phiếu và kỹ thuật viên | 400, field `id` |
| SEC-05 | `technician_id` khi phân công | 400, field `technician_id` |
| SEC-06 | `limit`, `page`, `offset` | 400, đúng field |

Kiểm thử trên hệ thống chạy thật (4 yêu cầu chèn mã, cùng trả 400): `docs/api-vi-du-chay-that.md`, mục 24–27. Tổng số test của dự án sau khi thêm: 133.

## Kiểm tra test có khả năng thất bại

Tiêu chí 5 của Test Plan: cố tình sửa mã thì ít nhất một test phải chuyển sang FAIL. Lệnh `npm run kiem-test` (`scripts/kiem-test-that-bai.js`) sửa mã ba lần, chạy cả bộ test, rồi khôi phục tệp nguyên vẹn. Chạy ngày 06/11/2026 trên PostgreSQL thật, ảnh `docs/screenshots/kiem-test-that-bai.png`:

| Lần sửa cố ý | Quy tắc | Kết quả (bản gốc 127 PASS) | Test phát hiện |
|---|---|---|---|
| M1: đổi `thành thạo < 3` thành `<= 3` | QT-08 | 126 PASS, 1 FAIL | test biên "thành thạo đúng 3 được, đúng 2 bị từ chối" |
| M2: bỏ việc lùi khi hạn rơi vào Chủ nhật | QT-04 | 123 PASS, 4 FAIL | TC-02 và 3 test biên/thời gian khác |
| M3: che số điện thoại sai (lộ 4 số cuối) | QT-15 | 125 PASS, 2 FAIL | TC-06 và test che số điện thoại |

Sau khi khôi phục: 127 PASS, 0 FAIL; phát hiện 3/3 lần sửa. Lưu ý trung thực: M1 không bị TC-04 phát hiện (TC-04 dùng mức thành thạo 4, xa ranh giới); biên QT-08 được giữ bởi test riêng trong bộ `npm test`, không nằm trong 12 test case của báo cáo.

## Kiểm thử tự động (CI)

Mỗi lần đẩy mã lên `main`, GitHub Actions (`.github/workflows/ci.yml`) dựng PostgreSQL 16 và chạy `npm ci`, `npm test`. Lần chạy đầu tiên (ci #1, commit `cca2f9f`) báo xanh sau 32 giây: ảnh `docs/anh/ci-xanh.png`.
