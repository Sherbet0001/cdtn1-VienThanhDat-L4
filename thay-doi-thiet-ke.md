# Nhật ký điều chỉnh thiết kế

- **Dự án:** CDTN1 – Viên Thành Đạt – L4
- **Tài liệu:** Nhật ký quyết định điều chỉnh thiết kế
- **Phạm vi:** Tiếp thu góp ý BT1 và chuẩn bị triển khai BT2
- **Trạng thái:** Bản ghi nhận quyết định thiết kế

## 1. Mục đích

Tài liệu ghi lại các điều chỉnh thiết kế sau khi rà soát BT1, các quyết định giữ nguyên thiết kế có căn cứ và những điểm cần xác minh trước khi triển khai BT2.

Mỗi quyết định sử dụng mã TD-xx và ghi rõ phản hồi, quyết định, lý do, ảnh hưởng và trạng thái. Những nội dung chưa có đủ bằng chứng được đánh dấu cần xác minh, không coi là lỗi đã được kết luận hoặc quyết định đã được giảng viên phê duyệt.

## 2. Nhật ký quyết định thiết kế

### TD-01 — Bổ sung chú thích và phạm vi ngoài hệ thống trên sơ đồ kiến trúc

- **Phản hồi:** Sơ đồ kiến trúc BT1 thiếu chú thích ký hiệu và chưa thể hiện rõ các chức năng nằm ngoài phạm vi triển khai.
- **Quyết định:** Bổ sung khung chú thích ký hiệu và khung "NGOÀI PHẠM VI – không xây dựng trong MVP L4".
- **Lý do:** Giúp người đọc hiểu các thành phần, kho dữ liệu, quan hệ gọi và ranh giới trách nhiệm của hệ thống; tránh hiểu nhầm các chức năng chưa triển khai là thành phần thuộc MVP.
- **Ảnh hưởng:** Cập nhật `docs/architecture.png` và `docs/architecture.drawio`; nội dung phạm vi phải nhất quán với SRS.
- **Trạng thái:** Đã cập nhật sơ đồ theo quá trình khắc phục BT1. Cần mở file nguồn bằng diagrams.net để kiểm tra hiển thị thực tế.

### TD-02 — Duy trì schema CSDL trong repository

- **Phản hồi:** Cần có tệp schema SQL trong repository để kiểm tra thiết kế dữ liệu và hỗ trợ triển khai.
- **Quyết định:** Duy trì `docs/schema.sql` làm nguồn DDL cần được đối chiếu và sử dụng khi xây dựng migration.
- **Lý do:** Có thể kiểm tra bảng, khóa, ràng buộc và chỉ mục trực tiếp thay vì chỉ dựa vào DDL trong PDF.
- **Ảnh hưởng:** BT2 sử dụng schema làm căn cứ xây dựng migration và kiểm thử tính toàn vẹn dữ liệu.
- **Trạng thái:** Đã xác nhận tệp tồn tại trong repository ở lần rà soát trước. Cần tiếp tục đối chiếu schema với SRS và mô hình dữ liệu.

### TD-03 — Giữ các ràng buộc kiểm tra dữ liệu hiện có

- **Phản hồi:** Thiết kế cần bảo đảm dữ liệu lưu trữ tuân thủ các quy tắc nghiệp vụ.
- **Quyết định:** Tạm giữ các ràng buộc `ck_customer_phone`, `ck_technician_level` và `ck_ticket_code`; chỉ điều chỉnh khi phát hiện mâu thuẫn với đặc tả.
- **Lý do:** Ràng buộc tại CSDL giúp ngăn dữ liệu không hợp lệ ngay cả khi thao tác không đi qua giao diện người dùng.
- **Ảnh hưởng:** Các thao tác tạo và cập nhật dữ liệu trong BT2 phải đáp ứng các điều kiện đã định nghĩa.
- **Trạng thái:** Đã xác minh tên các ràng buộc trong schema ở lần kiểm tra trước; cần đối chiếu giá trị hợp lệ với tài liệu đặc tả.

### TD-04 — Giữ ràng buộc chống trùng lịch ở tầng CSDL

- **Phản hồi:** Lịch hẹn phải tránh chồng lấn đối với cùng kỹ thuật viên, kể cả khi nhiều yêu cầu được xử lý gần như đồng thời.
- **Quyết định:** Giữ ràng buộc loại trừ `ex_appointment_no_overlap` nếu kiểm tra schema hiện hành vẫn xác nhận ràng buộc này đáp ứng quy tắc nghiệp vụ.
- **Lý do:** Kiểm tra ở CSDL tạo lớp bảo vệ toàn vẹn dữ liệu, không chỉ phụ thuộc vào bước kiểm tra trước khi ghi lịch ở ứng dụng.
- **Ảnh hưởng:** BT2 cần có kiểm thử lịch chồng lấn, lịch liền kề và các yêu cầu đặt lịch đồng thời. Ứng dụng cũng cần xử lý lỗi vi phạm ràng buộc một cách phù hợp.
- **Trạng thái:** Thiết kế đã được ghi nhận trong lần rà soát trước; cần xác minh lại định nghĩa SQL thực tế và kết quả kiểm thử trên schema hiện hành.

### TD-05 — Giữ các chỉ mục phục vụ truy vấn nghiệp vụ

- **Phản hồi:** Các truy vấn quản lý phiếu, kỹ thuật viên và lịch hẹn cần có cấu trúc dữ liệu hỗ trợ.
- **Quyết định:** Tạm giữ các chỉ mục hiện có: `ix_ticket_unassigned`, `ix_ticket_technician`, `ix_appointment_technician_start` và `ix_status_log_ticket`.
- **Lý do:** Các chỉ mục được thiết kế để hỗ trợ những truy vấn theo trung tâm, ngày đến hạn, kỹ thuật viên, thời điểm lịch hẹn và lịch sử trạng thái.
- **Ảnh hưởng:** Giữ cấu trúc hiện tại khi xây dựng migration; đánh giá lại nếu kiểm thử truy vấn cho thấy chỉ mục không phù hợp.
- **Trạng thái:** Đã xác minh tên các chỉ mục trong lần kiểm tra trước; hiệu quả thực tế chưa được kết luận nếu chưa đo hiệu năng.

### TD-06 — Giữ ranh giới phạm vi MVP L4

- **Phản hồi:** Cần làm rõ các chức năng không triển khai để tránh mở rộng phạm vi ngoài yêu cầu BT1.
- **Quyết định:** Giữ các chức năng ngoài phạm vi đã ghi trên sơ đồ, gồm tiếp nhận phiếu thuộc L2, quản lý tài khoản và phân quyền chi tiết, SMS/Zalo, kho linh kiện L5, báo cáo L6, tự động phân công tối ưu, đổi/hủy lịch và xem lịch tuần.
- **Lý do:** Phạm vi triển khai cần thống nhất với danh sách chức năng được chủ ý loại trừ trong SRS.
- **Ảnh hưởng:** Không bổ sung các chức năng trên vào kế hoạch BT2 nếu chưa có yêu cầu thay đổi phạm vi chính thức.
- **Trạng thái:** Đã đưa vào khung ngoài phạm vi trên sơ đồ kiến trúc; cần đối chiếu lần cuối với SRS hiện hành.

### TD-07 — Làm rõ các quy tắc thuộc tầng ứng dụng

- **Phản hồi:** Ràng buộc CSDL không thay thế toàn bộ việc kiểm tra quy tắc nghiệp vụ và quyền truy cập.
- **Quyết định:** Không tự động bổ sung các quy tắc mới vào schema khi chưa có căn cứ. Trong BT2, đối chiếu SRS và hợp đồng API để xác định kiểm tra nào thuộc tầng ứng dụng, kiểm tra nào cần được bảo vệ tại CSDL.
- **Lý do:** Phân chia trách nhiệm rõ ràng giữa ứng dụng và CSDL giúp tránh bỏ sót kiểm tra hoặc triển khai trùng lặp không cần thiết.
- **Ảnh hưởng:** Cần xác minh quy tắc giờ làm việc, trạng thái phiếu được phép đặt lịch, xác thực khách hàng và phân quyền trước khi triển khai các luồng tương ứng.
- **Trạng thái:** Cần đối chiếu tài liệu và kiểm thử trong BT2; chưa kết luận các quy tắc này đang bị thiếu trong mã nguồn.

### TD-08 — Duy trì quy tắc quản lý cấu hình và tài liệu repository

- **Phản hồi:** Repository cần có cấu hình mẫu, loại trừ dữ liệu nhạy cảm và cấu trúc tài liệu rõ ràng.
- **Quyết định:** Duy trì `.gitignore`, `.env.example` và không đưa tệp `.env` chứa thông tin cấu hình bí mật lên repository.
- **Lý do:** Hỗ trợ dựng môi trường nhất quán và giảm nguy cơ công khai thông tin nhạy cảm.
- **Ảnh hưởng:** Hướng dẫn triển khai BT2 cần nêu rõ cách tạo tệp môi trường cục bộ từ cấu hình mẫu.
- **Trạng thái:** Đã được ghi nhận là hoàn thành trong lần rà soát BT1 trước; cần tiếp tục duy trì quy tắc này.

### TD-09 — Giữ nguyên nội dung lịch sử commit cũ

- **Phản hồi:** Một số commit cũ có thông điệp chung chung như `Add files via upload`.
- **Quyết định:** Không viết lại lịch sử commit cũ chỉ để đổi thông điệp; sử dụng thông điệp rõ nghĩa cho các commit mới.
- **Lý do:** Tránh ghi đè lịch sử đã được sử dụng làm minh chứng và hạn chế rủi ro đồng bộ giữa các bản clone.
- **Ảnh hưởng:** Các thay đổi từ thời điểm này cần được chia thành commit theo từng mục đích cụ thể.
- **Trạng thái:** Áp dụng cho các thay đổi tiếp theo.

## 3. Các điểm cần đối chiếu trước BT2

1. Đối chiếu các bảng, trường, khóa ngoại và ràng buộc trong `docs/schema.sql` với SRS và sơ đồ dữ liệu.
2. Kiểm tra định nghĩa chính xác của ràng buộc chống trùng lịch, bao gồm cách xử lý lịch liền kề và thời điểm kết thúc.
3. Xác minh các quy tắc nghiệp vụ thuộc tầng ứng dụng, bao gồm giờ làm việc, trạng thái phiếu, xác thực và phân quyền.
4. Kiểm tra các chỉ mục có phù hợp với các truy vấn dự kiến; không kết luận hiệu năng chỉ dựa trên sự tồn tại của chỉ mục.
5. Đối chiếu danh sách ngoài phạm vi trên sơ đồ với SRS để tránh mâu thuẫn giữa các tài liệu.
6. Khi bắt đầu BT2, xây dựng migration từ schema đã được đối chiếu và bổ sung kiểm thử cho các ràng buộc quan trọng.
