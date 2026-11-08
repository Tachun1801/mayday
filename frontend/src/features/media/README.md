# Ảnh riêng tư Web

MediaPanel.jsx cung cấp metadata/phân trang, UploadForm và public PrivateImage cho hồ sơ/lesion views. Chọn tối đa 10 JPEG/PNG/WebP, mỗi ảnh ≤5 MiB; raw uploads tuần tự, dừng khi lỗi và đọc lại trước gửi tiếp, không batch atomic/retry tự động.

PrivateImage tải Bearer → Blob → object URL khi bấm xem; hide/unmount/decode failure revoke URL, abort request cũ, 401 kết thúc phiên. Không provider URL/credentials hoặc browser persistence. Completed ẩn upload nhưng còn scoped view. Tests media-api/render và browser CAP/MAN/PATIENT dùng fake API. [Contract](../../../../doc/current-api.md).
