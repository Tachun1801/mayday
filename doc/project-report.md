# Báo cáo dự án DrMayDay

Ngày rà soát: **07/11/2026**. Căn cứ: mã nguồn, routes, kiểm thử, `package.json`, DDL trong [mayday.sql](mayday.sql) và các quyết định đã ghi nhận của chủ dự án.

## 1. Mục tiêu và kiến trúc

DrMayDay quản lý hoạt động khám bệnh và theo dõi mề đay cấp/mạn. Có ba nhóm sử dụng: bác sĩ/nhân viên y tế, quản trị viên và bệnh nhân. Web bệnh nhân đã được chủ dự án bổ sung vào phạm vi; ứng dụng mobile thuộc workstream khác.

- Backend: Node.js 24+, Express 5, JavaScript CommonJS; REST API `/api/v1`.
- Frontend: React 19, Vite, React Router, Axios; JavaScript/JSX.
- Kiến trúc modular monolith, chia theo chức năng và phân lớp bên trong; backend dùng một `pg.Pool` để truy cập PostgreSQL hiện có.
- Schema local có **44 bảng**, view `v_chukytheodoiuas7`; không có migration, seed hay database thay thế.
- Bảo mật: JWT Bearer 15 phút, RBAC động, kiểm tra chủ sở hữu/phân công/chi nhánh ở backend; Web giữ token trong bộ nhớ.

Trong báo cáo, **đã triển khai** nghĩa là có mã nguồn và kiểm thử tương ứng; không đồng nghĩa đã triển khai production hoặc đã nghiệm thu ghi dữ liệu thật.

## 2. Chức năng đã triển khai

| Nhóm chức năng | Phần đã có | Mã nguồn chính |
|---|---|---|
| Xác thực và tài khoản | Đăng nhập username/password, JWT, đọc/sửa hồ sơ cá nhân, đổi mật khẩu; đăng ký bệnh nhân khi bật cấu hình role | [Backend auth](../backend/src/modules/auth/README.md), [Web auth](../frontend/src/features/auth/README.md) |
| Phân quyền | Đọc quyền hiện hành mỗi request; từ chối khi thiếu action/quyền; kiểm tra staff, owner, bác sĩ phụ trách và branch | `backend/src/modules/auth/`, `clinical/record-access.js`, `administration/` |
| Tiếp nhận bệnh nhân | Tạo bệnh nhân mới cùng hồ sơ CAP/MAN và phiên đầu trong một transaction; tiếp nhận lại bệnh nhân đã có phân công | [Clinical](../backend/src/modules/clinical/README.md), [Web patients](../frontend/src/features/patients/README.md) |
| Tiếp nhận lần đầu sau đăng ký | Nhân viên tra cứu đúng cặp username + phone, chỉ nhận thông tin tối thiểu; tạo hồ sơ đầu mà không nhân đôi danh tính | `clinical/first-contact.*`, `patients/FirstContactPage.jsx` |
| Hồ sơ và khám bệnh | Danh sách/chi tiết/lịch sử; biểu mẫu cố định CAP/MAN; tiền sử, hoàn cảnh dị ứng, nhiễm trùng, sinh hiệu và tổn thương theo loại hồ sơ | `clinical/clinical-fields.js`, [Web medical-records](../frontend/src/features/medical-records/README.md) |
| Tái khám và hoàn tất | Bác sĩ đã được phân công tạo phiên tái khám cho chính mình; sửa phiên mình phụ trách; chuyển `draft → in_progress → completed`; hồ sơ hoàn tất chỉ đọc | `clinical/clinical-write.*`, `clinical/record-workflow.*` |
| Đơn thuốc | Lập đơn, chi tiết thuốc và chỉ dẫn ngừng thuốc nguyên tử; đọc lịch sử đơn, tên thuốc, liều và thời gian dùng | `clinical/clinical-write.*`, `medical-records/ClinicalResults.jsx` |
| Kết quả xét nghiệm | Nhập và xem kết quả CAP/MAN, giữ độ chính xác số; NLR/PLR do DB sinh, client không tự ghi | `clinical/clinical-write.*`, `medical-records/VisitEntry.jsx` |
| UAS ngày | Bệnh nhân ghi điểm sẩn phù HSS và ngứa ISS, mỗi điểm 0..3, chỉ hôm nay theo giờ Việt Nam trên hồ sơ MAN của mình còn hoạt động; chống trùng bệnh nhân/ngày; xem lịch sử | `clinical/uas.*`, `patient-portal/PatientUas.jsx` |
| Ảnh riêng tư | Upload JPEG/PNG/WebP tối đa 5 MiB/ảnh; UI tối đa 10 ảnh/lượt, gửi tuần tự; metadata và xem ảnh qua backend có xác thực; Cloudinary authenticated assets | [Backend media](../backend/src/modules/media/README.md), [Web media](../frontend/src/features/media/README.md) |
| Theo dõi tổn thương | Tạo đợt/vị trí/ảnh trên hồ sơ MAN; liên kết attachment cùng hồ sơ; cập nhật mốc start/peak/normal và chỉ số ngứa/đau/bỏng rát/số nốt | `clinical/lesion-write.*`, `medical-records/LesionForms.jsx` |
| Quản trị nhân viên và quyền | Xem/tạo/sửa staff cùng chi nhánh; tạo role, đọc/thay tập quyền; chặn vượt quyền và tự đổi role/active hoặc mapping role đang dùng | [Backend administration](../backend/src/modules/administration/README.md), [Web admin](../frontend/src/features/admin/README.md) |
| Cơ sở và danh mục | Xem/sửa chi nhánh của staff; tạo/sửa khoa và phòng khám trong chi nhánh; tạo/sửa thuốc, đặc điểm sẩn phù | `clinical/catalog-write.*`, Web `facilities/`, `catalogs/` |
| Cổng bệnh nhân | `/register`, `/login`, `/portal`: xem hồ sơ/phiên/đơn/kết quả của mình, UAS, ảnh/tổn thương và tài khoản; danh tính kép có thể đổi khu vực | [Patient portal](../frontend/src/features/patient-portal/README.md) |
| Hạ tầng ứng dụng | `/health`, kiểm tra cấu hình, lỗi có kiểm soát, shutdown đóng pool; CLI kiểm tra kết nối, metadata schema và quyền | `backend/src/app/`, [Scripts](../backend/scripts/README.md), [Runbook](production-runbook.md) |

Các giới hạn quan trọng: quyền quản trị không tự cấp quyền xem mọi bệnh án; có quyền chức năng vẫn phải đúng phạm vi tài nguyên. Phân công bác sĩ lấy từ `phienkham.ma_bac_si`, không có cột phân công ở cấp hồ sơ. Biểu mẫu hiện tại là form cố định theo schema, chưa phải form động.

## 3. Chức năng chưa triển khai hoặc mới triển khai một phần

| Chức năng còn thiếu | Trạng thái và lý do | Điều kiện để tiếp tục |
|---|---|---|
| Role phân cấp và mapping endpoint–permission lưu trong DB | **Một phần**: role–permission và enforcement đã có; action → permission hiện lấy từ cấu hình, schema không có role cha hoặc bảng endpoint mapping như đề xuất nguồn | Chốt mô hình/contract phù hợp schema; không gọi cấu hình hiện tại là đủ persistence cho thiết kế cũ |
| Bộ dựng form động Template → Section → Question → Option, câu trả lời và ảnh câu trả lời | **Bị chặn bởi persistence**: schema không có mô hình này; form CAP/MAN không thay thế yêu cầu form động | Chủ dự án duyệt giải pháp lưu trữ/contract; hiện vẫn cấm thay schema |
| Thông báo, lịch sử đọc/xóa, thiết lập và FCM token | **Chưa triển khai**: thiếu persistence notification/device/settings và tích hợp provider | Chốt persistence, FCM và quyền truy cập thiết bị |
| Quên/reset mật khẩu qua OTP, xác minh điện thoại | **Chưa triển khai**: chưa có provider và mô hình lưu OTP/reset, TTL/số lần thử được duyệt | Chốt kênh gửi, persistence và quy tắc bảo mật; signup hiện không xác minh phone |
| Logout thu hồi từng JWT, refresh token/quản lý phiên | **Một phần**: logout Web chỉ xóa token trong bộ nhớ; đổi mật khẩu vô hiệu token cũ qua phiên bản hash; thiếu session/blacklist persistence | Duyệt mô hình quản lý phiên; không tuyên bố logout thiết bị đã thu hồi token server |
| Hàng đợi nhận ca, nhận/chuyển/hủy/mở lại hồ sơ | **Chưa triển khai**: luồng được duyệt hiện chỉ gán bác sĩ qua phiên khám và chuyển trạng thái tiến tới hoàn tất | Duyệt workflow, trạng thái, quyền và cách ánh xạ schema; không suy từ slide cũ |
| Chỉ định xét nghiệm dạng phiếu yêu cầu + dòng xét nghiệm | **Bị chặn bởi persistence**: schema hiện hỗ trợ kết quả, không có lab-request header/items | Duyệt mô hình lưu và contract riêng; nhập kết quả không phải lập chỉ định |
| Sửa/hủy đơn đã lưu; sửa, duyệt hoặc ký kết quả xét nghiệm | **Chưa triển khai**: phạm vi hiện tại chỉ thêm và đọc; chính sách sửa, lưu lịch sử và ký chưa được chốt | Chốt nghiệp vụ, quyền, trạng thái và khả năng lưu lịch sử |
| UAS chu kỳ, tổng hợp/đánh giá tuần, nhập bù, sửa/xóa ngày | **Một phần**: mới có điểm ngày và lịch sử; thiếu policy ngày hợp lệ/thiếu ngày/chu kỳ chồng lấn và sửa lịch sử | Duyệt quy tắc chuyên môn/contract; có bảng hoặc view không đồng nghĩa nghiệp vụ đã hoàn chỉnh |
| AAS, PROMs, nghiệm pháp kích thích và sàng lọc báo động đỏ | **Chưa mở chức năng** dù có bảng: chủ dự án yêu cầu chốt quy tắc chuyên môn trước; thang AAS trong các bảng còn khác biệt | Duyệt đối tượng, thang điểm, workflow, quyền và cách hiển thị |
| AI phân tích ảnh | **Chưa tích hợp, tùy chọn**: service/model do nhóm khác phụ trách; chưa có contract để nối | Nhận API/provider, timeout và quy tắc xử lý dữ liệu; repo không huấn luyện model |
| Xóa/unlink ảnh và dọn object đang được tham chiếu | **Chưa có API**: cần policy retention và kiểm tra mọi tham chiếu; lỗi COMMIT không rõ cần đối soát thủ công | Duyệt vòng đời media; không xóa object có thể đã được lưu tham chiếu |
| Cây tổ chức chi nhánh → khoa → phòng, chuyển chi nhánh; quản trị tài khoản bệnh nhân/reset mật khẩu người khác | **Chưa hỗ trợ đầy đủ**: DB cho khoa và phòng cùng thuộc branch, không có FK phòng→khoa; admin hiện giới hạn same-branch staff, không branch transfer/create hoặc hard-delete | Chốt phạm vi và contract phù hợp schema; không dựng quan hệ giả |
| Ứng dụng mobile | **Ngoài phạm vi repository**; Web bệnh nhân đã có | Workstream riêng nếu được yêu cầu |
| Production và nghiệm thu tích hợp thật | **Chưa nghiệm thu**: chưa hosting/deployment; chưa xác minh toàn bộ constraints/expressions DB remote hoặc ghi lâm sàng/concurrency thật | Chỉ định môi trường, tài khoản, dataset, phạm vi ghi và hạ tầng phát hành |

Không phải mọi chức năng thiếu đều do database: một số bị chặn bởi persistence, một số cần quyết định chuyên môn/provider, một số là giới hạn phạm vi đã duyệt hoặc bước nghiệm thu còn thiếu.

## 4. Kiểm chứng và giới hạn bằng chứng

Các bằng chứng phiên trước được giữ dưới đây để phân biệt với lần chạy kiểm tra tài liệu hiện tại:

- Backend: ghi nhận **164/164 tests** và lint đạt ở checkpoint kích hoạt quyền bệnh nhân.
- Frontend: ghi nhận **8 tệp kiểm thử**, lint/build đạt; Chrome chạy ba kịch bản CAP, MAN, PATIENT với API tổng hợp localhost. Đây là kiểm thử UI, không phải backend/PG/provider E2E.
- Audit READ ONLY từng đối chiếu **44 bảng/507 cột**: tên/thứ tự/type/nullability/generated/identity/default presence khớp dump. Chưa chứng minh biểu thức default/generated, toàn bộ constraints/indexes/triggers hoặc quyền ghi runtime.
- Quyền bệnh nhân: ngày 07/11 đã thực hiện một INSERT được chủ dự án cho phép vào liên kết role–permission hiện có; audit sau COMMIT đạt, không còn patient action thiếu grant. Không sửa schema hay UPDATE/DELETE dữ liệu cũ. Việc này không phải nghiệm thu ghi dữ liệu y tế.
- Cloudinary: checkpoint cũ ghi nhận upload/download/destroy một PNG tổng hợp 1 pixel đều HTTP 200; không dùng ảnh bệnh nhân hoặc ghi PostgreSQL. Không thay thế kiểm thử toàn luồng upload → metadata → đọc ảnh.

Kiểm tra chạy lại trong đợt tinh gọn tài liệu ngày 07/11:

| Kiểm tra | Kết quả |
|---|---|
| Backend `npm run lint` | Đạt |
| Backend `npm test` | 164/164 tests đạt; lần đầu bị sandbox chặn listen localhost (EPERM), chạy lại ngoài sandbox đạt |
| Frontend `npm test` | 8/8 tệp kiểm thử đạt |
| Frontend `npm run lint`, `npm run build` | Đạt, build 128 modules |
| Liên kết Markdown và README coverage | Không link nội bộ hỏng; mọi thư mục source có README |
| Schema map so DDL local | Đủ 44 bảng, không trùng/thiếu/thừa |

Không chạy lại browser opt-in, CLI remote DB hoặc provider smoke vì đợt này chỉ thay tài liệu; bằng chứng các lần chạy trước ở trên được giữ nhãn lịch sử. Không thay code runtime hoặc schema.

## 5. Công việc tiếp theo

1. Nghiệm thu luồng đã có trên môi trường/dataset được phép: đăng ký → tiếp nhận → khám/tái khám → đơn/kết quả → hoàn tất; patient ownership, wrong doctor/branch, UAS trùng ngày và ảnh riêng tư.
2. Kiểm chứng transaction, FK deferred/generated/UNIQUE và cạnh tranh ghi/hoàn tất trên PostgreSQL thật trong phạm vi được duyệt; không seed/reset database hiện có.
3. Chốt nghiệp vụ cho UAS tuần, AAS/PROMs/nghiệm pháp/sàng lọc và các thao tác sửa/hủy/ký trước khi bổ sung code.
4. Giải quyết persistence/provider cho form động, notification, OTP và quản lý phiên; giữ rõ các điểm chặn nếu schema tiếp tục bất biến.
5. Chuẩn bị HTTPS/reverse proxy, SPA fallback, cấu hình secrets và kế hoạch triển khai theo [runbook](production-runbook.md); đo hiệu năng/độ sẵn sàng trước khi công bố SLA.

## 6. Tài liệu đã hợp nhất

Báo cáo này thay các bản tiến độ, bàn giao, kế hoạch triển khai hiện tại/cũ, workstream backend/frontend, backlog auth/RBAC, kế hoạch Web bệnh nhân và ghi nhận schema remote. Chín tệp cũ được gỡ để tránh nhiều bản trạng thái mâu thuẫn. Quyết định còn hiệu lực nằm ở [decisions](context/11_DECISIONS_AND_GAPS.md), contract ở [current-api](current-api.md), thao tác vận hành ở [runbook](production-runbook.md), cấu trúc DB ở [schema map](project-schema-map.md).

Các trang context được giữ vì AGENTS.md dùng chúng làm điểm đọc theo nhiệm vụ. README mỗi thư mục giữ mô tả trách nhiệm, giới hạn cần biết và liên kết; không lặp toàn bộ báo cáo/API/DDL.
