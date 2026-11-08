# 12 — Codex Engineering Playbook

## Mandatory initial context

1. Read root `AGENTS.md` and `doc/context/README.md`.
2. Read `00_PROJECT_OVERVIEW.md`, `11_DECISIONS_AND_GAPS.md`, then only relevant context files.
3. Inspect actual repository tree, related module READMEs and tests before editing. Prefer reality over proposed tree.
4. For DB work: inspect `mayday.sql` and read-only DB metadata when allowed. Confirm table/field/FK types; never assume from slides alone.
5. For API work: check the exact corresponding Sheet tab and existing implementation. Do not manufacture route names or response payloads.

## Step-by-step change protocol

1. State task scope and affected modules; separate new behavior from refactor.
2. Trace frontend → API route → controller → service → repository → tables and integrations.
3. Check all roles, permissions, medical-record ownership and status transitions.
4. Implement minimally in the proper feature directory and its internal layers.
5. Use pooled, parameterized SQL; transactions for multistep write workflows.
6. Add/update relevant tests for success, validation, authorization, ownership, duplicate/race and rollback scenarios.
7. Update READMEs in every affected directory and API contract docs if route/payload changed.
8. Run relevant lint/test/build commands found in actual `package.json`. Report exactly what was run, any failures and unverified items.

## Repository coding constraints

- Express backend only, React frontend only, separate root directories.
- Feature-first organization; service holds business rules; repository holds SQL; controller holds HTTP concerns.
- Shared code only when reusable across features; resist giant `utils` dumping grounds.
- No FE database imports; no client-side privileged database credentials.
- No unauthenticated medical record endpoints, no naive `role_id` short-circuit for permission checks.
- No hard-coded secret values, external DB host, medical/private data, fake production config, or placeholder outputs pretending to be live.
- No auto DB setup, Docker Postgres, schema changes, migrations or seeding absent explicit request.
- No new AI model server; integrate external inference by adapter when needed.
- No unrelated dependency/toolchain overhaul or full repo restructuring during a small feature task.

## README policy (owner-required)

**Every directory added by Codex gets `README.md`**. Exceptions: conventional generated directories not tracked in Git (`node_modules`, build artifacts, coverage). Within a directory:

- `README.md` at root: project role, setup, commands, tree, links to child READMEs.
- Mid-level README: what subdirectories own and how they interact.
- Leaf README: file-by-file explanation, API/DB contract, dependencies, edge cases, tests, examples of internal flow where helpful.

Update README when behavior, layout or public contracts change. Do not copy a generic README into every folder; write local, actionable descriptions.

## Definition of done

- Contract and real DB schema aligned, or ambiguities explicitly listed.
- Feature meets requested behavior with guarded access and helpful validation errors.
- No accidental changes to existing DB infrastructure.
- Automated checks pass (or output clearly identifies why they were not run).
- Relevant README and API documentation updated.
- Delivery note lists touched files, tests and limitations.

## Example Codex prompts

> Implement `backend/src/modules/uas7` following `doc/context/` and existing repo conventions. First verify `mayday.sql` types and the response-code/Sheet tab contracts. Do not create/migrate the database. Add tests and READMEs.

> Implement the doctor patient-search screen in `frontend/`. Reuse the existing HTTP client and actual backend contract, include filters/pagination/loading/error, and add relevant README documentation. Do not connect directly to PostgreSQL.
