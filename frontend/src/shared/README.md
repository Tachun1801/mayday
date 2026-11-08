# Shared frontend

- [api/](api/README.md): HTTP client/envelope, business/health URLs và raw media.
- [session/](session/README.md): context dùng chung, không import feature.
- [ui/](ui/README.md): bảng/chi tiết/phân trang/trạng thái mutation.
- use-resource.js: read/abort, tránh dữ liệu request cũ, 401 logout.
- use-mutation.js: ref chống submit trùng, abort/pending/error, xác minh response và explicit readback khi outcome không rõ.

Không tự retry mutation, lưu token/draft hoặc quyết định clinical authorization. Feature khai báo field/payload.
