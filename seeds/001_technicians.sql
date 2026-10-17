-- ============================================================================
-- 001_technicians.sql - 38 kỹ thuật viên lấy nguyên từ dataset/technicians.csv.
-- Giữ nguyên technician_id của bộ dữ liệu mẫu để đối chiếu với tickets_history.csv.
-- Cột ánh xạ: ho_ten -> full_name; technician_code không lưu (không có trong ERD BT1).
-- Chạy lại được: ON CONFLICT DO NOTHING, rồi đặt lại bộ đếm id để KTV thêm mới không trùng khóa.
-- ============================================================================

INSERT INTO technician (technician_id, full_name, center_id, level, is_active) VALUES
  (1, 'Phạm Minh Quyên', 1, 'TRUNG_CAP', false),
  (2, 'Trần Hoài Giang', 4, 'TRUNG_CAP', true),
  (3, 'Đặng Quang Oanh', 3, 'CAO_CAP', true),
  (4, 'Phan Thị Yến', 4, 'TRUNG_CAP', true),
  (5, 'Đặng Anh Quân', 2, 'CAO_CAP', true),
  (6, 'Đặng Bảo Duy', 4, 'TRUNG_CAP', true),
  (7, 'Trần Xuân Nam', 5, 'SO_CAP', true),
  (8, 'Phạm Hữu Huy', 2, 'TRUNG_CAP', true),
  (9, 'Lý Đức Lâm', 5, 'TRUNG_CAP', true),
  (10, 'Đỗ Văn Thắng', 6, 'CAO_CAP', true),
  (11, 'Bùi Hữu Thảo', 6, 'CAO_CAP', false),
  (12, 'Đỗ Tuấn Oanh', 2, 'SO_CAP', true),
  (13, 'Phan Kim Hải', 6, 'SO_CAP', true),
  (14, 'Đỗ Thị Ngân', 4, 'SO_CAP', true),
  (15, 'Phạm Kim Tâm', 4, 'SO_CAP', true),
  (16, 'Đỗ Tuấn Trang', 4, 'SO_CAP', true),
  (17, 'Võ Đức Phương', 5, 'CAO_CAP', true),
  (18, 'Vũ Minh Dung', 6, 'CAO_CAP', true),
  (19, 'Đỗ Đức Giang', 3, 'TRUNG_CAP', true),
  (20, 'Trần Văn Thảo', 1, 'TRUNG_CAP', true),
  (21, 'Phan Xuân Tuyết', 4, 'TRUNG_CAP', true),
  (22, 'Đỗ Thị Phong', 3, 'CAO_CAP', true),
  (23, 'Phạm Quang Hoa', 6, 'SO_CAP', true),
  (24, 'Đỗ Hoài Tuyết', 5, 'SO_CAP', true),
  (25, 'Phan Gia Cường', 2, 'SO_CAP', true),
  (26, 'Phạm Bảo Thắng', 5, 'TRUNG_CAP', true),
  (27, 'Phan Kim Nhung', 3, 'CAO_CAP', true),
  (28, 'Lý Văn Trang', 6, 'TRUNG_CAP', true),
  (29, 'Vũ Đức Thắng', 2, 'TRUNG_CAP', true),
  (30, 'Nguyễn Thị Hạnh', 2, 'SO_CAP', true),
  (31, 'Đỗ Văn Tâm', 5, 'SO_CAP', false),
  (32, 'Phạm Văn Hạnh', 3, 'SO_CAP', true),
  (33, 'Phan Kim Hạnh', 1, 'CAO_CAP', true),
  (34, 'Trần Văn Dung', 4, 'TRUNG_CAP', true),
  (35, 'Phạm Minh Hà', 5, 'SO_CAP', true),
  (36, 'Lý Xuân Trung', 3, 'CAO_CAP', true),
  (37, 'Huỳnh Gia Trung', 3, 'TRUNG_CAP', true),
  (38, 'Phan Ngọc Lâm', 3, 'TRUNG_CAP', true)
ON CONFLICT (technician_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('technician', 'technician_id'),
              (SELECT MAX(technician_id) FROM technician));
