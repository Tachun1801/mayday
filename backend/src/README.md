# Backend source

- [app/](app/README.md): lắp Express và quản lý HTTP lifecycle.
- [config/](config/README.md): đọc/kiểm tra môi trường và cấu hình auth/storage.
- [database/](database/README.md): pool chung và transaction helper.
- [modules/](modules/README.md): nghiệp vụ theo feature.
- [shared/](shared/README.md): lỗi HTTP và rate limit dùng chung.

App inject pool/config vào module; controller xử lý HTTP, service giữ workflow, repository giữ SQL. Không import repository riêng tư xuyên module.
