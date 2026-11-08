# AGENTS.md — DrMayDay / Mayday

> Repository-wide instructions for Codex and other coding agents.  
> Project: DrMayDay — clinical management and chronic urticaria (mề đay) tracking.  
> Updated: 2026-11-07.
> These instructions apply to the whole repository unless a more specific nested `AGENTS.md` exists. A nested file may refine local conventions but must not weaken security, database, or privacy requirements.

## 1. Mission and engineering boundaries

Build and maintain DrMayDay using the existing project decisions and verified source contracts. Focus on reliable clinical workflows, clear module boundaries, safe database access, precise authorization, and maintainable documentation.

**Confirmed project decisions:**

- `backend/`: **Node.js + ExpressJS** REST API.
- `frontend/`: **ReactJS** web app.
- Maintain separate backend and frontend directories in the same repository.
- Architecture: **Modular Monolith with hybrid feature-first / layer-inside organization**. Organize major business capabilities as modules; organize controllers, services, repositories, validation, etc. inside each module.
- Database: an **existing remotely hosted PostgreSQL instance** (publicly reachable IP). Only the backend accesses it, normally through a shared `pg.Pool` connection layer.
- **Database-first implementation (owner confirmed 2026-11-06): prioritize the existing database when planning and implementing features.** Use the verified schema as the implementation baseline; adapt architecture and API/data mapping to it rather than reshaping the database to match older slides or context proposals. See §3.1.
- **Do not provision or recreate PostgreSQL**, add Docker/database infrastructure, run seeds, reset data, add migrations, or modify the schema unless the project owner explicitly asks.
- Frontend communicates with backend using HTTP(S)/JSON; it must never connect to PostgreSQL or contain DB credentials.
- Medical-image AI inference is owned by a different team/service. Our scope is the integration client/adapter when specifically required—not model training or implementation.
- Write useful, hierarchical **`README.md` files for every source directory** added under `backend/` or `frontend/`. See §11.

Do not introduce a new framework, language, ORM, API paradigm, backend service, monorepo tool, or deployment system just because it is popular. Follow the actual repository's installed choices. Where a choice has not been made (JS/TS, Vite, React Router, form library, state manager, test runner, lint setup, etc.), **inspect current files first** and avoid parallel stacks.

## 2. Mandatory context-loading protocol

At the beginning of a task:

1. Read this repository-root `AGENTS.md`.
2. Read [`doc/context/README.md`](doc/context/README.md), then [`doc/context/00_PROJECT_OVERVIEW.md`](doc/context/00_PROJECT_OVERVIEW.md) and [`doc/context/11_DECISIONS_AND_GAPS.md`](doc/context/11_DECISIONS_AND_GAPS.md).
3. Read only the context documents pertinent to the requested task (see routing table below). For difficult cross-cutting changes, also read [`doc/context/12_CODEX_PLAYBOOK.md`](doc/context/12_CODEX_PLAYBOOK.md).
4. Inspect the **current checked-out code**, relevant directory READMEs, `package.json` files, tests, configuration and SQL schema before changing files.
5. Identify the actual API contract and DB tables involved. Do not equate an example in a slide with a final implemented contract.

| Task area | Context to read (all paths relative to `doc/context/`) |
|---|---|
| Product behavior / clinical rules | `01_SCOPE_AND_REQUIREMENTS.md`, `02_DOMAIN_MODEL.md`, `10_BUSINESS_FLOWS.md` |
| Backend feature or API | `03_ARCHITECTURE.md`, `04_BACKEND_STRUCTURE.md`, `06_DATABASE_CONTRACT.md`, `07_API_CATALOG.md`, `08_API_RESPONSES.md`, `09_AUTH_AND_SECURITY.md` |
| Frontend feature | `03_ARCHITECTURE.md`, `05_FRONTEND_STRUCTURE.md`, `07_API_CATALOG.md`, `08_API_RESPONSES.md`, `10_BUSINESS_FLOWS.md` |
| SQL queries / data mapping | `02_DOMAIN_MODEL.md`, `06_DATABASE_CONTRACT.md`, `11_DECISIONS_AND_GAPS.md`, **actual `mayday.sql`** |
| Auth, permissions or sensitive data | `09_AUTH_AND_SECURITY.md`, `02_DOMAIN_MODEL.md`, `06_DATABASE_CONTRACT.md` |
| API contracts / response codes | `07_API_CATALOG.md`, `08_API_RESPONSES.md`, `11_DECISIONS_AND_GAPS.md` |
| Integrations | `03_ARCHITECTURE.md`, `01_SCOPE_AND_REQUIREMENTS.md`, relevant feature docs |

If a referenced file does not exist in the checkout, **report that fact** and proceed from verified repository evidence; do not invent its contents. Do not scan every document indiscriminately when only one module is relevant.

## 3. Source of truth and conflict resolution

Different sources describe *current state*, *intended contracts*, and *proposals*. Handle them explicitly:

1. **Repository reality** (code, tests, configuration and actual SQL DDL) establishes what is currently implemented and which database fields actually exist.
2. **Explicit project-owner instructions** establish the intended solution and override older proposals.
3. **Detailed endpoint specifications in the linked Google Sheets API workbook** are the primary reference for proposed API request/response contracts, subject to confirmation against live implementation and newer owner decisions.
4. **DrMayDay slide decks** establish requirements, workflows and use cases; some example endpoints and sample data are stale or inconsistent.
5. **`doc/context/` architecture proposals** guide implementation without claiming all their paths/modules are already present.

A working implementation is not necessarily correct intended behavior. If the code and approved contract differ, **report the discrepancy, preserve backward compatibility where possible, and resolve consequential contract changes before implementing them**. For a task where a choice is unavoidable, make the narrowest safe change, document the assumption, and do not silently invent a new contract.

**Known conflicts to check rather than guess:**

- The sources disagree on DB table count; consult the actual `mayday.sql`, not a reported total.
- API base prefix (`/api` vs `/api/v1`) and some endpoint names differ.
- `1001` is used for created results in endpoint specs but is absent from the central response-code table shown in source material.
- `ISS7`/`HSS7` descriptions may reverse itch versus wheal/hive meanings; verify approved labels before using them in user-facing clinical screens.
- Prescription item array is named `items` in one endpoint sheet and `medicines` in a slide.
- FCM token registration endpoint, lesion-photo listing path, some ID types and record status values differ across sources.
- Allowed upload size is ambiguous (5 MB or 10 MB in source examples); a batch maximum of 10 images appears in requirements.
- Exact foreign keys, `ON DELETE` behavior, enum values and column names require inspection of DDL.

Keep unresolved material discrepancies in `doc/context/11_DECISIONS_AND_GAPS.md`. **Never invent SQL columns, foreign keys, roles, error codes, routes or JSON fields to make code compile.**

### 3.1. Database-first baseline — owner decision, 2026-11-06

**Current full-project implementation constraint (owner reaffirmed): do not modify, add or delete database tables or otherwise change the schema. Build against the existing database. Unsupported persistence requirements remain explicit gaps; do not create replacement storage or migrations.**

**Owner authorization, 2026-11-07 (resumed after a requested stop): agent may INSERT needed data into the existing database. Never UPDATE, DELETE, TRUNCATE, MERGE or use ON CONFLICT DO UPDATE against existing remote data; never add/alter/drop columns, tables or other schema objects.** This supersedes the prior blanket no-remote-writes restriction only for authorized additive data operations. Keep discovery/checks READ ONLY and tests mocked unless an explicit real-data test scope is established; do not seed unrelated accounts/clinical fixtures or delete data for cleanup. The patient-role activation inserted one missing existing role-permission link using ON CONFLICT DO NOTHING; see doc/project-report.md and backend/scripts/README.md. Preserve authorization/ownership checks, existing data and credentials. SQL SELECT row locks/transaction control are not data edits. Existing application API edit workflows are not changed by this operator-task authorization.

- Read **`doc/mayday.sql`** for the local schema baseline. If authorized read-only metadata later shows drift, report the difference and establish the current schema before dependent work; do not assume the dump and remote DB are identical.
- The inspected dump contains **44 tables**, primarily with Vietnamese names, and the view `v_chukytheodoiuas7`. Recheck the actual DDL when it changes; older context files were written without access to this dump.
- Identity is modeled by `nguoi`, `taikhoan`, `benhnhan` and `nhanvien`; authorization by `vaitro`, `quyenhan` and `vaitroquyenhan`. Do not write queries against illustrative English tables such as `users` or assume endpoint-permission/session tables exist.
- Clinical persistence centers on `hosobenhan` with acute/chronic subtypes (`benhanmaydaycap`, `benhanmaydayman`) and `phienkham` with its own subtypes. Preserve this distinction. Doctor linkage exists on `phienkham.ma_bac_si`; do not invent a record-level assignment column or infer the acceptance workflow from it.
- The dump has no Template → Section → Question → Option / answers persistence, token blacklist, notification/FCM persistence or lab-request header/items model described in older context. Treat these as unresolved capability gaps, not implemented features or permission to create replacement tables. Existing specialized clinical tables do not by themselves replace the dynamic-form requirement.
- Plan the first implementation slices around capabilities supported by the existing schema and confirmed business rules. Features needing additional persistence remain explicitly blocked or deferred until the owner approves a solution. Do not silently drop requirements or fabricate storage, routes, permissions or clinical behavior.
- Keep verified API contracts stable through explicit mappers where possible. If a contract cannot be fulfilled with the existing schema, explain the mismatch and resolve the consequential contract decision before implementing it; database priority does not authorize silently changing an approved API.
- Respect generated columns, deferred parent/subtype foreign keys, actual delete policies and uniqueness constraints. Use transactions for related parent/subtype writes. The daily UAS schema names HSS as `diem_san_phu_hss` and ISS as `diem_ngua_iss`; preserve their meanings when mapping fields.
- Schema presence establishes storage capability, not product scope or clinical policy. Tables such as `sanglocbaodongdo`, AAS and PROMs do not automatically require new Web/mobile features.
- This decision takes precedence over conflicting architecture/schema assumptions in `doc/context/`. It does **not** authorize database writes for discovery, schema changes, migrations, seeds, infrastructure provisioning or disclosure of credentials. Follow the existing approval and privacy boundaries.

## 4. Product scope and users

DrMayDay manages healthcare operations and chronic urticaria tracking with extensible examination templates. Its principal capabilities are:

1. **Authentication and accounts:** patient signup/login/logout, password management, patient/staff profiles, authorized staff creation.
2. **Organization and access control:** branches → departments → rooms; users, roles, permissions, role-permission and endpoint-permission relationships.
3. **Dynamic examination forms:** templates → sections → questions → options, including conditional display logic.
4. **Patients and medical records:** patient search, classification, record creation, answers, acceptance by doctors, clinical review and closure.
5. **Lesion tracking:** episodes → affected body locations → progression photos at `start`, `peak`, `normal` milestones.
6. **UAS7:** daily component scores, duplicate prevention, clinical history/aggregation where specified.
7. **Labs and prescriptions:** request headers, line items, results and medication instructions.
8. **Media:** secure upload, shared attachment metadata, answer-image mapping and lesion-photo references.
9. **Notifications:** FCM token registration, notification history, read/delete operations and user settings.
10. **Optional AI integration:** call an external inference API for image analysis when its contract is supplied.

**Web audience:** doctors, authorized healthcare staff and administrators. A patient-facing mobile client belongs to a separate workstream; **do not build an unrelated patient web app or the mobile app unless requested**. Backend endpoints may still serve patient workflows.

This system stores sensitive medical data. Do not add autonomous medical diagnosis, treatment decisions or clinical inference beyond explicitly approved product requirements.

## 5. Repository layout and ownership

Expected top-level layout (a **target convention**, not a claim that every item already exists):

```text
mayday/
├── AGENTS.md
├── README.md
├── doc/
│   └── context/
│       ├── README.md
│       ├── 00_PROJECT_OVERVIEW.md
│       ├── ...
│       └── 13_SOURCES.md
├── backend/
│   ├── README.md
│   ├── package.json
│   └── src/
│       ├── app/                 # Express assembly / bootstrap
│       ├── config/              # Environment-aware configuration
│       ├── database/            # Shared pg pool and transaction helpers
│       ├── modules/             # Business features
│       ├── shared/              # Truly cross-module infrastructure
│       └── ...
└── frontend/
    ├── README.md
    ├── package.json
    └── src/
        ├── app/                 # Application composition / routing
        ├── features/            # Business-facing UI features
        ├── shared/              # Reusable UI and infrastructure
        └── ...
```

Do not restructure an already working repository simply to match this sketch. A focused task should touch only its necessary modules. Avoid root-level folders named `controllers/`, `services/`, `repositories/` and `components/` that aggregate unrelated business features; prefer placing feature-specific code together.

### Backend: feature-first, layers inside a feature

Typical feature layout (adapt to existing naming and dependencies):

```text
backend/src/modules/medical-records/
├── README.md
├── medical-records.routes.js
├── medical-records.controller.js
├── medical-records.service.js
├── medical-records.repository.js
├── medical-records.validation.js
├── medical-records.constants.js     # If needed
└── __tests__/                       # If supported by the project
```

The names/extensions above are **illustrative**; use existing JS or TS conventions. Responsibilities:

- **Routes:** declare URLs, methods, middleware and mapping to controllers.
- **Controllers:** translate HTTP requests/responses; do not perform SQL or embed business rules.
- **Services:** enforce domain invariants, workflows, data ownership, state transitions and transaction boundaries.
- **Repositories:** implement parameterized SQL/data access; do not know about Express `req`/`res`.
- **Validation:** request shape, types, allowed values, limits and contextual constraints as needed.
- **Shared infrastructure:** centralized error handling, authentication primitives, reusable `pg.Pool`, logger and integration clients. Do not turn `shared/` into a catch-all business module.

Illustrative module groupings: `auth`, `users`/`accounts`, `access-control`, `staff`, `patients`, `facilities`, `dynamic-forms`, `medical-records`, `lesion-tracking`, `uas7`, `laboratory`, `prescriptions`, `media`, `notifications`, `integrations`. Align actual modules with the checked-out schema and repository. `visits`, `red-flag-screening` and AI implementation are **not automatically required** merely because they appeared in earlier planning proposals.

Feature-to-feature calls should go through explicit service interfaces or well-defined shared contracts, not by importing another feature's private repository or duplicating its SQL.

### Frontend: feature-first React

Typical feature layout (adapt to existing conventions):

```text
frontend/src/features/medical-records/
├── README.md
├── api/                   # Typed/validated API boundary if used
├── components/            # Feature UI pieces
├── hooks/                 # Feature hooks when useful
├── pages/                 # Feature route screens
├── utils/                 # Feature-local pure utilities
└── ...
```

- `app/` handles app bootstrap, routing, providers and app-level composition.
- `features/` groups screens, hooks, API access and business UI by feature.
- `shared/` contains genuinely reusable components, HTTP client, helpers and design primitives.
- Keep clinical calculations and authorization decisions authoritative on the server; frontend validation improves UX but does not substitute for backend validation.
- Use existing navigation, data fetching, form and state libraries. Do not introduce Redux, Zustand, TanStack Query, React Router, Tailwind, a UI kit or TypeScript without assessing the current codebase and actual need.

## 6. Database access: existing PostgreSQL only

- The real schema in `mayday.sql`, or confirmed read-only PostgreSQL metadata when authorized, is the authority for table/column names, types, constraints and relationships.
- There is **no mandate to create database infrastructure**. Never start a local replacement PostgreSQL, invent migrations or seed scripts, overwrite the remote DB, or issue schema-changing SQL without explicit authorization.
- A public database address is **not permission to expose PostgreSQL to browsers** or copy host/credentials into source control.
- Use one configured backend connection pool (normally `pg.Pool`); avoid a new pool in each module/request.
- Use **parameterized queries** (e.g. `$1`, `$2`) and controlled SQL identifiers; never interpolate untrusted input into SQL strings.
- For multi-table writes (e.g. user+patient, medical record+answers, prescription+items, lab request+items) use **transactions** with the same acquired client, proper `BEGIN`/`COMMIT`/`ROLLBACK`, and guaranteed release.
- Respect DB `UNIQUE`, `FOREIGN KEY`, `NOT NULL` and `ON DELETE` constraints; translate expected constraint violations to stable API errors. Do not expose raw SQL errors or schema detail to the client.
- Prevent race conditions on doctor acceptance, duplicate UAS7 entries and other stateful transitions using verified DB constraints or safe conditional updates/locking; do not rely only on a prior SELECT.
- Avoid destructive operations against existing production-like medical data. Tests should use mocks or a dedicated authorized test environment; **never assume the remote DB is a disposable test database**.
- Keep DB connection details in backend environment variables. Commit only a **redacted `.env.example`** with names/placeholders; do not commit `.env`, actual IPs, passwords, certificates or access tokens.
- If a DB or integration is unavailable, report the block and perform only checks possible without causing data loss. Do not fake a successful DB result.

### Existing connection exception — owner authorized 2026-11-06

For the currently configured PostgreSQL endpoint only, the owner authorized using its existing `sslmode=disable` connection after being informed that the server does not support TLS. Preserve this explicit setting without disabling certificate validation on TLS connections. This exception does not apply to other endpoints. Connection checks must use read-only transactions and must not modify data or schema. The endpoint rejects the startup parameter `statement_timeout`; use client query timeouts rather than sending that parameter at connection startup. Never print the private URI or password.

## 7. API design and response compatibility

- Use existing REST routes and API version conventions. The proposed `/api/v1` prefix is **not** authorization to rename existing `/api` routes unilaterally.
- Consult `doc/context/07_API_CATALOG.md`, `08_API_RESPONSES.md`, and the exact linked Google Sheets endpoint specification when working on a contract.
- Keep the established response envelope (often `code`, `message`, `data`) and project-specific business code format **as actually verified**; do not confuse business codes with HTTP status codes.
- Preserve types defined by the accepted contract even when unusual (some sheet responses describe IDs and booleans as strings). Perform explicit, testable conversions at the boundary. Do not blanket-stringify all data based on one example.
- Centralize response formatting, validation failures and error conversion rather than constructing incompatible variants in every controller.
- Use appropriate HTTP statuses and explicit authorization failures; never return success on a failed write or hide an internal error as an empty successful result.
- Validate query/path params, pagination limits, filter operators, enum values, dates and upload types/sizes. Avoid unbounded list endpoints by default.
- For changes to request fields, response bodies, permissions or routes, update frontend callers, tests and contract documentation together, or document the compatibility plan.
- Do not implement an endpoint simply because its worksheet tab exists; scope work according to the request and verified product priorities.

## 8. Authentication, RBAC and medical privacy

**Server-side checks are mandatory**, regardless of frontend route/menu visibility.

- Authenticate protected requests with the project's approved JWT/Bearer mechanism; verify signature, expiry and applicable revocation/blacklist behavior.
- Treat logout and password changes according to the verified token invalidation policy; do not assume local browser token deletion alone revokes server access.
- Apply **dynamic RBAC**, based on actual roles/permissions/endpoint mappings where supported; do not scatter hard-coded `role_id` checks or assume any role name grants unlimited clinical data access.
- Authorization has at least two dimensions: **capability** (may this role perform the action?) and **resource scope** (may this specific user access this patient/record/image?). Check both.
- Patients access only their own records, answers, UAS7, photos, notifications and appropriate reports.
- Doctors may access or change the records their role and assignment allow. For actions requiring an assigned doctor, verify `assigned_doctor_id` (or the actual equivalent) on the server. An unrelated doctor must not be able to prescribe or close a case.
- Staff assignments must respect the verified branch → department → room hierarchy, not merely individually valid IDs.
- Prevent IDOR (insecure direct object references) by scoping repository/service queries to authorized owners and permitted organizations where appropriate.
- Never trust a client-provided owner/doctor ID for privileged assignments when it should be derived from the authenticated user.
- Never include passwords/hashes, OTP codes, JWTs, DB credentials, FCM credentials, sensitive clinical data or private object-storage paths in client responses, logs, screenshots, test fixtures or docs.
- Serve private media through an authorized access path / short-lived URL mechanism supported by the project, not uncontrolled public buckets by default.
- Require HTTPS/TLS for remote sensitive transports; do not disable TLS validation to bypass connection issues.
- Use generic, controlled auth error responses when distinguishing accounts would disclose sensitive user existence; preserve the approved API error contract where required.

## 9. Core domain invariants

Apply the verified SQL and accepted API contracts; these are domain-level guardrails, not substitutes for the actual DDL.

### Medical records

- Workflow typically progresses `pending` → `in_progress` → `completed`. Some source tabs also mention `draft` and `cancelled`: confirm actual supported transitions before coding.
- A doctor can accept only an eligible pending record; concurrent acceptance must not assign two doctors.
- Completed records must not accept further edits where the specification forbids them; protect historical clinical data.
- Medical-record history and answers must be filtered by patient ownership / authorized clinician access.
- Preserve records and audit-relevant clinical history; do not assume hard-deleting a user or form should cascade into medical records.

### Dynamic forms

- The tree is `Template` → `Section` → `Question` → `Option`, with ordered sections/questions and role-specific `filled_by` as supported.
- Conditional logic (`parent_question_id`, `show_if_answer`, `condition_rules`) must be handled consistently between FE rendering and BE validation.
- Avoid invalid parent links, circular dependencies, cross-template references and child answers inconsistent with enabled conditions.
- Do not delete a template already used in existing records if the approved contract forbids it; verify how versioning/historical answers are preserved.

### UAS7 and lesion tracking

- Daily scores typically contain two components each in the `0..3` range; validate the approved labels for ISS7/HSS7 and aggregate only as specified.
- Prevent duplicate `(patient_id, score_date)` submissions using the actual unique constraint/transactional design.
- Episode → location → photo relationships must belong to an authorized patient/medical record.
- Only accept verified progression milestones (`start`, `peak`, `normal`) and supported symptom ranges; do not silently reinterpret clinical data.
- Any AI-provided counts or AUAS values should be distinguished from clinician/patient observations and handled as external output, not guaranteed medical truth.

### Prescriptions, laboratory and attachments

- Multi-row prescriptions and lab orders must be atomic, validated and restricted to authorized clinical personnel.
- Image upload metadata should be persisted only after successful object storage handling; recover safely from partial failures.
- Unlinking an answer image **does not automatically delete the underlying stored image**, which might be reused elsewhere.
- Physical media deletion must account for all references and verified database `CASCADE`/`RESTRICT` behavior before deleting an object.
- Validate file MIME/content and size and limit batch uploads according to the approved contract (requirements mention at most 10 images).

## 10. External service boundaries

- Isolate MinIO/S3-compatible storage, Firebase FCM, SMS/email OTP and AI calls behind small clients/adapters. Use the repository's existing infrastructure if present.
- Configure service endpoints/credentials only through backend environment, secret managers or approved deployment configuration.
- Handle network errors, timeouts, transient service failure and retries carefully. Never duplicate non-idempotent medical writes on unsafe retries.
- Do not claim a push notification, SMS, image upload, or AI result succeeded until the actual provider reports success. Make partial failure observable without leaking clinical data.
- No new local AI inference server/training pipeline, object-store deployment, or notification service provisioning unless specifically requested.

## 11. README and context documentation policy

**Every new tracked source directory under `backend/` or `frontend/` must have a meaningful `README.md`.** Existing directories touched by meaningful structural/behavior changes must have their README updated or created if missing. Exclude generated and untracked folders such as `node_modules/`, `dist/`, `build/`, `coverage/` and temporary caches.

Documentation detail increases with directory depth:

- **Repository `README.md`:** what DrMayDay is, project layout, prerequisites, safe local startup and links to backend/frontend/context docs.
- **`backend/README.md`, `frontend/README.md`:** responsibility, architecture overview, startup/verification commands and child-directory map.
- **Mid-level directory README:** scope, dependencies and responsibilities of immediate children; do **not** copy every leaf implementation detail.
- **Feature/module README:** purpose, data flow, routes/screens, involved DB tables, permissions, dependency boundaries, key invariants, tests and links to lower-level details.
- **Leaf directory README:** exact file responsibilities, usage, contracts, nonobvious edge cases and local commands where useful.

Update relevant READMEs whenever a module, public API, data flow, dependency, permissions or structure changes. Keep docs factual: label planned features as planned, do not claim unimplemented code exists. Never put real passwords, access tokens, public DB address, patient data or secret values into documentation.

Keep `doc/context/` synchronized when a **confirmed** product rule, architecture decision or API contract changes. Record a previously unresolved conflict in `11_DECISIONS_AND_GAPS.md` with its resolution; update the corresponding domain/architecture/contract document. Do not rewrite unrelated context files or duplicate the whole source tree in every README.

## 12. Coding and maintainability conventions

- Follow existing formatting, naming, import style, language (JS/TS) and package structure. Favor explicit names based on domain concepts.
- Keep functions cohesive; separate HTTP handling, business decisions and persistence. Do not put SQL in React or Express controllers.
- Handle async errors centrally and do not leave floating promises/unhandled rejections.
- Use `async`/`await` consistently with established style; release DB connections and clean up transient resources in `finally` where applicable.
- Avoid mutable global request state. Use dependency boundaries where mocking and testing benefit.
- Reuse existing validators/constants/response helpers; do not create redundant abstractions for a single trivial function.
- Prefer predictable API serialization (date/timezone, numeric/string IDs, nullability) and document conversions.
- Make user-facing screens accessible: labels, keyboard navigation, actionable validation, loading/error/empty states, and permission-aware UI affordances.
- Do not perform unrelated formatting, mass renames or large refactors in a feature fix. Never remove code or configuration merely because it looks unused without checking actual references.
- Preserve non-ASCII Vietnamese text correctly (UTF-8). Do not use sample patient records that resemble real private medical data in tests or docs.

## 13. Testing and verification

Before declaring a task complete:

1. Inspect **actual** scripts in `backend/package.json` and `frontend/package.json`; run relevant existing lint, tests, typecheck/build commands when available. **Do not invent script names**.
2. Add/update focused tests using the repository's chosen framework. Cover successful flows, invalid input, denied role, wrong owner/unassigned doctor, absent resources and relevant state transitions.
3. For multi-table writes, test rollback on failure, uniqueness/duplicate cases and concurrent operations where material.
4. For API changes, test response `code`/`message`/`data` and field types against the accepted contract; test frontend handling of expected error states.
5. For FE changes, test loading, empty state, errors, permissions, form branching and accessibility as relevant.
6. Do not run destructive tests or ad hoc writes against the existing remote PostgreSQL instance unless explicitly authorized and a safe test scope is established.
7. Report **exactly which checks ran**, their results, and any checks skipped because of missing setup, credentials, unavailable services or absent scripts.

Do not manufacture passing test logs, successful database connections, provider responses or completed deployment status.

## 14. Standard agent workflow

### Before coding

- Summarize the requested outcome and modules involved.
- Read the required context and targeted local README(s).
- Inspect code, routes, SQL, dependencies and existing tests.
- Identify the authorized roles, object ownership, relevant medical-record state and external service boundaries.
- Note **material** conflicts; follow the source-of-truth rules in §3.

### While coding

- Implement the **smallest complete vertical slice** satisfying the request.
- Keep backend routes → controller → service → repository responsibilities clear.
- Use verified DB structures, parameterized queries and transactions as needed.
- Preserve backend/frontend separation and reuse existing helpers.
- Add tests and update documentation **as part of the same change**.
- Avoid unrequested upgrades, services, database setup or unrelated reorganization.

### Before delivery

- Review changed files for secrets, private medical data, authorization gaps, SQL injection, unintended remote DB writes and accidental public media exposure.
- Run relevant tests/lint/build if supported.
- Update directory README files and resolved context gaps.
- Summarize implemented behavior, affected files, tests run and outstanding limitations.

## 15. Definition of done

A requested change is complete only when, to the extent supported by the actual repository:

- It follows confirmed Mayday stack, module boundaries and product scope.
- Its API and SQL assumptions are verified, or meaningful unresolved differences are explicitly documented.
- Backend enforcement covers authentication, RBAC, record ownership and doctor assignment where required.
- Sensitive data and secrets stay protected.
- Multi-table writes and status transitions preserve integrity.
- Relevant automated checks pass, or unrun/failed checks are disclosed accurately.
- Local README documentation and relevant `doc/context/` files reflect actual changes.
- No unrequested DB setup/schema change, external AI engine or infrastructure has been introduced.

## 16. Reference links and final reminder

- Context navigation: [`doc/context/README.md`](doc/context/README.md).
- Confirmed choices and open conflicts: [`doc/context/11_DECISIONS_AND_GAPS.md`](doc/context/11_DECISIONS_AND_GAPS.md).
- Source document inventory: [`doc/context/13_SOURCES.md`](doc/context/13_SOURCES.md).
- Agent operational playbook: [`doc/context/12_CODEX_PLAYBOOK.md`](doc/context/12_CODEX_PLAYBOOK.md).

**Critical reminder:** The `doc/context/` files describe documented requirements and a proposed implementation model, **not a guarantee that every feature, folder or field exists**. Inspect the actual repository and `mayday.sql` before coding; use the owner's confirmed decisions to guide changes, and never resolve contract ambiguities by quietly inventing behavior.
