# Bản đồ schema DrMayDay

Nguồn cấu trúc duy nhất: [mayday.sql](mayday.sql), 44 bảng và view `v_chukytheodoiuas7`. Dump có dữ liệu riêng tư: chỉ đọc DDL cần thiết, không import/seed hoặc sao chép phần dữ liệu vào tài liệu/tests. Bảng dưới là bản đồ lưu trữ, không phải danh sách tính năng đã triển khai; xem [báo cáo](project-report.md).

## Nhóm bảng

| Nhóm | Các bảng trong dump |
|---|---|
| Identity | `nguoi`, `taikhoan`, `benhnhan`, `nhanvien` |
| Access control | `vaitro`, `quyenhan`, `vaitroquyenhan` |
| Facilities | `chinhanh`, `khoaphong`, `phongkham` |
| Clinical record and subtype | `hosobenhan`, `benhanmaydaycap`, `benhanmaydayman` |
| Clinical history | `tiensubanthan`, `hoancanhkhoiphatdiung`, `benhsucacdotbenhtruoc`, `tinhtrangnhiemtrung` |
| Examination session | `phienkham`, `phienkhamcap`, `phienkhamman` |
| Clinical observations | `dauhieusinhton`, `chitiettonthuongcaptinh`, `chitiettonthuongsanphu`, `dacdiemsanphu` |
| UAS / AAS / PROMs | `chukytheodoiuas7`, `nhatkyuashangngay`, `nhatkyaashangngay`, `danhgiamucdohoatdongbenh`, `ketquaproms` |
| Lesion progression | `dottonthuongda`, `vitritonthuong`, `anhchuptonthuong` |
| Media | `tepdinhkem` |
| Prescriptions and drug catalogue | `donthuoc`, `chitietdonthuoc`, `chidanngungthuoc`, `thuoc` |
| Laboratory results | `ketquacanlamsang`, `ketquacanlamsangcap`, `ketquacanlamsangman` |
| Provocation testing | `phiennghiemphapkichthich`, `chitietketquanghiemphap`, `loainghiemphap` |
| Screening | `sanglocbaodongdo` |

## Ràng buộc cần giữ khi viết code

- Identity tách `nguoi`, `taikhoan` và subtype bệnh nhân/nhân viên; username unique không phân biệt hoa thường, một tài khoản/người; phone không unique. Account ID không phải person/patient/staff ID.
- RBAC role–permission N:M; không có role cha hoặc bảng endpoint mapping. Quyền API lấy từ config và catalogue, phạm vi tài nguyên kiểm tra riêng.
- Khoa và phòng khám cùng thuộc chi nhánh; nhân viên gắn branch. Không có FK phòng→khoa hoặc record-level assigned_doctor_id/template_id/created_by/completed_at.
- Hồ sơ CAP/MAN, phiên khám CAP/MAN và kết quả CAP/MAN có cặp cha/subtype bắt buộc qua FK deferred: tạo trong cùng transaction, subtype phải khớp khi COMMIT.
- `phienkham.ma_bac_si` chỉ tới nhân viên; FK không tự chứng minh quyền bác sĩ. Số lần khám UNIQUE trong hồ sơ; parent lock bảo vệ cấp số và ghi cạnh tranh với complete.
- Đơn thuốc phải đúng cặp phiên/hồ sơ; chi tiết dùng đúng một trong mã thuốc/tên bổ sung. Không áp ràng buộc một đơn/hồ sơ khi DDL không có.
- UAS ngày UNIQUE bệnh nhân/ngày; HSS sẩn phù, ISS ngứa 0..3; tổng ngày generated. Chu kỳ đúng 7 ngày nhưng không có exclusion constraint chống chồng lấn.
- Đánh giá tuần có CHECK HSS7/ISS7 0..21, UAS7 0..42 riêng biệt; không generated sum và không CHECK buộc các tổng bằng nhau. View `v_chukytheodoiuas7` đếm ngày hợp lệ, không tự tổng hợp điểm tuần.
- AAS daily có generated sum tối đa 12 theo bốn thành phần 0..3; `phienkhamman.diem_aas7` CHECK 0..105. Không tự đổi thang hoặc tính lâm sàng để hòa giải.
- NLR/PLR và các biểu thức generated chỉ đọc; identity khác generated expression. Bigint/numeric giữ precision, date/timestamptz/interval/nullability theo contract.
- CHECK nullable có thể nhận NULL nếu không có ràng buộc khác; không mặc định mọi range đều bắt buộc nhập.
- Lesion/UAS/AAS có composite FK cùng bệnh nhân; ảnh có composite FK cùng đợt/vị trí. Service còn phải xác minh attachment cùng hồ sơ; FK không thay authorization. Mốc ảnh start/peak/normal do API kiểm tra, không suy có CHECK DB.
- Attachment thuộc hồ sơ, uploader có thể SET NULL, ảnh tham chiếu attachment bằng RESTRICT. Không suy FK delete thành quyền xóa object storage.
- Phần lớn FK lâm sàng RESTRICT/NO ACTION; CASCADE có ở subtype kết quả và role-permission. Luôn đọc constraint cụ thể trong DDL trước thao tác xóa.
- Timestamp triggers không áp cho mọi bảng. `fn_cap_nhat_cha_kqcls` cập nhật timestamp kết quả cha; `fn_cap_nhat_thoi_gian` xử lý timestamp và bảo vệ thời điểm tạo theo tham số trigger.
- Nghiệm pháp có một phiên/phiên khám mạn, chi tiết/cờ căn nguyên dùng composite FK; screening có UUID unique, patient nullable và generated risk/route. Không tự mở public endpoint hoặc diễn giải chẩn đoán từ cấu trúc bảng.

## Khoảng trống và kiểm chứng

Không có mô hình dynamic forms/answers/answer_images, notification/device/settings, OTP/session/blacklist hay lab-request header/items trong dump. Không thay chúng bằng các bảng lâm sàng chuyên biệt. Gate chuyên môn/provider tại [decisions](context/11_DECISIONS_AND_GAPS.md).

Audit lịch sử READ ONLY khớp 44 bảng/507 cột về tên/thứ tự/type/nullability/generated/identity/default presence; chưa đối chiếu biểu thức, toàn bộ constraints/indexes/triggers hoặc runtime writes. `backend/scripts/schema-contract.js` parse cấu trúc DDL, không execute dump; `npm run db:verify` là CLI opt-in, không tự chạy khi startup/tests. Xem [runbook](production-runbook.md).
