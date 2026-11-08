# Administration

Mount `/api/v1/admin`: đọc accounts/roles/permissions/mapping, tạo staff/role, sửa account và thay permission set. [Contract](../../../../doc/current-api.md) ghi payload/actions.

`administration.routes.js` khai báo middleware/routes; `administration.repository.js` đọc dữ liệu. Nhóm `administration-write.controller/service/repository/validation.js` lần lượt xử lý HTTP, policy/transaction, SQL và input.

Bảng: nguoi, nhanvien, taikhoan, chinhanh, vaitro, quyenhan, vaitroquyenhan. Mọi route cần staff; account directory và chỉnh staff giới hạn same-branch. Quyền target/grant phải subset caller, không tự đổi role/active hoặc own-role mapping; chặn role ảnh hưởng patient-only/out-of-branch accounts. Reload/khóa actor/role trong transaction; không hard-delete, branch transfer hay reset password người khác.

Tests: administration.test.js và administration-write.test.js, chạy `npm test` từ backend với fake pool. Không suy quyền clinical từ khả năng quản trị.
