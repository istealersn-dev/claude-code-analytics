# Cleanup Backlog

## Scripts

- `npm run test`, `npm run test:parser`, `npm run test:db`, and `npm run db:test` reference `test/test-parser.ts`, `test/test-database-insertion.ts`, and `test-db-connection.js`, none of which exist anymore. Restore the missing entry points or replace the scripts with a working test runner.

## Backend Dependencies

- `node-cron` and `@types/node-cron` remain in `package.json` but are only mentioned in comments. Either wire them into an actual scheduler or remove them.
- `nodemailer` and `@types/nodemailer` are unused across the codebase. Remove them unless outbound email is still planned for Phase 6.

## Frontend Dependencies

- `d3-zoom` is listed in `frontend/package.json` but never imported. Drop it unless future chart work requires it.

## Follow-Up

- After trimming dependencies, run `npm install` (root and `frontend/`) to refresh lockfiles.
- Update documentation (e.g., `TODOs.md`) so the cleanup tasks are tracked alongside Phase 6 work.
