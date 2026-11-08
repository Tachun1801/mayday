# Clinical, cơ sở và danh mục

Mount `/api/v1`; [current-api](../../../../doc/current-api.md) giữ routes/payload/actions. Module quản lý patient/record/visit, lịch sử, kê đơn/kết quả, UAS ngày, lesion graph và facility/catalog trên schema hiện có.

| File/nhóm | Trách nhiệm |
|---|---|
| `clinical.routes/service/repository/validation.js` | Scoped reads, DTO, phân trang và kiểm tra ID |
| `clinical-fields.js`, `clinical-write.*` | Field allowlists theo DDL, ghi nội dung/phiên/tiền sử/sinh hiệu/tổn thương/đơn/kết quả |
| `intake.*`, `first-contact.*` | Tiếp nhận mới, exact-match first-contact và chống tạo hồ sơ đầu trùng |
| `record-workflow.*` | `draft → in_progress → completed` |
| `uas.service/repository.js` | Điểm ngày patient-owned/today-only, duplicate conflict |
| `catalog-write.*` | Tạo/sửa khoa, phòng, thuốc, đặc điểm sẩn phù; sửa branch hiện tại |
| `lesion-write.*`, `record-access.js` | Đợt/vị trí/ảnh MAN; public scope contract cho clinical/media |

Bảng chính: nguoi/benhnhan, hosobenhan + subtype, phienkham + subtype, các bảng tiền sử/sinh hiệu/tổn thương, donthuoc/chitietdonthuoc/chidanngungthuoc, ketquacanlamsang + subtype, nhatkyuashangngay, dottonthuongda/vitritonthuong/anhchuptonthuong và các danh mục. [Schema map](../../../../doc/project-schema-map.md) liệt kê đầy đủ.

Đọc cần capability + owner hoặc assignment đúng record; UAS staff không mở lịch sử ở record khác. Clinical writes cần assigned staff; visit writes cần doctor đúng phiên. Khóa hosobenhan trước ghi con/complete; cha/subtype và header/items cùng transaction. Completed/legacy không writable, không ghi generated/owner/type/status qua editor. First-contact dùng READ COMMITTED + khóa patient rồi kiểm tra occupancy lại.

UAS chỉ own active MAN, hôm nay Việt Nam, HSS sẩn phù/ISS ngứa 0..3; DB tính tổng. Lesion photo phải cùng record/episode/location/attachment, không nhận URL/AI/AUAS hoặc xóa vật lý. Media qua [module riêng](../media/README.md). Không form động/lab-order/weekly UAS hoặc chuyên môn chưa duyệt.

Tests: clinical*, intake, first-contact, record-workflow, uas-write, catalog-write, lesion-write, patient-web. Chạy `npm test` từ backend; fake pool/lock doubles không chứng minh PostgreSQL concurrency thật.
