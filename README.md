# MathTutor AI

**Phase 0: application foundation.** An English-language Next.js workspace for a future guided algebra tutor. This phase provides design tokens, an accessible responsive app shell, real navigation and explicitly unavailable feature states.

There is no equation checker, AI integration, practice generator, progress storage or learning analytics yet. No model calls are made, no API key is needed, and no learning activity is invented. Phase 1 requires the owner's approval.

## Local setup

Use Node.js 24 (`.nvmrc`) and npm; Node 22+ is supported by the scaffold. The authoring environment has Node 24.7.0 and npm 11.5.1.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The Home, Study, Practice, Progress and Curriculum links lead to real preview routes. Study preserves the planned problem-left/tutor-right composition; phones stack problem before tutor. A missing route returns a 404.

Dependencies are project-local. Inter is bundled through Fontsource; neither build nor browsing needs Google Fonts. The first install needs access to the npm registry. The generated `package-lock.json` is included; use `npm ci` for repeatable installations.

The included `.env.example` reserves server-only settings for Phase 2. Do not add real keys now. Never expose them through `NEXT_PUBLIC_*` or commit `.env.local`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

`typecheck` generates Next route types before checking strict TypeScript. ESLint is a separate check; Next 16 does not run it during build. Browser QA targets 1440, 1024, 768, 390 and 360 pixels. Stop the server after checking.

Phase 0 has no domain logic or test suite. Vitest and React Testing Library will be introduced with the math engine in Phase 1; Playwright is planned for essential interactive flows. There is intentionally no empty `test` script that reports a false pass.

Verified on the production build: lint, strict typecheck, build and all 25 combinations of five routes × five viewport widths pass. Expected HTTP statuses and baseline security headers pass. Interactive keyboard traversal has not been separately automated.

The initial audit findings were resolved by a scoped override of the dev-tooling minimatch dependency to 11.0.1. The owner-provided live audit on 2026-11-08 reports zero known vulnerabilities; lint, typecheck, build and parser compatibility checks pass after installation. ESLint 9 remains end-of-life because the installed React/accessibility plugins do not declare ESLint 10 compatibility; review an ecosystem-compatible upgrade before release. See [implementation progress](docs/IMPLEMENTATION_PROGRESS.md) for evidence and remaining work.

## Structure

```text
src/
  app/                 # Route pages, metadata, CSS tokens, favicon, root layout
  components/
    shell/app-shell.tsx # Responsive navigation and guest header
    ui/                 # Brand, card, heading and honest pending-page states
  lib/navigation.ts     # Shared navigation definitions
docs/IMPLEMENTATION_PROGRESS.md
```

Later phases will add pure math modules under `src/lib/math/`, server-only AI integration under `src/lib/ai/`, schema-validated route handlers under `src/app/api/`, and learning events/storage under `src/lib/learning/`. The server will independently recompute algebra verdicts; model prose will not determine mathematical correctness.

## Scope and source control

The provided handoff specifications and reference PNGs remain unchanged and local. They are explicitly excluded by `.gitignore` at the owner's request. Only new implementation files belong in commits. This means a clone will not contain the private handoff kit; this README and implementation progress document describe the foundation independently.

No deployment, remote Git repository, production data, analytics, account system or paid API is configured. Vercel with Node route handlers is the planned hosting target. Web/iOS/Android expansion is a future plan: keep domain logic independent, share TypeScript contracts with React Native/Expo, and introduce authenticated backend storage when needed. No native applications exist.
