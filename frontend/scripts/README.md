# Browser acceptance opt-in

browser-workflow.js dùng Chrome headless, Node 24 CDP/WebSocket và Vite; không thêm test framework. Từ frontend chạy `npm run test:browser` (CAP), `npm run test:browser -- MAN` hoặc `npm run test:browser -- PATIENT`. `MAYDAY_TEST_CHROME` chọn executable nếu cần.

Chrome dùng profile tạm `/tmp`, mock keychain/password-store basic và cleanup cuối; không profile/keyring cá nhân. Cờ tắt browser sandbox chỉ cho fixture headless local, không browser cá nhân/production. API stateful tổng hợp, không backend env/PG/Cloudinary hoặc dữ liệu bệnh nhân.

CAP/MAN kiểm tra first-contact 403/404/reset/submit trùng, intake, editor/readback, đơn/kết quả precision, raw upload/Blob view, completed/401. PATIENT thêm signup/confirmation/uncertain recovery, subtype/owner guards, UAS duplicate, chọn ảnh/tổn thương, profile và mobile layout. Kết quả chỉ xác nhận UI với fake API.
