-- Sinh bởi scripts/tao-seed-nguoi-dung.js (TD-34). Tài khoản mẫu để chạy thử; mật khẩu mẫu ghi ở docs/deployment-guide.md.
-- Cột password_hash là chuỗi băm scrypt (muối riêng mỗi dòng), KHÔNG phải mật khẩu gốc. ON CONFLICT: chạy lại không nhân đôi.
INSERT INTO app_user (username, password_hash, full_name, role, center_id) VALUES
  ('admin', 'scrypt$16384$8$1$GBtnOCBS9qO/FUFp1qCaFw==$OcH1IMJOZ78dJfOkBGh+iFI9n0Usj3LGGPHpBt7LsCNWcC+gr8sicCer6BqfBZ9ZXa+VV3GnbTXmTBm7LQZIYw==', 'Quản trị hệ thống', 'QUAN_TRI', NULL),
  ('quanly_tt1', 'scrypt$16384$8$1$gqXDa7L2twXhK0GNIE72WA==$vF3Nzpbzb+Ko3JNDR2c2SQ90TZz7lMj7/LqXZHnqXcMB9kLpZt94QGsdRYPdycXCEWB06DPrOZh4ddP7YZ+nwQ==', 'Quản lý trung tâm 1', 'QUAN_LY', 1),
  ('quanly_tt2', 'scrypt$16384$8$1$SXNPG47FSUnwau/IeqGxxQ==$VyRHUSb9NSb9iDVgH5Lqzv02ImJuflm2kIOOwLHUvCudVh/98/BrZ9KBN9JzfMcCvaeUTnSdZgue+UqEDtSy+g==', 'Quản lý trung tâm 2', 'QUAN_LY', 2),
  ('quanly_tt3', 'scrypt$16384$8$1$7Od25Rug4lEdX5kng67RqQ==$iWTA2VkAgNj2EjKwbYAZaghL35IM2tm2EE/CRCgNQn5HQcy8gY9IJIZNSnr5nvJXwfDMc5iUP/O90FVZq2XQAg==', 'Quản lý trung tâm 3', 'QUAN_LY', 3),
  ('quanly_tt4', 'scrypt$16384$8$1$4j4P5/7v4NShrmjJ/dzK6Q==$Umh9c7bIB3ogXBSWJukfx3+QOdpD0I7HzbwTRLXzh7bvfNrG690zBscE/V/JC2fCVr9JrJFpGItXrqQOr3rpSA==', 'Quản lý trung tâm 4', 'QUAN_LY', 4),
  ('quanly_tt5', 'scrypt$16384$8$1$CSMuoyh3ZIMUT7AXAud1JA==$EhR5Aml7kMZFdMTfZeGvTmsy4yNJUy/NQ5Bx3UiEXgFLCg5pwpwm0ZuSTPPPg2OMLX61r0EjNNJG5xwGnPbdrQ==', 'Quản lý trung tâm 5', 'QUAN_LY', 5),
  ('quanly_tt6', 'scrypt$16384$8$1$TbPbq9fXCNOseXvEJlHgjw==$WXM93YIM0laXpC5SFxI8OrTdtQ7JMyhVsrshoB3mpL6WEfKGqnBno9BiLEN5YjmOyTJzsrkmlhXK8wvdUMXXAg==', 'Quản lý trung tâm 6', 'QUAN_LY', 6)
ON CONFLICT DO NOTHING;
