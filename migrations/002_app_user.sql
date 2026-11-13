-- ============================================================================
-- 002_app_user.sql - Tài khoản đăng nhập và phân quyền theo trung tâm (TD-34, QT-14, OWASP A01/A07).
-- Mật khẩu KHÔNG lưu dạng gốc: cột password_hash chứa chuỗi băm scrypt có muối riêng (src/auth/password.js).
-- Hai vai trò: QUAN_TRI (mọi trung tâm, center_id = NULL) và QUAN_LY (đúng một trung tâm, center_id bắt buộc).
-- Chạy bằng: npm run migrate (chạy lại không lỗi).
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_user (
    user_id       BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(10)  NOT NULL,
    center_id     INT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_role   CHECK (role IN ('QUAN_LY', 'QUAN_TRI')),
    CONSTRAINT ck_user_center CHECK ((role = 'QUAN_TRI' AND center_id IS NULL) OR (role = 'QUAN_LY' AND center_id IS NOT NULL)),
    CONSTRAINT ck_user_hash   CHECK (password_hash LIKE 'scrypt$%')   -- cấm lưu mật khẩu gốc ngay ở tầng CSDL
);

-- Tên đăng nhập không phân biệt hoa thường và không trùng.
CREATE UNIQUE INDEX IF NOT EXISTS ux_app_user_username ON app_user (lower(username));
