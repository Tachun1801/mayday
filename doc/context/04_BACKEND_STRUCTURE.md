# 04 — Cấu trúc backend

Express/CommonJS; source thực tế được mô tả ở [backend/src](../../backend/src/README.md). Entry `src/app/server.js`, assembly `src/app/app.js`; không dùng cây thư mục dự kiến cũ để tạo module rỗng.

| Thư mục | Trách nhiệm |
|---|---|
| app | HTTP bootstrap, inject dependencies, shutdown |
| config | Env, JWT/RBAC/signup role, Cloudinary |
| database | Một pg.Pool lazy và withTransaction |
| modules/health | Public liveness |
| modules/auth | Signup/login, principal, own profile/password |
| modules/clinical | Patient/record/visit, history, RX/labs/UAS/lesions, facilities/catalog |
| modules/administration | Same-branch staff và role/permission management |
| modules/media | Private upload/metadata/binary access, Cloudinary adapter |
| shared | Controlled errors/HTTP handler, account limiter |
| scripts, tests | CLI opt-in và node:test bằng doubles |

Routes chọn middleware/action; controller dịch HTTP; service giữ workflow/scope/transaction; repository giữ SQL tham số; validation giới hạn input. Một số read/auth handlers hiện nằm ngay routes, không giả tất cả đã tách controller. Không nhận generated/owner/status tùy ý hoặc đưa raw DB errors ra client.

Mỗi source directory có README ngắn, dẫn contract/schema/tests; không lặp toàn DDL. [Backend README](../../backend/README.md) giữ startup/check commands; [API](../current-api.md), [schema](../project-schema-map.md) và [báo cáo](../project-report.md) giữ thông tin chi tiết.
