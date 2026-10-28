# Bằng chứng buổi 11 — Tích hợp hệ thống và xử lý lỗi

Môi trường chạy thử: Node 22, PostgreSQL 16, `npm test` (97 test PASS). Docker chưa làm ở thời điểm viết tài liệu này (xem README mục 6).

## 1. Khóa phiên bản và runtime

- `package-lock.json` đã commit; README bước 4 dùng `npm ci` để cài đúng phiên bản đã khóa.
- Runtime: `.nvmrc` ghi Node 20, `package.json` có `engines.node = ">=20.6 <27"`, README mục 2 ghi "Node.js 20 LTS".
- `git log --all --oneline -- .env` không in dòng nào: `.env` chưa từng bị commit.

## 2. Log có cấu trúc (src/logger.js)

Ba dòng log mẫu sinh ra từ chính logger của dự án (thời điểm có múi giờ, mức, thông điệp, ngữ cảnh; số điện thoại bị che):

```json
{"thoi_diem":"2026-10-28T18:30:02+07:00","muc":"info","thong_diep":"yêu cầu hoàn tất","requestId":"7f3a-21","phuong_thuc":"GET","duong_dan":"/api/tickets/unassigned","ma_trang_thai":200,"thoi_gian_ms":14}
{"thoi_diem":"2026-10-28T18:30:02+07:00","muc":"info","thong_diep":"yêu cầu bị từ chối theo quy tắc nghiệp vụ","requestId":"7f3a-22","ma_loi":"TICKET_ALREADY_ASSIGNED"}
{"thoi_diem":"2026-10-28T18:30:02+07:00","muc":"error","thong_diep":"không kết nối được cơ sở dữ liệu","requestId":"7f3a-23","customer":{"id":1024,"phone":"***"},"err":{"loai":"Error","ma":"ECONNREFUSED", "...":"..."}}
```

Kiểm thử: `tests/logger.test.js` (mức log, che dữ liệu nhạy cảm, requestId, không ghi query string).

## 3. Xử lý lỗi xuyên lớp

| Tình huống | Mã HTTP | Mức log | Số dòng log lỗi |
|---|---|---|---|
| Vi phạm quy tắc nghiệp vụ (ví dụ phiếu đã được phân công) | 409 | INFO | 0 dòng ERROR |
| Dữ liệu vào sai | 400 | INFO | 0 dòng ERROR |
| Lỗi hệ thống không lường trước | 500, kèm mã tra cứu | ERROR | đúng 1 |
| Mất kết nối cơ sở dữ liệu | 503, kèm mã tra cứu | ERROR | đúng 1 |

Kiểm thử: `tests/xuLyLoi.test.js`. Phản hồi 5xx không chứa câu SQL, tên bảng hay ngăn xếp lỗi.

**Suy giảm có kiểm soát khi cơ sở dữ liệu ngừng:** `GET /health` trả 503 `{"status":"degraded"}` (có log WARN); các API khác trả 503 kèm mã tra cứu; giao diện hiện "Hệ thống đang gặp sự cố… Mã tra cứu: …" cùng nút Thử lại (thành phần DataState), không bị trắng trang.

## 4. Debug có hệ thống

BUG-001 được gỡ đủ bốn bước, có test hồi quy FAIL trước và PASS sau: xem `docs/bug-log.md`.

## 5. Checklist tự kiểm (mục D4 của tài liệu tự học)

| Mục | Lệnh | Kết quả |
|---|---|---|
| Không nuốt lỗi | `grep -rnE "catch *\([^)]*\) *\{ *\}" src web/src` | 0 dòng |
| Không còn `console.log` gỡ lỗi trong `src/` | `grep -rn "console\." src` | chỉ còn `src/db/runner.js` (công cụ dòng lệnh in kết quả cho người chạy migration) |
| Không có đường dẫn tuyệt đối | `grep -rnE "/home/|/Users/|C:\\\\" src web/src` | 0 dòng |
| `.env` chưa từng bị commit | `git log --all --oneline -- .env` | 0 dòng |
| Chỉ lớp client được gọi `fetch` | `grep -rn "fetch(" web/src/pages web/src/components` | 0 dòng |
| Có `.env.example` đủ biến | xem tệp | có, gồm `LOG_LEVEL` |
| Lỗi người dùng 4xx, lỗi hệ thống 5xx kèm mã tra cứu | `tests/xuLyLoi.test.js` | PASS |

Còn lại của buổi 11: đóng gói Docker (Dockerfile, `docker-compose.yml`, `.dockerignore`) và phép thử từ thư mục trống.
