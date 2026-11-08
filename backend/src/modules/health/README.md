# Health

`health.routes.js` khai báo GET; `health.controller.js` trả status ok. App mount tại `/health`. Đây là liveness HTTP công khai, không có bảng DB, quyền y tế hoặc dependency dịch vụ ngoài. Không cần service/repository vì chưa có nghiệp vụ. Kiểm thử ở backend/tests/foundation.test.js; không biểu thị readiness DB.
