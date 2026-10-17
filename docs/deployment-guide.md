# Hướng dẫn dựng và kiểm tra môi trường – L4

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Track SE · Phiên bản BT1

Tài liệu này dùng để dựng cơ sở dữ liệu của gói thiết kế BT1 và kiểm tra các ràng buộc quan trọng. Chưa có mã backend/frontend, nên phạm vi chỉ gồm PostgreSQL và các sơ đồ.

## 1. Yêu cầu

| Thành phần | Yêu cầu | Kiểm tra |
|---|---|---|
| PostgreSQL | 13 trở lên (đã thử trên 16) | `psql --version` |
| Công cụ `psql` | Có trong PATH | `psql --version` |
| diagrams.net | Mở tệp `.drawio` (web hoặc ứng dụng) | – |
| Shell | bash (Linux, macOS, Git Bash, WSL) | – |

## 2. Dựng cơ sở dữ liệu

Thực hiện đúng các bước 1–6 ở Mục 3 của `README.md` (tạo người dùng và CSDL, sao chép `.env`, `npm install`, `npm run migrate`, `npm run seed`). Sau đó kiểm tra:

```
psql "$DATABASE_URL" -c '\dt'
```

Đạt khi migration không báo lỗi và `\dt` liệt kê 6 bảng của L4 (`appointment`, `customer`, `technician`, `technician_skill`, `ticket`, `ticket_status_log`) cùng bảng `schema_migrations`. `docs/schema.sql` vẫn là bản DDL BT1 để đọc; `migrations/001_init.sql` chỉ khác ở chỗ thêm `IF NOT EXISTS`.

Các lệnh `psql "$DATABASE_URL"` trong tài liệu này viết cho bash. Trên PowerShell, đặt trước `$env:DATABASE_URL = 'postgres://l4_user:change_me@localhost:5432/l4_dev'` và thay `"$DATABASE_URL"` bằng `$env:DATABASE_URL`. Bộ smoke test ở Mục 4 dùng heredoc nên chạy trong Git Bash hoặc WSL.

## 3. Checklist kiểm tra

| # | Việc cần kiểm tra | Cách kiểm tra | Đạt khi |
|---|---|---|---|
| 1 | Có 6 bảng | `psql "$DATABASE_URL" -c '\dt'` | Liệt kê 6 bảng của L4 (và `schema_migrations`) |
| 2 | Extension `btree_gist` đã bật | `psql "$DATABASE_URL" -c '\dx'` | Có dòng `btree_gist` |
| 3 | Ràng buộc chống trùng lịch tồn tại | `psql "$DATABASE_URL" -c '\d appointment'` | Có `ex_appointment_no_overlap` |
| 4 | Chỉ mục cho FR1, FR2/FR6, FR8 | `psql "$DATABASE_URL" -c '\di'` | Có `ix_ticket_unassigned`, `ix_ticket_technician`, `ix_appointment_technician_start` |
| 5 | Các ràng buộc hoạt động | Chạy bộ kiểm tra nhanh ở Mục 4 | Mỗi ca cho đúng kết quả mong đợi |
| 6 | Sơ đồ mở được | Mở `docs/usecase.drawio`, `architecture.drawio`, `erd.drawio`, `wireframe.drawio` bằng diagrams.net | Không lỗi, bố cục không vỡ |
| 7 | Không có bí mật trong repo | `git ls-files .env` | Không in ra gì (chỉ có `.env.example`) |

## 4. Bộ kiểm tra nhanh ràng buộc (smoke test)

Chạy trên CSDL vừa dựng, rồi dọn dữ liệu thử. Tiền tố `[n]` là mã ca; dòng `ERROR` xuất hiện ở các ca 2, 3, 5–10 là **kết quả mong đợi**.

```
psql "$DATABASE_URL" -X <<'SQL'
INSERT INTO customer(full_name,phone) VALUES ('Nguyen Van An','0901234567');
INSERT INTO technician(full_name,center_id,level) VALUES ('Tran Minh Khoa',1,'CAO_CAP');
INSERT INTO technician_skill VALUES (1,'MAN_HINH',4);
INSERT INTO ticket(ticket_code,customer_id,center_id,device_name,issue_category,priority,received_at,due_date)
 VALUES ('BH-001287/2026',1,1,'iPhone 14','MAN_HINH','CAO','2026-10-05 10:30+07','2026-10-06 10:30+07');

\echo '[1] Đặt lịch hợp lệ 09:00-09:30: thành công'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000001/2026',1,1,'GIAO_MAY','2026-10-12 09:00+07','2026-10-12 09:30+07');
\echo '[2] Trùng đúng khung giờ: lỗi 23P01'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000002/2026',1,1,'GIAO_MAY','2026-10-12 09:00+07','2026-10-12 09:30+07');
\echo '[3] Chồng lấn một phần 09:15-09:45: lỗi 23P01'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000003/2026',1,1,'GIAO_MAY','2026-10-12 09:15+07','2026-10-12 09:45+07');
\echo '[4] Liền kề 09:30-10:00: thành công (khoảng nửa mở)'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000004/2026',1,1,'GIAO_MAY','2026-10-12 09:30+07','2026-10-12 10:00+07');
\echo '[5] Lịch dài 45 phút: lỗi 23514 ck_appointment_length'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000005/2026',1,1,'GIAO_MAY','2026-10-12 11:00+07','2026-10-12 11:45+07');
\echo '[6] Mức thành thạo = 6: lỗi 23514'
INSERT INTO technician_skill VALUES (1,'PIN',6);
\echo '[7] Hạn cam kết không sau thời điểm nhận: lỗi 23514 ck_ticket_due'
INSERT INTO ticket(ticket_code,customer_id,center_id,device_name,issue_category,priority,received_at,due_date)
 VALUES ('BH-000002/2026',1,1,'X','PIN','THAP','2026-10-05 10:30+07','2026-10-05 10:30+07');
\echo '[8] Số điện thoại sai định dạng: lỗi 23514'
INSERT INTO customer(full_name,phone) VALUES ('B','12345');
\echo '[9] Kỹ thuật viên không tồn tại: lỗi 23503 (khóa ngoại)'
INSERT INTO appointment(appointment_code,ticket_id,technician_id,type,start_at,end_at)
 VALUES ('LH000009/2026',1,999,'GIAO_MAY','2026-10-13 09:00+07','2026-10-13 09:30+07');
\echo '[10] Trạng thái phiếu không hợp lệ: lỗi 23514'
UPDATE ticket SET status='LUNG_TUNG' WHERE ticket_id=1;

\echo 'Dọn dữ liệu thử'
TRUNCATE ticket_status_log, appointment, ticket, technician_skill, technician, customer RESTART IDENTITY;
SQL
```

Kết quả đúng: ca 1 và 4 báo `INSERT 0 1`; các ca còn lại báo `ERROR` với mã nêu trong dòng `\echo` tương ứng. Ca 2–3 chứng minh yêu cầu NFR3/BR-L4-02 ở mức CSDL; kiểm thử đồng thời 100 lần (TC-11) sẽ thực hiện khi có backend.

## 5. Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `permission denied to create extension "btree_gist"` | PostgreSQL dưới 13, hoặc người dùng không sở hữu CSDL | Dùng PostgreSQL 13+ và tạo CSDL với `OWNER l4_user`; hoặc chạy `CREATE EXTENSION btree_gist;` bằng tài khoản `postgres` rồi nạp lại |
| `relation "customer" already exists` | Nạp `schema.sql` lên CSDL đã có bảng | `DROP DATABASE l4_dev;` rồi tạo lại CSDL trống (bước 2 của README) |
| `connection refused` | PostgreSQL chưa chạy hoặc `DATABASE_URL` sai cổng | Kiểm tra dịch vụ PostgreSQL và giá trị trong `.env` |
| `password authentication failed` | Mật khẩu trong `.env` khác mật khẩu đã tạo ở bước 1 | Sửa `.env` hoặc đặt lại mật khẩu cho `l4_user` |
| `$DATABASE_URL` rỗng | Chưa nạp `.env` vào shell | `set -a; . ./.env; set +a` |
