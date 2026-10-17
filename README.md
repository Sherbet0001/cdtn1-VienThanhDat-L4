# L4 - Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE
**Case study:** Smart CRM – Mekong Mobile
**Repository:** <https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4>

## 1. Mô tả hệ thống

Hệ thống hỗ trợ trung tâm bảo hành Mekong Mobile phân công kỹ thuật viên (KTV) cho phiếu bảo hành và đặt lịch giao/nhận máy với khách. Quản lý trung tâm xem phiếu chưa phân công, lọc KTV đúng tay nghề, cùng trung tâm và đang hoạt động, rồi gán hoặc đổi KTV có ghi lịch sử. Khách đặt lịch bằng mã phiếu và số điện thoại; hệ thống chặn lịch hẹn chồng lấn bằng ràng buộc `EXCLUDE USING gist` của PostgreSQL. Kiến trúc là modular monolith nhiều lớp: routes → services → repositories → PostgreSQL. Thiết kế đầy đủ nằm trong `docs/` (SRS, ERD, hợp đồng API, nhật ký thay đổi).

## 2. Yêu cầu môi trường

- **Node.js 20.6 trở lên** và npm (đã thử với Node 22 và Node 26). Cần từ 20.6 vì lệnh khởi động dùng `node --env-file`.
- **PostgreSQL 13 trở lên** (đã thử với PostgreSQL 16). Từ bản 13, extension `btree_gist` là "trusted" nên chủ sở hữu CSDL tạo được mà không cần quyền siêu người dùng.
- Công cụ dòng lệnh `psql` (đi kèm PostgreSQL) để tạo người dùng và CSDL lần đầu.
- `curl.exe` để gọi thử API (có sẵn trên Windows 10 trở lên). Trên Windows hãy gõ `curl.exe`, không gõ `curl`, vì `curl` trong PowerShell là lệnh khác.
- Biến môi trường: xem `.env.example` (`DATABASE_URL`, `PORT`, `JWT_SECRET`, ...). Tệp `.env` thật nằm trong `.gitignore`, không commit.

## 3. Cài đặt và chạy

Chạy từ thư mục gốc repository trong PowerShell. Mỗi bước là một lệnh.

1. Tạo người dùng CSDL (khớp `DATABASE_URL` mẫu): `psql -U postgres -c "CREATE USER l4_user WITH PASSWORD 'change_me';"`
2. Tạo CSDL trống: `psql -U postgres -c "CREATE DATABASE l4_dev OWNER l4_user;"`
3. Sao chép cấu hình mẫu: `Copy-Item .env.example .env`
4. Cài thư viện: `npm install`
5. Dựng bảng (migration): `npm run migrate`
6. Nạp dữ liệu mẫu: `npm run seed`
7. Khởi động máy chủ: `npm start`

Trên Linux hoặc macOS thay lệnh ở bước 1–2 bằng `sudo -u postgres psql -c "..."` và bước 3 bằng `cp .env.example .env`.

Chạy lại được: `npm run migrate` và `npm run seed` chạy lần hai không lỗi và không nhân đôi dữ liệu. Migration ghi các tệp đã chạy vào bảng `schema_migrations` và bỏ qua chúng; seed dùng `ON CONFLICT DO NOTHING`.

## 4. Kiểm tra hệ thống đã chạy đúng và chạy kiểm thử

Chạy kiểm thử (không cần CSDL, không cần máy chủ):

```
npm test
```

Kiểm tra máy chủ khi `npm start` đang chạy (mở cửa sổ PowerShell thứ hai):

```
curl.exe -s http://localhost:3000/health
curl.exe -s "http://localhost:3000/api/technicians?center_id=1&limit=3"
curl.exe -s http://localhost:3000/api/technicians/7
curl.exe -i -s -X POST http://localhost:3000/api/technicians -H "Content-Type: application/json" --data-binary "@data/mau/ktv-hop-le.json"
curl.exe -i -s -X POST http://localhost:3000/api/technicians -H "Content-Type: application/json" --data-binary "@data/mau/ktv-thieu-truong.json"
curl.exe -s -X DELETE http://localhost:3000/api/technicians/39
```

Kết quả đúng: `/health` trả `{"status":"ok","db":"ok"}`; lệnh POST đầu trả `201 Created` kèm kỹ thuật viên mới; lệnh POST thứ hai trả `400 Bad Request` kèm tên các trường sai (`full_name`, `center_id`, `level`); lệnh DELETE (mã 39 là KTV vừa tạo ở lệnh POST đầu trên CSDL mới seed; dùng mã trong phản hồi của bạn nếu khác) chuyển KTV sang `is_active = false` (xóa mềm, dòng dữ liệu vẫn còn). Nếu chữ tiếng Việt hiện lỗi font trong PowerShell, chạy `chcp 65001` trước.

## 5. Cấu trúc thư mục và tài liệu

```
src/routes/          chuyển đổi HTTP <-> nghiệp vụ (chỉ nơi này biết mã HTTP)
src/services/        quy tắc nghiệp vụ, không phụ thuộc giao thức web
src/repositories/    đọc/ghi PostgreSQL, không chứa quy tắc nghiệp vụ
src/validators/      kiểm tra định dạng dữ liệu vào
src/errors/          lỗi nghiệp vụ có mã
src/db/runner.js     bộ chạy migration và seed
migrations/          001_init.sql: dựng 6 bảng theo DDL BT1
seeds/               dữ liệu mẫu lấy từ bộ dữ liệu Mekong Mobile
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
| `deployment-guide.md` | Hướng dẫn dựng CSDL và bộ kiểm tra nhanh các ràng buộc |
| `ai-disclosure-Tuan1..3.md`, `ai-disclosure-BT1-SauKhiSuaLoi.md` | Khai báo sử dụng AI |

## 6. Trạng thái hiện tại (buổi 8)

- [x] Khung `src/` tách ba lớp routes / services / repositories (và validators, errors)
- [x] Migration `001_init.sql` dựng 6 bảng theo DDL BT1; chạy lại không lỗi
- [x] Seed 38 kỹ thuật viên và 159 dòng tay nghề từ bộ dữ liệu mẫu; chạy lại không nhân đôi
- [x] CRUD thực thể Technician qua ba lớp (xóa mềm) kèm quy tắc "KTV đang giữ phiếu thì không được ngừng hoạt động"
- [x] 25 kiểm thử đơn vị PASS bằng `npm test` (không cần CSDL)
- [ ] Gọi thử API bằng curl trên máy sinh viên và lưu ảnh kết quả vào `docs/`
- [ ] Thực thể thứ hai (Ticket), quy tắc phân công và đặt lịch: chờ các buổi sau
- [ ] Giao diện, xác thực JWT: chưa làm
- Ghi chú: các lệnh `npm run migrate`, `npm run seed` và `npm start` mới được kiểm chứng ở mức SQL và mức nghiệp vụ; chạy đầy đủ trên máy sinh viên chưa thực hiện.
