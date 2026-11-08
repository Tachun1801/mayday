# DrMayDay / Mayday

Hệ thống quản lý khám và theo dõi mề đay cấp/mạn, có Web nhân viên/bác sĩ/quản trị và cổng bệnh nhân. Backend Express, frontend React/Vite, PostgreSQL hiện có; không migration hoặc seed.

## Chạy local

Yêu cầu Node.js 24+. Chạy `npm ci` riêng trong `backend/` và `frontend/`, tham khảo `.env.example` của mỗi ứng dụng và giữ `.env` hiện có riêng tư.

- Backend: `cd backend`, `npm run dev` — mặc định `127.0.0.1:3000`.
- Frontend: `cd frontend`, `npm run dev` — mặc định `127.0.0.1:5173`.
- Business API cần bật DB và cấu hình JWT; `/health` chỉ xác nhận HTTP hoạt động.
- Kiểm tra backend: `npm run lint`, `npm test`; frontend: `npm test`, `npm run lint`, `npm run build`.

## Tài liệu

- [Báo cáo dự án](doc/project-report.md): chức năng đã có, phần còn thiếu, nguyên nhân và kiểm chứng.
- [Backend](backend/README.md), [frontend](frontend/README.md): cấu trúc và cách chạy.
- [Tài liệu kỹ thuật](doc/README.md): API, schema, vận hành và context.
- [AGENTS.md](AGENTS.md): quy tắc làm việc và bảo vệ dữ liệu.

Chưa nghiệm thu production hoặc ghi lâm sàng/concurrency trên DB thật. Không đưa credentials hay dữ liệu y tế vào Git.
