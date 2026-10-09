# L4 - Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE  
**Case study:** Smart CRM - Mekong Mobile  
**Repository:** https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4

## 1. Mục tiêu và phạm vi

MVP mô tả và thiết kế luồng L4: quản lý trung tâm xem phiếu chưa phân công, lọc kỹ thuật viên đúng tay nghề/cùng trung tâm/đang hoạt động, gán hoặc đổi KTV có ghi lịch sử; KTV xem việc được giao; khách đặt lịch giao/nhận máy qua xác thực mã phiếu và điện thoại. Hệ thống phải chặn các lịch hẹn chồng lấn.

Không thuộc MVP: tiếp nhận phiếu (L2), tự động phân công tối ưu, gửi SMS/Zalo, kho linh kiện, báo cáo tổng hợp, quản lý tài khoản đầy đủ và đổi/hủy lịch đã xác nhận.

## 2. Công nghệ và thiết kế

- Frontend dự kiến: ReactJS.
- Backend dự kiến: Node.js + Express, REST/JSON API.
- Cơ sở dữ liệu: PostgreSQL.
- Kiến trúc: modular monolith, tách lớp routes/controllers, services, repositories, database.
- Các sơ đồ XML chỉnh sửa được: `docs/usecase.drawio`, `docs/architecture.drawio`, `docs/erd.drawio`, `docs/wireframe.drawio`.
- Hợp đồng API dự kiến: `docs/api-contract.md`; SQL DDL skeleton: `docs/schema.sql`.

## 6. Cấu hình và kiểm chứng

Từ repository gốc:

1. Cài Node.js LTS và PostgreSQL; tạo database thử nghiệm trống.
2. Sao chép `.env.example` thành `.env`, điền thông tin cục bộ; không commit `.env`.
3. Chạy DDL với `psql "$DATABASE_URL" -f docs/schema.sql` sau khi xác nhận có quyền tạo extension `btree_gist`.
4. Mở các tệp `.drawio` bằng diagrams.net để rà bố cục; xem `docs/deployment-guide.md` để biết checklist kiểm tra.

**Trạng thái:** đây là gói thiết kế BT1. Chưa có khẳng định rằng ứng dụng backend/frontend đã được hiện thực hoặc API đã chạy. API và SQL cần được kiểm chứng trong giai đoạn triển khai.
