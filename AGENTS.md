# AGENTS.md

Guidance for anyone — human or AI assistant — working in this repository.

- Read `docs/ARCHITECTURE.md` first; follow its module layout.
- Follow `CONTRIBUTING.md`: branch, small PRs, `npm run ci` green.
- NestJS 12, native ESM: relative imports end in `.js`; use
  `import.meta.dirname`, not `__dirname`. Tests run on Vitest (`vi.fn()`).
- With `isolatedModules` + `emitDecoratorMetadata`, types used in decorated
  signatures must be imported with `import type`.
- Use npm 11; npm 10 fails to resolve this dependency tree.
- Catalog edits: see `docs/CATALOG.md`. Never rename a part `id`.
- Prefer NestJS first-party packages (`@nestjs/config`, `@nestjs/terminus`,
  `@nestjs/throttler`, …) before adding third-party libraries.
