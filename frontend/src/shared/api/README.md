# HTTP boundary

client.js tạo Axios từ VITE_API_BASE_URL (default `/`, timeout 10s). business-path.js thêm api/v1 một lần, business.js nối request wrappers; request.js gắn Bearer/AbortSignal, chỉ chấp nhận code1000 và che lỗi nội bộ. health-url.js tách `/health` khỏi prefix, giữ origin URL tuyệt đối.

media-request.js là factory raw upload/Blob download, media.js bind client: upload 45s, download 20s, kiểm tra MIME/size và encode filename header. Không signed provider URL/token query/log hoặc tự retry. Node tests session-api/health-url/media-api dùng client giả, không remote request.
