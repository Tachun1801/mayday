# Backend operator scripts

Chạy opt-in từ backend; không script nào tự chạy khi startup hoặc `npm test`. Không in URI, credentials, raw errors hoặc dữ liệu bệnh nhân.

| Lệnh / file | Tác dụng |
|---|---|
| `npm run db:check` / check-database.js | BEGIN READ ONLY → metadata version/TLS/read-only → ROLLBACK, release/end |
| `npm run db:verify` / verify-database.js | So sánh column metadata và audit role/permission/action catalogue, không đọc clinical/account rows |
| schema-contract.js | Parse DDL local, không execute/import dump hoặc dùng COPY data |
| `npm run db:patient-access` / enable-patient-access.js | Preview READ ONLY cho existing patient role-permission link |
| `npm run db:patient-access -- --apply` | Operator INSERT-only có chủ đích, chỉ trong phạm vi owner đã cho phép; không dùng để test/seed |

Verify so tên/thứ tự/type/nullability/generated/identity/default presence; không chứng minh expressions, full constraints/indexes/triggers hoặc runtime writes. Exit 0 khi đạt, 1 khi lỗi/readiness gap; audit không tự sửa grants.

Patient-access kiểm tra schema 44/507, target role/permission/mapping, không staff membership và grant table PK/default/no RLS/custom enabled triggers/rewrite rules. Apply khóa role/permission, chỉ INSERT missing vaitroquyenhan với donor NULL và ON CONFLICT DO NOTHING; giữ link cũ/timestamp, không tạo user/role/permission hoặc clinical fixtures. Readback trước COMMIT; outcome không rõ không retry. Đã ghi nhận một INSERT được phép ngày 07/11, audit sau đó đạt; xem [báo cáo](../../doc/project-report.md).

Tests db-check/db-verify/patient-access dùng doubles; không chạy apply để nghiệm thu. Cấu hình, giới hạn TLS và đối soát tại [runbook](../../doc/production-runbook.md).
