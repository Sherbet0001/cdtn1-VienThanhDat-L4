# Bằng chứng chạy thực tế — module Technician (buổi 8–9)

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Chạy ngày 24/10/2026 trên máy sinh viên (Windows, PowerShell, PostgreSQL cài cục bộ, Node.js ≥ 20.6, đúng các bước ở README mục 3).

## 1. Dựng CSDL và nạp dữ liệu (tiêu chí C5: chạy lại không nhân đôi)

```
npm run migrate  (lần 1) -> migrations: bỏ qua 001_init.sql (đã chạy trước đó); xong (0 chạy, 1 bỏ qua)
npm run migrate  (lần 2) -> migrations: bỏ qua 001_init.sql (đã chạy trước đó); xong (0 chạy, 1 bỏ qua)
npm run seed     (lần 1) -> seeds: xong (2 chạy, 0 bỏ qua)
npm run seed     (lần 2) -> seeds: xong (2 chạy, 0 bỏ qua)
```

Đếm dòng sau hai lần seed (sinh viên chạy trong psql, kết quả đúng như bảng dưới):

| Bảng | Số dòng | Giải thích |
|---|---|---|
| `technician` | 39 | 38 dòng seed + 1 kỹ thuật viên tạo ở mục 2 (dòng vẫn còn sau xóa mềm) |
| `technician_skill` | 159 | đúng số dòng của bộ dữ liệu mẫu; seed lần hai không nhân đôi |

## 2. Gọi thử API bằng curl (kết quả gốc từ cửa sổ PowerShell)

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `GET /health` | `{"status":"ok","db":"ok"}` |
| 2 | `GET /api/technicians?center_id=1&limit=3` | 3 dòng, `technician_id` là số; `limit: 3, offset: 0`; mã 1 có `is_active: false` |
| 3 | `GET /api/technicians/7` | có mảng `skills`: NUOC_VAO 3, PHAN_MEM 3, PIN 5, SAC 3 |
| 4 | `POST` với `data/mau/ktv-hop-le.json` | `201 Created`, `Location: /api/technicians/39`, thân `{"technician_id":39,"full_name":"Nguyễn Thị Mai","center_id":2,"level":"TRUNG_CAP","is_active":true}` |
| 5 | `POST` với `data/mau/ktv-thieu-truong.json` | `400 Bad Request`, `VALIDATION_ERROR`, `field: "full_name"`, `fields` gồm `full_name` (bắt buộc), `center_id` (bắt buộc), `level` (phải là một trong SO_CAP, TRUNG_CAP, CAO_CAP) |

Thân phản hồi lệnh 5 (nguyên văn):

```json
{"error":{"code":"VALIDATION_ERROR","message":"Dữ liệu không hợp lệ ở trường: full_name, center_id, level.","field":"full_name","fields":[{"field":"full_name","reason":"bắt buộc"},{"field":"center_id","reason":"bắt buộc"},{"field":"level","reason":"phải là một trong SO_CAP, TRUNG_CAP, CAO_CAP"}]}}
```

## 3. Giao diện (`web/`)

Mở `http://localhost:3000/`: trang "Kỹ thuật viên" hiển thị danh sách thật từ PostgreSQL (lọc mặc định "Đang hoạt động", 20 dòng đầu, mã 1 và 11 vắng vì đã nghỉ). Chuỗi kiểm chứng: trình duyệt → Express → routes → service → repository → PostgreSQL.

## 4. Nối với yêu cầu kiểm chứng

| Kiểm chứng | Bằng chứng |
|---|---|
| Chạy từ README trên máy sạch (C1) | Mục 1, các lệnh đúng README mục 3 |
| Chạy lại không nhân đôi dữ liệu (C5) | Mục 1: 39 và 159 sau hai lần seed |
| Lỗi dữ liệu vào trả 4xx, có tên trường (S, buổi 9) | Mục 2, lệnh 5 |
| Luồng ba lớp chạy với CSDL thật | Mục 2 và 3 |

## 5. Chưa có trong tài liệu này

- Ảnh chụp màn hình (có thể bổ sung vào `docs/anh/`).
- Kết quả `DELETE` (xóa mềm) và lỗi 400 với mã không hợp lệ qua curl; hai trường hợp này đã được kiểm thử trong `tests/technician.integration.test.js`.
