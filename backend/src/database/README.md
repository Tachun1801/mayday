# Database

`pool.js` tạo một `pg.Pool` lazy khi bật DB; config/TLS/timeouts theo [backend](../../README.md). Không migration, seed hoặc query kiểm tra tự động.

`transaction.js` cung cấp `withTransaction(pool, operation, options?)`: acquire → BEGIN → callback dùng cùng client → COMMIT; lỗi thì ROLLBACK, luôn release, loại client nếu rollback lỗi. Callback không tự commit/release; không nested transaction hoặc tự retry khi outcome không rõ.

Option duy nhất `{isolation:'read_committed'}` dùng SQL cố định cho first-contact: occupancy SELECT sau row lock phải thấy COMMIT cạnh tranh. Tests: `../../tests/transaction.test.js`; remote metadata checks tách tại [scripts](../../scripts/README.md).
