# App

`app.js` tạo Express app và inject dependencies; import không mở port hoặc truy vấn DB. Mount `/health`, auth, administration, clinical và media khi có cấu hình; media mount trước clinical để giữ record ID và giới hạn body riêng.

`server.js` đọc config, tạo pool lazy, mở HTTP và đóng HTTP/pool khi SIGINT/SIGTERM hoặc startup lỗi. JSON tối đa 100 KiB; ảnh raw dùng giới hạn 5 MiB riêng. Không gọi provider/DB khi startup. Kiểm tra qua `tests/foundation.test.js`, `server-lifecycle.test.js` và các HTTP tests.
