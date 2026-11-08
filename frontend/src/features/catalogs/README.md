# Danh mục lâm sàng

DrugsPage.jsx xem/tạo/sửa thuốc và đặc điểm sẩn phù. CatalogForm.jsx là form công khai dùng lại cho facilities: fixed fields/enums, dirty patch, mutation/readback. Mã thuốc là text và không đổi qua PATCH; không DELETE hoặc tự thêm nhóm thuốc ngoài DDL.

Quyền danh mục không cấp quyền đọc mọi bệnh án. [Contract](../../../../doc/current-api.md). Kiểm tra unit/render, lint/build từ frontend; chưa browser/DB write acceptance.
