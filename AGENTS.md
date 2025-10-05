# Repository Guidelines

## Project Structure & Module Organization
Backend TypeScript lives in `src/`, split into `server` (Fastify HTTP layer), `services` (business logic), `database` (query builders), `parsers` (Claude Code JSONL ingestion), `utils`, and `types`. Transpiled output lands in `dist/` after `npm run build`; do not edit it by hand. The SPA source sits in `frontend/src` with feature folders per route; static assets live in `frontend/public`. Database schema and stack orchestration are defined in `schema.sql` and `docker-compose.yml`; keep migrations compatible with the Postgres image declared there.

## Build, Test, and Development Commands
Run `npm run dev:all` for a full-stack dev experience (Fastify on :3001, Vite on :5173). Use `npm run dev` when only the API is needed, or `npm run dev:frontend` to focus on the UI. Build distributables with `npm run build:all`; backend-only builds use `npm run build`. Parser and database smoke tests run via `npm run test`, `npm run test:parser`, and `npm run test:db`. `docker-compose up --build` boots the Postgres + API + web stack; stop with `docker-compose down`.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes, and required semicolons; run `npx biome check .` before opening a PR. Keep TypeScript strictness intact—prefer explicit return types and discriminated unions over `any`. Name files using kebab-case, React components and classes in PascalCase, and variables/functions in camelCase. Co-locate helper modules near their consumers to maintain short import paths.

## Testing Guidelines
Backend tests are TypeScript scripts executed with `ts-node`; place them under `test/` and mirror the source folder names (for example, `test/parsers/session-parser.spec.ts`). Snap backend fixtures into `src/parsers/__fixtures__` to keep runs deterministic. Ensure new features cover happy path, edge cases, and database failure modes; include assertions for metric accuracy and date handling. Run `npm run test` plus any targeted commands before pushing, and document new test entry points in the PR.

## Commit & Pull Request Guidelines
Follow the Conventional Commit prefix pattern seen in history (`feat:`, `fix:`, `docs:`). Keep commits scoped and message bodies focused on the “why”. Pull requests should link related issues, list impacted endpoints or screens, include screenshots/GIFs for UI changes, and mention required DB or env updates. Confirm Biome formatting and test status in the PR description, and note any manual QA steps reviewers should repeat.

## Environment & Configuration Tips
Copy `.env.example` to `.env` for local runs; never commit secrets. When changing database structure, update `schema.sql` and verify the Docker init volume still works. Coordinate rate limit or email credentials via `src/services` config objects so cron jobs and Fastify stay in sync.
