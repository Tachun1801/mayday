# 07 — API Catalog and Ownership

## Database-first writes và reads bổ sung — 2026-11-07

Owner đã chấp nhận contract theo DB hiện tại, giữ APIs đang chạy và giữ thiếu persistence/provider ở trạng thái blocked. Canonical payload/action/scope/type/error của code hiện hành nằm tại [current-api](../current-api.md); bảng nguồn bên dưới vẫn là inventory cũ, không alias hoặc implementation guarantee. Có existing-patient intake, patient admin patches, record/visit/history editors, vitals/lesion observations, prescribing/lab entry, patient daily UAS, staff/role và facility/catalog writes; thêm scoped visit/history/lesion metadata reads. Không template/answers/completed_at hoặc frequency/instruction giả.

Đã bổ sung opt-in POST `/api/v1/auth/signup` (configured existing patient role, không OTP/phone verification); staff POST `/patients/first-contact/lookup` và `/patients/:id/first-contact` (exact username+phone, chưa có hồ sơ, hai capabilities, one-time transaction). Media GET/POST record attachments và GET private binary content; lesion episode/location/photo creates và photo metrics/milestone patch. Prefix bảng viết tắt này vẫn `/api/v1`; exact payload/actions/errors tại current-api. Admin account list chỉ same-branch staff; staff UAS history chỉ exact assigned record. Không tự thêm aliases từ inventory nguồn.


> **Critical:** The inventory below faithfully follows the **tab titles** in the linked Google Sheet, including mixed `/api/...` and `/api/v1/...` and some legacy names. It is **not** a guarantee these are all the currently deployed paths. The slide descriptions generally use `/api/v1/...`. **Do not register both path variants indiscriminately.** Verify live routes, select canonical `/api/v1` conventions where agreed, and document aliases explicitly if compatibility requires them.

Source: [Detailed API spreadsheet](https://docs.google.com/spreadsheets/d/162s8pbiP7WhOwSDWopc11hK3Qp-CBYF19qv25ShMKCA/edit) and the DrMayDay slide decks. Google Sheet tab titles are a planning/spec artifact, **not proof of implementation**.

## Cross-cutting API expectations

Owner-requested patient Web now consumes the existing canonical APIs via /register and /portal; it introduces no backend route aliases/schema changes. Prescription item DTO adds ten_thuoc from current drug catalogue or stored free-text name, retaining existing fields and record scope. Shared login remains Bearer/current-principal reload, patient capabilities are not auto-granted; see [current-api](../current-api.md) and [project report](../project-report.md).

- Most endpoints require `Authorization: Bearer <token>` except login/signup/forgot-password as designed.
- The Sheet specifies a `code` (string), `message` (string), `data` object/array response envelope. Details are in `08_API_RESPONSES.md`.
- Each route needs input validation, proper HTTP status mapping, authentication, RBAC and **record ownership** where appropriate.
- IDs and booleans are inconsistent between examples (e.g. `"true"`, `"5"` vs integer fields). Do not universal-stringify without endpoint contract verification.
- `.../all`, `.../my`, `.../eligibility`, `.../record/...`, `.../week/...` MUST be registered before `/:id` to avoid accidental route capture.

## Verified local clinical workflow — 2026-11-07

The owner selected draft → in_progress → completed for the existing Web intake flow. The current local route is PATCH /api/v1/medical-records/:id/status, requiring JWT, records.write and a staff assignment through a visit in that exact record. JSON body is exactly {status:"in_progress"} or {status:"completed"}; HTTP200 data is {id:"<string>",status} in the code1000/OK envelope. No doctor/owner/clinical fields are accepted.

Source workbook status tab A1:L65 was re-read: its older target was cancelled. The newer owner decision replaces that transition policy for this slice; retain the source inventory below as historical reference, not implemented aliases. There is no cancellation/accept/reopen endpoint. Invalid transition returns 409/4009; already completed returns 409/4003; unassigned/missing record returns 404/4001; patient-only/absent capability returns 403/3101. See modules/clinical README for the full body validation and locking contract.

## Endpoint inventory by business feature

### Authentication and profiles (SLIDE2)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/change-password`
- `POST /api/auth/admin/create-staff`
- `GET /api/profile`
- `PUT /api/profile`

### Notifications and device tokens (SLIDE10)

- `POST /api/notifications/register_token`
- `GET /api/notifications`
- `PUT /api/notifications/{id}`
- `DELETE /api/notifications/:id`

### Branches, departments and rooms (SLIDE4)

- `POST /api/branches`
- `GET /api/branches`
- `GET /api/v1/branches/:id`
- `PUT /api/v1/branches/:id`
- `DELETE /api/v1/branches/:id`
- `POST /api/departments`
- `GET /api/departments`
- `GET /api/v1/departments/:id`
- `PUT /api/v1/departments/:id`
- `DELETE /api/v1/departments/:id`
- `POST /api/rooms`
- `GET /api/rooms`
- `GET /api/v1/rooms/:id`
- `PUT /api/v1/rooms/:id`
- `DELETE /api/v1/rooms/:id`

### Roles and permissions (SLIDE3)

- `POST /api/roles`
- `GET /api/roles`
- `POST /api/v1/permissions`
- `GET /api/v1/permissions`
- `PUT /api/v1/permissions/:id`
- `DELETE /api/v1/permissions/:id`
- `POST /api/role_permissions`
- `GET /api/role_permissions/role/:role_id`
- `DELETE /api/role_permissions/:role_id/:permission_id`

### User admin and patient directory (SLIDE3 + SLIDE5)

- `GET /api/doctor/patients/search`
- `POST /api/doctor/patients/create`
- `GET /api/admin/users/`
- `GET /api/admin/users/:id`
- `POST /api/admin/users/`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `PUT /api/admin/users/:id/assign`

### Dynamic form builder (SLIDE11)

- `GET /api/templates/all`
- `GET /api/templates/:id`
- `POST /api/templates/`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- `POST /api/templates/:template_id/sections`
- `PUT /api/templates/sections/:id`
- `DELETE /api/templates/sections/:id`
- `POST /api/templates/sections/:section_id/questions`
- `PUT /api/templates/questions/:id`
- `DELETE /api/templates/questions/:id`

### Medical records and answers (SLIDE5)

- `GET /api/medical_records/classify-questions`
- `POST /api/medical_records/classify`
- `GET /api/medical_records/all`
- `GET /api/medical_records/:id`
- `GET /api/medical_records/:id/summary`
- `POST /api/v1/medical_records`
- `GET /api/medical_records/:id/answers`
- `POST /api/medical_records/:id/accept`
- `POST /api/medical_records/:id/answers`
- `PUT /api/medical_records/:id/answers`
- `PUT /api/medical_records/:id`
- `PATCH /api/medical_records/:id/status`
- `GET /api/medical_records/patients/:id/history`
- `DELETE /api/medical_records/:id`

### Lesion tracking (SLIDE9)

- `POST /api/lesion-episodes/`
- `GET /api/lesion-episodes/my`
- `GET /api/lesion-episodes/record/:medical_record_id`
- `GET /api/lesion-episodes/:id`
- `PATCH /api/lesion-episodes/:id`
- `DELETE /api/lesion-episodes/:id`
- `POST /api/lesion-locations/`
- `GET /api/lesion-locations/episode/:episode_id`
- `PATCH /api/lesion-locations/:id`
- `DELETE /api/lesion-locations/:id`
- `POST /api/lesion-photos/`
- `GET /api/lesion-photos/location/:location_id`
- `PATCH /api/lesion-photos/:id/milestone`
- `DELETE /api/lesion-photos/:id`

### UAS7 (SLIDE6)

- `GET /api/uas7-scores/eligibility`
- `POST /api/uas7-scores/`
- `GET /api/uas7-scores/patient/:patientId`
- `GET /api/uas7-scores/week/:patientId`

### Prescriptions and laboratory (SLIDE7)

- `POST /api/prescriptions/`
- `POST /api/lab-requests`
- `GET /api/lab-results/:record_id`

### Media and answer images (SLIDE8)

- `POST /api/image-attachments/upload`
- `POST /api/image-attachments/upload-multiple`
- `GET /api/image-attachments/user/:user_id`
- `GET /api/image-attachments/view/:id`
- `DELETE /api/image-attachments/:id`
- `POST /api/answer-images/`
- `POST /api/answer-images/bulk`
- `GET /api/answer-images/:answer_id`
- `DELETE /api/answer-images/:id`

### AI (external integration, optional)

- `POST /api/ai/predict/image`

## Noteworthy examples from detailed API tabs

| Endpoint feature | Contract details shown in the Sheet |
|---|---|
| Login | Input `phone`, `password`; output `data.token`, `data.user_info` with `user_id`, `full_name`, `phone`, `role_id` (user_info may also display `display_name` per description) |
| New medical record | Input `template_id`, optional `patient_id` depending on actor, optional `answers[]`; answer includes `question_id`, optional `question_option_id`, `answer_text`, `answer_value`; record returned with status |
| Template detail | Nested `data.code_template`, `name`, `sections[]`, `questions[]`, `options[]`; option fields `id`, `option_text`, `option_value` |
| Prescription creation | Detailed Sheet uses `items[]` containing `medicine_name`, `dosage`, `frequency`, `duration`, `instruction`; slide narrative says `medicines[]` — **conflict** |
| Patient search | `keyword`, `gender`, `min_year`, `max_year`, `page`, `limit`; returned `total_records`; if only min_year present, slide requests exact-year semantics |
| UAS7 | Score components 0–3, daily total; duplicate submission produces code `5002`; fields/labels need reconciliation |

## Operational caution

The 10-week Sheet plan totals **91 API tasks**, but the same workbook has additional tabs/variations; a task count is not the same as a distinct implemented endpoint count. Some older source links point to a separate GitHub repository `datn_cuc_mai`; use as **historical reference only** after confirming it belongs to the current codebase, never automatically copy its security model or queries.

**Before implementing an endpoint:** open its exact Sheet tab, inspect request/output fields and examples, check `mayday.sql`, inspect existing backend routes and feature README, then add tests matching both success and failure cases.
