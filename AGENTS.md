# AGENTS.md

## Task Completion Requirements

- All of `pnpm format`, `pnpm lint`, and `pnpm typecheck` must pass before considering tasks completed.

## Project Snapshot

OptStuff is a secure image optimization API service providing on-the-fly image optimization, signed URL security, and multi-tenant management.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- `apps/optstuff-dashboard`: Dashboard app for managing image optimization and signed URL security.
- `apps/optstuff-marketing`: Marketing website for OptStuff.
- `packages/auth`: Authentication utilities.
- `packages/eslint-config`: ESLint configuration.
- `packages/hooks`: Shared React hooks.
- `packages/typescript-config`: TypeScript configuration.
- `packages/ui`: Shared UI components.
- `examples/nextjs`: Next.js integration example.

## TypeScript

- Never use `any` unless 100% necessary or specifically instructed.


## Commands
- Don't run dev server commands (e.g., `bun run dev`) - assume it's already running.
- Don't run build commands unless specifically told to.
- Focus on checking commands like `pnpm lint`, `pnpm format`, and `pnpm typecheck` to ensure code is consistent and correct.

## Workflow
- If asked to do too much work at once, stop and state that clearly.