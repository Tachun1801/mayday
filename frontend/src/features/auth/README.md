# Auth Web

LoginPage/SignupPage dùng `/login`, `/register`; ProfilePage dùng chung staff `/profile` và patient `/portal/profile`. SessionProvider giữ token trong memory, timeout phiên và logout; session.js kiểm tra expiry/subtype/home route, context.js re-export shared context.

Signup có password confirmation, không auto-login/claim OTP; network/5xx/malformed IDs khóa retry để tránh đăng ký trùng sau COMMIT. Đổi password yêu cầu đăng nhập lại. Logout thiết bị không thu hồi JWT server còn hạn tối đa 15 phút. Backend giữ authority về quyền/own profile; tests session-api/rendering/patient-portal và browser PATIENT.
