# Ảnh y tế riêng tư

Mount `/api/v1/medical-records/:id/attachments`: GET metadata, POST raw image, GET `/:attachmentId/content`. Owner/assigned staff phải có media capability; chỉ active record được upload, completed chỉ đọc. [Contract](../../../../doc/current-api.md), [vận hành/đối soát](../../../../doc/production-runbook.md).

- `media.routes.js`: auth, parser 5 MiB, capacity 1 operation/account và 4/process; giữ lease tới khi response/work kết thúc, kể cả abort.
- `media.validation.js`: JPEG/PNG/static WebP, signature/content, kích thước ≤16384 và ≤40M pixels, filename UTF-8.
- `cloudinary.client.js`: signed authenticated upload/download/destroy, UUID mới, fixed HTTPS host, timeout và response bounds; provider URLs/keys chỉ phía backend.
- `media.repository.js`: SQL tepdinhkem, scoped bằng public clinical record-access; metadata không xuất locator/private paths.
- `media.service.js`: scope/state và phối hợp provider → parent lock/recheck → metadata transaction.

Upload ngoài DB transaction. Lỗi trước COMMIT bù trừ asset mới; COMMIT không rõ thì đọc lại đúng record/account/locator, chưa xác minh được phải giữ asset riêng tư và báo đối soát. Không xóa object có thể đã referenced. Binary response private/no-store, không redirect; UI dùng Blob/revoke. Legacy locator ngoài adapter trả lỗi có kiểm soát.

Tests `media.test.js` dùng provider/pool giả, HTTP loopback và ảnh tổng hợp; `lesion-write.test.js` kiểm tra attachment graph. Chạy `npm test` từ backend; chưa full application/DB/provider E2E.
