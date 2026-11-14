# Ví dụ API chạy thật

Sinh tự động bởi `scripts/sinh-vi-du-api.js` ngày 2026-11-14T01:13:59.120Z trên http://localhost:3000. Mọi phản hồi dưới đây là kết quả thật, không viết tay.

### 1. Kiểm tra sức khỏe (công khai)

```http
GET /health
```

Phản hồi: **200**

```json
{
  "status": "ok",
  "db": "ok"
}
```

### 2. Lỗi: gọi API khi chưa đăng nhập

```http
GET /api/technicians?limit=1
```

Phản hồi: **401**

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."
  }
}
```

### 3. Lỗi: đăng nhập sai mật khẩu

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "sai-mat-khau"
}
```

Phản hồi: **401**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Tên đăng nhập hoặc mật khẩu không đúng."
  }
}
```

### 4. Lỗi: đăng nhập tên không tồn tại (cùng thông điệp với sai mật khẩu)

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "khong_co_ai",
  "password": "sai-mat-khau"
}
```

Phản hồi: **401**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Tên đăng nhập hoặc mật khẩu không đúng."
  }
}
```

### 5. Đăng nhập (quản trị)

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Mekong@2026"
}
```

Phản hồi: **200**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs…(rút gọn)",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "user_id": 1,
    "username": "admin",
    "full_name": "Quản trị hệ thống",
    "role": "QUAN_TRI",
    "center_id": null
  }
}
```

### 6. Lỗi: quản lý trung tâm 1 xem kỹ thuật viên của trung tâm 2 (403)

```http
GET /api/technicians?center_id=2
Authorization: Bearer <token>
```

Phản hồi: **403**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Bạn không có quyền truy cập dữ liệu của trung tâm này.",
    "field": "center_id"
  }
}
```

### 7. Danh sách kỹ thuật viên (lọc theo trung tâm, phân trang)

```http
GET /api/technicians?limit=2
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "items": [
    {
      "technician_id": 1,
      "full_name": "Phạm Minh Quyên",
      "center_id": 1,
      "level": "TRUNG_CAP",
      "is_active": false
    },
    {
      "technician_id": 2,
      "full_name": "Trần Hoài Giang",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    }
  ],
  "limit": 2,
  "offset": 0
}
```

### 8. Chi tiết một kỹ thuật viên (kèm kỹ năng)

```http
GET /api/technicians/1
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "technician_id": 1,
  "full_name": "Phạm Minh Quyên",
  "center_id": 1,
  "level": "TRUNG_CAP",
  "is_active": false,
  "skills": [
    {
      "issue_category": "KHAC",
      "proficiency": 3
    },
    {
      "issue_category": "NUOC_VAO",
      "proficiency": 3
    },
    {
      "issue_category": "PHAN_MEM",
      "proficiency": 5
    }
  ]
}
```

### 9. Tạo kỹ thuật viên

```http
POST /api/technicians
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Nguyễn Văn Thử Nghiệm",
  "center_id": 1,
  "level": "TRUNG_CAP"
}
```

Phản hồi: **201**

```json
{
  "technician_id": 39,
  "full_name": "Nguyễn Văn Thử Nghiệm",
  "center_id": 1,
  "level": "TRUNG_CAP",
  "is_active": true
}
```

### 10. Sửa toàn bộ kỹ thuật viên (PUT)

```http
PUT /api/technicians/39
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Nguyễn Văn Thử Nghiệm",
  "center_id": 1,
  "level": "CAO_CAP",
  "is_active": true
}
```

Phản hồi: **200**

```json
{
  "technician_id": 39,
  "full_name": "Nguyễn Văn Thử Nghiệm",
  "center_id": 1,
  "level": "CAO_CAP",
  "is_active": true
}
```

### 11. Ngừng hoạt động kỹ thuật viên (xóa mềm)

```http
DELETE /api/technicians/39
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "technician_id": 39,
  "full_name": "Nguyễn Văn Thử Nghiệm",
  "center_id": 1,
  "level": "CAO_CAP",
  "is_active": false
}
```

### 12. Lỗi: tạo kỹ thuật viên sai dữ liệu

```http
POST /api/technicians
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "",
  "level": "GIOI"
}
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: full_name, center_id, level.",
    "field": "full_name",
    "fields": [
      {
        "field": "full_name",
        "reason": "không được để trống"
      },
      {
        "field": "center_id",
        "reason": "bắt buộc"
      },
      {
        "field": "level",
        "reason": "phải là một trong SO_CAP, TRUNG_CAP, CAO_CAP"
      }
    ]
  }
}
```

### 13. Lỗi: kỹ thuật viên không tồn tại

```http
GET /api/technicians/999999999
Authorization: Bearer <token>
```

Phản hồi: **404**

```json
{
  "error": {
    "code": "TECHNICIAN_NOT_FOUND",
    "message": "Không tìm thấy kỹ thuật viên có mã 999999999.",
    "field": "technician_id"
  }
}
```

### 14. Danh sách phiếu chưa phân công

```http
GET /api/tickets/unassigned?limit=2
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "page": 1,
  "limit": 2,
  "total": 12,
  "items": [
    {
      "ticket_id": 6924,
      "ticket_code": "BH-006924/2026",
      "customer_name": "Lê Văn Linh",
      "customer_phone": "0364862956",
      "device_name": "Samsung Pro Max 14",
      "issue_category": "PHAN_MEM",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "center_id": 5,
      "technician_id": null,
      "technician_name": null,
      "received_at": "2026-06-29T08:00:00+07:00",
      "due_date": "2026-07-02T08:00:00+07:00"
    },
    {
      "ticket_id": 212,
      "ticket_code": "BH-000212/2026",
      "customer_name": "Ly Duc Khoa",
      "customer_phone": "0912639956",
      "device_name": "realme Tab S6",
      "issue_category": "NUOC_VAO",
      "priority": "CAO",
      "status": "MOI",
      "center_id": 6,
      "technician_id": null,
      "technician_name": null,
      "received_at": "2026-07-17T12:30:00+07:00",
      "due_date": "2026-07-18T12:30:00+07:00"
    }
  ]
}
```

### 15. Chi tiết một phiếu

```http
GET /api/tickets/6924
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "ticket_id": 6924,
  "ticket_code": "BH-006924/2026",
  "customer_name": "Lê Văn Linh",
  "customer_phone": "0364862956",
  "device_name": "Samsung Pro Max 14",
  "issue_category": "PHAN_MEM",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "center_id": 5,
  "technician_id": null,
  "technician_name": null,
  "received_at": "2026-06-29T08:00:00+07:00",
  "due_date": "2026-07-02T08:00:00+07:00"
}
```

### 16. Kỹ thuật viên đủ điều kiện của phiếu

```http
GET /api/tickets/6924/eligible-technicians
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "ticket_id": 6924,
  "issue_category": "PHAN_MEM",
  "technicians": [
    {
      "technician_id": 17,
      "full_name": "Võ Đức Phương",
      "level": "CAO_CAP",
      "proficiency": 4,
      "open_tickets": 22
    },
    {
      "technician_id": 26,
      "full_name": "Phạm Bảo Thắng",
      "level": "TRUNG_CAP",
      "proficiency": 5,
      "open_tickets": 22
    },
    {
      "technician_id": 7,
      "full_name": "Trần Xuân Nam",
      "level": "SO_CAP",
      "proficiency": 3,
      "open_tickets": 24
    }
  ]
}
```

### 17. Danh sách kỹ thuật viên (tối đa 100, để chọn người không đủ điều kiện)

```http
GET /api/technicians?limit=100
Authorization: Bearer <token>
```

Phản hồi: **200**

```json
{
  "items": [
    {
      "technician_id": 1,
      "full_name": "Phạm Minh Quyên",
      "center_id": 1,
      "level": "TRUNG_CAP",
      "is_active": false
    },
    {
      "technician_id": 2,
      "full_name": "Trần Hoài Giang",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 3,
      "full_name": "Đặng Quang Oanh",
      "center_id": 3,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 4,
      "full_name": "Phan Thị Yến",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 5,
      "full_name": "Đặng Anh Quân",
      "center_id": 2,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 6,
      "full_name": "Đặng Bảo Duy",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 7,
      "full_name": "Trần Xuân Nam",
      "center_id": 5,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 8,
      "full_name": "Phạm Hữu Huy",
      "center_id": 2,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 9,
      "full_name": "Lý Đức Lâm",
      "center_id": 5,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 10,
      "full_name": "Đỗ Văn Thắng",
      "center_id": 6,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 11,
      "full_name": "Bùi Hữu Thảo",
      "center_id": 6,
      "level": "CAO_CAP",
      "is_active": false
    },
    {
      "technician_id": 12,
      "full_name": "Đỗ Tuấn Oanh",
      "center_id": 2,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 13,
      "full_name": "Phan Kim Hải",
      "center_id": 6,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 14,
      "full_name": "Đỗ Thị Ngân",
      "center_id": 4,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 15,
      "full_name": "Phạm Kim Tâm",
      "center_id": 4,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 16,
      "full_name": "Đỗ Tuấn Trang",
      "center_id": 4,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 17,
      "full_name": "Võ Đức Phương",
      "center_id": 5,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 18,
      "full_name": "Vũ Minh Dung",
      "center_id": 6,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 19,
      "full_name": "Đỗ Đức Giang",
      "center_id": 3,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 20,
      "full_name": "Trần Văn Thảo",
      "center_id": 1,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 21,
      "full_name": "Phan Xuân Tuyết",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 22,
      "full_name": "Đỗ Thị Phong",
      "center_id": 3,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 23,
      "full_name": "Phạm Quang Hoa",
      "center_id": 6,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 24,
      "full_name": "Đỗ Hoài Tuyết",
      "center_id": 5,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 25,
      "full_name": "Phan Gia Cường",
      "center_id": 2,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 26,
      "full_name": "Phạm Bảo Thắng",
      "center_id": 5,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 27,
      "full_name": "Phan Kim Nhung",
      "center_id": 3,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 28,
      "full_name": "Lý Văn Trang",
      "center_id": 6,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 29,
      "full_name": "Vũ Đức Thắng",
      "center_id": 2,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 30,
      "full_name": "Nguyễn Thị Hạnh",
      "center_id": 2,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 31,
      "full_name": "Đỗ Văn Tâm",
      "center_id": 5,
      "level": "SO_CAP",
      "is_active": false
    },
    {
      "technician_id": 32,
      "full_name": "Phạm Văn Hạnh",
      "center_id": 3,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 33,
      "full_name": "Phan Kim Hạnh",
      "center_id": 1,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 34,
      "full_name": "Trần Văn Dung",
      "center_id": 4,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 35,
      "full_name": "Phạm Minh Hà",
      "center_id": 5,
      "level": "SO_CAP",
      "is_active": true
    },
    {
      "technician_id": 36,
      "full_name": "Lý Xuân Trung",
      "center_id": 3,
      "level": "CAO_CAP",
      "is_active": true
    },
    {
      "technician_id": 37,
      "full_name": "Huỳnh Gia Trung",
      "center_id": 3,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 38,
      "full_name": "Phan Ngọc Lâm",
      "center_id": 3,
      "level": "TRUNG_CAP",
      "is_active": true
    },
    {
      "technician_id": 39,
      "full_name": "Nguyễn Văn Thử Nghiệm",
      "center_id": 1,
      "level": "CAO_CAP",
      "is_active": false
    }
  ],
  "limit": 100,
  "offset": 0
}
```

### 18. Lỗi: phân công kỹ thuật viên không đủ điều kiện

```http
POST /api/tickets/6924/assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "technician_id": 1
}
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "TECH_NOT_ELIGIBLE",
    "message": "Kỹ thuật viên đã ngừng hoạt động.",
    "field": "technician_id"
  }
}
```

### 19. Lỗi: phân công thiếu technician_id

```http
POST /api/tickets/6924/assignment
Authorization: Bearer <token>
Content-Type: application/json

{}
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: technician_id.",
    "field": "technician_id",
    "fields": [
      {
        "field": "technician_id",
        "reason": "bắt buộc"
      }
    ]
  }
}
```

### 20. Phân công kỹ thuật viên cho phiếu

```http
POST /api/tickets/6924/assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "technician_id": 17
}
```

Phản hồi: **201**

```json
{
  "ticket_id": 6924,
  "ticket_code": "BH-006924/2026",
  "status": "DA_PHAN_CONG",
  "technician_id": 17,
  "assigned_at": "2026-11-14T08:13:58+07:00",
  "assigned_by": 1
}
```

### 21. Lỗi: phân công lần hai cho phiếu đã có người

```http
POST /api/tickets/6924/assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "technician_id": 17
}
```

Phản hồi: **409**

```json
{
  "error": {
    "code": "TICKET_ALREADY_ASSIGNED",
    "message": "Phiếu đã có kỹ thuật viên hoặc không còn ở trạng thái MOI; hãy tải lại để xem người đang phụ trách.",
    "field": "ticket_id",
    "details": {
      "status": "DA_PHAN_CONG",
      "technician_id": 17
    }
  }
}
```

### 22. Lỗi: ngừng hoạt động kỹ thuật viên còn phiếu mở

```http
DELETE /api/technicians/17
Authorization: Bearer <token>
```

Phản hồi: **409**

```json
{
  "error": {
    "code": "TECHNICIAN_HAS_OPEN_TICKETS",
    "message": "Kỹ thuật viên đang giữ 23 phiếu chưa hoàn tất; hãy đổi người xử lý trước khi ngừng hoạt động.",
    "field": "is_active",
    "details": {
      "so_phieu": 23
    }
  }
}
```

### 23. Tiếp nhận phiếu mới

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "Khách Thử Nghiệm",
  "customer_phone": "0900000001",
  "device_name": "Điện thoại thử nghiệm",
  "issue_category": "PIN",
  "center_id": 5
}
```

Phản hồi: **201**

```json
{
  "ticket_id": 7801,
  "ticket_code": "BH-007801/2026",
  "customer_name": "Khách Thử Nghiệm",
  "customer_phone": "0900000001",
  "device_name": "Điện thoại thử nghiệm",
  "issue_category": "PIN",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "center_id": 5,
  "technician_id": null,
  "technician_name": null,
  "received_at": "2026-11-14T08:13:59+07:00",
  "due_date": "2026-11-18T08:13:59+07:00"
}
```

### 24. Sửa phiếu chưa phân công (PATCH)

```http
PATCH /api/tickets/7801
Authorization: Bearer <token>
Content-Type: application/json

{
  "priority": "CAO",
  "device_name": "Điện thoại thử nghiệm (đã sửa)"
}
```

Phản hồi: **200**

```json
{
  "ticket_id": 7801,
  "ticket_code": "BH-007801/2026",
  "customer_name": "Khách Thử Nghiệm",
  "customer_phone": "0900000001",
  "device_name": "Điện thoại thử nghiệm (đã sửa)",
  "issue_category": "PIN",
  "priority": "CAO",
  "status": "MOI",
  "center_id": 5,
  "technician_id": null,
  "technician_name": null,
  "received_at": "2026-11-14T08:13:59+07:00",
  "due_date": "2026-11-16T08:13:59+07:00"
}
```

### 25. Hủy phiếu (xóa mềm)

```http
DELETE /api/tickets/7801
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Khách đổi ý"
}
```

Phản hồi: **200**

```json
{
  "ticket_id": 7801,
  "ticket_code": "BH-007801/2026",
  "customer_name": "Khách Thử Nghiệm",
  "customer_phone": "0900000001",
  "device_name": "Điện thoại thử nghiệm (đã sửa)",
  "issue_category": "PIN",
  "priority": "CAO",
  "status": "DA_HUY",
  "center_id": 5,
  "technician_id": null,
  "technician_name": null,
  "received_at": "2026-11-14T08:13:59+07:00",
  "due_date": "2026-11-16T08:13:59+07:00"
}
```

### 26. Lỗi: phiếu không tồn tại

```http
GET /api/tickets/999999999
Authorization: Bearer <token>
```

Phản hồi: **404**

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Không tìm thấy phiếu có mã 999999999.",
    "field": "ticket_id"
  }
}
```

### 27. Lỗi: tiếp nhận phiếu thiếu dữ liệu

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{}
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: customer_name, device_name, customer_phone, issue_category, center_id.",
    "field": "customer_name",
    "fields": [
      {
        "field": "customer_name",
        "reason": "bắt buộc"
      },
      {
        "field": "device_name",
        "reason": "bắt buộc"
      },
      {
        "field": "customer_phone",
        "reason": "bắt buộc"
      },
      {
        "field": "issue_category",
        "reason": "bắt buộc"
      },
      {
        "field": "center_id",
        "reason": "bắt buộc"
      }
    ]
  }
}
```

### 28. Lỗi: JSON không hợp lệ

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{bad json
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nội dung gửi lên không phải JSON hợp lệ.",
    "field": "body"
  }
}
```

### 29. Chèn SQL qua số điện thoại

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "A",
  "customer_phone": "' OR '1'='1",
  "device_name": "B",
  "issue_category": "PIN",
  "center_id": 5
}
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: customer_phone.",
    "field": "customer_phone",
    "fields": [
      {
        "field": "customer_phone",
        "reason": "phải là số điện thoại 10 chữ số bắt đầu bằng 0 (hoặc +84)"
      }
    ]
  }
}
```

### 30. Chèn SQL qua tham số center_id (kỹ thuật viên)

```http
GET /api/technicians?center_id=1'%20OR%20'1'%3D'1
Authorization: Bearer <token>
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: center_id.",
    "field": "center_id",
    "fields": [
      {
        "field": "center_id",
        "reason": "phải là số nguyên dương"
      }
    ]
  }
}
```

### 31. Chèn SQL qua tham số center_id (phiếu)

```http
GET /api/tickets/unassigned?center_id=1'%20OR%20'1'%3D'1
Authorization: Bearer <token>
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: center_id.",
    "field": "center_id",
    "fields": [
      {
        "field": "center_id",
        "reason": "phải là số nguyên dương"
      }
    ]
  }
}
```

### 32. Chèn SQL qua mã trong đường dẫn

```http
GET /api/tickets/1%20OR%201%3D1
Authorization: Bearer <token>
```

Phản hồi: **400**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ ở trường: id.",
    "field": "id",
    "fields": [
      {
        "field": "id",
        "reason": "phải là số nguyên dương"
      }
    ]
  }
}
```
