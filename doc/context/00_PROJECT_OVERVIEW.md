# 00 — Tổng quan DrMayDay

DrMayDay quản lý khám và theo dõi mề đay cấp/mạn. Nhóm dùng: bác sĩ/nhân viên y tế, quản trị và bệnh nhân; Web bệnh nhân được owner yêu cầu ngày 07/11/2026, mobile thuộc workstream riêng.

Backend Node.js/Express 5 CommonJS, frontend React 19/Vite/JSX ESM, React Router và Axios. Kiến trúc modular monolith, feature-first/layer-inside; frontend → HTTP JSON → backend → PostgreSQL hiện có qua một pg.Pool. Cloudinary là adapter media riêng tư đang có; FCM/OTP/AI chưa tích hợp đầy đủ. Model AI do nhóm khác phụ trách.

Database-first theo 44 bảng và view trong `doc/mayday.sql`. Không tự thay schema, migration, seed hoặc dựng DB thay thế. Owner chỉ cho phép operator INSERT dữ liệu cần thiết; discovery READ ONLY/tests mocked, không sửa/xóa remote data. Frontend không chứa DB credentials. Chi tiết [quyết định](11_DECISIONS_AND_GAPS.md), quy tắc đầy đủ ở AGENTS.md.

Web staff khám/quản trị; `/portal` cho bệnh nhân xem dữ liệu của mình, UAS và media/lesions theo quyền. Form CAP/MAN hiện cố định, không phải dynamic form engine. [Báo cáo](../project-report.md) là nguồn trạng thái chức năng; [current-api](../current-api.md) là contract code; [scope](01_SCOPE_AND_REQUIREMENTS.md) giữ yêu cầu nguồn.
