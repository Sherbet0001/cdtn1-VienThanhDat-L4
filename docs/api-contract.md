# API contract – L4: Phân công kỹ thuật viên và lịch hẹn

Sinh viên: Viên Thành Đạt · MSSV 2374802010107 · Track SE · Phiên bản 1.1 (BT1) Định dạng: JSON, UTF-8. Thời gian theo ISO 8601 múi giờ +07:00. Tiền tố đường dẫn: /api. Xác thực nhân viên (quản lý, kỹ thuật viên): header Authorization: Bearer <token>; vai trò và trung tâm lấy từ token. Khách hàng không dùng token mà gửi mã phiếu + số điện thoại trong body (dùng POST để số điện thoại không nằm trên URL).

### 1. Danh sách endpoint

| # | Phương thức | Đường dẫn | Mục đích | Vai trò | FR | US | UC | MoSCoW |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GET | /api/tickets/unassigned | Danh sách phiếu MỚI chưa phân công | Quản lý | FR1 | US1 | UC1 | MUST |
| 2 | GET | /api/tickets/{ticketId}/eligible-technicians | Kỹ thuật viên đủ điều kiện + khối lượng | Quản lý | FR2 | US2 | UC2 | SHOULD |
| 3 | POST | /api/tickets/{ticketId}/assignment | Gán kỹ thuật viên cho phiếu | Quản lý | FR3, FR4 | US3 | UC3 | MUST |
| 4 | PUT | /api/tickets/{ticketId}/assignment | Đổi kỹ thuật viên kèm lý do | Quản lý | FR5 | US4 | UC4 | SHOULD |
| 5 | GET | /api/technicians/me/tasks | Phiếu và lịch hẹn được giao | Kỹ thuật viên | FR6 | US5 | UC5 | SHOULD |
| 6 | POST | /api/appointments | Đặt lịch hẹn giao – nhận máy | Khách | FR7, FR8 | US6 | UC6 | MUST |
| 7 | POST | /api/appointments/available-slots | Gợi ý khung giờ trống | Khách | FR9 | US7 | UC7 | SHOULD |

Giá trị enum dùng ASCII không dấu, đối chiếu với tên trong SRS:

| Trong SRS | Trong API |
| --- | --- |
| MỚI · ĐÃ PHÂN CÔNG · ĐANG XỬ LÝ · CHỜ LINH KIỆN · HOÀN TẬT · ĐÃ ĐÓNG · ĐÃ HỦY | MOI · DA_PHAN_CONG · DANG_XU_LY · CHO_LINH_KIEN · HOAN_TAT · DA_DONG · DA_HUY |
| Giao máy · Nhận máy | GIAO_MAY · NHAN_MAY |
| ĐÃ XÁC NHẬN (lịch hẹn) | DA_XAC_NHAN |
| Cao · Trung bình · Thấp | CAO · TRUNG_BINH · THAP |

Định dạng lỗi chung:

```json
{ "error": { "code": "TECH_NOT_ELIGIBLE", "message": "Kỹ thuật viên chưa đạt mức thành thạo ≥ 3 với nhóm sự cố MAN_HINH.", "field": "technician_id" } }
```

### 2. Chi tiết từng endpoint

#### 2.1 GET /api/tickets/unassigned (FR1)

Query: page (mặc định 1, ≥ 1), limit (mặc định 20, 1–100). Sắp theo due_date tăng dần. Chỉ trả phiếu thuộc trung tâm của quản lý (QT-14).

Response 200:

```json
{
  "page": 1, "limit": 20, "total": 12,
  "items": [
    {
      "ticket_id": 1287, "ticket_code": "BH001287/2026",
      "customer_name": "Nguyễn Văn An", "customer_phone": "0901234567",
      "device_name": "iPhone 14 128GB", "issue_category": "MAN_HINH",
      "priority": "CAO", "status": "MOI",
      "received_at": "2026-10-05T10:30:00+07:00", "due_date": "2026-10-06T10:30:00+07:00"
    }
  ]
}
```

| Mã | Khi nào |
| --- | --- |
| 200 | Thành công (kể cả danh sách rỗng, items: [], total: 0) |
| 400 | page hoặc limit sai kiểu/ngoài dải |
| 401 | Thiếu hoặc hết hạn token |
| 403 | Vai trò không phải quản lý |

#### 2.2 GET /api/tickets/{ticketId}/eligible-technicians (FR2)

Path: ticketId (số nguyên dương). Trả kỹ thuật viên cùng trung tâm, is_active = true, proficiency ≥ 3 với nhóm sự cố của phiếu, sắp tăng dần theo open_tickets.

Response 200:

```json
{
  "ticket_id": 1287, "issue_category": "MAN_HINH",
  "technicians": [
    { "technician_id": 12, "full_name": "Trần Minh Khoa", "level": "CAO_CAP", "proficiency": 4, "open_tickets": 5 },
    { "technician_id": 15, "full_name": "Lê Thị Hoa", "level": "TRUNG_CAP", "proficiency": 3, "open_tickets": 9 }
  ]
}
```

| Mã | Khi nào |
| --- | --- |
| 200 | Thành công; technicians: [] nếu không ai đủ điều kiện (luồng 3a của UC3) |
| 400 | ticketId không phải số nguyên dương |
| 401, 403 | Chưa đăng nhập; không phải quản lý hoặc phiếu thuộc trung tâm khác |
| 404 | Không có phiếu ticketId |

#### 2.3 POST /api/tickets/{ticketId}/assignment (FR3, FR4)

Request:

```json
{ "technician_id": 12 }
```

Response 201:

```json
{
  "ticket_id": 1287, "ticket_code": "BH001287/2026",
  "status": "DA_PHAN_CONG", "technician_id": 12,
  "assigned_at": "2026-10-05T11:02:15+07:00", "assigned_by": 3
}
```

| Mã | Mã lỗi | Khi nào |
| --- | --- | --- |
| 201 | – | Gán thành công, đã ghi ticket_status_log |
| 400 | VALIDATION_ERROR / TECH_NOT_ELIGIBLE | Thiếu technician_id, sai kiểu; hoặc khác trung tâm, thành thạo < 3, không hoạt động (QT-08) |
| 401, 403 | – | Chưa đăng nhập; không phải quản lý trung tâm của phiếu |
| 404 | TICKET_NOT_FOUND / TECHNICIAN_NOT_FOUND | Không có phiếu hoặc kỹ thuật viên |
| 409 | TICKET_ALREADY_ASSIGNED | Phiếu đã có kỹ thuật viên hoặc không còn ở trạng thái MOI (QT-06, QT-07) |
| 500 | INTERNAL_ERROR | Lỗi hệ thống; giao dịch được hoàn tác |

#### 2.4 PUT /api/tickets/{ticketId}/assignment (FR5)

Request:

```json
{ "technician_id": 15, "reason": "Kỹ thuật viên cũ nghỉ phép đột xuất 3 ngày" }
```

Response 200:

```json
{
  "ticket_id": 1287, "previous_technician_id": 12, "technician_id": 15,
  "reason": "Kỹ thuật viên cũ nghỉ phép đột xuất 3 ngày",
  "changed_at": "2026-10-06T08:15:00+07:00", "changed_by": 3
}
```

| Mã | Mã lỗi | Khi nào |
| --- | --- | --- |
| 200 | – | Đổi thành công, đã ghi lý do và log |
| 400 | VALIDATION_ERROR / TECH_NOT_ELIGIBLE | Thiếu hoặc quá ngắn reason; kỹ thuật viên mới không đủ điều kiện; trùng kỹ thuật viên hiện tại |
| 401, 403 | – | Chưa đăng nhập; sai vai trò/trung tâm |
| 404 | TICKET_NOT_FOUND / TECHNICIAN_NOT_FOUND | Không tồn tại |
| 409 | TICKET_NOT_REASSIGNABLE | Phiếu chưa có kỹ thuật viên, hoặc ở HOAN_TAT / DA_DONG / DA_HUY |

#### 2.5 GET /api/technicians/me/tasks (FR6)

Query: from, to (ngày YYYY-MM-DD, tùy chọn). Chỉ trả phiếu và lịch hẹn của kỹ thuật viên đang đăng nhập; sắp theo due_date tăng dần. due_soon = true khi còn dưới 24 giờ đến hạn.

Response 200:

```json
{
  "technician_id": 12,
  "tickets": [
    {
      "ticket_id": 1287, "ticket_code": "BH001287/2026", "status": "DA_PHAN_CONG",
      "issue_category": "MAN_HINH", "customer_phone": "090****567",
      "due_date": "2026-10-06T10:30:00+07:00", "due_soon": true,
      "appointments": [
        { "appointment_id": 501, "type": "GIAO_MAY", "start_at": "2026-10-05T14:00:00+07:00", "end_at": "2026-10-05T14:30:00+07:00" }
      ]
    }
  ]
}
```

| Mã | Khi nào |
| --- | --- |
| 200 | Thành công (có thể rỗng) |
| 400 | from/to sai định dạng hoặc from > to |
| 401, 403 | Chưa đăng nhập; không phải kỹ thuật viên |

#### 2.6 POST /api/appointments (FR7, FR8)

Request:

```json
{ "ticket_code": "BH001287/2026", "phone": "0901234567", "type": "GIAO_MAY", "start_at": "2026-10-12T09:00:00+07:00" }
```

Response 201:

```json
{
  "appointment_id": 501, "appointment_code": "LH000501/2026",
  "ticket_code": "BH001287/2026", "technician_name": "Trần Minh Khoa",
  "type": "GIAO_MAY", "status": "DA_XAC_NHAN",
  "start_at": "2026-10-12T09:00:00+07:00", "end_at": "2026-10-12T09:30:00+07:00"
}
```

| Mã | Mã lỗi | Khi nào |
| --- | --- | --- |
| 201 | – | Đặt lịch thành công |
| 400 | VALIDATION_ERROR / OUTSIDE_WORKING_HOURS | Sai định dạng; khung giờ ở quá khứ, Chủ nhật hoặc ngoài 08:00–17:30; start_at không nằm trên mốc :00/:30 hoặc bắt đầu sau 17:00 (BR-L4-01) |
| 404 | TICKET_NOT_FOUND | Mã phiếu và số điện thoại không khớp (cố ý dùng chung một thông báo để không lộ phiếu có tồn tại) |
| 409 | SLOT_CONFLICT / TICKET_NOT_BOOKABLE | Kỹ thuật viên đã có lịch chồng khung giờ; hoặc phiếu chưa có kỹ thuật viên, ĐÃ ĐÓNG/ĐÃ HỦY, hoặc loại hẹn không hợp lệ với trạng thái phiếu (BR-L4-02, 03) |
| 500 | INTERNAL_ERROR | Lỗi hệ thống; không tạo lịch hẹn |

#### 2.7 POST /api/appointments/available-slots (FR9)

Request:

```json
{ "ticket_code": "BH001287/2026", "phone": "0901234567", "type": "GIAO_MAY", "from_date": "2026-10-12", "limit": 3 }
```

limit: 3–10, mặc định 3. Trả các khung trống gần nhất tính từ from_date, trong 7 ngày.

Response 200:

```json
{
  "ticket_code": "BH001287/2026",
  "slots": [
    { "start_at": "2026-10-12T09:30:00+07:00", "end_at": "2026-10-12T10:00:00+07:00" },
    { "start_at": "2026-10-12T10:00:00+07:00", "end_at": "2026-10-12T10:30:00+07:00" },
    { "start_at": "2026-10-12T13:30:00+07:00", "end_at": "2026-10-12T14:00:00+07:00" }
  ]
}
```

| Mã | Khi nào |
| --- | --- |
| 200 | Thành công; slots: [] nếu hết khung trống trong 7 ngày (luồng 5b của UC6) |
| 400 | Thiếu trường, from_date ở quá khứ, limit ngoài 3–10 |
| 404 | Mã phiếu và số điện thoại không khớp |
| 409 | Phiếu không đặt lịch được (như TICKET_NOT_BOOKABLE) |

### 3. Quy tắc validation theo trường

| Trường | Endpoint | Bắt buộc | Kiểu | Quy tắc |
| --- | --- | --- | --- | --- |
| ticketId (path) | 2, 3, 4 | Có | số nguyên | > 0 |
| technician_id | 3, 4 | Có | số nguyên | > 0, tồn tại, cùng trung tâm, đang hoạt động, proficiency ≥ 3 (QT-08) |
| reason | 4 | Có | chuỗi | 10–255 ký tự, không toàn khoảng trắng; khác kỹ thuật viên hiện tại (QT-07) |
| page | 1 | Không | số nguyên | ≥ 1, mặc định 1 |
| limit | 1 | Không | số nguyên | 1–100, mặc định 20 |
| from, to | 5 | Không | ngày YYYY-MM-DD | from ≤ to |
| ticket_code | 6, 7 | Có | chuỗi | Đúng dạng BH + 6 chữ số + / + 4 chữ số; tồn tại |
| phone | 6, 7 | Có | chuỗi | Chuẩn hóa về 10 chữ số bắt đầu bằng 0 (QT-02); phải khớp phiếu |
| type | 6, 7 | Có | chuỗi | GIAO_MAY hoặc NHAN_MAY |
| start_at | 6 | Có | ISO 8601 | Mốc :00/:30; không ở quá khứ; thứ Hai–thứ Bảy; từ 08:00 đến 17:00 (kết thúc muộn nhất 17:30); không chồng lịch |
| from_date | 7 | Có | ngày | Không ở quá khứ |
| limit | 7 | Không | số nguyên | 3–10, mặc định 3 |

### 4. Mô hình dữ liệu

DDL đầy đủ nằm ở `docs/schema.sql`. Chống trùng lịch (BR-L4-02, NFR3) dùng ràng buộc `EXCLUDE USING gist` trên (technician_id, khoảng thời gian); lỗi CSDL 23P01 được ánh xạ sang HTTP 409 `SLOT_CONFLICT`.
