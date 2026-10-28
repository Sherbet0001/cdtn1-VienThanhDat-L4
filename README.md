# L4 - Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE
**Case study:** Smart CRM – Mekong Mobile
**Repository:** <https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4>

## 1. Mô tả hệ thống

Hệ thống hỗ trợ trung tâm bảo hành Mekong Mobile phân công kỹ thuật viên (KTV) cho phiếu bảo hành và đặt lịch giao/nhận máy với khách. Quản lý trung tâm xem phiếu chưa phân công, lọc KTV đúng tay nghề, cùng trung tâm và đang hoạt động, rồi gán KTV có ghi lịch sử (đổi KTV và đặt lịch hẹn là phần thiết kế của BT1, chưa hiện thực). Kiến trúc là modular monolith nhiều lớp: routes → services → repositories → PostgreSQL; giao diện web tĩnh gọi API qua một lớp client. Thiết kế đầy đủ nằm trong `docs/` (SRS, ERD, hợp đồng API, nhật ký thay đổi).

**Luồng chính chạy được từ đầu đến cuối (UC3):** tiếp nhận phiếu mới (hoặc chọn một trong 12 phiếu `MOI` đã seed) → xem danh sách phiếu chưa phân công → mở chi tiết, xem KTV đủ điều kiện kèm số phiếu đang giữ → chọn KTV, xác nhận → phiếu sang `DA_PHAN_CONG` và ghi `ticket_status_log` trong một giao dịch.

## 2. Yêu cầu môi trường

- **Node.js 20 LTS (tối thiểu 20.6)** và npm (đã thử với Node 22 và Node 26); tệp `.nvmrc` ghi bản 20 (`nvm use`). Cần từ 20.6 vì lệnh khởi động dùng `node --env-file`.
- **PostgreSQL 13 trở lên** (đã thử với PostgreSQL 16). Từ bản 13, extension `btree_gist` là "trusted" nên chủ sở hữu CSDL tạo được mà không cần quyền siêu người dùng.
- Công cụ dòng lệnh `psql` (đi kèm PostgreSQL) để tạo người dùng và CSDL lần đầu.
- `curl.exe` để gọi thử API (có sẵn trên Windows 10 trở lên). Trên Windows hãy gõ `curl.exe`, không gõ `curl`, vì `curl` trong PowerShell là lệnh khác.
- Biến môi trường: xem `.env.example` (`DATABASE_URL`, `PORT`, `JWT_SECRET`, ...). Tệp `.env` thật nằm trong `.gitignore`, không commit.

## 3. Cài đặt và chạy

Chạy từ thư mục gốc repository trong PowerShell. Mỗi bước là một lệnh.

1. Tạo người dùng CSDL (khớp `DATABASE_URL` mẫu): `psql -U postgres -c "CREATE USER l4_user WITH PASSWORD 'change_me';"`
2. Tạo CSDL trống: `psql -U postgres -c "CREATE DATABASE l4_dev OWNER l4_user;"`
3. Sao chép cấu hình mẫu: `Copy-Item .env.example .env`
4. Cài đúng phiên bản đã khoá trong `package-lock.json`: `npm ci`
5. Dựng bảng (migration): `npm run migrate`
6. Nạp dữ liệu mẫu: `npm run seed`
7. Khởi động máy chủ (giữ cửa sổ này mở): `npm start`
8. Mở giao diện trong cửa sổ PowerShell thứ hai: `Start-Process http://localhost:3000/`

Trên Linux hoặc macOS thay lệnh ở bước 1–2 bằng `sudo -u postgres psql -c "..."`, bước 3 bằng `cp .env.example .env` và bước 8 bằng `xdg-open http://localhost:3000/` (macOS: `open`). Nếu bạn đặt mật khẩu `l4_user` khác `change_me`, sửa cùng mật khẩu đó trong dòng `DATABASE_URL` của `.env` trước bước 5.

Chạy lại được: `npm run migrate` và `npm run seed` chạy lần hai không lỗi và không nhân đôi dữ liệu. Migration ghi các tệp đã chạy vào bảng `schema_migrations` và bỏ qua chúng; seed dùng `ON CONFLICT DO NOTHING`.

## 4. Kiểm tra hệ thống đã chạy đúng và chạy kiểm thử

Chạy kiểm thử (không cần CSDL, không cần máy chủ):

```
npm test
```

Kết quả đúng: dòng cuối in `# tests 83`, `# pass 83`, `# fail 0` (số test có thể tăng khi bổ sung). Bộ kiểm thử gồm ba loại: luồng đúng, giá trị biên (thành thạo đúng 3 và 2, thứ Bảy cộng 24 giờ, số điện thoại 9 và 10 số, `limit` 100 và 101) và dữ liệu sai (trường thiếu, mã lạ, số điện thoại rác), cùng test hợp đồng và test tích hợp routes → service → repository.

Kiểm tra máy chủ khi `npm start` đang chạy (mở cửa sổ PowerShell thứ hai):

```
curl.exe -s http://localhost:3000/health
curl.exe -s "http://localhost:3000/api/technicians?center_id=1&limit=3"
curl.exe -s http://localhost:3000/api/technicians/7
curl.exe -i -s -X POST http://localhost:3000/api/technicians -H "Content-Type: application/json" --data-binary "@data/mau/ktv-hop-le.json"
curl.exe -i -s -X POST http://localhost:3000/api/technicians -H "Content-Type: application/json" --data-binary "@data/mau/ktv-thieu-truong.json"
curl.exe -s -X DELETE http://localhost:3000/api/technicians/39
```

Luồng chính qua API (trên CSDL vừa seed; phiếu 113 là phiếu `MOI` của trung tâm 4, nhóm sự cố `MAN_HINH`):

```
curl.exe -s "http://localhost:3000/api/tickets/unassigned?limit=3"
curl.exe -s http://localhost:3000/api/tickets/113/eligible-technicians
curl.exe -i -s -X POST http://localhost:3000/api/tickets/113/assignment -H "Content-Type: application/json" --data-binary "@data/mau/phan-cong-ktv-7.json"
curl.exe -i -s -X POST http://localhost:3000/api/tickets/113/assignment -H "Content-Type: application/json" --data-binary "@data/mau/phan-cong-ktv-2.json"
curl.exe -i -s -X POST http://localhost:3000/api/tickets/113/assignment -H "Content-Type: application/json" --data-binary "@data/mau/phan-cong-ktv-2.json"
curl.exe -i -s -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" --data-binary "@data/mau/tiep-nhan-hop-le.json"
curl.exe -i -s -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" --data-binary "@data/mau/tiep-nhan-thieu-truong.json"
```

Kết quả đúng, theo thứ tự: danh sách có `total: 12` và 3 phiếu; danh sách KTV đủ điều kiện của phiếu 113, KTV mã 2 có `proficiency: 3` (đúng mức biên); gán KTV 7 (trung tâm 5) bị `400 TECH_NOT_ELIGIBLE` vì khác trung tâm; gán KTV 2 trả `201` với `status: DA_PHAN_CONG`; gán lần hai trả `409 TICKET_ALREADY_ASSIGNED` (không ghi đè); tiếp nhận hợp lệ trả `201` kèm `ticket_code` dạng `BH-00xxxx/2026`; tiếp nhận sai trả `400` với `error.fields` liệt kê từng trường. Sau lệnh gán thành công, `total` của danh sách phiếu chưa phân công giảm còn 11.

Kết quả đúng của nhóm lệnh kỹ thuật viên: `/health` trả `{"status":"ok","db":"ok"}`; lệnh POST đầu trả `201 Created` kèm kỹ thuật viên mới; lệnh POST thứ hai trả `400 Bad Request` kèm tên các trường sai (`full_name`, `center_id`, `level`); lệnh DELETE (mã 39 là KTV vừa tạo ở lệnh POST đầu trên CSDL mới seed; dùng mã trong phản hồi của bạn nếu khác) chuyển KTV sang `is_active = false` (xóa mềm, dòng dữ liệu vẫn còn). Nếu chữ tiếng Việt hiện lỗi font trong PowerShell, chạy `chcp 65001` trước.

## 5. Cấu trúc thư mục và tài liệu

```
src/routes/          chuyển đổi HTTP <-> nghiệp vụ (chỉ nơi này biết mã HTTP)
src/services/        quy tắc nghiệp vụ, không phụ thuộc giao thức web
src/repositories/    đọc/ghi PostgreSQL, không chứa quy tắc nghiệp vụ
src/contracts/       hợp đồng dữ liệu ở ranh giới (hình dạng JSON trả ra)
src/validators/      kiểm tra định dạng dữ liệu vào (kể cả chuẩn hóa số điện thoại, QT-02)
src/errors/          lỗi nghiệp vụ có mã
src/db/runner.js     bộ chạy migration và seed
migrations/          001_init.sql: dựng 6 bảng theo DDL BT1
seeds/               dữ liệu mẫu Mekong Mobile: 38 KTV, 159 kỹ năng, 1.063 khách, 1.098 phiếu đang mở (12 phiếu MOI)
web/src/api/         lớp client API (chỗ duy nhất được gọi fetch) và các tệp *.api.js
web/src/components/  DataState (đang tải / rỗng / lỗi) và hàm dựng DOM an toàn
web/src/pages/       bốn màn hình: danh sách phiếu, chi tiết và phân công, tiếp nhận, kỹ thuật viên
web/src/lib/         logic thuần (ba trạng thái, định dạng) để kiểm thử bằng node --test
scripts/             tao-seed-phieu.py: sinh seeds/003 và 004 từ bộ dữ liệu mẫu (không cần chạy lại)
tests/               kiểm thử (node --test)
data/mau/            tệp JSON mẫu để gọi thử API
docs/                tài liệu thiết kế
```

| Tệp trong `docs/` | Nội dung |
|---|---|
| `BT1_2374802010107_VienThanhDat.pdf` | Báo cáo Bài tập 1 (bản nộp) |
| `srs.md` | SRS rút gọn (7 User Story, 9 FR, 5 NFR, bảng truy vết) |
| `usecase.*`, `architecture.*`, `erd.*`, `wireframe.*` | Sơ đồ (`.drawio` mở bằng [diagrams.net](https://app.diagrams.net), kèm ảnh `.png`) |
| `schema.sql` | DDL PostgreSQL của BT1 (bản đọc; bản chạy là `migrations/001_init.sql`) |
| `api-contract.md` | Hợp đồng API |
| `thay-doi-thiet-ke.md` | Nhật ký thay đổi thiết kế (TD-01 trở đi) |
| `bang-chung-chay-thuc-te.md` | Kết quả chạy thật: migrate, seed, curl, giao diện |
| `bang-chung-luong-chinh.md`, `anh/` | Ảnh chụp luồng chính chạy trên dữ liệu thật |
| `deployment-guide.md` | Hướng dẫn dựng CSDL và bộ kiểm tra nhanh các ràng buộc |
| `ai-disclosure-Tuan1..3.md`, `ai-disclosure-BT1-SauKhiSuaLoi.md` | Khai báo sử dụng AI |

## 6. Trạng thái hiện tại (buổi 10)

- [x] Khung `src/` tách ba lớp routes / services / repositories (và validators, errors, contracts)
- [x] Migration `001_init.sql` dựng 6 bảng theo DDL BT1; seed 38 KTV, 159 kỹ năng, 1.063 khách, 1.098 phiếu; chạy lại không nhân đôi (`docs/bang-chung-chay-thuc-te.md`)
- [x] Thực thể 1, Technician: CRUD qua ba lớp (xóa mềm), quy tắc "KTV đang giữ phiếu thì không được ngừng hoạt động"
- [x] Thực thể 2, Ticket: danh sách chưa phân công (FR1), chi tiết, tiếp nhận; quy tắc QT-02 (số điện thoại), QT-04 (hạn cam kết, không tính Chủ nhật)
- [x] Quy tắc phân công (UC3): KTV đủ điều kiện (QT-08), gán trong một giao dịch có khóa dòng, ghi `ticket_status_log` (QT-06, QT-07)
- [x] Giao diện 4 màn hình gọi API thật qua lớp client, đủ ba trạng thái đang tải / rỗng / lỗi có nút Thử lại; hợp đồng dữ liệu ở `src/contracts/` và khung lỗi thống nhất có `error.fields` (TD-19)
- [x] 83 kiểm thử PASS bằng `npm test` (luồng đúng, giá trị biên, dữ liệu sai, hợp đồng, tích hợp; không cần CSDL)
- [x] Ảnh chụp danh sách phiếu, chi tiết phiếu kèm kỹ thuật viên đủ điều kiện, màn tiếp nhận và danh sách kỹ thuật viên trong `docs/anh/`, mô tả ở `docs/bang-chung-luong-chinh.md`
- [ ] Ảnh giao diện thông báo phân công thành công (chưa chụp)
- [ ] Đổi KTV (FR5), đặt lịch hẹn và gợi ý khung giờ (UC6, UC7), `EXCLUDE` chống trùng lịch: chờ hướng dẫn các buổi sau
- [ ] Đăng nhập JWT và phân quyền theo trung tâm (TD-18); test đồng thời TC-11 (TD-08)
- Ghi chú: phân công hiện ghi `assigned_by = 0` vì chưa có đăng nhập (TD-23); danh sách phiếu lọc trung tâm bằng tham số `center_id` thay cho trung tâm trong token (TD-22).
