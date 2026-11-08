# Bệnh nhân và tiếp nhận

PatientsPage.jsx: danh sách/tìm kiếm/chi tiết/lịch sử bệnh nhân có phân trang. NewIntakePage.jsx: intake mới và hồ sơ mới cho bệnh nhân đã có phân công; intake-payload.js tạo payload allowlist, không nhận doctor/status tùy ý.

FirstContactPage.jsx: `/patients/first-contact`, tra đúng username+phone để tiếp nhận người đăng ký chưa có hồ sơ; giữ identity từ lần lookup, chống submit trùng và không mở directory toàn cục. Backend quyết định assignment/branch/transaction.

[Contract](../../../../doc/current-api.md). Tests intake-payload/render và browser CAP/MAN có lookup 403/404, reset, intake và readback; chưa DB thật.
