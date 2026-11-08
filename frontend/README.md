# Frontend

React 19/Vite/JSX, React Router và Axios; Node.js 24+. Web gồm staff/admin và patient portal, chỉ gọi HTTP API, không truy cập PostgreSQL.

## Chạy và kiểm tra

Từ frontend: `npm ci`, `npm run dev` (mặc định `127.0.0.1:5173`). Kiểm tra: `npm test`, `npm run lint`, `npm run build`; `npm run preview` xem build.

[.env.example](.env.example) chỉ chứa cấu hình public. `VITE_API_BASE_URL` mặc định `/`; client thêm `/api/v1` một lần, health gọi `/health`. Vite proxy backend local; production cần HTTPS reverse proxy và SPA fallback theo [runbook](../doc/production-runbook.md). Không đặt secrets trong biến VITE.

- [src/](src/README.md): app/features/shared và assets.
- [tests/](tests/README.md): unit/render tests bằng Node.
- [scripts/](scripts/README.md): browser opt-in CAP/MAN/PATIENT với API tổng hợp.
- [public/](public/README.md): static assets public.

Shared `/login`, `/register`; staff làm việc ở `/patients`, `/medical-records`, `/admin`; patient ở `/portal`. Token chỉ trong memory, backend quyết định quyền. Sau mutation không rõ outcome phải đọc lại trước retry. [Báo cáo chức năng](../doc/project-report.md), [contract](../doc/current-api.md); chưa nghiệm thu production/DB/provider thật.
