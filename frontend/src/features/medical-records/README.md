# Hồ sơ và khám bệnh Web

Staff routes `/medical-records`, `/:id`, `/:id/visits/:visitId`; chỉ assigned doctor có capability được sửa active record/own visit. Completed chỉ đọc; backend kiểm tra lại mọi thao tác.

- RecordsPage/RecordWorkflow: danh sách, chi tiết và `draft → in_progress → completed`.
- ClinicalEditor/editor-fields/clinical-form: form CAP/MAN cố định, dirty fields, giữ decimal/false/zero/null; không ghi generated hoặc field phân công.
- ClinicalHistory/clinical-fields: tiền sử, phiên, sinh hiệu/tổn thương theo loại.
- VisitEntry/ClinicalResults/clinical-details: nhập và xem đơn/kết quả, đúng field/unit/precision; chưa sửa/hủy/ký bản đã lưu.
- LesionForms/LesionHistory: đợt/vị trí/ảnh MAN, attachment cùng record và milestone/NRS/count; viewer dùng public media API.

Shared useMutation chống submit trùng, yêu cầu readback khi outcome không rõ; không tự retry POST. Prescription/lab details được dùng lại trong patient portal, không tự chỉ định điều trị. [Contract](../../../../doc/current-api.md).

Tests clinical-form, record-workflow, rendering; browser CAP/MAN với fake API. Chưa form động/clinical policy mở rộng hoặc DB/provider E2E.
