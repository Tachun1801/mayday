# Quản trị Web

AdminPage.jsx liệt kê accounts/roles/permissions; AdminForms.jsx tạo/sửa staff, tạo role và đọc/thay tập quyền. Same-branch staff, grant subset và self-lockout do backend quyết định; UI ẩn self role/active và own-role mapping. Không branch transfer, hard-delete hoặc reset password người khác.

Forms dùng shared mutation/readback; mật khẩu chỉ trong input memory, không log. [Contract](../../../../doc/current-api.md). Render tests có self/branch/password controls; chưa browser interaction/admin write DB thật.
