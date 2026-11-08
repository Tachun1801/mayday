# 08 — API Response Contract and Business Errors

## Contract mới được owner chấp nhận — 2026-11-07

Các write slices DB-first giữ code1000/OK và HTTP201 cho create, HTTP200 cho update/read; bigint string, bool boolean, decimal input string, date YYYY-MM-DD. PATCH chỉ field gửi, null clear nullable. Mã lỗi đã có được tái sử dụng; không tự thêm1001 hoặc blanket-stringify. Exact endpoint payloads/errors tại [current-api](../current-api.md). New create response tối thiểu identifiers; UI không báo thành công/auto retry khi outcome chưa rõ, yêu cầu readback. Các response nguồn cũ có fields không có persistence không được giả nhận/lưu.

Signup trả201/data{account_id,patient_id}, không auto-token/verified flag. First-contact lookup200 chỉ patient_id/full_name/birth_date/gender; no match/đã có hồ sơ404 không danh tính; intake201/data{patient_id,record_id,visit_id,status:draft}, cạnh tranh409. Media upload201/data{id,record_id}; authorized content là binary riêng tư, không JSON/signed redirect. Rate limits429+Retry-After không bịa business code; provider503/9903 có thông báo chung, không URLs/keys/raw errors. Account/UAS read scope siết lại giữ envelope/field types.


## Response envelope

From the detailed API Sheet, typical success/error responses use:

```json
{
  "code": "1000",
  "message": "OK",
  "data": {}
}
```

- `code` is a **string application code**, not the HTTP status. Choose HTTP 2xx/4xx/5xx separately and consistently after inspecting existing contracts.
- Successful reads usually use `"1000"`. Several create endpoints in slides/endpoint tabs use `"1001"` (Created successfully) **but `1001` is missing from the central response-code tab**. Treat this as a spec issue; don't erase 1001 without resolution.
- `message` is an external string. Avoid leaking internal stack traces, SQL, secrets or record contents into it.
- `data` contains an object or array as specified by each API tab. Do not assume every endpoint returns an identical pagination wrapper.
- Some endpoints are described as returning IDs/bools as strings. Respect verified endpoint contracts, and transform in a dedicated serializer/FE API adapter.
- Client must handle token expiry and `3101`/`3106` without assuming access based on a visible menu.

## Business code inventory from Google Sheet

| Code | Message in Sheet | Intended situation |
|---|---|---|
| `1000` | OK | Thành công |
| `2001` | Missing required parameter | Thiếu tham số |
| `2002` | Invalid parameter type | Sai kiểu |
| `2003` | Invalid parameter value | Sai giá trị |
| `2004` | Invalid phone number format | Sai định dạng số VN |
| `2005` | Invalid email format | Sai email |
| `2006` | Invalid date format | Ngày phải YYYY-MM-DD |
| `2007` | Request body invalid | JSON body không hợp lệ |
| `3001` | Token is invalid | Token sai |
| `3002` | Token expired | Token hết hạn |
| `3003` | User not authenticated | Chưa xác thực |
| `3004` | OTP incorrect | OTP sai |
| `3005` | OTP expired | OTP hết hạn |
| `3006` | User phone or email already exists | Trùng tài khoản |
| `3007` | User account not found | Không có user |
| `3008` | Password incorrect | Sai mật khẩu |
| `3009` | Old password incorrect | Sai mật khẩu cũ |
| `3101` | Permission denied | Không được phép |
| `3102` | Admin role required | Yêu cầu Admin |
| `3103` | Doctor role required | Yêu cầu Doctor |
| `3104` | Patient role required | Yêu cầu Patient |
| `3105` | Doctor not assigned to this record | Không phải bác sĩ phụ trách |
| `3106` | Cannot access another user's data | Không được xem dữ liệu khác chủ |
| `4001` | Medical record not found | Không có bệnh án |
| `4002` | Active medical record required | Cần bệnh án active |
| `4003` | Medical record already completed | Bệnh án đã hoàn tất |
| `4004` | Medical record not in pending status | Không còn pending |
| `4005` | Medical record already accepted by another doctor | Đã có bác sĩ nhận |
| `4006` | Classification options incomplete | Thiếu phân loại |
| `4007` | Answers list cannot be empty | Câu trả lời rỗng |
| `4008` | Question not found in template | Câu hỏi không thuộc mẫu |
| `4009` | Invalid medical record status | Trạng thái không hợp lệ |
| `4101` | Template not found | Không có mẫu |
| `4102` | Template code already exists | Mã mẫu trùng |
| `4103` | Section not found | Không có section |
| `4104` | Question not found | Không có question |
| `4105` | Template in use cannot be deleted | Không xóa mẫu đã dùng |
| `5001` | Patient not eligible for UAS7 scoring | Không đủ điều kiện UAS7 |
| `5002` | UAS7 score for this date already submitted | Đã nộp điểm ngày này |
| `5003` | Invalid ISS7 itch score value | Giá trị ISS7 không hợp lệ |
| `5004` | Invalid HSS7 hive score value | Giá trị HSS7 không hợp lệ |
| `5005` | Score date is required | Thiếu ngày |
| `6001` | Image file is required | Thiếu ảnh |
| `6002` | Unsupported image file format | Kiểu ảnh không hỗ trợ |
| `6003` | Image file size exceeds limit | File quá lớn |
| `6004` | Exceeded maximum batch upload count | Quá 10 ảnh |
| `6005` | Image attachment not found | Không tìm thấy tệp |
| `6006` | Image already mapped to answer | Ảnh đã liên kết |
| `6007` | MinIO object storage error | Lỗi lưu trữ |
| `7001` | Lesion episode not found | Không có đợt |
| `7002` | Lesion location not found | Không có vị trí |
| `7003` | Lesion photo record not found | Không có ảnh theo dõi |
| `7004` | Lesion name cannot be empty | Thiếu tên đợt |
| `7005` | Body part cannot be empty | Thiếu vùng cơ thể |
| `7006` | Invalid milestone value | Chỉ start/peak/normal |
| `7007` | Symptom score out of range | Triệu chứng 0–10 |
| `8001` | Medicines list cannot be empty | Không được rỗng |
| `8002` | Medicine name is required | Thiếu tên thuốc |
| `8003` | Prescription already exists for this record | Đơn đã tồn tại |
| `8101` | Lab tests list cannot be empty | Không có mục xét nghiệm |
| `8102` | Test name is required | Thiếu tên xét nghiệm |
| `8103` | Lab request not found | Không có yêu cầu |
| `9001` | AI model inference failed | Lỗi suy luận AI |
| `9002` | AI service unavailable | AI không sẵn sàng |
| `9003` | Invalid itch severity for AI calculation | Thang đo AI không hợp lệ |
| `9101` | FCM token is required | Thiếu FCM token |
| `9102` | Notification not found | Không có notification |
| `9901` | Internal server error | Lỗi server |
| `9902` | Database connection error | Lỗi DB |
| `9903` | Third-party service error | Lỗi dịch vụ ngoài |

## Quality gates

- Centralize a code registry in backend; don't hard-code numeric messages in every controller.
- Test mappings from invalid JWT, missing parameters, nonexistent resources, ownership denial and SQL constraint failure.
- Confirm whether `1001` is the canonical created code and agree on HTTP 201 behavior.
- **UAS7 terminology conflict:** some slide sections describe ISS7 as hive count and HSS7 as itch, while the response-code Sheet labels `5003 ISS7 itch` and `5004 HSS7 hive`. Do not codify a clinically misleading label until resolved.
- The central response-code tab has a **separate unrelated legacy bitmask table in columns F–J**; do not merge those codes (`9992`, etc.) into the DrMayDay application-code registry.

## Current record workflow HTTP mapping — 2026-11-07

PATCH /api/v1/medical-records/:id/status uses string codes already listed above: 200/1000 with data {id:"<string>",status}; malformed/extra input fields 400/2003; unsupported target 400/4009; invalid transition or failed conditional update 409/4009; already completed 409/4003; missing/unassigned record 404/4001; patient-only or missing capability 403/3101. Missing/invalid/expired JWT retains shared auth mapping. Error data is null, raw database errors stay private. The 4004 pending-only code is not reused for the owner-approved draft workflow.
