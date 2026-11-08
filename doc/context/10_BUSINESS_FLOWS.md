# 10 — Luồng nghiệp vụ hiện hành

Routes/payload/action chi tiết tại [current-api](../current-api.md); các luồng này theo quyết định owner database-first, thay ví dụ pending/accept/template/completed_at trong nguồn cũ.

## Đăng ký và khám lần đầu

1. Bệnh nhân `/register` tạo fresh nguoi/benhnhan/taikhoan với role cấu hình; không OTP/link theo phone/auto-login. Đăng nhập chung `/login` rồi vào `/portal`.
2. Staff có cả patients.write/records.write nhập đúng username+phone tại `/patients/first-contact`; lookup chỉ trả identity tối thiểu nếu chưa có hồ sơ.
3. Transaction READ COMMITTED khóa patient/account/person, kiểm tra occupancy lại; tạo hồ sơ CAP/MAN + subtype và phiên đầu + subtype, doctor là caller, room cùng branch. Cạnh tranh chỉ một request thành công, không tạo lại danh tính.

## Tiếp nhận và khám/tái khám

1. Intake mới tại điểm khám tạo người/bệnh nhân/hồ sơ/phiên đầu nguyên tử; với patient có sẵn, bác sĩ phải có assignment trước khi tạo hồ sơ mới riêng.
2. Bác sĩ được phân công chuyển draft → in_progress, nhập fixed CAP/MAN record/visit/history/vitals/lesions; chỉ sửa own visit trên active record.
3. Tạo phiên tái khám trên record đã assigned, bác sĩ mới là caller; số lần cấp dưới parent lock và UNIQUE.
4. Kê đơn + items + stop instructions nguyên tử, hoặc nhập kết quả + subtype; đọc lại đúng field/unit/precision, không tự tính NLR/PLR hoặc quyết định điều trị.
5. Assigned doctor chuyển in_progress → completed. Parent lock tuần tự hóa complete với child write; completed chỉ đọc, không queue/reassign/cancel/reopen.

## Theo dõi tại nhà

- Portal lấy patient ID từ session, đọc own records/visits/đơn/kết quả; kiểm tra ownership trước child views kể cả dual identity.
- UAS chỉ hôm nay giờ Việt Nam, own active MAN, HSS sẩn phù/ISS ngứa 0..3; tổng do DB sinh, duplicate bệnh nhân/ngày bị từ chối. Chưa cycle/weekly/backfill/edit.
- Ảnh upload raw vào active record theo owner/assigned scope; metadata transaction recheck parent sau provider upload. Viewer tải binary có xác thực → Blob/revoke; completed còn đọc.
- Lesion MAN tạo đợt/vị trí, gắn attachment cùng record và location cùng episode; cập nhật start/peak/normal/NRS/count, không AI/AUAS tự động hoặc delete.
- Profile/password dùng API own-account; đổi password yêu cầu login lại. Staff-only và patient-only không vào nhầm workspace, backend vẫn kiểm tra riêng.

## Quản trị và lỗi

Staff có quyền quản trị làm việc trong cùng branch, grant không vượt caller và chặn self-lockout. Khoa/phòng thuộc branch độc lập, danh mục clinical global không cấp quyền đọc mọi hồ sơ. Không transfer/hard-delete/reset password người khác.

Mọi mutation không rõ outcome cần đọc lại list/detail trước retry; signup thử login/liên hệ trước đăng ký lại. Không auto retry POST, không coi network error chứng minh transaction chưa COMMIT. Các phần chưa làm (form động, notifications/OTP/AI, lab ordering và clinical policy mở rộng) nằm trong [báo cáo](../project-report.md), không giả flow đã hoàn chỉnh.
