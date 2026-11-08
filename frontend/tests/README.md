# Frontend tests

Từ frontend: `npm test` bằng Node test runner; thêm `npm run lint`, `npm run build`. Không đọc env thật hoặc gọi DB/provider.

Các `*.test.js` kiểm tra health URL, session/Bearer/envelope, intake/UAS/workflow payload, dirty clinical fields, media requests và portal ownership/timezone. render-fixture.js phục vụ rendering.test.js: Vite bundle JSX và React server render kiểm tra allowlist, escaping, precision, labels, loading/empty/error và controls.

Unit/render không chứng minh DOM interaction. Browser opt-in CAP/MAN/PATIENT tách ở [scripts](../scripts/README.md), dùng localhost API tổng hợp; không thay live backend/PG/provider acceptance.
