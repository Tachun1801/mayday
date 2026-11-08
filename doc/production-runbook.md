# Vận hành và nghiệm thu DrMayDay

Đây là hướng dẫn, chưa phải bằng chứng production đã chạy. Trạng thái chức năng và checkpoint kiểm chứng tại [báo cáo](project-report.md); payload/quyền tại [current-api](current-api.md).

## Cấu hình và artifact

- Node.js 24+, cài dependency theo lockfile từng ứng dụng bằng `npm ci`. Backend: `npm run lint`, `npm test`, `npm start`; frontend: `npm test`, `npm run lint`, `npm run build`, artifact `frontend/dist`.
- Backend private env: NODE_ENV/HOST/PORT, DATABASE_ENABLED/DATABASE_URL, JWT_SECRET tối thiểu 32 bytes; không ghi đè `.env` hiện có hoặc in giá trị thật. Business API chỉ mount khi có pool và JWT; `/health` không chứng minh DB/provider ready.
- PATIENT_SIGNUP_ROLE_ID là existing patient role được duyệt, bật signup và first-contact; không role từ client, auto-grant, phone verification hoặc auto-login.
- Default action permissions: admin dùng manage_users_v2, facilities/catalog dùng manage_clinical, clinical/UAS/media/lesion dùng manage_medical_records. RBAC_ACTION_PERMISSIONS override thay toàn mapping; thiếu action/grant phải 403. Capability không thay staff/owner/assignment/branch checks.
- Cloudinary cần private CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET; authenticated assets, không public medical URLs hoặc VITE secrets. JPEG/PNG/static WebP ≤5 MiB/ảnh, UI ≤10 ảnh gửi tuần tự; 1 operation/account, 4/process. [Media module](../backend/src/modules/media/README.md) ghi orchestration/compensation.
- DB endpoint hiện có giữ owner-approved sslmode=disable vì không hỗ trợ TLS; không áp sang endpoint khác hoặc tắt certificate verification cho TLS. Không startup statement_timeout; pool dùng client query timeout.

## HTTP hosting

VITE_API_BASE_URL=/ cho same-origin. HTTPS reverse proxy đưa `/api/v1` và `/health` tới backend, SPA fallback cho Web staff, `/register` và `/portal/*`; API 404 phải giữ JSON. Backend bind private/loopback theo topology được duyệt. Cross-origin cần CORS origin cụ thể và nghiệm thu riêng; chưa có deployment đó. Không provision DB/provider hoặc công cụ triển khai mới từ hướng dẫn này.

## Preflight database và quyền

Từ backend, `npm run db:check` kiểm tra connection/version/TLS/read-only; `npm run db:verify` parse local DDL và audit column metadata/RBAC bằng BEGIN READ ONLY → SELECT → ROLLBACK. Chỉ đọc metadata/catalogue, không clinical/account rows, không DDL hoặc sửa grants. Exit 1 có thể do drift/readiness gap, không tự động có nghĩa connection hỏng.

Checkpoint 07/11: 44 bảng/507 cột khớp tên/thứ tự/type/NOT NULL/generated/identity/default presence. Sau một INSERT liên kết quyền bệnh nhân được owner cho phép, audit độc lập exit 0/ok:true, patientActionsWithoutGrant:[]. Những ghi nhận cũ “patient thiếu grants” đã được thay thế. Audit capability không chứng minh staff subtype, assignment hoặc runtime write privileges; điều dưỡng chưa có mapped actions ở checkpoint được ghi nhận, không suy quyền từ tên role.

`npm run db:patient-access` mặc định preview READ ONLY; `-- --apply` là thao tác operator INSERT-only có chủ đích trong phạm vi owner đã cho phép. Chỉ thêm missing existing role-permission link, ON CONFLICT DO NOTHING, không refresh timestamps hay tạo account/clinical fixtures. Có guards schema/PK/default/triggers/rules/RLS/target/no-staff và khóa role/permission; [scripts README](../backend/scripts/README.md). Không chạy lại apply chỉ để test, không dùng admin API bypass để bootstrap grants.

Chưa so sánh default/generated expressions, toàn bộ constraints/FK/UNIQUE/CHECK/delete semantics/indexes/triggers/functions hoặc quyền ghi runtime. Không thử INSERT rồi ROLLBACK để nghiệm thu trên DB hiện có vì sequence/provider vẫn có side effects. Owner cho phép INSERT cần thiết, vẫn cấm operator UPDATE/DELETE/TRUNCATE/MERGE/ON CONFLICT DO UPDATE và thay schema; tests vẫn mocked nếu chưa có scope real-data riêng. Các API edit được duyệt không bị thay đổi bởi giới hạn operator này.

## Nghiệm thu trước phát hành

1. Chạy lint/test hai ứng dụng và frontend build; kiểm tra secrets/config không lộ trong bundle/log.
2. Dùng tài khoản/dataset được phép: login, expiry/inactive/password invalidation, thiếu quyền 401/403; không lưu credentials/token/medical data vào ảnh chụp hoặc artifact.
3. Staff flow: intake mới/cũ/first-contact → khám CAP/MAN → tái khám → đơn/kết quả → hoàn tất; kiểm tra unassigned/wrong branch/completed writes bị chặn, keyboard/loading/error/readback.
4. Patient flow: register/login → own records/đơn/kết quả → today UAS/duplicate → ảnh/lesion → profile/password; wrong owner/record và staff/admin actions bị chặn; dual identity giữ own-record guard trong portal.
5. PostgreSQL thật chỉ trong phạm vi môi trường/dataset/ghi được duyệt: deferred FK, generated values, UNIQUE, concurrent visit numbering/first-contact và child-write vs complete. Không seed/reset hoặc DELETE cleanup dữ liệu hiện có.
6. Kiểm tra upload → metadata → authorized binary read với fixture tổng hợp được phép. Provider smoke upload/download/destroy riêng không thay toàn luồng; kiểm tra wrong owner/cross-record/completed và ambiguous COMMIT.
7. Đối chiếu phần chưa triển khai trong [báo cáo](project-report.md); chốt phạm vi phát hành. Đo trước khi công bố SLA/hiệu năng; hosting/TLS/domain/backup cần người phụ trách xác nhận.

Browser opt-in từ frontend: `npm run test:browser` (CAP), `npm run test:browser -- MAN`, `npm run test:browser -- PATIENT`. Chrome profile tạm và API tổng hợp, không PG/provider thật; hướng dẫn tại [frontend scripts](../frontend/scripts/README.md).

## Lỗi và phục hồi

Mutation timeout có thể sau COMMIT: đọc lại list/detail và xác minh ID/trạng thái trước retry, không tự gửi lại POST vì chưa có idempotency persistence. Signup outcome không rõ: thử login/liên hệ trước đăng ký lại. Transaction rollback/release; rollback lỗi thì loại connection khỏi pool.

Media upload trước DB: trước COMMIT lỗi thì bù trừ asset mới; outcome COMMIT không rõ phải readback đúng record/account/locator. Nếu chưa xác minh được, giữ asset riêng tư và đối soát thủ công bằng quyền truy cập được duyệt; không xóa object có thể đã referenced. Không log raw bodies, passwords, Bearer, ảnh hoặc private paths để điều tra.

SIGINT/SIGTERM đóng HTTP/pool trong giới hạn hiện có. Rollback application theo artifact đã duyệt, không reset/rollback schema hoặc dữ liệu. Repository chưa chứng minh deployment, live clinical write/concurrency hoặc full provider integration acceptance.
