# BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI HỖ TRỢ – BT1 sau khi sửa lỗi (16/10/2026)

**Học phần:** Chuyên đề Tốt nghiệp 1 (Specialized Graduation Topic I)  
**Học kỳ:** HK1, Năm học 2026 – 2027  
**Phạm vi:** Chỉ phần hoàn thiện gói BT1 sau khi đã nộp (ngày 16/10/2026). Bài tập 2 sẽ có bản khai báo riêng là `docs/ai-disclosure.md`.

## I. THÔNG TIN SINH VIÊN

- **Họ và tên:** Viên Thành Đạt
- **Mã số sinh viên:** 2374802010107
- **Chuyên ngành (Track):** [x] SE  [ ] DA  [ ] AI
- **Luồng nghiệp vụ:** L4 – Phân công kỹ thuật viên và lịch hẹn
- **Repository:** <https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4>

Các bản khai báo theo từng tuần được giữ nguyên làm hồ sơ gốc, không chép lại ở đây: `docs/ai-disclosure-Tuan1.md` (26/09/2026, phiếu phạm vi), `docs/ai-disclosure-Tuan2.md` (03/10/2026, phân tích yêu cầu), `docs/ai-disclosure-Tuan3.md` (10/10/2026, gói thiết kế BT1). Tệp này là bản khai báo của tuần tiếp theo, ghi phần làm sau khi nộp BT1.

## II. BẢNG KHAI BÁO CHI TIẾT

### Hoàn thiện gói BT1 sau khi nộp (16/10/2026)

Các thay đổi này được làm cùng Claude (Anthropic, qua claude.ai) để vá những chỗ gói BT1 còn thiếu. Sinh viên đưa ra yêu cầu, duyệt từng đề xuất của Claude trước khi áp dụng, và tự thực hiện mọi `git commit` và `git push`.

| Công cụ AI | Dùng vào việc gì | Áp dụng ở tệp | Cách kiểm chứng |
|---|---|---|---|
| Claude (Anthropic) | Soát lỗi nhất quán giữa SRS, hợp đồng API, ERD và báo cáo BT1; đề xuất 5 chỗ sửa, sinh viên đồng ý rồi mới sửa: thêm QT-02 vào SRS; định nghĩa "số phiếu đang giữ" và `open_tickets`; làm rõ trạng thái phiếu cho phép giao máy và nhận máy (BR-L4-02); sửa giờ hợp lệ của lịch hẹn cho khớp BR-L4-01; ghi chú rằng khi nhận 409 `SLOT_CONFLICT` thì gọi endpoint gợi ý khung giờ | `docs/srs.md` (FR2, US6 AC3, Mục 5, UC6), `docs/api-contract.md` (mục 2.2, trước mục 2.7) | Đối chiếu chéo bằng mã tra cứu (FR, US, UC, QT, BR); xem lại bản `git diff` từng dòng thay đổi; QT-02 đối chiếu với nội dung quy tắc trong case study Mục 9 |
| Claude (Anthropic) | Soạn `docs/schema.sql` từ DDL trong báo cáo BT1 Mục 4, bổ sung CHECK cho enum, định dạng số điện thoại, mã phiếu, độ dài lịch hẹn và các chỉ mục | `docs/schema.sql` | Claude nạp tệp vào PostgreSQL 16 trống rồi chạy 10 ca thử (đặt lịch hợp lệ, trùng khung giờ, chồng lấn một phần, lịch liền kề, và các vi phạm CHECK hoặc khóa ngoại); kết quả như kỳ vọng. Tệp `schema.sql` đã được dùng trong báo cáo BT1 nhưng chưa được commit lên repo ở lần nộp, nay đã bổ sung |
| Claude (Anthropic) | Viết lại `README.md` (mục 1–6) và viết mới `docs/deployment-guide.md` (checklist, bộ kiểm tra nhanh, lỗi thường gặp) | `README.md`, `docs/deployment-guide.md` | Claude chạy đúng các bước 1–6 của README trên PostgreSQL 16 bằng người dùng CSDL không phải superuser, và chạy đoạn smoke test lấy trực tiếp từ guide; kết quả như ghi trong tài liệu |
| Claude (Anthropic) | Hướng dẫn lệnh `git mv` và `git rm` để đổi tên `download` thành `.gitignore`, `env.example` thành `.env.example` và xóa tệp rỗng `slide bai giang/l` | `.gitignore`, `.env.example` | Sinh viên tự chạy lệnh; xem lại danh sách tệp trên GitHub sau khi push |
| Claude (Anthropic) | Soát nội dung ba bản khai báo tuần 1–3 và đề xuất cách tổ chức hồ sơ khai báo AI; sinh viên tự quyết định tên tệp và tự đổi tên | `docs/ai-disclosure-BT1-SauKhiSuaLoi.md`, `README.md` (bảng mục 3) | Sinh viên đối chiếu từng dòng với ba bản khai báo gốc và kiểm tra các đường dẫn trong README |

**Xác nhận kiểm chứng của sinh viên:** sinh viên tự chạy lại các lệnh trong `docs/deployment-guide.md` (Mục 2 đến Mục 4) trên máy của mình.  
Ngày chạy và kết quả: ______________________________

## III. GHI CHÚ

- Công cụ AI chỉ được dùng để hỗ trợ tham khảo, gợi ý, rà soát và soạn thảo; sinh viên chịu trách nhiệm kiểm tra, đối chiếu và sửa nội dung trước khi nộp.
- Phần "Đã kiểm chứng" ghi đúng việc đã thực sự được làm, bởi ai (sinh viên hay Claude). Việc Claude chạy thử trong môi trường của Claude không thay cho việc sinh viên tự chạy lại.
- Bài tập 2 sẽ có bản khai báo riêng (`docs/ai-disclosure.md`), với cột nêu rõ cách sinh viên kiểm chứng từng đoạn mã do AI gợi ý.

## IV. CAM KẾT VỀ LIÊM CHÍNH HỌC THUẬT

> “Tôi xác nhận đã đọc, hiểu và kiểm tra toàn bộ nội dung trong gói nộp này, chịu trách nhiệm về tính chính xác của nội dung và có thể giải thích mọi quyết định thiết kế khi giảng viên yêu cầu.”

- **Sinh viên:** Viên Thành Đạt – MSSV 2374802010107
- **Ngày xác nhận:** ____ / ____ / 2026
