# 05 — Cấu trúc frontend

React/Vite/JSX ESM; entry `src/main.jsx`, router/providers/layout tại `src/app/App.jsx`. Dùng React Router, Axios và Node test runner hiện có, không thêm stack song song.

| Nhóm | Thư mục hiện có |
|---|---|
| App | app: public login/register/system, staff workspace và patient portal |
| Business UI | features/auth, patients, medical-records, patient-portal, media, admin, facilities, catalogs, system |
| Hạ tầng | shared/api, session, ui; use-resource và use-mutation |
| Assets/test | src/assets, public, tests, scripts/browser-workflow.js |

[Feature index](../../frontend/src/features/README.md) dẫn README từng module; [app README](../../frontend/src/app/README.md) giữ route map. Không tạo thư mục trống theo cây đề xuất cũ.

Feature chọn fields/payload, shared tập trung API envelope/Bearer/cancellation/401 và UI states. Token chỉ memory, patient ID từ session; dual identity có thể đổi workspace nhưng portal vẫn own-record. Backend quyết định quyền/công thức lâm sàng; UI không tự tính hoặc diễn giải kết quả khác contract.

Danh sách có loading/empty/error/retry/phân trang; form có label, pending guard, readback sau outcome không rõ và không tự retry mutation. Media dùng authenticated bytes → Blob/object URL/revoke, không public provider URL. Form CAP/MAN là fixed fields, chưa dynamic template engine.

[Frontend README](../../frontend/README.md) giữ startup/verification; [tests](../../frontend/tests/README.md) phân biệt unit/render và browser fake API với live backend/DB/provider acceptance. Contract ở [current-api](../current-api.md).
