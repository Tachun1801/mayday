# Cơ sở y tế

FacilitiesPage.jsx đọc/sửa chi nhánh hiện tại, tạo/sửa khoa và phòng khám qua public CatalogForm. Branch do server lấy từ staff; khoa/phòng cùng thuộc branch, không FK phòng→khoa. Không tạo/chuyển chi nhánh hoặc xóa dữ liệu.

Danh sách phân trang, loading/empty/error, form có pending/readback; backend enforce capability và branch predicate. [Contract](../../../../doc/current-api.md). Kiểm tra `npm test`, lint/build từ frontend; chưa browser/DB write acceptance.
