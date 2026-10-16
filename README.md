# L4 - Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE  
**Case study:** Smart CRM – Mekong Mobile  
**Repository:** <https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4>

## 1. Mục tiêu và phạm vi

MVP mô tả và thiết kế luồng L4: quản lý trung tâm xem phiếu chưa phân công, lọc kỹ thuật viên đúng tay nghề/cùng trung tâm/đang hoạt động, gán hoặc đổi KTV có ghi lịch sử; KTV xem việc được giao; khách đặt lịch giao/nhận máy qua xác thực mã phiếu và điện thoại. Hệ thống phải chặn các lịch hẹn chồng lấn.

Không thuộc MVP: tiếp nhận phiếu (L2), tự động phân công tối ưu, gửi SMS/Zalo, kho linh kiện, báo cáo tổng hợp, quản lý tài khoản đầy đủ, đổi/hủy lịch đã xác nhận, xem lịch tuần của KTV.

## 2. Công nghệ và kiến trúc

- Frontend dự kiến: ReactJS. Backend dự kiến: Node.js + Express, REST/JSON API. Cơ sở dữ liệu: PostgreSQL.
- Kiến trúc: modular monolith bốn lớp (giao diện – API – nghiệp vụ – truy cập dữ liệu); mã nguồn sẽ tách routes/controllers, services, repositories, database.
- Chống trùng lịch hẹn bằng ràng buộc `EXCLUDE USING gist` trong PostgreSQL (cần extension `btree_gist`); lỗi 23P01 được ánh xạ sang HTTP 409 `SLOT_CONFLICT`.

## 3. Tài liệu trong `docs/`

| Tệp | Nội dung |
|---|---|
| `docs/BT1_2374802010107_VienThanhDat.pdf` | Báo cáo Bài tập 1 (bản nộp) |
| `docs/srs.md` | SRS rút gọn (7 User Story, 9 FR, 5 NFR, bảng truy vết đầy đủ) |
| `docs/usecase.drawio` · `docs/usecase.png` | Use case diagram (7 use case, 3 actor) |
| `docs/architecture.drawio` · `docs/architecture.png` | Kiến trúc phân lớp |
| `docs/erd.drawio` · `docs/erd.png` | ERD 6 bảng (3NF) |
| `docs/schema.sql` | SQL DDL cho PostgreSQL (6 bảng, ràng buộc CHECK, EXCLUDE chống trùng lịch) |
| `docs/wireframe.drawio` · `docs/wireframe.png` | Wireframe 3 màn hình |
| `docs/api-contract.md` | Hợp đồng API (7 endpoint) |
| `docs/deployment-guide.md` | Hướng dẫn dựng và kiểm tra môi trường |
| `docs/ai-disclosure.md` | Bảng khai báo sử dụng công cụ AI (tổng hợp) |
| `docs/ai-disclosure-Tuan1.md` … `Tuan3.md` | Ba bản khai báo AI đã nộp theo từng tuần (hồ sơ gốc) |

Các tệp `.drawio` mở bằng [diagrams.net](https://app.diagrams.net) để xem và chỉnh sửa.

## 4. Yêu cầu môi trường

- PostgreSQL 13 trở lên (đã kiểm thử DDL trên PostgreSQL 16). Từ bản 13, `btree_gist` là extension "trusted" nên chủ sở hữu CSDL tạo được mà không cần quyền siêu người dùng.
- Công cụ dòng lệnh `psql`.
- Node.js LTS: chưa cần ở giai đoạn thiết kế (BT1); sẽ dùng khi hiện thực backend.

## 5. Cài đặt và kiểm tra thiết kế

Chạy từ thư mục gốc repository (shell kiểu bash). Mỗi bước là một lệnh.

1. Tạo người dùng CSDL (khớp `DATABASE_URL` mẫu trong `.env.example`):
   `sudo -u postgres psql -c "CREATE USER l4_user WITH PASSWORD 'change_me';"`
2. Tạo CSDL trống:
   `sudo -u postgres psql -c "CREATE DATABASE l4_dev OWNER l4_user;"`
3. Sao chép cấu hình mẫu: `cp .env.example .env`, rồi sửa giá trị cục bộ nếu cần. Không commit `.env` (đã nằm trong `.gitignore`).
4. Nạp biến môi trường vào shell: `set -a; . ./.env; set +a`
5. Chạy DDL: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/schema.sql`
6. Kiểm tra: `psql "$DATABASE_URL" -c '\dt'`

**Kết quả đúng:** bước 5 không báo lỗi; bước 6 liệt kê 6 bảng `appointment`, `customer`, `technician`, `technician_skill`, `ticket`, `ticket_status_log`. Chạy lại bước 5 trên CSDL đã có bảng sẽ báo `relation ... already exists`; muốn chạy lại, tạo lại CSDL trống (`DROP DATABASE l4_dev;` rồi làm lại bước 2).

## 6. Trạng thái hiện tại

Đây là gói thiết kế BT1 (SRS, use case, kiến trúc, ERD, wireframe, hợp đồng API, DDL, khai báo AI).

- [x] DDL đã được nạp thử trên PostgreSQL 16 và kiểm tra các ràng buộc: CHECK, khóa ngoại, chặn lịch trùng và chồng lấn.
- [ ] Chưa có mã backend/frontend; API chưa được hiện thực và chưa được kiểm chứng.
- [x] `docs/deployment-guide.md`: hướng dẫn dựng CSDL, checklist kiểm tra và bộ kiểm tra nhanh các ràng buộc.
