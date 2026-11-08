# 06 — Hợp đồng database

Nguồn cấu trúc: [mayday.sql](../mayday.sql), **44 bảng và view v_chukytheodoiuas7**. Dump chứa dữ liệu riêng tư; không execute/import, seed hoặc lấy COPY rows làm fixture. [Schema map](../project-schema-map.md) giữ nhóm bảng/ràng buộc, tránh chép lại toàn bộ DDL.

## Quy tắc thực hiện

- Chỉ backend dùng một pg.Pool cấu hình qua private DATABASE_URL/DATABASE_ENABLED; frontend không DB credential/SQL.
- Database-first, không thêm/sửa/xóa schema, migration, seed, DB container hay storage thay thế. Owner cho phép operator INSERT cần thiết, cấm UPDATE/DELETE/TRUNCATE/MERGE/ON CONFLICT DO UPDATE; API edit được duyệt không bị đổi bởi authorization operator này.
- Discovery READ ONLY, tests mocked nếu chưa có scope real-data riêng. Không dùng DB hiện có làm môi trường disposable hoặc thử ghi rồi rollback để giả an toàn.
- SQL tham số hóa, identifiers allowlist, list bounded; multi-row/cha-subtype cùng client/transaction, release mọi nhánh. Constraint violation trả lỗi có kiểm soát, không raw SQL.
- Identity nguoi/taikhoan/benhnhan/nhanvien tách biệt; phone không unique, username unique không phân biệt hoa thường. RBAC vaitro/quyenhan/vaitroquyenhan; không query English tables từ slide.
- hosobenhan, phienkham và ketquacanlamsang có subtype CAP/MAN và deferred FK; assignment tại phienkham.ma_bac_si. Không invent template_id/completed_at/record-level doctor.
- Không ghi generated expressions; giữ bigint/numeric precision, date/time/nullability theo [current-api](../current-api.md). Row locks/conditional writes và UNIQUE bảo vệ state/race thay vì chỉ SELECT trước.
- TLS xác minh certificate trừ ngoại lệ sslmode=disable cho endpoint hiện có được owner duyệt; không startup statement_timeout, timeout query phía client.

## Khả năng còn thiếu và bằng chứng

Không có persistence cho dynamic forms/answers/answer_images, notifications/device/settings, OTP/reset/session/blacklist hoặc lab-request header/items. Không dùng bảng chuyên biệt để giả đáp ứng yêu cầu này; [decisions](11_DECISIONS_AND_GAPS.md).

Audit READ ONLY lịch sử khớp 44 bảng/507 cột về tên/thứ tự/type/NOT NULL/generated/identity/default presence; chưa xác minh expressions/full constraints/indexes/triggers/runtime writes. Sau một INSERT patient role-permission được phép, audit quyền đạt. Chi tiết/giới hạn tại [báo cáo](../project-report.md), CLI tại [scripts](../../backend/scripts/README.md) và [runbook](../production-runbook.md).
