# 11 — Quyết định hiện hành và điểm còn thiếu

Cập nhật 07/11/2026. Trạng thái chức năng/kiểm chứng: [báo cáo dự án](../project-report.md). Contract: [current-api](../current-api.md). Không dùng kế hoạch nguồn để suy ra chức năng đã có.

## Quyết định đã chốt

| Nội dung | Quyết định áp dụng |
|---|---|
| Công nghệ | Express/CommonJS, React/Vite/JSX, một `pg.Pool`; frontend chỉ gọi HTTP/JSON |
| Database | Database-first trên PostgreSQL hiện có; không thêm/sửa/xóa schema, migration, seed hay storage thay thế |
| Thao tác operator | Owner cho phép INSERT dữ liệu cần thiết từ 07/11; không UPDATE/DELETE/TRUNCATE/MERGE/ON CONFLICT DO UPDATE hoặc DDL. Discovery READ ONLY, tests mocked; authorization này không đổi các API sửa dữ liệu đã được duyệt |
| Patient grant | Đã thêm đúng một liên kết existing role 4 → manage_medical_records bằng ON CONFLICT DO NOTHING; audit sau COMMIT đạt. Không tạo role/permission/account/clinical fixtures; không còn gate thiếu patient grants ở checkpoint này |
| Web | Staff/admin và Web bệnh nhân được owner yêu cầu; `/register`, `/portal`; mobile riêng, không patient self-intake/clinical editor/admin |
| Auth | Username/bcrypt, JWT HS256 15 phút, reload principal/quyền mỗi request; token Web chỉ trong memory. Đổi password vô hiệu JWT theo hash version; logout thiết bị chưa thu hồi từng token |
| API | `/api/v1`, envelope code/message/data, thành công code `1000` kể cả create; bigint string, numeric giữ precision. Các worksheet cũ không được tự đổi contract đang chạy |
| Hồ sơ | `draft → in_progress → completed`; chỉ bác sĩ có phân công qua phienkham.ma_bac_si. Legacy pending/cancelled chỉ đọc; không queue/reassign/cancel/reopen/completed_at giả |
| Phiên khám | Tái khám trên hồ sơ đã phân công, doctor mới là caller; chỉ sửa own visit khi draft/in_progress. Khóa parent trước ghi con/complete, cha/subtype cùng transaction |
| Tiếp nhận | Signup tạo mới identity/account, role từ config, không link theo phone; first-contact exact username+phone, thông tin tối thiểu, khóa rồi kiểm tra lại occupancy để chỉ tạo hồ sơ đầu một lần |
| Admin | Same-branch staff, grant subset caller; không tự sửa role/active hoặc own-role mapping; không hard-delete, chuyển branch hay sửa role ảnh hưởng patient-only/out-of-branch accounts |
| Facilities | Khoa và phòng khám cùng thuộc branch; không có FK phòng→khoa. Không tự tạo cây tổ chức khác DDL |
| UAS ngày | Patient-owned active MAN, hôm nay Asia/Ho_Chi_Minh, HSS sẩn phù/ISS ngứa mỗi 0..3; duplicate denied, tổng ngày do DB tính; chưa backfill/edit/cycle/weekly writes |
| Media | Cloudinary authenticated, JPEG/PNG/static WebP ≤5 MiB/ảnh, UI ≤10 ảnh gửi tuần tự. Owner hoặc assigned staff, active mới upload; backend phục vụ bytes riêng tư, không public URL |
| Lâm sàng mở rộng | AAS/PROMs/provocation/screening phải có policy chuyên môn trước; tồn tại bảng không tự mở scope |
| TLS DB | Chỉ endpoint hiện có được owner cho phép sslmode=disable vì không hỗ trợ TLS; các TLS endpoint khác vẫn kiểm chứng certificate. Không startup statement_timeout; dùng query timeout phía client |

## Các gate còn mở

- **Persistence:** dynamic forms/answers/answer-image mapping, notifications/device/settings, OTP/reset, per-token blacklist/session và lab-request header/items không có trong dump; không tạo bảng/file/localStorage thay thế.
- **Chuyên môn:** UAS cycle/missing-day/weekly/edit/backfill, AAS/PROMs/nghiệm pháp/sàng lọc; thang AAS daily và phienkhamman còn khác nhau. Chưa sửa/hủy đơn hoặc sửa/duyệt/ký kết quả đã lưu.
- **Provider:** FCM, OTP và external AI chưa có tích hợp/contract hoàn chỉnh; model AI do nhóm khác làm. Cloudinary đã có adapter và smoke riêng, chưa toàn luồng DB thật.
- **Vòng đời:** nhận/chuyển/hủy/mở lại ca, unlink/xóa media và retention cần quyết định riêng; không tự xóa lịch sử y tế.
- **Nghiệm thu:** audit 44 bảng/507 cột chỉ kiểm chứng metadata đã nêu trong báo cáo; chưa full constraint/expression/index/trigger parity, clinical write/concurrency/provider E2E, hosting hoặc SLA.

## Cách xử lý nguồn cũ

Nguồn slide/sheet từng khác số bảng, prefix API, code1001, ISS/HSS, items/medicines, kích thước ảnh và trạng thái. Với code hiện tại dùng quyết định ở trên, DDL và [contract](../current-api.md); [API catalog](07_API_CATALOG.md) là inventory yêu cầu nguồn. Khi mở chức năng chưa có, đối chiếu đặc tả liên quan và chốt mâu thuẫn trước khi code. Không đổi âm thầm worksheet nguồn hoặc coi ví dụ English tables là DB thật.
