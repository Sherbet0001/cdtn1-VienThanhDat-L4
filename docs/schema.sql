-- ============================================================================
-- schema.sql - L4: Phân công kỹ thuật viên và lịch hẹn (Smart CRM - Mekong Mobile)
-- Sinh viên: Viên Thành Đạt - MSSV 2374802010107 - Track SE
-- Phiên bản: 1.0 (BT1) - đối chiếu với ERD (docs/erd.drawio) và báo cáo BT1, Mục 4
-- CSDL: PostgreSQL 14 trở lên. Cần quyền tạo extension btree_gist.
--
-- Cách chạy (từ thư mục gốc repo, trên CSDL trống):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/schema.sql
--
-- Ghi chú thiết kế:
--   * Không có bảng trung tâm / tài khoản trong phạm vi L4, nên center_id là số nguyên
--     không có khóa ngoại; changed_by là mã nhân viên lấy từ token, không có FK.
--   * Giá trị enum dùng ASCII không dấu, khớp bảng đối chiếu trong docs/api-contract.md.
--   * Chống lịch hẹn chồng khung giờ của cùng một KTV bằng EXCLUDE USING gist
--     (BR-L4-02, NFR3). Lỗi CSDL 23P01 được ánh xạ sang HTTP 409 SLOT_CONFLICT.
--   * Không xóa vật lý dữ liệu (QT-13): phiếu đi qua trạng thái DA_HUY, không có lệnh DELETE.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- 1. customer - Khách hàng
-- ---------------------------------------------------------------------------
CREATE TABLE customer (
    customer_id BIGSERIAL    PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(10)  NOT NULL UNIQUE,                       -- 10 chữ số, bắt đầu bằng 0 (QT-02)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_customer_phone CHECK (phone ~ '^0[0-9]{9}$')
);

-- ---------------------------------------------------------------------------
-- 2. technician - Kỹ thuật viên
-- ---------------------------------------------------------------------------
CREATE TABLE technician (
    technician_id BIGSERIAL    PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    center_id     INT          NOT NULL,
    level         VARCHAR(10)  NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_technician_level CHECK (level IN ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP'))
);

-- ---------------------------------------------------------------------------
-- 3. technician_skill - Tay nghề của KTV theo nhóm sự cố (khóa ghép)
-- ---------------------------------------------------------------------------
CREATE TABLE technician_skill (
    technician_id  BIGINT      NOT NULL REFERENCES technician (technician_id),
    issue_category VARCHAR(12) NOT NULL,
    proficiency    SMALLINT    NOT NULL,
    PRIMARY KEY (technician_id, issue_category),
    CONSTRAINT ck_skill_proficiency CHECK (proficiency BETWEEN 1 AND 5),
    CONSTRAINT ck_skill_category    CHECK (issue_category IN
        ('MAN_HINH', 'PIN', 'SAC', 'PHAN_MEM', 'NUOC_VAO', 'KHAC'))
);

-- ---------------------------------------------------------------------------
-- 4. ticket - Phiếu bảo hành
-- ---------------------------------------------------------------------------
CREATE TABLE ticket (
    ticket_id      BIGSERIAL    PRIMARY KEY,
    ticket_code    VARCHAR(20)  NOT NULL UNIQUE,                    -- dạng BH001287/2026
    customer_id    BIGINT       NOT NULL REFERENCES customer (customer_id),
    center_id      INT          NOT NULL,
    device_name    VARCHAR(100) NOT NULL,
    issue_category VARCHAR(12)  NOT NULL,
    priority       VARCHAR(10)  NOT NULL,
    status         VARCHAR(15)  NOT NULL DEFAULT 'MOI',
    technician_id  BIGINT       REFERENCES technician (technician_id),  -- NULL khi chưa phân công
    received_at    TIMESTAMPTZ  NOT NULL,
    due_date       TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_ticket_due      CHECK (due_date > received_at),
    CONSTRAINT ck_ticket_code     CHECK (ticket_code ~ '^BH[0-9]{6}/[0-9]{4}$'),
    CONSTRAINT ck_ticket_category CHECK (issue_category IN
        ('MAN_HINH', 'PIN', 'SAC', 'PHAN_MEM', 'NUOC_VAO', 'KHAC')),
    CONSTRAINT ck_ticket_priority CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    CONSTRAINT ck_ticket_status   CHECK (status IN
        ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'))
);

-- FR1 / NFR1: danh sách phiếu MỚI của một trung tâm, sắp theo hạn cam kết
CREATE INDEX ix_ticket_unassigned ON ticket (center_id, due_date) WHERE status = 'MOI';
-- FR2 / FR6: đếm và liệt kê phiếu đang giữ của một KTV
CREATE INDEX ix_ticket_technician ON ticket (technician_id, due_date) WHERE technician_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. appointment - Lịch hẹn giao / nhận máy
-- ---------------------------------------------------------------------------
CREATE TABLE appointment (
    appointment_id   BIGSERIAL   PRIMARY KEY,
    appointment_code VARCHAR(20) NOT NULL UNIQUE,                   -- dạng LH000501/2026
    ticket_id        BIGINT      NOT NULL REFERENCES ticket (ticket_id),
    technician_id    BIGINT      NOT NULL REFERENCES technician (technician_id),
    type             VARCHAR(10) NOT NULL,
    start_at         TIMESTAMPTZ NOT NULL,
    end_at           TIMESTAMPTZ NOT NULL,
    status           VARCHAR(15) NOT NULL DEFAULT 'DA_XAC_NHAN',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_appointment_type   CHECK (type IN ('GIAO_MAY', 'NHAN_MAY')),
    CONSTRAINT ck_appointment_status CHECK (status IN ('DA_XAC_NHAN')),
    CONSTRAINT ck_appointment_length CHECK (end_at = start_at + INTERVAL '30 minutes'),  -- BR-L4-01
    -- BR-L4-02, NFR3: một KTV không có hai lịch hẹn chồng khung giờ, kể cả khi đặt đồng thời
    CONSTRAINT ex_appointment_no_overlap
        EXCLUDE USING gist (technician_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)
);

-- FR8 / FR9 / NFR2: tìm lịch của một KTV theo thời gian
CREATE INDEX ix_appointment_technician_start ON appointment (technician_id, start_at);

-- ---------------------------------------------------------------------------
-- 6. ticket_status_log - Lịch sử đổi trạng thái và đổi KTV
-- ---------------------------------------------------------------------------
CREATE TABLE ticket_status_log (
    log_id            BIGSERIAL    PRIMARY KEY,
    ticket_id         BIGINT       NOT NULL REFERENCES ticket (ticket_id),
    old_status        VARCHAR(15),
    new_status        VARCHAR(15)  NOT NULL,
    old_technician_id BIGINT       REFERENCES technician (technician_id),
    new_technician_id BIGINT       REFERENCES technician (technician_id),
    reason            VARCHAR(255),                                 -- bắt buộc khi đổi KTV (QT-07), kiểm ở tầng service
    changed_by        BIGINT       NOT NULL,                        -- mã nhân viên lấy từ token, không có FK
    changed_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_log_new_status CHECK (new_status IN
        ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
    CONSTRAINT ck_log_old_status CHECK (old_status IS NULL OR old_status IN
        ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'))
);

CREATE INDEX ix_status_log_ticket ON ticket_status_log (ticket_id, changed_at);
