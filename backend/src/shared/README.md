# Shared HTTP

- `errors.js`: HttpError có kiểm soát.
- `http.js`: 404/error handler, che raw stack/SQL/body/provider errors; media 503/9903 được xử lý theo contract.
- `rate-limit.js`: first-contact limiter 10 attempts/account/phút, tối đa 1000 entries, fail closed khi đầy; trả 429/Retry-After.

Limiter chỉ trong process, không persistent/distributed quota. Không đưa nghiệp vụ riêng hoặc dữ liệu y tế vào shared/log; auth limiter nằm trong auth module.
