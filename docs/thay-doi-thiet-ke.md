# Nhật ký thay đổi thiết kế

- **Dự án:** CDTN1 – Viên Thành Đạt (MSSV 2374802010107) – Luồng L4, Track SE
- **Phạm vi:** Điều chỉnh sau phản hồi Bài tập 1 và chuẩn bị cho Bài tập 2
- **Cập nhật:** 17/10/2026 (thêm TD-14 đến TD-18)

## 1. Cách ghi

- Mục "Phản hồi của GV" chỉ chép lại đúng nhận xét của giảng viên cho BT1 (điểm 8,5/10, nhận ngày 17/10/2026). Việc do sinh viên tự phát hiện được ghi ở Mục 4 với "Nguồn: tự rà soát".
- Mỗi thay đổi có mã TD-xx và năm dòng: phản hồi hoặc nguồn, quyết định, lý do, ảnh hưởng, trạng thái.
- "Trạng thái" chỉ ghi đã kiểm chứng khi đã thực sự chạy hoặc kiểm tra; việc chưa làm ghi rõ là chưa làm.

**Không thay đổi:** kiến trúc modular monolith bốn lớp, ERD 6 bảng và các khóa ngoại, 7 endpoint API, NFR1–NFR5, bảng truy vết FR–US–UC–API–NFR–test case. Các thay đổi dưới đây là bổ sung và làm rõ, không đổi hướng thiết kế.

## 2. Tóm tắt

| Mã | Nội dung | Quyết định | Tệp bị ảnh hưởng |
|---|---|---|---|
| TD-01 | Sơ đồ kiến trúc: chú thích ký hiệu và phần ngoài phạm vi | SỬA | `docs/architecture.drawio`, `docs/architecture.png` |
| TD-02 | Thêm `docs/schema.sql` vào repo | SỬA | `docs/schema.sql`, `README.md`, `docs/deployment-guide.md` |
| TD-03 | DDL trong PDF bị vỡ khoảng trắng | GIỮ PDF đã nộp, sửa ở repo | `docs/schema.sql` |
| TD-04 | Thiếu `.gitignore` | SỬA | `.gitignore` |
| TD-05 | `env.example` sai tên | SỬA | `.env.example` |
| TD-06 | Commit "Add files via upload" | GIỮ lịch sử cũ, đổi cách làm từ nay | Quy trình commit BT2 |
| TD-07 | Xóa slide bài giảng và case study khỏi repo public | SỬA | Thư mục slide (đã xóa) |
| TD-08 | Gợi ý BT2: `schema.sql`, thử EXCLUDE, test đồng thời TC-11 | ÁP DỤNG CHO BT2 | `tests/`, migration |
| TD-09 | Bổ sung QT-02 vào SRS | SỬA (tự rà soát) | `docs/srs.md` |
| TD-10 | Định nghĩa "số phiếu đang giữ" | SỬA (tự rà soát) | `docs/srs.md`, `docs/api-contract.md` |
| TD-11 | Trạng thái phiếu cho phép giao máy và nhận máy | SỬA (tự rà soát) | `docs/srs.md` |
| TD-12 | Giờ hợp lệ của lịch hẹn khớp BR-L4-01 | SỬA (tự rà soát) | `docs/srs.md` |
| TD-13 | Luồng gợi ý khung giờ sau lỗi 409 | SỬA (tự rà soát) | `docs/api-contract.md` |
| TD-14 | Mã phiếu theo case study: `BH-000123/2026` | SỬA (phát hiện khi làm BT2) | `docs/schema.sql`, `docs/srs.md`, `docs/api-contract.md`, `docs/wireframe.drawio`, `docs/deployment-guide.md` |
| TD-15 | Thêm 5 endpoint CRUD `/api/technicians` | SỬA (bổ sung cho BT2) | `src/routes/`, `src/services/`, `src/repositories/`, `src/validators/` |
| TD-16 | Xóa mềm kỹ thuật viên và quy tắc "đang giữ phiếu thì không ngừng hoạt động" | SỬA (bổ sung cho BT2) | `src/services/technician.service.js` |
| TD-17 | Giữ 6 bảng của ERD; không thêm bảng danh mục từ bộ dữ liệu mẫu | GIỮ NGUYÊN | `migrations/001_init.sql`, `seeds/` |
| TD-18 | Chưa làm xác thực JWT ở buổi 8 | HOÃN | `src/app.js`, `src/routes/` |

## 3. Sau phản hồi Bài tập 1 của giảng viên (17/10/2026)

### TD-01 — Sơ đồ kiến trúc: chú thích ký hiệu và phần ngoài phạm vi

- **Phản hồi của GV:** "Sơ đồ kiến trúc (Hình 2) chưa có chú thích ký hiệu và chưa có dòng ghi rõ phần NGOÀI PHẠM VI (ví dụ L2 tiếp nhận phiếu, SMS/Zalo, quản lý tài khoản)."
- **Quyết định:** SỬA. Thêm khung "Chú thích ký hiệu" (lớp, thành phần, kho dữ liệu, quyết định gắn NFR, ghi chú triển khai, mũi tên gọi, phần ngoài phạm vi) và khung "NGOÀI PHẠM VI – không xây dựng trong MVP L4". Nội dung khung lấy nguyên từ mục "Chủ ý KHÔNG làm" của SRS (L2 tiếp nhận phiếu, quản lý tài khoản và phân quyền chi tiết, SMS/Zalo, L5 kho linh kiện, L6 báo cáo, tự động phân công tối ưu, đổi hoặc hủy lịch đã xác nhận, xem lịch tuần); không thêm hay bớt chức năng nào.
- **Lý do:** Người đọc cần biết mỗi ký hiệu nghĩa là gì và đâu là ranh giới của MVP để không nhầm chức năng chưa làm với thành phần có trong hệ thống.
- **Ảnh hưởng:** `docs/architecture.drawio` và `docs/architecture.png` (ảnh vẽ lại từ file nguồn). Hình 2 trong PDF BT1 đã nộp vẫn là bản cũ.
- **Trạng thái:** Đã cập nhật và đẩy lên repo. File `.drawio` đã kiểm tra là XML hợp lệ; còn cần mở bằng diagrams.net để xem hiển thị thực tế.

### TD-02 — Thêm `docs/schema.sql` vào repo

- **Phản hồi của GV:** "PDF dẫn tới docs/schema.sql nhưng repo không có file này."
- **Quyết định:** SỬA. Thêm `docs/schema.sql` dựng từ DDL trong báo cáo BT1 (Mục 4). So với đoạn rút gọn trong PDF, bản đầy đủ có thêm các ràng buộc CHECK (enum trạng thái, nhóm sự cố, mức ưu tiên, loại lịch hẹn; định dạng số điện thoại và mã phiếu; độ dài lịch hẹn 30 phút) và chỉ mục `ix_ticket_technician`, `ix_status_log_ticket`, `ix_appointment_technician_start`, đúng như PDF đã ghi ("bản đầy đủ có CHECK enum và chỉ mục"). Bảng, cột, khóa ngoại giữ nguyên theo ERD.
- **Lý do:** Báo cáo dẫn tới tệp này nên tệp phải có trong repo để người khác dựng lại được CSDL.
- **Ảnh hưởng:** `README.md` (mục 4–5) và `docs/deployment-guide.md` hướng dẫn dựng CSDL từ tệp này.
- **Trạng thái:** Đã nạp thành công vào PostgreSQL 16 trống và chạy lại các bước README từ bản clone mới (16–17/10/2026). Ba giá trị `level` của kỹ thuật viên (`SO_CAP`, `TRUNG_CAP`, `CAO_CAP`) khớp `technicians.csv` của bộ dữ liệu mẫu (đối chiếu ngày 17/10/2026).

### TD-03 — Đoạn DDL trong PDF bị vỡ khoảng trắng

- **Phản hồi của GV:** "đoạn DDL trong PDF bị vỡ khoảng trắng, khó đọc."
- **Quyết định:** GIỮ nguyên PDF BT1 đã nộp, sửa ở repo. Bản DDL đọc được là `docs/schema.sql`. Trong báo cáo BT2, DDL (nếu đưa vào) trình bày bằng font đơn cách, căn trái, một câu lệnh một dòng.
- **Lý do:** PDF BT1 là bản đã nộp và đã chấm; repo là nơi giữ bản chính thức, dễ đọc và chạy được.
- **Ảnh hưởng:** Mục 4 của PDF BT1 vẫn đọc khó; người đọc đối chiếu bằng `docs/schema.sql`.
- **Trạng thái:** Đã có `docs/schema.sql`. PDF BT1 chưa sửa.

### TD-04 — Thêm `.gitignore`

- **Phản hồi của GV:** "Repo thiếu .gitignore."
- **Quyết định:** SỬA. Tệp trước đó nằm ở repo dưới tên `download`; đã đổi thành `.gitignore`. Tệp chặn `.env`, `.env.*` (trừ `.env.example`), `node_modules/`, thư mục build và tệp tạm của trình soạn thảo và draw.io.
- **Lý do:** Ngăn commit nhầm tệp `.env` chứa thông tin bí mật.
- **Ảnh hưởng:** Mọi tệp cấu hình cục bộ của BT2 nằm trong `.env`, không đưa lên repo.
- **Trạng thái:** Đã kiểm tra: `git check-ignore` xác nhận `.env` bị chặn và repo không có tệp `.env`.

### TD-05 — Đổi tên tệp cấu hình mẫu

- **Phản hồi của GV:** "file mẫu đặt tên env.example (thiếu dấu chấm)."
- **Quyết định:** SỬA. Đổi `env.example` thành `.env.example`.
- **Lý do:** Tên chuẩn là `.env.example`; README hướng dẫn `cp .env.example .env`.
- **Ảnh hưởng:** `README.md` (mục 5, bước 3). BT2 phải liệt kê đủ mọi biến môi trường trong tệp này.
- **Trạng thái:** Đã đổi tên và dùng đúng trong bản clone mới khi chạy thử README.

### TD-06 — Thông điệp commit "Add files via upload"

- **Phản hồi của GV:** "commit chủ yếu "Add files via upload"."
- **Quyết định:** GIỮ lịch sử cũ, ĐỔI cách làm từ nay: không viết lại lịch sử; mỗi commit mới một việc, thông điệp nói rõ việc đó.
- **Lý do:** Viết lại lịch sử (force-push) làm mất chính minh chứng quá trình làm việc và gây rủi ro lệch giữa các bản clone.
- **Ảnh hưởng:** Quy trình commit của BT2. Các commit cũ giữ nguyên.
- **Trạng thái:** Các commit từ 16/10/2026 có thông điệp mô tả việc đã làm. Vẫn còn commit tạo qua giao diện web có tên chung chung; BT2 làm bằng dòng lệnh để tránh.

### TD-07 — Xóa slide bài giảng và case study khỏi repo public

- **Phản hồi của GV:** "em nên xóa thư mục slide bài giảng và case study khỏi repo public."
- **Quyết định:** SỬA. Đã xóa thư mục `slide bai giang` (commit `d156643`, 17/10/2026).
- **Lý do:** Tài liệu học phần lưu hành nội bộ không nên công khai.
- **Ảnh hưởng:** Repo không còn tệp tài liệu học phần; README không tham chiếu tới chúng.
- **Trạng thái:** Đã xóa khỏi cây tệp hiện tại. Các tệp vẫn nằm trong lịch sử commit cũ; không ghi đè lịch sử vì lý do ở TD-06. Nếu giảng viên yêu cầu xóa cả khỏi lịch sử thì cần hỏi lại trước khi làm.

### TD-08 — Gợi ý cho BT2

- **Phản hồi của GV:** "Đưa schema.sql vào repo, chạy thử ràng buộc EXCLUDE và viết test đồng thời cho TC-11 ngay từ đầu."
- **Quyết định:** ÁP DỤNG CHO BT2. Dùng `docs/schema.sql` làm căn cứ viết migration; ràng buộc `ex_appointment_no_overlap` giữ nguyên ở tầng CSDL (NFR3); viết test đồng thời cho TC-11 ngay từ checkpoint đầu của BT2.
- **Lý do:** NFR3 yêu cầu đúng 1 yêu cầu thành công và 0 lịch trùng qua 100 lần đặt đồng thời; kiểm tra ở ứng dụng không đủ nếu không có ràng buộc ở CSDL.
- **Ảnh hưởng:** `migrations/` và `tests/` của BT2; ứng dụng phải ánh xạ lỗi 23P01 sang HTTP 409 `SLOT_CONFLICT`.
- **Trạng thái:** `schema.sql` đã vào repo (TD-02). Đã chạy thử ràng buộc EXCLUDE bằng 10 ca (đặt hợp lệ, trùng khung, chồng lấn một phần, lịch liền kề và các vi phạm khác) trên PostgreSQL 16; bộ ca nằm ở `docs/deployment-guide.md`, Mục 4. Test đồng thời TC-11 **chưa làm**, thực hiện ở BT2.

## 4. Làm rõ SRS và hợp đồng API khi tự rà soát (16/10/2026)

Nguồn: tự rà soát chéo SRS, hợp đồng API, ERD và báo cáo BT1, không phải phản hồi của giảng viên. Các thay đổi sau làm `docs/srs.md` và `docs/api-contract.md` trong repo khác bản đã nộp trong PDF BT1.

### TD-09 — Bổ sung QT-02 vào SRS

- **Nguồn:** `docs/api-contract.md` dẫn tới QT-02 (chuẩn hóa số điện thoại) nhưng SRS Mục 5 không định nghĩa.
- **Quyết định:** SỬA. Thêm QT-02 vào SRS Mục 5: số điện thoại chuẩn hóa về 10 chữ số bắt đầu bằng 0 trước khi lưu và trước khi so khớp; nội dung theo case study Mục 9.
- **Lý do:** Mọi mã quy tắc được dẫn phải có định nghĩa trong SRS.
- **Ảnh hưởng:** `docs/srs.md` (Mục 5). Dùng khi khách nhập số điện thoại để xác thực (`POST /api/appointments`).
- **Trạng thái:** Đã sửa và đẩy lên repo (16/10/2026).

### TD-10 — Định nghĩa "số phiếu đang giữ"

- **Nguồn:** FR2, US2 và `open_tickets` trong API dùng cụm "số phiếu đang giữ/đang xử lý" nhưng không nói đếm phiếu ở trạng thái nào.
- **Quyết định:** SỬA. Số phiếu đang giữ của một KTV là số phiếu có KTV đó ở trạng thái ĐÃ PHÂN CÔNG, ĐANG XỬ LÝ hoặc CHỜ LINH KIỆN.
- **Lý do:** Không có định nghĩa này thì không viết được truy vấn đếm tải và không kiểm thử được TC-03.
- **Ảnh hưởng:** `docs/srs.md` (FR2), `docs/api-contract.md` (mục 2.2).
- **Trạng thái:** Đã sửa và đẩy lên repo (16/10/2026).

### TD-11 — Trạng thái phiếu cho phép giao máy và nhận máy

- **Nguồn:** BR-L4-02 ghi hẹn giao máy "khi phiếu ở ĐÃ PHÂN CÔNG trở đi", nghĩa là gồm cả HOÀN TẬT, ĐÃ ĐÓNG, ĐÃ HỦY; mâu thuẫn BR-L4-03 (phiếu ĐÃ ĐÓNG hoặc ĐÃ HỦY không đặt lịch được).
- **Quyết định:** SỬA. Hẹn giao máy chỉ khi phiếu ở ĐÃ PHÂN CÔNG, ĐANG XỬ LÝ hoặc CHỜ LINH KIỆN; hẹn nhận máy chỉ khi phiếu HOÀN TẬT.
- **Lý do:** Loại mâu thuẫn giữa hai quy tắc; khớp mã lỗi 409 `TICKET_NOT_BOOKABLE` trong API.
- **Ảnh hưởng:** `docs/srs.md` (BR-L4-02, điều kiện trước của UC6).
- **Trạng thái:** Đã sửa và đẩy lên repo (16/10/2026). Đây là quyết định của sinh viên; cần kiểm thử ở BT2.

### TD-12 — Giờ hợp lệ của lịch hẹn khớp BR-L4-01

- **Nguồn:** US6 AC3 và UC6 bước 4a ghi "sau 17:30", lệch BR-L4-01 (khung cuối bắt đầu 17:00, bắt đầu đúng mốc :00 hoặc :30).
- **Quyết định:** SỬA. Từ chối khi lịch vào Chủ nhật, bắt đầu trước 08:00 hoặc sau 17:00, hoặc không nằm trên mốc :00/:30.
- **Lý do:** Cùng một quy tắc phải được mô tả giống nhau ở mọi nơi.
- **Ảnh hưởng:** `docs/srs.md` (US6 AC3, UC6 bước 4a).
- **Trạng thái:** Đã sửa và đẩy lên repo (16/10/2026).

### TD-13 — Luồng gợi ý khung giờ sau lỗi 409

- **Nguồn:** FR9 và UC6 bước 5a nói khi trùng lịch thì hiển thị ít nhất 3 khung trống, nhưng phản hồi 409 `SLOT_CONFLICT` không kèm khung nào và hợp đồng API không ghi bước tiếp theo.
- **Quyết định:** SỬA. Ghi chú rõ: khi nhận 409 `SLOT_CONFLICT`, giao diện gọi tiếp `POST /api/appointments/available-slots` với cùng `ticket_code`, `phone`, `type`. Không thêm endpoint mới, không đổi phản hồi 409.
- **Lý do:** Làm rõ cách hai endpoint hiện có phối hợp để thực hiện FR9.
- **Ảnh hưởng:** `docs/api-contract.md` (trước mục 2.7).
- **Trạng thái:** Đã sửa và đẩy lên repo (16/10/2026).

## 5. Thay đổi khi hiện thực Bài tập 2 (buổi 8, 17/10/2026)

Nguồn: đối chiếu thiết kế BT1 với case study, bộ dữ liệu mẫu và đề bài BT2 khi viết migration, seed và thực thể đầu tiên.

### TD-14 — Mã phiếu theo case study: `BH-000123/2026`

- **Nguồn:** case study (mô tả bảng `ticket`) quy định mã phiếu dạng `BH-000123/2026`, có dấu gạch ngang; cả 7.800 mã trong `tickets_history.csv` đúng dạng này. Gói BT1 viết `BH001287/2026` (thiếu dấu gạch ngang), nên ràng buộc `ck_ticket_code` sẽ từ chối toàn bộ dữ liệu mẫu.
- **Quyết định:** SỬA. Đổi mã mẫu thành `BH-001287/2026` và ràng buộc thành `^BH-[0-9]{6}/[0-9]{4}$`; độ dài cột `VARCHAR(20)` giữ nguyên.
- **Lý do:** Lỗi chép sai định dạng ở BT1; thiết kế phải khớp case study và dữ liệu thật.
- **Ảnh hưởng:** `docs/schema.sql`, `docs/srs.md` (ví dụ ở US2, US6), `docs/api-contract.md` (ví dụ và quy tắc kiểm tra `ticket_code`), `docs/wireframe.drawio`, `docs/deployment-guide.md` (smoke test). `docs/wireframe.png` và PDF BT1 còn hiển thị mã cũ cho đến khi xuất lại.
- **Trạng thái:** Đã sửa văn bản và `.drawio`; chưa xuất lại `wireframe.png`.

### TD-15 — Thêm 5 endpoint CRUD `/api/technicians`

- **Nguồn:** đề BT2 yêu cầu ít nhất hai thực thể có đủ tạo–đọc–sửa–xóa qua ba lớp; hợp đồng API BT1 chỉ có 7 endpoint nghiệp vụ, không có CRUD kỹ thuật viên.
- **Quyết định:** SỬA. Thêm `GET /api/technicians`, `GET /api/technicians/{id}`, `POST /api/technicians`, `PUT /api/technicians/{id}`, `DELETE /api/technicians/{id}`. Phản hồi dùng trường snake_case và lỗi dạng `{ "error": { "code", "message", "field" } }` đúng quy ước chung của BT1; danh sách trả `{ items, limit, offset }`. Mã lỗi mới: `TECHNICIAN_NOT_FOUND` (404) và `TECHNICIAN_HAS_OPEN_TICKETS` (409), cộng `VALIDATION_ERROR` (400) đã có.
- **Lý do:** Thực thể kỹ thuật viên có sẵn trong ERD và trong dữ liệu mẫu (38 dòng), nên là thực thể đầu tiên dễ kiểm chứng; bảy endpoint nghiệp vụ của BT1 vẫn giữ nguyên, thực hiện ở các buổi sau.
- **Ảnh hưởng:** `src/routes/technician.routes.js`, `src/services/technician.service.js`, `src/repositories/technician.repository.js`, `src/validators/technician.validator.js`; `docs/api-contract.md` Mục 2.8 (cập nhật ở TD-19).
- **Trạng thái:** Đã viết và có 25 kiểm thử đơn vị PASS (service, validator, routes, bộ chạy migration). Các câu SQL của repository đã chạy thử trên PostgreSQL 16; chạy đủ qua Express trên máy sinh viên chưa thực hiện.

### TD-16 — Xóa mềm kỹ thuật viên và quy tắc đang giữ phiếu

- **Nguồn:** QT-13 (không xóa vật lý dữ liệu) mâu thuẫn với yêu cầu "xóa" trong CRUD của BT2.
- **Quyết định:** SỬA. `DELETE /api/technicians/{id}` chỉ đặt `is_active = false`; dòng dữ liệu vẫn còn. Nếu kỹ thuật viên đang giữ phiếu (trạng thái `DA_PHAN_CONG`, `DANG_XU_LY` hoặc `CHO_LINH_KIEN`, theo định nghĩa ở TD-10) thì trả 409 `TECHNICIAN_HAS_OPEN_TICKETS`, kèm số phiếu đang giữ.
- **Lý do:** Phiếu đang xử lý không được mất người phụ trách; cũng khớp FR2 (chỉ gán cho KTV đang hoạt động).
- **Ảnh hưởng:** `src/services/technician.service.js` (quy tắc), `src/repositories/technician.repository.js` (`countOpenTickets`).
- **Trạng thái:** Đã kiểm thử đơn vị cả biên (giữ 0 phiếu thì cho, giữ 1 phiếu thì chặn). Quy tắc "đổi trung tâm khi đang giữ phiếu" chưa làm.

### TD-17 — Giữ 6 bảng của ERD, không thêm bảng danh mục

- **Nguồn:** hướng dẫn bộ dữ liệu mẫu gợi ý nạp `service_centers.csv` và `issue_categories.csv` làm bảng danh mục; ERD BT1 không có hai bảng này.
- **Quyết định:** GIỮ NGUYÊN. `center_id` vẫn là số nguyên và nhóm sự cố vẫn là giá trị CHECK; seed chỉ nạp `technician` (38 dòng, giữ nguyên `technician_id`) và `technician_skill` (159 dòng, đổi `category_id` sang tên nhóm sự cố). Cột `technician_code` của dữ liệu mẫu không lưu.
- **Lý do:** Phạm vi L4 không quản lý trung tâm và danh mục (đã ghi ở SRS Mục 1); thêm hai bảng chỉ để tra tên mà không có chức năng nào dùng.
- **Ảnh hưởng:** Không đổi ERD và DDL. Ánh xạ cột ghi ở đầu `seeds/001_technicians.sql` và `seeds/002_technician_skills.sql`.
- **Trạng thái:** Seed đã chạy hai lần trên PostgreSQL 16: giữ nguyên 38 và 159 dòng.

### TD-18 — Chưa làm xác thực JWT ở buổi 8

- **Nguồn:** hợp đồng API BT1 quy định mọi endpoint nhân viên dùng `Authorization: Bearer <token>`.
- **Quyết định:** HOÃN. Các endpoint `/api/technicians` hiện chưa yêu cầu token; xác thực và phân quyền làm sau.
- **Lý do:** Buổi 8 chỉ yêu cầu module cốt lõi đầu tiên chạy được; cơ chế đăng nhập không phải phần được kiểm chứng ở bước này.
- **Ảnh hưởng:** `src/app.js`, `src/routes/`. Chỉ chạy cục bộ; không triển khai công khai khi chưa có xác thực.
- **Trạng thái:** Chưa làm.

## 6. Thay đổi khi làm buổi 9 (24/10/2026)

### TD-19 — Khung lỗi thêm `fields`, giữ nguyên phần còn lại

- **Nguồn:** bài giảng buổi 9 và checklist tự kiểm yêu cầu API trả lỗi thống nhất gồm `error`, `message`, `fields`, lỗi người dùng trả 4xx; ví dụ trong bài dùng `{data}` và mã 422.
- **Quyết định:** SỬA CỘNG THÊM. Giữ khung `{ error: { code, message, field } }` của BT1 và thêm `fields: [{ field, reason }]` cho `VALIDATION_ERROR`. Thay thế `details.cac_truong` (tên tiếng Việt, mới có ở buổi 8, chưa phát hành). Không đổi sang `{data}` hay 422.
- **Lý do:** Thêm thành phần tùy chọn là thay đổi TƯƠNG THÍCH: bên gọi theo hợp đồng cũ không vỡ. Đổi sang phong bì `{data}` hoặc mã 422 là thay đổi PHÁ VỠ, làm hỏng hợp đồng BT1 đã nộp mà không thêm giá trị.
- **Ảnh hưởng:** `src/errors/AppError.js`, `src/validators/technician.validator.js`, `src/routes/technician.routes.js`, `docs/api-contract.md` (Mục 1, 2.8; phiên bản 1.2), các test liên quan. Đồng thời đóng điểm mở "api-contract chưa có mục /api/technicians".
- **Trạng thái:** Đã sửa, test PASS. `details` vẫn dùng cho số liệu nghiệp vụ (`so_phieu`).

### TD-20 — Giao diện đầu tiên viết bằng HTML và ES module thuần, phục vụ từ Express

- **Nguồn:** tài liệu tự học buổi 9 (track SE) yêu cầu giao diện React hoặc Vue gọi API qua lớp client riêng, có ba trạng thái; ERD và kiến trúc BT1 không có thư mục giao diện riêng.
- **Quyết định:** TẠM THỜI. Một màn hình (`web/`) viết bằng HTML + ES module, Express phục vụ như tệp tĩnh. Giữ đúng các quy tắc của tài liệu: lớp client riêng (`web/api/client.mjs`), logic ba trạng thái tách riêng và có test, không có `fetch` ngoài lớp client.
- **Lý do:** Chưa có hướng dẫn chọn React hay Vue của giảng viên; trang thuần không cần bước build nên không thêm phụ thuộc và không đổi cách chạy ở README. Lớp client và logic trạng thái chuyển sang component React/Vue gần như nguyên vẹn.
- **Ảnh hưởng:** `web/`, `src/app.js` (thêm `express.static`), `tests/web.datastate.test.js`.
- **Trạng thái:** Một màn hình, đã thử trong trình duyệt với máy chủ giả; chưa thử với PostgreSQL thật. Yêu cầu ≥ 3 màn hình và xác thực (TD-18) làm ở buổi 10 theo hướng dẫn.

## 7. Thay đổi khi làm buổi 10 (24/10/2026)

### TD-21 — Seed phiếu đang mở và khách hàng từ bộ dữ liệu mẫu

- **Nguồn:** luồng chính UC3 cần phiếu và khách hàng thật; `tickets_history.csv` có 7.800 phiếu nhưng không có phiếu nào ở trạng thái `MOI`, và `customers_raw.csv` có số điện thoại nhiều định dạng ("0763247885", "+84…", "0763 247 885", "0763.247.885", trống).
- **Quyết định:** SỬA. Seed chỉ phiếu ĐANG MỞ (`DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`: 1.162 phiếu), chuẩn hóa số điện thoại theo QT-02, bỏ 64 phiếu của 61 khách không có số hợp lệ, gộp 4 cặp khách trùng số điện thoại, và đặt lại 12 phiếu nhận gần nhất (2 phiếu mỗi trung tâm) về `MOI`. Kết quả: 1.063 khách, 1.098 phiếu (12 `MOI`). Phiếu đã đóng và hoàn tất (6.638 phiếu) không nạp.
- **Lý do:** Chức năng L4 chỉ dùng phiếu đang giữ để tính khối lượng của kỹ thuật viên và phiếu `MOI` để phân công; `phone` của ERD là `NOT NULL UNIQUE`, nên khách không có số hợp lệ không thể nạp. Số phiếu `MOI` tự đặt lại là dữ liệu dựng cho luồng chính, không phải dữ liệu gốc.
- **Ảnh hưởng:** `seeds/003_customers.sql`, `seeds/004_tickets.sql` (do `scripts/tao-seed-phieu.py` sinh ra); ERD và DDL không đổi.
- **Trạng thái:** Đã chạy hai lần trên PostgreSQL 16: giữ nguyên 1.063 khách và 1.098 phiếu. 12 phiếu `MOI` có hạn cam kết đã trôi qua (dữ liệu năm 2024–2026), nên màn hình sẽ hiển thị là quá hạn; không sửa ngày để giữ dữ liệu thật.

### TD-22 — Thêm chi tiết phiếu, tiếp nhận phiếu và lọc theo trung tâm

- **Nguồn:** đề buổi 10 yêu cầu ba màn hình (danh sách, chi tiết, tiếp nhận) nối API thật; hợp đồng BT1 không có endpoint tạo phiếu (tiếp nhận thuộc L2, ngoài phạm vi, TD-01) và lấy trung tâm của quản lý từ token (QT-14), trong khi xác thực chưa làm (TD-18).
- **Quyết định:** SỬA. Thêm `GET /api/tickets/{id}` và `POST /api/tickets` (tạo phiếu `MOI` để có đầu vào cho luồng phân công); danh sách chưa phân công nhận thêm tham số tùy chọn `center_id` thay cho trung tâm lấy từ token.
- **Lý do:** Dữ liệu mẫu không có phiếu `MOI`, nên cần cách tạo phiếu để chạy luồng chính từ đầu đến cuối; `center_id` làm bộ lọc tạm cho đến khi có xác thực. Phạm vi POST chỉ gồm trường tối thiểu, không thêm chức năng L2 (không SMS, không tra cứu bảo hành).
- **Ảnh hưởng:** `src/routes/ticket.routes.js`, `src/services/ticket.service.js`, `src/services/ticket.rules.js` (QT-04), `src/validators/phone.js` (QT-02), `src/repositories/ticket.repository.js`, `docs/api-contract.md` (Mục 1, 2.1, 2.9).
- **Trạng thái:** Đã viết, 28 test mới (tổng 68) PASS; câu SQL đã chạy trên PostgreSQL 16 (sắp theo hạn, mã phiếu theo năm giờ Việt Nam, khách trùng số dùng lại bản ghi cũ).

### TD-23 — Phân công khi chưa có đăng nhập: `assigned_by` = 0

- **Nguồn:** hợp đồng API (Mục 2.3) trả `assigned_by` lấy từ token và cột `ticket_status_log.changed_by` là `NOT NULL`; xác thực chưa làm (TD-18).
- **Quyết định:** TẠM THỜI. Service nhận `nguoiThucHien` từ `req.user.id` (chưa có thì 0). Khi thêm đăng nhập, chỉ middleware đặt `req.user`; service và hợp đồng không đổi.
- **Lý do:** Tách rõ phần nghiệp vụ khỏi cơ chế xác thực để phân công kiểm thử được trước.
- **Ảnh hưởng:** `src/routes/ticket.routes.js` (hàm `assign`), `src/services/ticket.service.js`.
- **Trạng thái:** Đã viết và kiểm thử. Đã chạy khóa dòng `FOR UPDATE` trên PostgreSQL 16 với hai phiên song song: phiên thứ hai đợi, rồi thấy phiếu `DA_PHAN_CONG` nên bị từ chối (409), log chỉ có một dòng. Test đồng thời qua HTTP (TC-11) vẫn chưa làm (TD-08).

## 8. Điểm còn mở

1. PDF BT1 chưa cập nhật Hình 2 (TD-01), DDL (TD-03), các làm rõ ở Mục 4 và mã phiếu (TD-14); `docs/wireframe.png` còn mã phiếu cũ.
2. Số phiên bản SRS (1.2) và hợp đồng API (1.1) đang lệch; QT-13 (không xóa vật lý) chưa có chỗ truy vết trong bảng.
3. Test đồng thời TC-11 chưa làm (TD-08).
4. Giao diện mới có một màn hình (TD-20); thực thể CRUD thứ hai (đề BT2 yêu cầu từ hai thực thể) chưa làm; chờ hướng dẫn của giảng viên cho các buổi sau.
