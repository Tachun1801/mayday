# Auth và tài khoản cá nhân

Mount `/api/v1/auth`: POST login/signup/change-password, GET/PUT me. Signup chỉ bật khi cấu hình patient role đã có; tạo mới nguoi → benhnhan → taikhoan trong transaction, không link theo phone hoặc xác minh OTP. Payload/response tại [current-api](../../../../doc/current-api.md).

- `auth.js`: router, authentication, action authorization và IP limiter.
- `auth.service.js`: bcrypt, JWT, profile/password allowlists và principal an toàn.
- `auth.repository.js`: query tham số trên taikhoan/nguoi/nhanvien/benhnhan và vaitro/quyenhan/vaitroquyenhan.
- `signup.validation/service/repository.js`: kiểm tra input, bcrypt12, transaction đăng ký; role từ config, không client.

JWT HS256, issuer mayday, audience mayday-clients, TTL 900s; mỗi request reload active/hash version/quyền. Đổi password dùng conditional update và vô hiệu JWT cũ qua HMAC credential_version. Password mới 12..72 UTF-8 bytes; phone 10 chữ số nhưng không unique. Không trả hash hoặc suy quyền từ role name.

Chưa refresh/per-token logout/OTP; logout Web chỉ xóa memory. Tests: auth, auth-config, auth-profile, signup và patient-web trong `backend/tests/`; chạy `npm test` từ backend, dùng fake pool.
