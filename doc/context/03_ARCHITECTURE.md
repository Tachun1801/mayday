# 03 — Kiến trúc hiện hành

Modular monolith, feature-first và layers bên trong; backend/frontend cùng repository nhưng cài/chạy độc lập. Không thêm framework/service/ORM hoặc thay cấu trúc chỉ để giống đề xuất cũ.

```text
React Web (staff + patient portal)
  → Axios / HTTP JSON + Bearer JWT
  → Express routes → controller/service → repository → pg.Pool → PostgreSQL
                                └→ private Cloudinary adapter
```

App inject pool/auth/storage, repository dùng SQL tham số hóa; service giữ policy và transaction cùng client. Controllers chỉ xử lý HTTP; shared chỉ chứa hạ tầng dùng chung. Clinical cung cấp public record-access cho media, không import private repository xuyên module.

Mọi protected request xác minh JWT/principal/quyền hiện hành rồi resource ownership/assignment/branch. Parent lock tuần tự hóa child writes và complete; cha/subtype cùng transaction. FE guards chỉ hỗ trợ UX, session memory-only, mutation không rõ outcome cần readback. Không SQL/DB credentials trong browser.

Media upload qua provider trước metadata transaction và recheck active parent; compensation/ambiguous COMMIT tại [media README](../../backend/src/modules/media/README.md). FCM/OTP/external AI là integration chưa hoàn chỉnh, không coi interface dự kiến là service đã hoạt động.

Cấu trúc thực tế: [backend](04_BACKEND_STRUCTURE.md), [frontend](05_FRONTEND_STRUCTURE.md). Contract ở [current-api](../current-api.md), giới hạn persistence tại [decisions](11_DECISIONS_AND_GAPS.md), vận hành theo [runbook](../production-runbook.md).
