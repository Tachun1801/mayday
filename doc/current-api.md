# Contract hiện hành theo database — 2026-11-07

> Contract đã đồng bộ signup, first-contact và media ngày 2026-11-07. Nghiệm thu tự động dùng fake DB/provider; xem [báo cáo](project-report.md) và [runbook](production-runbook.md) cho giới hạn vận hành.

Tài liệu này ghi contract code đang triển khai, không đổi các worksheet nguồn. Owner đã chấp nhận contract theo schema hiện tại, giữ nguyên API đang chạy và giữ rõ capability thiếu persistence/provider. Đã đọc lại workbook `api` qua Google Drive ngày 2026-11-07, các tab create/update record, prescriptions, daily UAS, admin update, history/summary và labs (A1:L55 hoặc A1:L65). Bản cũ dùng English tables, template/answers/completed_at và thuốc có frequency/instruction riêng không thể ánh xạ không mất dữ liệu sang DDL hiện tại; các API mới dưới đây không giả nhận/lưu chúng.

## Quy ước chung

Prefix `/api/v1`. Bearer JWT. Thành công `{code:"1000",message:"OK",data:...}`; create HTTP201, update/read HTTP200. Không tự chuyển sang code1001. Bigint ID là string; numeric là decimal string khi ghi và theo parser mặc định pg khi đọc; boolean là boolean; date YYYY-MM-DD. Không blanket-stringify. PATCH chỉ đổi field có gửi; null xóa field nullable. Generated/identity/owner/doctor/type/status không thuộc writable fields trừ trường được chỉ ra rõ bên dưới. Status chỉ qua endpoint workflow đã có.

## Web bệnh nhân — owner yêu cầu 2026-11-07

Patient role activation đã hoàn tất theo owner INSERT-only approval: thêm đúng1existing role4→manage_medical_records link, không schema/UPDATE/DELETE. Independent audit sau COMMIT đủ9patient actions; route/payload/envelope và ownership/staff/assignment checks giữ nguyên. Operator tool không là HTTP endpoint mới hoặc quyền admin bypass.

Frontend mở public `/register` và protected `/portal`, `/portal/records`, `/portal/records/:id`, `/portal/uas`, `/portal/profile`. Shared `/login` nhận staff hoặc patient subtype, default staff cho dual identity và có link đổi workspace. Staff routes giữ nguyên, patient-only không vào staff workspace; staff-only không vào portal. JWT/expiry/memory-only transport và backend authorization không đổi. Không thêm endpoint BE hay schema để phục vụ UI này.

Patient ID lấy từ authenticated user_info.patient_id để gọi existing `/patients/:id/medical-records` và `/patients/:id/uas`. Detail kiểm tra ma_benh_nhan khớp patient ID trước child reads, kể cả dual staff/patient. Các API sẵn có vẫn enforce capability/resource scope phía server. Patient views chỉ đọc record/visit/RX/lab; own-account PUT/password và daily UAS/private media/lesion writes giữ nguyên policy đã duyệt. Không patient clinical editor/status transition/intake/admin hoặc tự cấp grants.

Prescription items thêm field **ten_thuoc** từ COALESCE(current thuoc.ten_thuoc, stored ten_thuoc_bo_sung), LEFT JOIN theo ma_thuoc. Additive DTO, giữ các field cũ/items/liều/thời gian/precision và record scope. Đây là tên catalogue hiện tại, không snapshot lịch sử mới hoặc schema change. UI hiển thị tên thay vì buộc bệnh nhân giải mã mã thuốc.

Signup giữ contract bên dưới, có client confirmation không gửi server; successful IDs cần positive bigint strings, không auto-login/OTP claim. Network/5xx/malformed success có thể sau COMMIT nên khóa form và hướng dẫn thử login/liên hệ trước đăng ký lại. UAS UI chỉ today Asia/Ho_Chi_Minh,0..3; tổng hiển thị từ server. Patient lesion photo UI chọn attachments cùng record/locations cùng episode qua phân trang, không nhập raw IDs/URLs. Completed chỉ đọc. Trạng thái/kiểm chứng: [báo cáo](project-report.md).

Lỗi validation/constraint: HTTP400/code2003; capability: 403/3101; resource ngoài scope cùng response với không tồn tại (404, code4001 cho clinical record/visit); completed: 409/4003, legacy trạng thái không writable: 409/4009. UNIQUE/new write conflict thông thường: 409/2003, duplicate UAS: 409/5002. Lỗi SQL/stack/private paths không ra client. Ràng buộc cặp flag/detail, quan hệ ngày và CHECK còn lại do PostgreSQL xác minh và dịch lỗi có kiểm soát; UI phải nhập/xóa chi tiết phù hợp khi đổi cờ.

## Đọc bổ sung

| Method/path | Action | Data |
|---|---|---|
| GET /patients/:id/medical-records | records.read | `{items,total,page,limit}`; exact-record scope, không mở tất cả hồ sơ cùng bệnh nhân |
| GET /medical-records/:id/visits/:visitId | records.read | Visit + `chi_tiet` đúng CAP/MAN; bind cả hai ID |
| GET /medical-records/:id/clinical/:section | records.read | List phân trang: personal-history, previous-episodes, allergy-context, infections, vitals, acute-lesions, chronic-lesions |
| GET /medical-records/:id/lesions | records.read | Đợt gắn hồ sơ mạn, phân trang |
| GET /medical-records/:id/lesions/:episodeId/locations | records.read | Vị trí trong đúng đợt/hồ sơ, phân trang |
| GET /medical-records/:id/lesions/:episodeId/photos | records.read | Metadata ảnh/điểm, phân trang; không url_anh hoặc storage paths |
| GET /catalogs/wheal-characteristics | catalogs.read | Danh mục đặc điểm sẩn phù, phân trang |
| GET /admin/roles/:id/permissions | permissions.read | `{items}`; tối đa1000 mapping, lớn hơn báo lỗi thay vì truncate |

Các list clinical dùng page/limit hiện hành (default1/20, max100). GET record thêm `assigned_to_current_doctor` boolean để UI biết assignment; không thay backend capability enforcement. GET prescriptions giữ items và thêm `stop_instructions` theo chidanngungthuoc, date cast text. Auth/read APIs cũ giữ nguyên.

GET `/patients/:id/uas` giữ envelope/phân trang/field types. Bệnh nhân đọc lịch sử của mình kể cả legacy row chưa gắn hồ sơ; staff chỉ đọc row gắn `ma_ho_so_man` thuộc đúng hồ sơ mình được phân công. Có assignment trên một hồ sơ không mở UAS ở hồ sơ khác của cùng bệnh nhân. Row không gắn hồ sơ không hiện cho staff.

## Đăng ký bệnh nhân và tiếp nhận lần đầu

Hai luồng chỉ bật khi backend cấu hình `PATIENT_SIGNUP_ROLE_ID` là existing patient role đã được owner duyệt. Không role ID từ client, không tạo role/grants/schema tự động.

- POST `/auth/signup` public, body `{username,password,full_name,phone,birth_date?,gender?}`. Username trim≤100, full_name trim≤150, phone đúng10 chữ số, password12..72 UTF-8 bytes không NUL; ngày sinh hợp lệ không sau hôm nay UTC; gender Nam/Nu/null. Strict allowlist. Transaction tạo mới nguoi→benhnhan→taikhoan, bcrypt12, role từ config. HTTP201/code1000/data`{account_id,patient_id}` string. Không token tự động, OTP/phone verification hoặc link existing patient theo số điện thoại dùng chung. Conflict409/2003; limiter5 attempts/IP/minute, tối đa1000 nguồn/process.
- POST `/patients/first-contact/lookup` cần staff + patients.write + records.write, body đúng `{username,phone}`. Username khớp không phân biệt hoa thường, phone khớp nguyên10 chữ số; chỉ active account có configured patient role và chưa có bất kỳ hồ sơ. HTTP200/data`{patient_id,full_name,birth_date,gender}`; không khớp/đã tiếp nhận dùng cùng404, không directory, không clinical data.
- POST `/patients/:id/first-contact`, cùng hai capabilities và staff guard; body `{username,phone,record:{loai_benh_an:"CAP|MAN"},visit:{ngay_kham,ma_phong_kham?}}`. READ COMMITTED transaction khóa patient/account/person rồi SELECT occupancy mới; tạo đúng một record/subtype/visit/subtype, doctor từ caller, room cùng branch. HTTP201/data`{patient_id,record_id,visit_id,status:"draft"}`. Không tạo lại identity/account; concurrent winner nhận201, request sau409. Identity/role/active phải còn khớp lúc khóa.

Lookup/intake chung limiter10 attempts/account/minute, tối đa1000 accounts/process,429 + Retry-After. Không phải distributed quota/persistent store. Web `/patients/first-contact` dành staff; signup API dùng cho Web `/register` và client bệnh nhân khác, không mobile app implementation. Sau phản hồi intake không rõ outcome, đọc danh sách hồ sơ được phân công trước khi thử tiếp; không tự tạo danh tính mới.

## Patient, hồ sơ và phiên khám

Owner chốt: bác sĩ chỉ tạo tái khám trên hồ sơ đã được phân công; phiên mới gán chính bác sĩ đó. Chỉ sửa phiên mình phụ trách khi hồ sơ draft/in_progress; completed giữ nguyên, không mở lại. Existing-patient intake chỉ cho bác sĩ đã có phiên trên hồ sơ của bệnh nhân đó; không dùng patient ownership của dual identity để tự gán ca.

| Method/path | Action | Body / data |
|---|---|---|
| POST /patients/:id/intakes | patients.write + records.write | `{record:{loai_benh_an:"CAP\|MAN"},visit:{ngay_kham,ma_phong_kham?}}` → `{patient_id,record_id,visit_id,status:"draft"}` |
| PATCH /patients/:id | patients.write | `{person:{...},patient:{...}}` → `{patient_id}`; phải có hồ sơ active được phân công |
| POST /medical-records/:id/visits | records.write | `{ngay_kham,ma_phong_kham?}` → `{record_id,visit_id}` |
| PATCH /medical-records/:id/content | records.write | `{record:{...},detail:{...}}` → `{id}` |
| PATCH /medical-records/:id/visits/:visitId | records.write | `{visit:{...},detail:{...}}` → `{id,record_id}` |
| PATCH /medical-records/:id/clinical/:section | records.write | Field patch của một trong bốn bảng tiền sử/hoàn cảnh/nhiễm trùng → `{record_id}` |
| POST /medical-records/:id/visits/:visitId/details/:kind | records.write | Field object cho vitals/acute-lesions/chronic-lesions → `{record_id,visit_id}`; thêm lần ghi nhận, không thay/xóa lịch sử |

Writable allowlists/type/enum/bounds chính xác: backend `src/modules/clinical/clinical-fields.js`. Được cố định từ DDL local, không schema discovery/runtime form engine. Tiền sử bản thân và các đợt trước chỉ MAN; nhiễm trùng chỉ CAP; hoàn cảnh dị ứng theo hosobenhan cả hai loại. Loại hồ sơ/visit/subtype lấy từ DB. Không nhận `diem_aas7` khi scope/thang AAS chưa chốt. Personal identity và patient subtype giữ riêng; ma_his là text unique, không phải ID số hoặc foreign key. Phone không unique.

Mọi write record/child khóa hosobenhan trước, cùng thứ tự với workflow complete. Visit-specific writes còn khóa và xác minh ma_bac_si của đúng visit. Cấp số lần khám dưới parent lock và existing UNIQUE. Tạo cha/subtype trong cùng transaction với deferred FK. Không sửa ngày điều trị khi complete, không invent completed_at. Date visit và doctor của phiên hiện hữu không đổi qua editor.

Row locks tuần tự hóa ghi; không có optimistic edit version hoặc tự merge đồng thời. PATCH giữ field không gửi. Create không có idempotency persistence; UI chặn double submit và yêu cầu đọc lại sau lỗi có thể đã COMMIT, không retry POST tự động.

## Đơn thuốc và kết quả

POST `/medical-records/:id/visits/:visitId/prescriptions`, action records.write, đúng assigned doctor của visit và active record:

- Body `{ngay_ke_don,ghi_chu_dieu_tri?,items:[{ma_thuoc?,ten_thuoc_bo_sung?,lieu_dung,thoi_gian_dung}],stop_instructions?:[{thuoc_can_ngung,ngung_tu_ngay?,thoi_gian_ngung_ngay?,muc_dich?,muc_dich_khac_ghi_ro?}]}`.
- 1..50 items; đúng một trong ma_thuoc/ten_thuoc_bo_sung. Liều/thời gian nonblank, max100; mã max50, tên bổ sung max255. Stop instructions tối đa50, mục đích enum DDL; Khac bắt buộc detail và các mục đích khác không nhận detail. Days integer >=0.
- Response `{prescription_id,record_id}`. Header + items + stop instructions atomic. Không tự cấp thuốc/liều, tách/ghép field clinical âm thầm hoặc áp một đơn/hồ sơ. Trạng thái mới dùng default DDL; chưa sửa/hủy đơn đã lưu.

POST `/medical-records/:id/visits/:visitId/labs`, action records.write, cùng assignment/state policy: body `{result:{...},detail:{...}}`, response `{result_id,record_id}`. Loại CAP/MAN suy từ visit đã khóa; header/subtype atomic. Numeric(12,4) giữ precision; NLR/PLR/generated không writable. Đây là nhập kết quả, **không phải lab ordering**; chưa sửa kết quả đã lưu, duyệt/ký hoặc nghiệm pháp mở rộng.

## Daily UAS

Owner duyệt phạm vi giới hạn: POST `/uas/daily`, action `uas.write`, principal phải có patient_id. Body `{ma_ho_so_man,ngay_cham_diem,diem_san_phu_hss,diem_ngua_iss}`. Chỉ **hôm nay theo Asia/Ho_Chi_Minh**, integer0..3; hồ sơ MAN của chính bệnh nhân còn draft/in_progress; khóa parent chống completion race. Identity không từ body. Không note, cycle ID, total hoặc status do client gửi. DB tính diem_uas_ngay; response `{id,ngay_cham_diem,diem_san_phu_hss,diem_ngua_iss,diem_uas_ngay}`.

Unique bệnh nhân/ngày xử lý tại DB →409/5002. Không nhập bù/sửa/xóa, tạo chu kỳ/tổng hợp/đánh giá tuần. Web `/portal/uas` dùng contract này. Default action mapping dùng quyền manage_medical_records đã có; deployment phải cấu hình RBAC_ACTION_PERMISSIONS phù hợp quyền patient thực tế, không mặc định mọi patient đều có capability chỉ vì là owner.

## Administration

Owner duyệt: chỉ quản lý staff cùng branch; role/quyền được grant không vượt quyền caller; không tự đổi role/active của mình hoặc sửa mapping role mình dùng; không hard-delete. Capability vẫn qua mapping hiện hành, không role-name bypass. Service reload actor/role/permissions trong transaction, khóa role để tránh race với thay mapping qua các API này.

Mọi admin route yêu cầu staff subtype. GET `/admin/accounts` chỉ liệt kê staff cùng branch được lấy từ nhanvien theo authenticated staff ID, không nhận branch từ query để mở phạm vi; không patient-only accounts. DTO và pagination giữ nguyên. Role/permission catalogue reads không chứa danh tính bệnh nhân. Default accounts.read/write và permissions.read/write map `manage_users_v2` theo catalogue đã xác minh; không `manage_users` cũ.

| Method/path | Action | Body → data |
|---|---|---|
| POST /admin/staff | accounts.write | `{username,password,full_name,phone,role_id}` → `{account_id,person_id}`; branch từ actor, bcrypt12, 12..72 bytes |
| PATCH /admin/accounts/:id | accounts.write | `{full_name?,gender?,role_id?,is_active?}` → `{account_id}`; bool is_active; không nhận patient-only target |
| POST /admin/roles | permissions.write | `{ten_vai_tro,ten_hien_thi,mo_ta_vai_tro?}` → `{role_id}`; ban đầu không có quyền |
| PUT /admin/roles/:id/permissions | permissions.write | `{permission_ids:["..."]}` → `{role_id}`; replace tập quyền atomic, tối đa1000, không trùng |

Target role hiện tại và role mới đều phải có permission subset caller. Role mapping đang ảnh hưởng staff ngoài branch hoặc patient-only account không được sửa; own role cũng bị từ chối. Thay mapping xóa/tạo quan hệ vaitroquyenhan trong transaction, không xóa role/account/clinical history; grantor là person_id server. Account bị khóa/quyền đổi có hiệu lực qua principal reload. Chưa hỗ trợ chuyển branch, reset mật khẩu cho người khác hoặc quản trị patient accounts.

## Facilities/catalog management

Actions facilities.write/catalogs.write mặc định map manage_clinical. Chỉ staff. POST departments/rooms tự lấy branch từ DB, PATCH branch/department/room có branch condition phía SQL. Không tạo branch mới, chuyển branch hoặc dựng FK phòng→khoa. Giữ mọi tham chiếu, không DELETE API.

- PATCH `/facilities/branches/:id`: ten_chi_nhanh, dia_chi, so_dien_thoai, trang_thai.
- POST `/facilities/departments`, PATCH `/:id`: ten_khoa_phong, loai_khoa, mo_ta.
- POST `/facilities/rooms`, PATCH `/:id`: ten_phong_kham.
- POST `/catalogs/drugs`, PATCH `/:id`: ten_thuoc, hoat_chat, nhom_dieu_tri; create thêm ma_thuoc text max50, update không đổi mã. Nhóm thuốc theo CHECK DDL, không tự tạo nhóm.
- POST `/catalogs/wheal-characteristics`, PATCH `/:id`: ten_dac_diem, mo_ta.

Response `{id}` string (mã thuốc có thể không phải số). Global clinical catalog được quản lý theo capability; không suy từ quyền đó thành quyền đọc bệnh án mọi bệnh nhân.

## Media riêng tư và tổn thương

GET/POST `/medical-records/:id/attachments` và GET `/:attachmentId/content` theo actions media.read/media.write; scoped owner hoặc assigned staff. Upload chỉ draft/in_progress, completed chỉ đọc. Cloudinary authenticated assets, private backend credentials; không public URLs/locators trong JSON hoặc redirect. POST nhận raw JPEG/PNG/static WebP≤5MiB, Content-Type đúng MIME, optional `X-File-Name=encodeURIComponent(filename)`;201/data`{id,record_id}`. UI chọn≤10 ảnh, gửi từng ảnh tuần tự, từng request độc lập; không batch atomic. GET metadata phân trang; content trả bytes private/no-store để browser Blob view/revoke. Signature/content/dimension checks và process-local capacity1 operation/account,4/process;429/Retry-After khi đầy. Oversize413/6003, format415/6002, invalid image400/6001 hoặc6002, provider503/9903.

Upload provider trước, sau đó khóa/recheck record trong DB transaction rồi lưu tepdinhkem. Pre-COMMIT failure compensate asset mới; ambiguous COMMIT đọc lại theo record/account/locator, chỉ trả success nếu xác minh metadata. Nếu không rõ, giữ private asset + warning chung cho operator reconciliation; không phá object có thể đã referenced. Không delete ảnh cũ hay tạo orphan store thay thế. Legacy locators ngoài adapter không được chuyển public tự động.

Action lesions.write: POST `/medical-records/:id/lesions` tạo đợt; POST `/:episodeId/locations`; POST `/:episodeId/photos`; PATCH `/:episodeId/photos/:photoId`. Chỉ scoped active MAN; khóa parent và kiểm tra same-record attachment/same-episode location. Episode bắt buộc `ten_dot_ton_thuong_da`; location bắt buộc `vi_tri_co_the`. Context optional theo [validator](../backend/src/modules/clinical/lesion-write.validation.js). Photo create nhận `ma_tep_dinh_kem`, optional `ma_vi_tri_ton_thuong`, `thoi_diem_chup` có timezone, `moc_tien_trien` start/peak/normal; optional NRS ngứa/đau/bỏng rát0..10 và `so_luong_not_san`≥0. PATCH chỉ milestone và các chỉ số trên; không thay linkage/URL/AI/AUAS/owner. Không hard-delete. Payload/metadata keys giữ tên DDL, bigint string.

## Chưa hỗ trợ và bằng chứng

Chưa form động/answers, notification/OTP/per-token blacklist, lab-request model hoặc AI/FCM; schema/provider không đủ, không storage thay thế. AAS/PROMs/screening/provocation và UAS cycle/backfill/edit/weekly còn gate chuyên môn. Backend mocks/race doubles không phải PostgreSQL write/concurrency acceptance. Browser CAP/MAN chạy Chrome thật với synthetic localhost API, không live backend/DB/provider E2E. Cloudinary synthetic smoke trước đó thành công và đã dọn asset. Không write/DDL remote hoặc deploy trong đợt hoàn thiện này. `npm run db:verify` chỉ đối chiếu metadata và role/grant catalogue; không tự cấp quyền.
