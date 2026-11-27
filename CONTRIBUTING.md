# Contributing

## Workflow

1. Branch from `main`: `feature/<short-name>`, `fix/<short-name>`, or
   `catalog/<short-name>`.
2. Keep each pull request to one purpose. Refactors go in their own PR.
3. Run `npm run ci` before pushing. CI runs the same command.
4. `main` is protected: changes land only through a reviewed PR with green CI.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):
`feat(catalog): add Rira schedule`, `fix(api): return 404 for unknown model`.

## Code rules

- TypeScript strict mode; no `any` in new code unless a comment explains why.
- New behavior comes with tests: unit tests beside the code (`*.spec.ts`),
  HTTP behavior in `test/*.e2e-spec.ts`.
- Validate external input (env, files, request bodies) with Zod schemas in a
  `domain/` folder.
- No secrets in the repo. Add new variables to `src/config/env.ts` and
  `.env.example`.
- Relative imports end in `.js` (the project is native ESM).
