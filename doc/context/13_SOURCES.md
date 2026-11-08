# 13 — Sources and Provenance

## Sources actually consulted for this context package

### 11 DrMayDay slide decks in shared Drive folder

Folder: [DrMayDay slide library](https://drive.google.com/drive/folders/1Zkisee35Crla_q6NNWWmaG-NPy0P-ETz)

| File | Scope | Direct Drive link |
|---|---|---|
| SLIDE1 | Product vision, requirements, schema overview | [Slide 1](https://docs.google.com/presentation/d/1jAUK9K4I_qS_yjnRTGYFkMGlz0ny6QK_/edit) |
| SLIDE2 | Auth, profiles, staff creation | [Slide 2](https://docs.google.com/presentation/d/1v0dz8HcKuHRK6lRKZAIQLKZP7nfVMTdq/edit) |
| SLIDE3 | Users, role and permissions | [Slide 3](https://docs.google.com/presentation/d/1J4AdTaR_mnS8LJRlN_11V30wEl08iOFL/edit) |
| SLIDE4 | Branches, departments, rooms | [Slide 4](https://docs.google.com/presentation/d/19-LZFbOgwL1MXT4zo85rn_yCWc7-Bf4J/edit) |
| SLIDE5 | Patients and medical records | [Slide 5](https://docs.google.com/presentation/d/1aIkefb3nAbAFbCZKzXc33UbmvSD5xuHR/edit) |
| SLIDE6 | UAS7 | [Slide 6](https://docs.google.com/presentation/d/1huE9dDGwnVz-o7u2di5HYSfaUOe7l8Ho/edit) |
| SLIDE7 | Prescription and laboratory | [Slide 7](https://docs.google.com/presentation/d/19mhG-Ytc8zRcfiuyK3Acd-V-0xANpFmT/edit) |
| SLIDE8 | Media uploads and answer images | [Slide 8](https://docs.google.com/presentation/d/1uRXULwftBpm2khSeZ1FcnHIzin54XpB9/edit) |
| SLIDE9 | Lesion tracking | [Slide 9](https://docs.google.com/presentation/d/1-zpEoiIE7K3PG_VV1u8gMFUCYV_706Uz/edit) |
| SLIDE10 | Push notifications | [Slide 10](https://docs.google.com/presentation/d/1ctZLnJwDqcsy-CUDRjSsXJRoNrCqFI4h/edit) |
| SLIDE11 | Dynamic form builder | [Slide 11](https://docs.google.com/presentation/d/1ud0Anm6AtYVnGo9hGDDdmLoNK4yj9XUG/edit) |

### Detailed API workbook linked from SLIDE1

- [Google Sheet `api` — request/response per endpoint, `3. response code`, `1. Weekly API`, legacy reference API list](https://docs.google.com/spreadsheets/d/162s8pbiP7WhOwSDWopc11hK3Qp-CBYF19qv25ShMKCA/edit).
- Relevant tabs: `1. Weekly API`, `2. API đã có_ĐATN`, `3. response code`, the individual endpoint-named tabs (e.g. `1.2 login`, `GET /api/templates/:id`, `POST /api/v1/medical_records`, `POST /api/prescriptions/`).
- Workbook tab `2. API đã có_ĐATN` includes historical references to repository [datn_cuc_mai](https://github.com/doantrunghieu08/datn_cuc_mai). These links are a **reference, not verified current Mayday implementation**.

## Prior project decisions (conversation context)

- User requested an ExpressJS/ReactJS repository with separate `backend/` and `frontend/` directories.
- Prior conversation chose modular-monolith/hybrid organization as the preferred baseline.
- User clarified database has public IP, so only web/backend need connecting; no DB setup by default.
- User required detailed README files at every nested directory, with broader parent-level overviews.
- A previous chat referenced an uploaded `mayday.sql` with a report of 44 tables; no SQL file bytes were available in this context-export session.

## Not treated as a DrMayDay source

SLIDE1 contains an unrelated Google Docs link on its title page that resolves to a programming assignment about `net.xml`, not a Mayday specification. It was **excluded** deliberately.

## Provenance boundaries

- Slide prose and Sheet cell values were read on **2026-11-06**. Source content may be changed after that date.
- Diagrams in this bundle are explanatory reconstructions. Original slide screenshots of detailed payloads were not individually transcribed; use the linked Sheet for exact contract fields.
- No source code checkout, schema dump, live DB connection or build/test execution was available during export.
- Proposed architecture and directory trees are labeled as proposals, not established repository implementation.
