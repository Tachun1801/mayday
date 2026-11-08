# 01 — Phạm vi và yêu cầu

Yêu cầu gốc từ slide/workbook được ghi nguồn tại [13](13_SOURCES.md); trạng thái thực hiện ở [báo cáo](../project-report.md). Không xem danh sách yêu cầu dưới đây là chức năng đã hoàn thành.

## Các nhóm chức năng

1. Tài khoản: signup/login/logout, hồ sơ cá nhân, đổi/quên/reset mật khẩu; tạo tài khoản staff theo quyền.
2. Tổ chức/RBAC: chi nhánh, khoa, phòng, staff/role/permission và kiểm soát API; mô hình hierarchy/endpoint mapping nguồn phải đối chiếu schema thực tế.
3. Form động: Template → Section → Question → Option, thứ tự, loại câu hỏi, patient/doctor/both, điều kiện hiện câu con; bảo toàn câu trả lời lịch sử khi thay template. Schema hiện chưa hỗ trợ persistence này.
4. Bệnh nhân/hồ sơ: tìm kiếm/phân loại/tiếp nhận, khám/phiên/tái khám, lịch sử và hoàn tất; đọc/sửa phải đúng quyền và ownership/assignment. Luồng đã duyệt dùng draft → in_progress → completed, khác hàng đợi pending trong nguồn.
5. Tổn thương: đợt → vị trí → ảnh, mốc start/peak/normal và chỉ số triệu chứng; AI/AUAS nếu có phải phân biệt với quan sát người dùng.
6. UAS7: điểm ngày hai thành phần 0..3, chống trùng và tổng hợp tuần khi policy được duyệt; HSS sẩn phù, ISS ngứa theo schema.
7. Đơn/xét nghiệm/media: đơn và chi tiết, chỉ dẫn; yêu cầu xét nghiệm và kết quả là hai mô hình riêng; ảnh riêng tư, attachment và liên kết theo phạm vi.
8. Thông báo: FCM token, lịch sử/read/delete/settings; tích hợp OTP và external AI khi đủ contract/provider/persistence.

Web phục vụ bác sĩ/nhân viên/quản trị và cổng bệnh nhân do owner bổ sung 07/11. Portal chỉ own data, không tự mở bệnh án/intake/editor của bác sĩ. Mobile riêng; huấn luyện/model AI và provision database không thuộc phạm vi repo.

## Mục tiêu phi chức năng

| Nguồn yêu cầu | Tình trạng |
|---|---|
| Form load/save <500 ms, AI 3–5 giây, uptime 99,9% | Mục tiêu nguồn, chưa đo/chưa đạt SLA được chứng minh |
| Tối đa 10 ảnh/lượt | UI hiện gửi tuần tự; limit được owner duyệt 5 MiB/ảnh, không batch atomic |
| JWT/RBAC/HTTPS/ownership/assignment | Backend kiểm tra; DB endpoint hiện hữu có ngoại lệ TLS riêng, không áp cho transports khác |
| Toàn vẹn và UX | Transaction/constraints, chống duplicate, label/keyboard/loading/empty/error/readback; kiểm thử cụ thể theo module |
| Mở rộng chuyên khoa | Form động vẫn là requirement, chưa được thay thế bằng fixed CAP/MAN forms |

Giới hạn persistence, clinical policy, provider và release tại [quyết định](11_DECISIONS_AND_GAPS.md); không tự thêm schema/storage, diagnosis hoặc quy tắc điều trị để lấp gap.
