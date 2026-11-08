# Cổng bệnh nhân

PatientPortal.jsx cung cấp workspace/home/own-record list/detail tại `/portal`; PatientUas.jsx gửi điểm ngày và đọc lịch sử; PatientLesions.jsx tạo/chọn đợt/vị trí/ảnh. portal.js giữ helper ownership, active state, ngày Việt Nam và payload.

Patient ID lấy từ session; kiểm tra record thuộc chính patient trước child views kể cả dual identity. Chỉ đọc clinical/đơn/kết quả; ghi UAS/media/lesion theo policy hiện có; không clinical editor/intake/status/admin. Dùng chung auth profile và private media viewer. Completed chỉ đọc, dữ liệu chọn attachment/location có phân trang.

[Contract](../../../../doc/current-api.md). Tests patient-portal/rendering và browser PATIENT với fake API; backend patient-web tests kiểm tra quyền/ownership riêng, chưa live DB acceptance.
