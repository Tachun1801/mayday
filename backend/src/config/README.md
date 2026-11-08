# Config

- `env.js`: đọc backend `.env` dạng KEY=value hoặc URI legacy; process env ưu tiên; validate host/port/DB/TLS mà không lộ giá trị trong lỗi.
- `auth.js`: JWT secret, optional patient signup role và action → permission mapping. Override thay toàn mapping; thiếu action bị từ chối.
- `cloudinary.js`: kiểm tra bộ cloud name/API key/secret phía backend, inject storage khi đủ; không gọi provider lúc import.

Tên biến/placeholder tại [backend .env.example](../../.env.example); default permissions và quy trình audit tại [runbook](../../../doc/production-runbook.md). Không đưa secrets vào VITE hoặc log.
