# Backend tests

Từ backend chạy `npm test` (node:test), `npm run lint`; chạy riêng bằng `node --test tests/<file>.test.js`. HTTP tests cần loopback port; không đọc `.env` thật hoặc gọi DB/provider remote.

- Foundation/config/lifecycle/transaction: bootstrap, lỗi, cleanup, BEGIN/COMMIT/ROLLBACK và timeout.
- Auth/signup/profile/patient-web: JWT, quyền reload, ownership, validation, hash invalidation, staff guard và đăng ký.
- Clinical/intake/first-contact/workflow/UAS/lesions: scope, allowlists theo DDL, subtype, duplicate, rollback và queued-lock race doubles.
- Administration/catalog: branch, subset grant, self-lockout và transaction.
- Media: ảnh tổng hợp, transport giả, private metadata/binary, compensation và ambiguous COMMIT.
- DB check/verify/patient-access: CLI bằng fake pool; parser DDL không dùng phần dữ liệu dump.

Mock lock/transaction không thay nghiệm thu PostgreSQL constraint/concurrency thật. Browser acceptance nằm ở frontend và dùng API tổng hợp.
