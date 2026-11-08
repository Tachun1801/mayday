# 09 — Xác thực, phân quyền và riêng tư

Policy hiện hành theo owner và code, không theo ví dụ English-schema nguồn. [Contract](../current-api.md), [decisions](11_DECISIONS_AND_GAPS.md), [báo cáo kiểm chứng](../project-report.md).

## Authentication/session

- Username/bcrypt; signup password mới 12..72 UTF-8 bytes, bcrypt12; không link existing identity theo phone hoặc claim đã xác minh điện thoại. Role signup từ backend config.
- JWT HS256, TTL 900s, issuer/audience/subject kiểm tra; secret backend ≥32 bytes, không frontend/log. Mỗi request reload active, credential version và quyền; inactive/hash thay đổi/quyền rút có hiệu lực qua cơ chế đó.
- Web memory-only token, expiry/401 kết thúc session; logout thiết bị không thu hồi JWT còn hạn. Đổi password có old-password check/conditional update và vô hiệu JWT hash version cũ; chưa OTP/refresh/per-token blacklist.
- Limiter login/signup theo IP và first-contact theo account là process-local; không tuyên bố distributed/persistent quota. Generic controlled auth errors, không lộ hash/token/SQL hoặc thông tin account vượt contract.

## Capability và resource scope

- Action → permission mapping động, thiếu action/grant phải deny; không bypass theo role name. Patient grants đã kích hoạt bằng một INSERT existing link được phép; audit sau COMMIT đủ 9 portal actions, không tự grant khi startup/login.
- Patient chỉ own records/UAS/media/lesion/profile; patient-only không gọi staff/admin/intake/editor/status. Dual identity trong portal vẫn phải đúng own-record, ownership không tự cho physician writes.
- Staff reads scoped exact assigned record; staff UAS không mở các hồ sơ khác cùng patient hoặc legacy row chưa gắn record. Clinical write cần assigned active parent, visit write đúng ma_bac_si; khóa parent trước child/complete, completed không sửa/reopen.
- First-contact cần staff + patients.write + records.write, exact username+phone và chưa có hồ sơ; minimal lookup, lock/recheck occupancy trong READ COMMITTED; không global directory/duplicate identity.
- Admin cần staff và same-branch; account directory/count/page cùng scope. Reload actor/quyền trong transaction; role/grant subset caller, chặn self role/active/own-role mapping và role ảnh hưởng patient-only/out-of-branch staff. Không hard-delete/branch transfer/reset password người khác.
- Facilities branch từ DB theo staff; không tin branch/owner/doctor do client gửi. Global catalog capability không mở dữ liệu lâm sàng toàn cục.

## Dữ liệu và transport

- Validate allowlists/path/query/ID/pagination/date/type/size; SQL tham số, identifiers cố định; DB constraints/transactions và authorization backend là thẩm quyền cuối.
- Ảnh private Cloudinary, JPEG/PNG/static WebP ≤5 MiB, UI ≤10 ảnh tuần tự; auth + scope trước download, active recheck dưới parent lock trước metadata write. Binary no-store, không public URLs/private locator trong response; Blob revoke khi hide/unmount.
- Ambiguous COMMIT phải readback; chưa rõ giữ asset có thể referenced, không destroy/xóa lịch sử để cleanup. Unlink không tự xóa attachment/object dùng chung; delete policy chưa mở.
- Secrets chỉ backend env, placeholders trong .env.example; không passwords/hash/OTP/Bearer/FCM keys/private paths/clinical data trong log, test fixture, screenshot hoặc docs. Dùng dữ liệu kiểm thử tổng hợp.
- HTTPS/TLS cho remote sensitive transports; ngoại lệ DB sslmode=disable chỉ endpoint hiện có được owner duyệt, không tắt verification cho TLS endpoint khác.
- Operator scope: owner cho INSERT cần thiết, không UPDATE/DELETE/schema changes; discovery READ ONLY/tests mocked. Các API edit workflows được duyệt giữ nguyên. Không seed fixtures hoặc dùng remote data làm test disposable.

Kiểm thử security phải có 401/403/wrong owner/unassigned doctor/wrong branch/completed/duplicate/rollback và current grant reload. Mocks/browser fake API không thay PostgreSQL/provider E2E; nghiệm thu theo [runbook](../production-runbook.md).
