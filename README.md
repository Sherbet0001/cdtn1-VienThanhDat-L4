# L4 - Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE  
**Case study:** Smart CRM – Mekong Mobile  
**Repository:** <https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4>

## 1. Mục tiêu và phạm vi

MVP mô tả và thiết kế luồng L4: quản lý trung tâm xem phiếu chưa phân công, lọc kỹ thuật viên đúng tay nghề/cùng trung tâm/đang hoạt động, gán hoặc đổi KTV có ghi lịch sử; KTV xem việc được giao; khách đặt lịch giao/nhận máy qua xác thực mã phiếu và điện thoại. Hệ thống phải chặn các lịch hẹn chồng lấn.

Không thuộc MVP: tiếp nhận phiếu (L2), tự động phân công tối ưu, gửi SMS/Zalo, kho linh kiện, báo cáo tổng hợp, quản lý tài khoản đầy đủ, đổi/hủy lịch đã xác nhận, xem lịch tuần của KTV.

## 2. Công nghệ và thiết kế

- Frontend dự kiến: ReactJS. Backend dự kiến: Node.js + Express, REST/JSON API. Cơ sở dữ liệu: PostgreSQL.
- Kiến trúc: modular monolith, tách lớp routes/controllers, services, repositories, database.
- Tài liệu trong `docs/`:

| Tệp | Nội dung |
|---|---|
| `docs/srs.md` | SRS rút gọn (7 User Story, 9 FR, 5 NFR, bảng truy vết đầy đủ) |
| `docs/usecase.drawio` | Use case diagram (7 use case, 3 actor) |
| `docs/architecture.drawio` | Kiến trúc phân lớp |
| `docs/erd.drawio` | ERD 6 bảng (3NF) |
| `docs/schema.sql` | SQL DDL skeleton cho PostgreSQL |
| `docs/wireframe.png` | Wireframe 3 màn hình (nguồn: `docs/wireframe.drawio`) |
| `docs/api-contract.md` | Hợp đồng API (7 endpoint) |
| `docs/ai-disclosure.md` | Bảng khai báo sử dụng AI |

## 6. Cấu hình và kiểm chứng

Từ thư mục gốc repository:

1. Cài Node.js LTS và PostgreSQL; tạo database thử nghiệm trống.
2. Sao chép `.env.example` thành `.env`, điền thông tin cục bộ; không commit `.env`.
3. Chạy DDL: `psql "$DATABASE_URL" -f docs/schema.sql` (cần quyền tạo extension `btree_gist`).
4. Mở các tệp `.drawio` bằng diagrams.net để xem và chỉnh sửa.

**Trạng thái:** đây là gói thiết kế BT1; chưa có mã backend/frontend. DDL và API cần được kiểm chứng ở giai đoạn triển khai.
