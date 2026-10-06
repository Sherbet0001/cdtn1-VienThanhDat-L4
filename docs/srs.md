# SRS rút gọn – L4: Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Viên Thành Đạt · **MSSV:** 2374802010107 · **Track:** SE
**Học phần:** Chuyên đề Tốt nghiệp 1, HK1 2026–2027 · **Phiên bản:** 1.1 (buổi 4) · **Ngày:** 06/10/2026

> Cấu trúc SRS rút gọn theo tinh thần của ISO/IEC/IEEE 29148, không tuân thủ đầy đủ chuẩn.

---

## 1. Giới thiệu và phạm vi

**Bối cảnh.** Mekong Mobile có 6 trung tâm bảo hành và 38 kỹ thuật viên. Việc phân công do quản lý làm thủ công theo trí nhớ nên khối lượng lệch nhau (có người nhận 40 phiếu/tháng, người khác 12 phiếu – vấn đề V3) và khoảng 15% phiếu quá hạn cam kết mà không được cảnh báo (V2).

**Luồng nghiệp vụ:** L4 – Phân công kỹ thuật viên và lịch hẹn.

**Phạm vi (một câu):** Quản lý trung tâm chọn kỹ thuật viên đủ tay nghề, cùng trung tâm và ít việc nhất để gán cho phiếu bảo hành mới, sau đó khách hàng đặt lịch hẹn giao – nhận máy với kỹ thuật viên đó và hệ thống chặn lịch trùng, kết thúc khi lịch hẹn được xác nhận.

**Chủ ý KHÔNG làm (WON'T) ở phiên bản này:**

- Tiếp nhận phiếu, phân loại sự cố, sinh hạn cam kết (thuộc L2; dùng dữ liệu phiếu mẫu có sẵn).
- Thuật toán tự động phân công tối ưu; đổi hoặc hủy lịch hẹn sau khi đã xác nhận.
- Gửi SMS/Zalo nhắc hẹn; kho linh kiện (L5); báo cáo tổng hợp (L6); quản lý tài khoản và phân quyền chi tiết.

**Thuật ngữ** (theo Bảng 3.1 của case study; mỗi khái niệm chỉ dùng một tên trong SRS, sơ đồ và API):

| Thuật ngữ | Ý nghĩa | Tên kỹ thuật |
|---|---|---|
| Phiếu bảo hành | Một yêu cầu bảo hành/sửa chữa, có mã duy nhất và vòng đời trạng thái | `ticket` |
| Trạng thái phiếu | MỚI → ĐÃ PHÂN CÔNG → ĐANG XỬ LÝ → CHỜ LINH KIỆN → HOÀN TẬT → ĐÃ ĐÓNG (hoặc ĐÃ HỦY) | `status` |
| Kỹ thuật viên | Nhân viên sửa chữa, có tay nghề theo nhóm sự cố | `technician` |
| Tay nghề / mức thành thạo | Điểm 1–5 của kỹ thuật viên theo từng nhóm sự cố | `technician_skill.proficiency` |
| Nhóm sự cố | Màn hình, pin, sạc, phần mềm, nước vào, khác | `issue_category` |
| Hạn cam kết | Thời điểm chậm nhất phải hoàn tất phiếu | `due_date` |
| Quản lý trung tâm | Người phân công kỹ thuật viên của một trung tâm bảo hành; trong tài liệu gọi tắt là "quản lý" | `center_manager` (vai trò) |
| Khách hàng | Người mang thiết bị đến bảo hành; trong tài liệu gọi tắt là "khách" | `customer` |
| Lịch hẹn | Khung giờ khách giao hoặc nhận máy với kỹ thuật viên (bảng bổ sung, không có trong từ điển tham chiếu) | `appointment` |

## 2. Các bên liên quan và vai trò người dùng

| Vai trò (actor) | Được làm | Không được làm |
|---|---|---|
| Quản lý trung tâm | Xem phiếu chưa phân công của trung tâm mình; xem kỹ thuật viên và khối lượng; gán, đổi kỹ thuật viên; xem lịch hẹn; xem số điện thoại đầy đủ | Xem hoặc phân công phiếu của trung tâm khác; xóa phiếu |
| Kỹ thuật viên | Xem phiếu và lịch hẹn được gán cho mình | Xem phiếu người khác; tự gán/đổi phiếu; xem số điện thoại đầy đủ (thấy dạng che) |
| Khách hàng | Đặt lịch giao – nhận máy cho phiếu của chính mình (xác thực bằng mã phiếu + số điện thoại) | Xem thông tin khách khác; đặt lịch cho phiếu không phải của mình |

## 3. Yêu cầu chức năng

### 3.1 Danh sách yêu cầu chức năng

| Mã | Yêu cầu chức năng | MoSCoW |
|---|---|---|
| FR1 | Hệ thống hiển thị danh sách phiếu ở trạng thái MỚI chưa có kỹ thuật viên, thuộc trung tâm của quản lý, sắp theo hạn cam kết tăng dần | MUST |
| FR2 | Với một phiếu, hệ thống liệt kê kỹ thuật viên đủ điều kiện (cùng trung tâm, đang hoạt động, mức thành thạo ≥ 3 với nhóm sự cố của phiếu) kèm số phiếu đang xử lý | SHOULD |
| FR3 | Hệ thống gán một kỹ thuật viên cho phiếu, chuyển trạng thái MỚI → ĐÃ PHÂN CÔNG và ghi `ticket_status_log` | MUST |
| FR4 | Hệ thống từ chối việc gán khi kỹ thuật viên không đủ điều kiện (khác trung tâm hoặc mức thành thạo < 3) hoặc khi phiếu đã có kỹ thuật viên, và nêu rõ lý do | MUST |
| FR5 | Hệ thống cho đổi kỹ thuật viên của phiếu, bắt buộc nhập lý do, lưu kỹ thuật viên cũ/mới, thời điểm, người thực hiện | SHOULD |
| FR6 | Hệ thống hiển thị cho kỹ thuật viên các phiếu và lịch hẹn được giao, sắp theo hạn cam kết; phiếu còn dưới 24 giờ đến hạn được đánh dấu | SHOULD |
| FR7 | Hệ thống cho khách đặt lịch giao hoặc nhận máy cho phiếu của mình, chọn ngày và khung giờ trong giờ làm việc | MUST |
| FR8 | Hệ thống từ chối lịch hẹn chồng khung giờ với lịch đã có của cùng kỹ thuật viên | MUST |
| FR9 | Khi lịch hẹn bị từ chối vì trùng, hệ thống đề xuất ít nhất 3 khung giờ trống gần nhất | SHOULD |
| FR10 | Hệ thống hiển thị lịch hẹn theo tuần của một kỹ thuật viên cho quản lý | COULD (không hiện thực) |

### 3.2 User Story

| Mã | User Story | MoSCoW |
|---|---|---|
| US1 | Là **quản lý trung tâm**, tôi muốn xem danh sách phiếu chưa phân công sắp theo hạn cam kết để ưu tiên giao phiếu sắp quá hạn trước (V2). | MUST |
| US2 | Là **quản lý trung tâm**, tôi muốn xem kỹ thuật viên phù hợp tay nghề kèm số phiếu đang giữ để chọn đúng người và tránh lệch tải (V3). | SHOULD |
| US3 | Là **quản lý trung tâm**, tôi muốn gán một kỹ thuật viên cho phiếu để mỗi phiếu có đúng một người chịu trách nhiệm. | MUST |
| US4 | Là **quản lý trung tâm**, tôi muốn đổi kỹ thuật viên của phiếu kèm lý do để lịch sử đổi người được lưu và truy được trách nhiệm. | SHOULD |
| US5 | Là **kỹ thuật viên**, tôi muốn xem phiếu và lịch hẹn được giao sắp theo hạn cam kết để ưu tiên xử lý phiếu sắp quá hạn (V2). | SHOULD |
| US6 | Là **khách hàng**, tôi muốn đặt lịch giao – nhận máy vào khung giờ kỹ thuật viên còn rảnh để không phải chờ đợi hoặc đến nhầm giờ. | MUST |
| US7 | Là **khách hàng**, tôi muốn được gợi ý các khung giờ trống gần nhất khi khung giờ mình chọn đã kín để đặt lại ngay mà không phải thử từng giờ. | SHOULD |
| US8 | Là **quản lý trung tâm**, tôi muốn xem lịch hẹn theo tuần của một kỹ thuật viên để biết lịch dày hay thưa khi cân nhắc phân công. | COULD |

Tổng: 8 story, **3 MUST** (US1, US3, US6), 4 SHOULD, 1 COULD.

### 3.3 Tiêu chí chấp nhận (Given – When – Then) cho story MUST

**US1 – Xem phiếu chưa phân công**

- **AC1.** GIVEN trung tâm Tân Bình có 12 phiếu MỚI chưa gán kỹ thuật viên, WHEN quản lý trung tâm Tân Bình mở danh sách, THEN hệ thống hiển thị đúng 12 phiếu, sắp theo hạn cam kết tăng dần.
- **AC2.** GIVEN trung tâm không còn phiếu MỚI nào, WHEN quản lý mở danh sách, THEN hệ thống hiển thị thông báo "Không có phiếu cần phân công" thay vì danh sách trống không giải thích. *(ngoại lệ)*
- **AC3.** GIVEN phiếu MỚI thuộc trung tâm Quận 10, WHEN quản lý trung tâm Tân Bình mở danh sách, THEN phiếu đó không xuất hiện (QT-14). *(ngoại lệ – phân quyền)*

**US3 – Gán kỹ thuật viên**

- **AC1.** GIVEN phiếu BH001287/2026 ở trạng thái MỚI và kỹ thuật viên Trần Minh Khoa (cùng trung tâm, thành thạo nhóm MAN_HINH = 4), WHEN quản lý chọn Khoa và xác nhận, THEN phiếu chuyển sang ĐÃ PHÂN CÔNG, gắn với Khoa, và có một dòng log ghi trạng thái trước/sau, thời điểm, người thực hiện.
- **AC2.** GIVEN kỹ thuật viên có mức thành thạo 2 với nhóm sự cố của phiếu, WHEN quản lý cố gán, THEN hệ thống từ chối, nêu rõ lý do theo QT-08 và phiếu giữ nguyên trạng thái MỚI. *(ngoại lệ)*
- **AC3.** GIVEN hai quản lý cùng mở một phiếu, WHEN người thứ hai xác nhận sau khi người thứ nhất đã gán, THEN yêu cầu thứ hai bị từ chối, không ghi đè kỹ thuật viên đã gán. *(ngoại lệ)*

**US6 – Đặt lịch giao – nhận máy**

- **AC1.** GIVEN phiếu BH001287/2026 đã gán cho Khoa và Khoa rảnh 09:00–09:30 ngày 12/10/2026, WHEN khách nhập đúng mã phiếu + số điện thoại và chọn khung giờ đó, THEN hệ thống lưu lịch hẹn ĐÃ XÁC NHẬN và hiển thị mã lịch hẹn, ngày giờ, địa chỉ trung tâm.
- **AC2.** GIVEN Khoa đã có lịch hẹn 09:00–09:30 ngày 12/10/2026, WHEN khách khác chọn đúng khung 09:00–09:30 đó, THEN hệ thống từ chối, không lưu lịch hẹn và thông báo khung giờ đã kín. *(ngoại lệ)*
- **AC3.** GIVEN khách chọn khung giờ vào Chủ nhật hoặc sau 17:30, WHEN bấm xác nhận, THEN hệ thống từ chối và nêu khung giờ hợp lệ (BR-L4-01). *(ngoại lệ)*

### 3.4 Kiểm tra INVEST và bốn lỗi thường gặp

| Story | I | N | V | E | S | T | Ghi chú |
|---|---|---|---|---|---|---|---|
| US1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Độc lập: có thể mở phiếu theo mã khi chưa có danh sách |
| US2 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Giá trị nối với V3 |
| US3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Đã tách khỏi US4 (đổi người) để chấp nhận/từ chối riêng |
| US4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cần phiếu đã gán (điều kiện dữ liệu, không phải phụ thuộc story) |
| US5 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| US6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Chặn trùng lịch là tiêu chí AC2, không tách story |
| US7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Tách khỏi US6 vì gợi ý khung giờ làm sau được |
| US8 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COULD, chỉ đọc |

Soi bốn lỗi: không có từ định tính mơ hồ; mỗi story có AC hoặc kiểm chứng được qua FR; mỗi story một việc; không nêu công nghệ hay giải pháp (không có "ô ghi chú", "dropdown", tên bảng). Vai trò đều là người dùng hệ thống.

## 4. Yêu cầu phi chức năng

| Mã | Loại | Yêu cầu (có ngưỡng đo được) | Cách kiểm chứng |
|---|---|---|---|
| NFR1 | Hiệu năng | Danh sách phiếu chưa phân công (FR1) hiển thị trong dưới 2 giây với 10.000 phiếu, 20 dòng/trang, trên máy 8 GB RAM | Nạp 10.000 phiếu mẫu, đo 20 lần, lấy giá trị lớn nhất |
| NFR2 | Hiệu năng | Kiểm tra trùng lịch (FR8) trả kết quả trong dưới 1 giây với 5.000 lịch hẹn | Nạp 5.000 lịch hẹn mẫu, đo 50 lần gọi |
| NFR3 | Tin cậy | Gán/đổi kỹ thuật viên và đặt lịch theo giao dịch. Khi 2 khách đặt cùng khung giờ của cùng một kỹ thuật viên đồng thời, đúng 1 yêu cầu thành công, 0 lịch trùng được lưu qua 100 lần thử | Kịch bản đồng thời 100 lần |
| NFR4 | Bảo mật | 100% yêu cầu truy cập phiếu ngoài trung tâm hoặc ngoài quyền vai trò bị từ chối (HTTP 403); số điện thoại hiển thị dạng che (090****567) với mọi vai trò trừ quản lý | Test phân quyền, mỗi vai trò ≥ 5 ca |
| NFR5 | Khả dụng | Quản lý mới dùng gán đúng một kỹ thuật viên cho một phiếu trong dưới 1 phút, không quá 4 lần bấm, không cần hỏi đồng nghiệp | 3 người chưa dùng hệ thống, bấm giờ |

## 5. Ràng buộc và quy tắc nghiệp vụ

| Mã | Quy tắc | Nguồn |
|---|---|---|
| QT-04 | Hạn cam kết sinh theo mức ưu tiên (CAO 24h, TRUNG_BINH 72h, THAP 120h), chỉ tính thứ Hai–thứ Bảy; dùng để sắp xếp và đánh dấu phiếu sắp quá hạn | Case study, Mục 9 |
| QT-06 | Phiếu chỉ chuyển trạng thái theo đúng vòng đời, không quay lại; mọi lần chuyển ghi vào `ticket_status_log` | Case study, Mục 9 |
| QT-07 | Một phiếu tại một thời điểm chỉ gán cho tối đa một kỹ thuật viên; đổi kỹ thuật viên phải ghi lý do | Case study, Mục 9 |
| QT-08 | Chỉ phân công kỹ thuật viên cùng trung tâm và có mức thành thạo ≥ 3 với nhóm sự cố của phiếu | Case study, Mục 9 |
| QT-13/14/15 | Không xóa vật lý; chỉ xem dữ liệu đơn vị mình; số điện thoại che với mọi vai trò trừ quản lý | Case study, Mục 9 |
| BR-L4-01 | Lịch hẹn dài 30 phút, bắt đầu đúng mốc :00 hoặc :30, trong giờ làm việc 08:00–17:30 (khung cuối bắt đầu 17:00), thứ Hai–thứ Bảy, không đặt vào quá khứ | Giả định của sinh viên |
| BR-L4-02 | Một kỹ thuật viên không có hai lịch hẹn chồng khung giờ. Hẹn giao máy chỉ khi phiếu ở ĐÃ PHÂN CÔNG trở đi; hẹn nhận máy chỉ khi phiếu HOÀN TẬT | Giả định của sinh viên |
| BR-L4-03 | Khách chỉ đặt lịch cho phiếu của chính mình; phiếu ĐÃ ĐÓNG hoặc ĐÃ HỦY không đặt lịch được | Giả định của sinh viên |

## 6. Bảng truy vết yêu cầu

| Mã FR | Yêu cầu (tóm tắt) | User Story | Use Case | MoSCoW | Test case (BT3) |
|---|---|---|---|---|---|
| FR1 | Xem phiếu chưa phân công | US1 | UC1 | MUST | — |
| FR2 | Xem kỹ thuật viên đủ điều kiện + khối lượng | US2 | UC2 | SHOULD | — |
| FR3 | Gán kỹ thuật viên cho phiếu | US3 | UC3 | MUST | — |
| FR4 | Từ chối gán khi không hợp lệ | US3 | UC3 | MUST | — |
| FR5 | Đổi kỹ thuật viên kèm lý do | US4 | UC4 | SHOULD | — |
| FR6 | Kỹ thuật viên xem phiếu và lịch được giao | US5 | UC5 | SHOULD | — |
| FR7 | Khách đặt lịch giao – nhận máy | US6 | UC6 | MUST | — |
| FR8 | Chặn lịch hẹn trùng | US6 | UC6 | MUST | — |
| FR9 | Gợi ý ≥ 3 khung giờ trống | US7 | UC7 | SHOULD | — |
| FR10 | Xem lịch hẹn theo tuần của kỹ thuật viên | US8 | UC8 | COULD | — |

---

## Phụ lục A. Use Case Diagram

![Use Case Diagram L4](usecase-l4.png)

File gốc: `docs/usecase-l4.drawio`.

**Chú thích.** Ranh giới hệ thống chỉ chứa use case; 3 actor đều ở ngoài. Quản lý trung tâm thực hiện UC1–UC4 và UC8, kỹ thuật viên thực hiện UC5, khách hàng thực hiện UC6. UC3 và UC4 luôn gọi UC2 (phải xem kỹ thuật viên phù hợp trước khi chọn) nên dùng `<<include>>`. UC7 chỉ xảy ra khi UC6 phát hiện trùng lịch nên dùng `<<extend>>`. Nền cam: MUST; nền xanh dương: SHOULD; nền xanh lá: COULD.

## Phụ lục B. Đặc tả use case quan trọng nhất

### UC3 – Gán kỹ thuật viên cho phiếu

| Mục | Nội dung |
|---|---|
| Actor chính | Quản lý trung tâm |
| Mục tiêu | Giao một phiếu mới cho đúng một kỹ thuật viên phù hợp để phiếu có người chịu trách nhiệm |
| Điều kiện trước | Quản lý đã đăng nhập; phiếu ở trạng thái MỚI, chưa có kỹ thuật viên, thuộc trung tâm của quản lý |
| Điều kiện sau | Phiếu có `technician_id`, trạng thái ĐÃ PHÂN CÔNG; một dòng `ticket_status_log` được ghi |
| Liên quan | US1, US2, US3 · FR1–FR4 · QT-06, QT-07, QT-08 · MUST |

**Luồng chính**

1. Quản lý mở danh sách phiếu chưa phân công (UC1).
2. Quản lý chọn một phiếu.
3. Hệ thống hiển thị chi tiết phiếu (mã, nhóm sự cố, mức ưu tiên, hạn cam kết) và danh sách kỹ thuật viên đủ điều kiện kèm số phiếu đang giữ, sắp tăng dần theo số phiếu. *[include UC2]*
4. Quản lý chọn một kỹ thuật viên.
5. Quản lý bấm "Xác nhận phân công".
6. Hệ thống kiểm tra phiếu còn MỚI chưa có người và kỹ thuật viên vẫn đủ điều kiện.
7. Hệ thống lưu kỹ thuật viên, chuyển trạng thái sang ĐÃ PHÂN CÔNG, ghi log trong một giao dịch và báo thành công.

**Luồng ngoại lệ**

- **3a.** Không có kỹ thuật viên đủ điều kiện → hệ thống thông báo "Không có kỹ thuật viên phù hợp", phiếu giữ nguyên MỚI; quản lý xử lý ngoài hệ thống.
- **4a.** Quản lý chọn kỹ thuật viên không đủ điều kiện (khác trung tâm hoặc thành thạo < 3) → từ chối, nêu lý do theo QT-08.
- **6a.** Phiếu vừa được quản lý khác gán → từ chối, không ghi đè, tải lại và hiển thị kỹ thuật viên hiện tại.
- **7a.** Mất kết nối hoặc lỗi khi lưu → hoàn tác giao dịch, phiếu giữ MỚI, cho phép thử lại, không ghi log trùng.

### UC6 – Đặt lịch hẹn giao – nhận máy

| Mục | Nội dung |
|---|---|
| Actor chính | Khách hàng |
| Mục tiêu | Hẹn khung giờ giao máy cho kỹ thuật viên (hoặc nhận máy sau khi sửa xong) mà không trùng lịch |
| Điều kiện trước | Phiếu đã có kỹ thuật viên: ĐÃ PHÂN CÔNG trở đi (giao máy) hoặc HOÀN TẬT (nhận máy); khách biết mã phiếu và số điện thoại đã đăng ký |
| Điều kiện sau | Một lịch hẹn ĐÃ XÁC NHẬN được lưu, gắn với phiếu và kỹ thuật viên, không chồng khung giờ với lịch nào khác của kỹ thuật viên đó |
| Liên quan | US6, US7 · FR7–FR9 · BR-L4-01..03 · NFR2, NFR3 · MUST |

**Luồng chính**

1. Khách nhập mã phiếu và số điện thoại.
2. Hệ thống xác thực, hiển thị phiếu, kỹ thuật viên phụ trách và các loại hẹn hợp lệ.
3. Khách chọn loại hẹn (giao máy hoặc nhận máy).
4. Khách chọn ngày và khung giờ.
5. Hệ thống kiểm tra khung giờ không chồng lịch của kỹ thuật viên.
6. Khách bấm "Xác nhận đặt lịch".
7. Hệ thống lưu lịch hẹn, hiển thị mã lịch hẹn, ngày giờ và địa chỉ trung tâm.

**Luồng ngoại lệ**

- **2a.** Mã phiếu và số điện thoại không khớp → từ chối bằng thông báo chung, không tiết lộ phiếu có tồn tại hay không.
- **2b.** Phiếu chưa có kỹ thuật viên, hoặc đã ĐÃ ĐÓNG/ĐÃ HỦY → thông báo không thể đặt lịch.
- **4a.** Khung giờ ở quá khứ, ngoài 08:00–17:30 hoặc vào Chủ nhật → từ chối, nêu khung giờ hợp lệ (BR-L4-01).
- **5a.** Khung giờ trùng lịch của kỹ thuật viên → không lưu, hiển thị ít nhất 3 khung giờ trống gần nhất *[extend UC7]*; khách chọn lại và quay về bước 5.
- **5b.** Không còn khung trống trong 7 ngày tới → thông báo và đề nghị chọn ngày khác.
- **6a.** Hai khách xác nhận cùng khung giờ của cùng kỹ thuật viên gần như đồng thời → chỉ một yêu cầu thành công; người còn lại nhận kết quả như 5a.
- **7a.** Mất kết nối khi lưu → giữ lại lựa chọn trên màn hình, cho phép thử lại, không tạo lịch hẹn trùng.

## Phụ lục C. Mẫu đặc tả riêng theo track SE

Xem `docs/api-contract.md`.
