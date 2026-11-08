# Trạng thái HTTP

system.api.js gọi `/health`; SystemStatus.jsx hiển thị loading/success/error/retry, abort và aria-live. Health URL tách khỏi business prefix, hỗ trợ `VITE_HEALTH_URL` override. Chỉ xác nhận process HTTP, không DB/provider readiness. URL tests ở `frontend/tests/health-url.test.js`.
