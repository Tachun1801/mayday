# Backend modules

- [health/](health/README.md): public HTTP liveness.
- [auth/](auth/README.md): đăng nhập/signup, principal/quyền và tài khoản cá nhân.
- [clinical/](clinical/README.md): bệnh nhân, hồ sơ/phiên, đơn/kết quả, UAS, tổn thương, cơ sở/danh mục.
- [administration/](administration/README.md): staff cùng branch, role và quyền.
- [media/](media/README.md): ảnh riêng tư, Cloudinary adapter và metadata.

Pool/auth inject từ app. Capability và resource scope được kiểm tra riêng; media dùng public record-access của clinical. Contract chung: [current-api](../../../doc/current-api.md).
