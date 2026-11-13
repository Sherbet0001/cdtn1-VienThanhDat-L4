# API Reference — Smart CRM Mekong Mobile, flow L4 "Technician assignment" (v1.0)

REST API over HTTP, JSON bodies, `snake_case` field names. This document covers **every endpoint that exists in v1.0**. All examples were captured from a running system by `scripts/sinh-vi-du-api.js`; the unabridged output is in [`api-vi-du-chay-that.md`](api-vi-du-chay-that.md) (screenshot: `screenshots/api-chay-that.png`).

## Conventions

| Topic | Rule |
|---|---|
| Base URL | `http://localhost:3000` (set by `API_PORT`, see the [Deployment Guide](deployment-guide.md)) |
| Authentication | **None in v1.0.** Every endpoint is open; the system has no login or roles (TD-18, TD-28). Do not expose it to the public internet. Because there is no user, `assigned_by` in assignment results is always `0`. |
| Content type | Requests with a body use `Content-Type: application/json` (max 256 KB). |
| Errors | One envelope for all errors: `{"error": {"code", "message", "field?", "fields?", "details?"}}`. `fields` lists every invalid field as `{field, reason}`. 5xx responses carry only a generic message and a `requestId` for log lookup. |
| Dates | ISO 8601 with the Vietnam offset, e.g. `2026-11-13T11:20:18+07:00`. |
| Pagination | Technicians: `limit` (1–100, default 20) and `offset` (default 0). Tickets: `page` (from 1) and `limit` (1–100, default 20). |
| Customer phone | `customer_phone` is returned in full (no roles exist to apply the masking rule QT-15). Logs always mask it. |

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed input: wrong type, missing field, bad id, invalid JSON |
| `TECH_NOT_ELIGIBLE` | 400 | Chosen technician breaks the assignment rules (QT-08) |
| `TECHNICIAN_NOT_FOUND` | 404 | No technician with that id |
| `TICKET_NOT_FOUND` | 404 | No ticket with that id |
| `TICKET_ALREADY_ASSIGNED` | 409 | Ticket already has a technician or is no longer `MOI` |
| `TICKET_NOT_EDITABLE` | 409 | Only tickets in `MOI` can be edited |
| `TICKET_NOT_CANCELLABLE` | 409 | Only `MOI` or `DA_PHAN_CONG` tickets can be cancelled |
| `TECHNICIAN_HAS_OPEN_TICKETS` | 409 | Cannot deactivate a technician who still holds unfinished tickets |
| `PAYLOAD_TOO_LARGE` | 413 | Body larger than 256 KB |
| `INTERNAL_ERROR` | 500 | Unexpected server error (details only in the logs) |
| `SERVICE_UNAVAILABLE` | 503 | Database not reachable |

### Enumerations

- `level`: `SO_CAP`, `TRUNG_CAP`, `CAO_CAP`
- `issue_category`: `MAN_HINH`, `PIN`, `SAC`, `PHAN_MEM`, `NUOC_VAO`, `KHAC`
- `priority`: `CAO`, `TRUNG_BINH`, `THAP`
- `status`: `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY`

## Endpoint summary

| # | Method and path | Purpose |
|---|---|---|
| 1 | `GET /health` | Liveness and database check |
| 2 | `GET /api/technicians` | List technicians |
| 3 | `GET /api/technicians/{id}` | One technician with skills |
| 4 | `POST /api/technicians` | Create a technician |
| 5 | `PUT /api/technicians/{id}` | Replace a technician |
| 6 | `DELETE /api/technicians/{id}` | Deactivate (soft delete) |
| 7 | `GET /api/tickets/unassigned` | List unassigned tickets |
| 8 | `GET /api/tickets/{id}` | One ticket |
| 9 | `GET /api/tickets/{id}/eligible-technicians` | Technicians allowed to take a ticket |
| 10 | `POST /api/tickets/{id}/assignment` | Assign a technician to a ticket |
| 11 | `POST /api/tickets` | Create a ticket |
| 12 | `PATCH /api/tickets/{id}` | Edit an unassigned ticket |
| 13 | `DELETE /api/tickets/{id}` | Cancel a ticket (soft delete) |

Planned in the design contract ([`api-contract.md`](api-contract.md)) but **not implemented in v1.0**: reassignment (FR5), the technician task list (FR6) and appointments (FR7–FR9).

---

## 1. GET /health

1. **Purpose:** tells Docker and operators whether the API and its database are up.
2. **Authentication:** none.
3. **Parameters:** none.
4. **Request example:** `curl.exe -s http://localhost:3000/health`
5. **Success response (200):**
   ```json
   { "status": "ok", "db": "ok" }
   ```
6. **Errors:** 503 `{"status":"degraded","db":"không kết nối được"}` when the database is down.
7. **Notes:** used by the container health check.

## 2. GET /api/technicians

1. **Purpose:** list technicians, optionally filtered.
2. **Authentication:** none.
3. **Query parameters:** `center_id` (positive integer), `is_active` (`true`/`false`), `limit` (1–100, default 20), `offset` (≥ 0, default 0).
4. **Request example:** `GET /api/technicians?limit=2`
5. **Success response (200):**
   ```json
   {
     "items": [
       { "technician_id": 1, "full_name": "Phạm Minh Quyên", "center_id": 1, "level": "TRUNG_CAP", "is_active": false },
       { "technician_id": 2, "full_name": "Trần Hoài Giang", "center_id": 4, "level": "TRUNG_CAP", "is_active": true }
     ],
     "limit": 2,
     "offset": 0
   }
   ```
6. **Errors:** 400 `VALIDATION_ERROR` for an invalid parameter, for example `center_id=1' OR '1'='1` returns `{"error":{"code":"VALIDATION_ERROR","message":"Dữ liệu không hợp lệ ở trường: center_id.","field":"center_id", ...}}`.
7. **Notes:** this list has no `total`; page with `offset` until fewer than `limit` items come back.

## 3. GET /api/technicians/{id}

1. **Purpose:** one technician with their skills.
2. **Authentication:** none.
3. **Path parameter:** `id` — positive integer.
4. **Request example:** `GET /api/technicians/1`
5. **Success response (200):**
   ```json
   {
     "technician_id": 1,
     "full_name": "Phạm Minh Quyên",
     "center_id": 1,
     "level": "TRUNG_CAP",
     "is_active": false,
     "skills": [
       { "issue_category": "KHAC", "proficiency": 3 },
       { "issue_category": "NUOC_VAO", "proficiency": 3 },
       { "issue_category": "PHAN_MEM", "proficiency": 5 }
     ]
   }
   ```
6. **Errors:** 400 `VALIDATION_ERROR` (bad id); 404 `TECHNICIAN_NOT_FOUND`:
   ```json
   { "error": { "code": "TECHNICIAN_NOT_FOUND", "message": "Không tìm thấy kỹ thuật viên có mã 999999999.", "field": "technician_id" } }
   ```
7. **Notes:** `skills` appears only in this detail view. `proficiency` is 1–5.

## 4. POST /api/technicians

1. **Purpose:** create a technician.
2. **Authentication:** none.
3. **Body:** `full_name` (1–100 chars, required), `center_id` (positive integer, required), `level` (enum, required), `is_active` (boolean, default `true`).
4. **Request example:**
   ```json
   { "full_name": "Nguyễn Văn Thử Nghiệm", "center_id": 1, "level": "TRUNG_CAP" }
   ```
5. **Success response (201)** with a `Location` header (`/api/technicians/39`):
   ```json
   { "technician_id": 39, "full_name": "Nguyễn Văn Thử Nghiệm", "center_id": 1, "level": "TRUNG_CAP", "is_active": true }
   ```
6. **Errors:** 400 `VALIDATION_ERROR`; sending `{"full_name":"","level":"GIOI"}` returns every invalid field at once:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Dữ liệu không hợp lệ ở trường: full_name, center_id, level.",
       "field": "full_name",
       "fields": [
         { "field": "full_name", "reason": "không được để trống" },
         { "field": "center_id", "reason": "bắt buộc" },
         { "field": "level", "reason": "phải là một trong SO_CAP, TRUNG_CAP, CAO_CAP" }
       ]
     }
   }
   ```
7. **Notes:** names containing control characters are rejected.

## 5. PUT /api/technicians/{id}

1. **Purpose:** replace all fields of a technician.
2. **Authentication:** none.
3. **Path parameter:** `id`. **Body:** same fields as `POST /api/technicians`.
4. **Request example:** `PUT /api/technicians/39`
   ```json
   { "full_name": "Nguyễn Văn Thử Nghiệm", "center_id": 1, "level": "CAO_CAP", "is_active": true }
   ```
5. **Success response (200):**
   ```json
   { "technician_id": 39, "full_name": "Nguyễn Văn Thử Nghiệm", "center_id": 1, "level": "CAO_CAP", "is_active": true }
   ```
6. **Errors:** 400 `VALIDATION_ERROR`; 404 `TECHNICIAN_NOT_FOUND`.
7. **Notes:** it is a full replacement, so send every field you want to keep.

## 6. DELETE /api/technicians/{id}

1. **Purpose:** deactivate a technician (soft delete; the row stays so ticket history is kept, TD-16).
2. **Authentication:** none.
3. **Path parameter:** `id`. No body.
4. **Request example:** `DELETE /api/technicians/39`
5. **Success response (200):** the technician with `"is_active": false`:
   ```json
   { "technician_id": 39, "full_name": "Nguyễn Văn Thử Nghiệm", "center_id": 1, "level": "CAO_CAP", "is_active": false }
   ```
6. **Errors:** 404 `TECHNICIAN_NOT_FOUND`; 409 `TECHNICIAN_HAS_OPEN_TICKETS`:
   ```json
   {
     "error": {
       "code": "TECHNICIAN_HAS_OPEN_TICKETS",
       "message": "Kỹ thuật viên đang giữ 23 phiếu chưa hoàn tất; hãy đổi người xử lý trước khi ngừng hoạt động.",
       "field": "is_active",
       "details": { "so_phieu": 23 }
     }
   }
   ```
7. **Notes:** the technician can be reactivated with `PUT` and `"is_active": true`.

## 7. GET /api/tickets/unassigned

1. **Purpose:** the work queue: tickets in status `MOI` with no technician.
2. **Authentication:** none.
3. **Query parameters:** `page` (≥ 1, default 1), `limit` (1–100, default 20), `center_id` (positive integer, optional).
4. **Request example:** `GET /api/tickets/unassigned?limit=2`
5. **Success response (200):** `total` is the number of matching tickets, `items` the current page (second item shortened here, full text in the raw examples file):
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
       { "ticket_id": 212, "ticket_code": "BH-000212/2026", "status": "MOI", "...": "same fields as above" }
     ]
   }
   ```
6. **Errors:** 400 `VALIDATION_ERROR` (for example `center_id=1' OR '1'='1`, `limit=0`).
7. **Notes:** on the sample data `total` is 12.

## 8. GET /api/tickets/{id}

1. **Purpose:** one ticket.
2. **Authentication:** none.
3. **Path parameter:** `id` — positive integer.
4. **Request example:** `GET /api/tickets/6924`
5. **Success response (200):** the ticket object shown under endpoint 7 (`ticket_id` 6924).
6. **Errors:** 400 `VALIDATION_ERROR` (for example `GET /api/tickets/1%20OR%201%3D1` is rejected with `field: "id"`); 404 `TICKET_NOT_FOUND`:
   ```json
   { "error": { "code": "TICKET_NOT_FOUND", "message": "Không tìm thấy phiếu có mã 999999999.", "field": "ticket_id" } }
   ```
7. **Notes:** `technician_id` and `technician_name` are `null` until a technician is assigned.

## 9. GET /api/tickets/{id}/eligible-technicians

1. **Purpose:** technicians who may take this ticket: same service center, active, and proficiency ≥ 3 in the ticket's issue category (QT-08). Each entry shows the current workload.
2. **Authentication:** none.
3. **Path parameter:** `id`.
4. **Request example:** `GET /api/tickets/6924/eligible-technicians`
5. **Success response (200):**
   ```json
   {
     "ticket_id": 6924,
     "issue_category": "PHAN_MEM",
     "technicians": [
       { "technician_id": 17, "full_name": "Võ Đức Phương", "level": "CAO_CAP", "proficiency": 4, "open_tickets": 22 },
       { "technician_id": 26, "full_name": "Phạm Bảo Thắng", "level": "TRUNG_CAP", "proficiency": 5, "open_tickets": 22 },
       { "technician_id": 7, "full_name": "Trần Xuân Nam", "level": "SO_CAP", "proficiency": 3, "open_tickets": 24 }
     ]
   }
   ```
6. **Errors:** 400 `VALIDATION_ERROR`; 404 `TICKET_NOT_FOUND`.
7. **Notes:** `technicians` is an empty array when nobody qualifies.

## 10. POST /api/tickets/{id}/assignment

1. **Purpose:** assign one technician to a ticket. The ticket moves from `MOI` to `DA_PHAN_CONG` and the change is written to the status log (QT-06, QT-07).
2. **Authentication:** none.
3. **Path parameter:** `id`. **Body:** `technician_id` (positive integer, required).
4. **Request example:** `POST /api/tickets/6924/assignment`
   ```json
   { "technician_id": 17 }
   ```
5. **Success response (201):**
   ```json
   {
     "ticket_id": 6924,
     "ticket_code": "BH-006924/2026",
     "status": "DA_PHAN_CONG",
     "technician_id": 17,
     "assigned_at": "2026-11-13T11:20:18+07:00",
     "assigned_by": 0
   }
   ```
6. **Errors:**
   - 400 `VALIDATION_ERROR` — body `{}` gives `field: "technician_id"`, `reason: "bắt buộc"`.
   - 400 `TECH_NOT_ELIGIBLE` — for example an inactive technician:
     ```json
     { "error": { "code": "TECH_NOT_ELIGIBLE", "message": "Kỹ thuật viên đã ngừng hoạt động.", "field": "technician_id" } }
     ```
   - 404 `TICKET_NOT_FOUND`, 404 `TECHNICIAN_NOT_FOUND`.
   - 409 `TICKET_ALREADY_ASSIGNED` — the same call sent a second time:
     ```json
     {
       "error": {
         "code": "TICKET_ALREADY_ASSIGNED",
         "message": "Phiếu đã có kỹ thuật viên hoặc không còn ở trạng thái MOI; hãy tải lại để xem người đang phụ trách.",
         "field": "ticket_id",
         "details": { "status": "DA_PHAN_CONG", "technician_id": 17 }
       }
     }
     ```
7. **Notes:** the ticket is locked inside a database transaction while it is checked and updated, so two people assigning the same ticket at once cannot both succeed.

## 11. POST /api/tickets

1. **Purpose:** receive a new warranty ticket.
2. **Authentication:** none.
3. **Body:** `customer_name` (1–100 chars), `customer_phone` (10 digits starting with 0, or `+84…`; normalised on save, QT-02), `device_name` (1–100 chars), `issue_category` (enum), `center_id` (positive integer), all required; `priority` (enum, optional — defaults from the issue category).
4. **Request example:**
   ```json
   {
     "customer_name": "Khách Thử Nghiệm",
     "customer_phone": "0900000001",
     "device_name": "Điện thoại thử nghiệm",
     "issue_category": "PIN",
     "center_id": 5
   }
   ```
5. **Success response (201)** with a `Location` header (`/api/tickets/7801`):
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
     "received_at": "2026-11-13T11:20:18+07:00",
     "due_date": "2026-11-17T11:20:18+07:00"
   }
   ```
6. **Errors:** 400 `VALIDATION_ERROR` listing every bad field. A body of `{}` reports all five required fields; a phone such as `' OR '1'='1` reports:
   ```json
   { "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ ở trường: customer_phone.", "field": "customer_phone",
       "fields": [ { "field": "customer_phone", "reason": "phải là số điện thoại 10 chữ số bắt đầu bằng 0 (hoặc +84)" } ] } }
   ```
   Invalid JSON returns 400 `{"error":{"code":"VALIDATION_ERROR","message":"Nội dung gửi lên không phải JSON hợp lệ.","field":"body"}}`.
7. **Notes:** `due_date` is calculated by the system from the priority (QT-04, Sundays skipped); the client cannot set it.

## 12. PATCH /api/tickets/{id}

1. **Purpose:** edit a ticket that has not been assigned yet.
2. **Authentication:** none.
3. **Path parameter:** `id`. **Body:** at least one of `device_name`, `issue_category`, `priority`. Any other field (such as `status` or `technician_id`) is rejected, not ignored.
4. **Request example:** `PATCH /api/tickets/7801`
   ```json
   { "priority": "CAO", "device_name": "Điện thoại thử nghiệm (đã sửa)" }
   ```
5. **Success response (200):** the updated ticket. In the captured run `priority` became `CAO` and `due_date` moved from `2026-11-17T11:20:18+07:00` to `2026-11-14T11:20:18+07:00`.
6. **Errors:** 400 `VALIDATION_ERROR` (empty body, unknown field, bad enum); 404 `TICKET_NOT_FOUND`; 409 `TICKET_NOT_EDITABLE` (ticket is no longer `MOI`).
7. **Notes:** changing the priority recalculates `due_date`.

## 13. DELETE /api/tickets/{id}

1. **Purpose:** cancel a ticket (soft delete: the row and its history remain, QT-13).
2. **Authentication:** none.
3. **Path parameter:** `id`. **Body (optional):** `reason` (string up to 255 chars, default `Hủy theo yêu cầu`).
4. **Request example:** `DELETE /api/tickets/7801`
   ```json
   { "reason": "Khách đổi ý" }
   ```
5. **Success response (200):** the ticket with `"status": "DA_HUY"` (other fields unchanged).
6. **Errors:** 400 `VALIDATION_ERROR`; 404 `TICKET_NOT_FOUND`; 409 `TICKET_NOT_CANCELLABLE` (only `MOI` or `DA_PHAN_CONG` tickets).
7. **Notes:** a cancelled ticket no longer appears in `GET /api/tickets/unassigned`.

---

## Injection checks

Four injection attempts were sent to the live API (items 24–27 of [`api-vi-du-chay-that.md`](api-vi-du-chay-that.md)): `' OR '1'='1` in `customer_phone`, in `center_id` of both list endpoints, and `1 OR 1=1` as a ticket id. All returned **400 `VALIDATION_ERROR`** and no data. Queries use bound parameters (`$1`, `$2`) throughout; see [`checklist-bao-mat.md`](checklist-bao-mat.md), item 2.
