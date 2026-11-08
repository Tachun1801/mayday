# Backend

Express 5/CommonJS, Node.js 24+, REST `/api/v1`. Một `pg.Pool` dùng chung; SQL tham số hóa nằm trong repository, nghiệp vụ/transaction trong service.

## Chạy và kiểm tra

Từ `backend/`: `npm ci`, `npm run dev` (hoặc `npm start`), `npm run lint`, `npm test`. Tests dùng mock/fake và HTTP loopback, không DB remote.

Cấu hình theo [.env.example](.env.example), không ghi đè `.env` riêng tư. `DATABASE_ENABLED=false` mặc định; business routes chỉ mount khi có pool và `JWT_SECRET` tối thiểu 32 bytes. `PATIENT_SIGNUP_ROLE_ID` bật signup/first-contact với role đã có. Cloudinary cần đủ ba biến cấu hình phía backend. `/health` không kiểm tra DB/provider.

## Cấu trúc

- [src/](src/README.md): app, config, database, modules và shared.
- [scripts/](scripts/README.md): công cụ DB opt-in; không tự chạy khi startup/test.
- [tests/](tests/README.md): kiểm thử API, nghiệp vụ, bảo mật và transaction bằng doubles.

Pool lazy, tối đa 10 kết nối, connect timeout 5s/query timeout 10s; shutdown đóng HTTP/pool trong giới hạn 10s. Chỉ DB endpoint hiện có được phép `sslmode=disable`; TLS endpoint khác phải xác minh certificate, không gửi startup `statement_timeout`.

[Contract API](../doc/current-api.md), [báo cáo chức năng](../doc/project-report.md), [cấu hình/vận hành](../doc/production-runbook.md). Không migration/seed/schema sync; chưa nghiệm thu ghi lâm sàng thật hoặc production.
