# Implementation progress

## Current boundary

Phase 0 only. Phase 1 must wait for the owner's explicit approval. Status: Phase 0 scaffold verified. Lint, strict typecheck, production build and all 25 responsive checks pass. Stopping before Phase 1; the identified dev-tooling advisory is resolved with a zero-finding live audit; a separately automated keyboard flow and the lint ecosystem upgrade remain documented follow-ups.

## Initial audit — 2026-11-08

- Read `AGENTS.md`, `README_START_HERE.md`, and every original `docs/*.md` (01–06).
- Visually inspected both PNGs. Reference 02 defines the Study composition; reference 01 informs the light, spacious Home treatment.
- Initial directory contained only the handoff kit, no application, package manifest, installed dependencies or Git repository. `.env.example` was referenced by the handoff but missing; added an empty-key template.
- Recorded SHA-256 hashes for all 13 original files before edits. All original files must remain byte-for-byte unchanged and excluded from commits at the owner's request.
- Node 24.7.0 and npm 11.5.1 are available. No services were listening on the project QA ports at the start.
- Local installation was explicitly authorized in chat. Global packages, plugins and hooks remain out of scope.

## Plan and proposed architecture

1. **Phase 0 — foundation:** preserve handoff, add Next.js/strict TypeScript/Tailwind, tokens, shared primitives and responsive shell; verify checks and stop.
2. **Phase 1 — Study and math:** high-fidelity equation UI, restricted parser with exact rational arithmetic, generalized distribution detection, Vitest/RTL tests. No arbitrary expression evaluation.
3. **Phase 2 — real tutoring:** server-only OpenAI Responses API, Zod request/response contracts, server-recomputed math verdicts, Socratic hint state machine, honest failures. Live API checks require separate approval to spend credits.
4. **Phase 3 — transfer and history:** independently verified problem generator, deduplicated learning events and versioned browser persistence, actual Practice/Progress views.
5. **Phase 4 — supporting views:** complete Home and Curriculum from real learning activity, visual polish and accessibility review.
6. **Phase 5 — assessment QA:** full reviewer flow, production-readiness checks and submission documentation. Push/deploy only on explicit request.

Planned data flow: React workspace → validated server request → independent math verifier → teaching policy → model-generated guidance → validated response → deduplicated browser learning events. None of this domain flow is implemented in Phase 0.

### File tree

```text
.env.example
.gitignore
.nvmrc
README.md
package.json
package-lock.json            # Installed dependency versions
eslint.config.mjs
next.config.ts
postcss.config.mjs
tsconfig.json
src/
  app/
    globals.css              # Tokens, Tailwind mapping, responsive shell
    layout.tsx
    icon.svg
    page.tsx
    not-found.tsx
    study/page.tsx
    practice/page.tsx
    progress/page.tsx
    curriculum/page.tsx
  components/
    shell/app-shell.tsx
    ui/{brand,card,page-heading,pending-page}.tsx
  lib/navigation.ts
docs/IMPLEMENTATION_PROGRESS.md

# Planned, not implemented:
src/lib/math/                # Pure parser, rational arithmetic, verifier, generator
src/lib/ai/                  # Server-only provider and teaching policy
src/lib/learning/            # Contracts, events, storage and selectors
src/app/api/tutor/route.ts
tests/                      # Math + API contracts; essential UI flows later
```

### Decisions and dependencies

- Next App Router/React: one web application with Node-compatible server endpoints later; Vite plus a separate API was considered but adds deployment surface outside this assessment's scope.
- Next 16.4.5 and React 19.3.1 were checked against the npm registry on 2026-11-08. Tailwind 4.3.5 uses the documented PostCSS integration. Matching Next/ESLint config versions are declared.
- TypeScript 5.9.3 is supported by the installed typescript-eslint peer range (`>=4.8.4 <6.1.0`). ESLint 9.39.4 passes the current Next configuration but is end-of-life. ESLint 10 is current; installed eslint-plugin-react 7.37.5 and eslint-plugin-jsx-a11y 6.10.2 do not declare ESLint 10 support. Keep this explicit toolchain limitation rather than forcing incompatible peer dependencies. Review an ecosystem-compatible upgrade before release.
- `lucide-react` supplies consistent line icons. `@fontsource/inter` bundles Inter locally so building does not fetch remote fonts. No animation library is necessary.
- KaTeX, Zod, OpenAI, Vitest and RTL are deliberately deferred to their implementation phases; no unused AI or math dependencies are installed now.
- MVP storage will be anonymous and local to one browser. No accounts, cloud storage, subscriptions or fabricated mastery.
- Keep `OPENAI_MODEL=gpt-6-luna` as the supplied future configuration, without claiming account availability. No real secret files are read.
- No domain or model calls exist; no API status is inferred from configuration. Tutor always says **Not connected** in this phase.
- Hosting is planned for the owner's Vercel project, with a separate owner-controlled API account/billing later. Neither is required or configured in Phase 0.
- The original files are excluded through explicit `.gitignore` entries, rather than ignoring all documentation and accidentally excluding new progress notes.

### Design translation

- Approved color tokens live in `src/app/globals.css` and are mapped to Tailwind utilities. Main surfaces are white/pale blue with restrained shadows and 24px cards; controls use 14px radii.
- Original editable SVG M mark; no screenshot crops, stock avatar or ideological imagery.
- Inter 400/500/600/700, system fallback. KaTeX font family is reserved only; proper formula rendering starts in Phase 1.
- Study desktop uses a 1.05:1 problem/tutor split. Navigation is 216px wide, becomes an 88px compact rail at tablet sizes, and a labeled five-item bottom nav below 768px. Mobile stacks problem before tutor.
- Keyboard skip link, landmarks, current-route semantics, focus rings, 44px targets, 16px form-font baseline, safe-area padding and reduced-motion handling are part of the shell.
- Motion is limited to 180ms feedback per the project brandbook (which overrides longer general defaults). No reveal effects or hidden-on-load content.
- The suggested gradient is retained as a brand token. Filled CTA uses a darker blue/violet gradient to keep white text legible. No fake progress bars, charts, AI transcript, equation inputs or inactive action buttons are shown.
- Home is a modest foundation layout, not Phase 4's final dashboard. Supporting routes are honest unavailable states, not implemented learning features.

## Phase 0 checklist

- [x] Inspect source documents, reference images and initial status.
- [x] Record scope, assumptions, architecture and future phase checklist.
- [x] Preserve and explicitly exclude all supplied files from commits.
- [x] Add manual Next.js scaffold without replacing the nonempty handoff directory.
- [x] Add strict TS, Tailwind/PostCSS, ESLint, Node preference and environment example.
- [x] Establish tokens, font, brand, shared primitives and responsive navigation.
- [x] Add all five preview routes and custom 404 without fake controls or data.
- [x] Owner installed dependencies and generated the lockfile (434 packages added; npm audited 441).
- [x] Lint, strict typecheck and production build pass.
- [x] Responsive web-qa: all five routes at 1440 / 1024 / 768 / 390 / 360 pass.
- [x] Production route/404/header smoke checks and responsive navigation rendering pass.
- [ ] Interactive keyboard traversal has not been separately automated; no form/chat flow exists in Phase 0.
- [x] Confirm all 13 handoff hashes and actual Git ignore behavior.
- [x] Stop the owned production server and confirm process cleanup before final handoff.
- [x] Verify the 26-file staged change set and prepare the Conventional Commit as the final source-control step, excluding all originals.
- [x] Stop; await approval before Phase 1.

## Verification — 2026-11-08

| Check | Result and evidence |
| --- | --- |
| Preserve original files | PASS: all 13 SHA-256 hashes match the initial manifest |
| Original file exclusions | PASS: `git check-ignore` confirms all handoff specs/PNGs; `git ls-files --others --exclude-standard` contains none of the original files |
| Dependency installation | PASS: owner ran `npm install`; lockfile generated. npm reported 8 moderate affected packages. The supplied audit was subsequently triaged to one minimatch advisory; see the dependency follow-up below. |
| `npm run lint` | PASS, exit 0; zero warnings |
| `npm run typecheck` | PASS, exit 0; Next route types generated and strict TypeScript checked |
| `npm run build` | PASS, exit 0; Next 16.4.5/Turbopack generated all five app pages, 404 and icon |
| Responsive web-qa | PASS: 25/25 page-width combinations, 0 blocking findings, 5 canonical metadata warnings |
| Visual inspection | Home and Study at 1440/390: readable content, no clipping, visible mobile nav, problem before tutor, clear disconnected/empty states |
| Production HTTP smoke | `/`, `/study`, `/practice`, `/progress`, `/curriculum`, `/icon.svg` return 200; `/missing-phase0-page` returns 404 |
| Response headers | `/study` sends nosniff, DENY framing, strict-origin-when-cross-origin and camera/microphone/geolocation restrictions; no X-Powered-By |
| Interactive keyboard flow | NOT AUTOMATED: semantic links, skip link and focus styling exist; QA covers layout/console/request failures, not a full keyboard traversal |
| AI/domain tests | NOT APPLICABLE in Phase 0; no model calls, parser, learning events, forms or chat exist. Meaningful unit/interaction tests begin with those features. |
| Dependency audit | PASS after scoped override: owner-provided live `/tmp/math-tutor-audit-after.json` reports 0 findings across all severity levels. Confirmed installed minimatch 11.0.1 in the affected dev chain; see follow-up below. |
| Source control | Foundation committed as `e62e8f1` with 26 new files. The dependency follow-up changes only package.json, package-lock.json, README.md and this progress document. Original handoff files, real environment files and generated builds remain excluded. No push/deploy attempted. |
| Cleanup | Production server stopped after checks. Final `lsof -nP -iTCP -sTCP:LISTEN` shows no listeners on 3000/4173/4321/5173/8787–8789; `pgrep -fl web-qa-profile` returns no matches. Existing IDE services were left alone. |

### Responsive evidence and accepted deviations

The web-qa skill delegated the multi-page run to its QA runner. Command:

```text
node <web-qa-skill>/scripts/qa.mjs http://127.0.0.1:3000 --paths=/,/study,/practice,/progress,/curriculum --widths=1440,1024,768,390,360 --out=/tmp/math-tutor-phase0-web-qa
```

Evidence: `/tmp/math-tutor-phase0-web-qa/report.md`, `report.json` and 25 screenshots (local QA artifacts, not committed).

Accepted warnings: all five preview pages lack canonical URLs because no deployment origin exists and the root metadata deliberately says `noindex, nofollow`. Set correct canonicals when the owner chooses a production origin. The tablet logo link is 34×44px, with enough spacing to satisfy the tool's target-size check; all navigation controls are larger.

### Environment findings

The owner resolved the initial installation/Git initialization blockers in Terminal. Lint/typecheck/build and the approved QA command now run successfully. The first QA preflight incorrectly appeared to show a stopped server: restricted `curl`/Node fetches could not connect, while `lsof` confirmed the listener and the already-approved curl/QA commands worked. The successful full run supersedes that preflight.

The shell still cannot query the live npm audit endpoint. Do not use `npm audit fix --force` without inspecting the actual advisory paths and compatible fixes. ESLint 9's EOL is a separate, confirmed toolchain limitation; see [ESLint version support](https://eslint.org/version-support/).

## Exact files added in Phase 0

All original files are unchanged. These 26 new files are the complete Phase 0 change set, including the owner-generated lockfile:

```text
.env.example
.gitignore
.nvmrc
README.md
docs/IMPLEMENTATION_PROGRESS.md
eslint.config.mjs
next.config.ts
package-lock.json
package.json
postcss.config.mjs
src/app/curriculum/page.tsx
src/app/globals.css
src/app/icon.svg
src/app/layout.tsx
src/app/not-found.tsx
src/app/page.tsx
src/app/practice/page.tsx
src/app/progress/page.tsx
src/app/study/page.tsx
src/components/shell/app-shell.tsx
src/components/ui/brand.tsx
src/components/ui/card.tsx
src/components/ui/page-heading.tsx
src/components/ui/pending-page.tsx
src/lib/navigation.ts
tsconfig.json
```

### Documentation checked

- [Next.js manual installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js 16 migration notes](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Next.js registry metadata](https://registry.npmjs.org/next/latest)
- [React registry metadata](https://registry.npmjs.org/react/latest)
- [Tailwind registry metadata](https://registry.npmjs.org/tailwindcss/latest)

## Phase 0 dependency follow-up — 2026-11-08

Scope: inspect the owner-provided npm audit report and fix its reported tooling dependency chain. This is not a full application security audit and does not authorize Phase 1. The security-review skill is applied only to dependency triage.

Applicability: Next/React/TypeScript browser scaffold and npm supply chain apply; the affected package belongs to development tooling. Database, login/authorization, payments, AI calls and production infrastructure are absent or outside this check. No real secret files or production services are accessed.

### Finding

The owner-provided `/tmp/math-tutor-audit.json` reports 8 moderate affected packages but one underlying advisory: [GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249). The dependency path is `eslint-config-next → typescript-eslint → @typescript-eslint/typescript-estree → minimatch@10.2.6`. The remaining entries propagate that affected dependency.

The advisory describes excessive CPU/memory consumption from attacker-controlled glob patterns with optimization level 2 or higher, affecting minimatch `>=7.0.0 <11.0.1`. `npm ls minimatch --omit=dev` returns an empty tree. This project does not accept glob patterns from browser users and does not import the linter in application routes; current exposure is in development tooling, not a demonstrated remotely exploitable Phase 0 endpoint.

### Applied scoped fix

Added npm's documented nested `overrides` to replace only `minimatch` beneath `@typescript-eslint/typescript-estree@8.72.1` with exact version `11.0.1`. The installed tree and lockfile confirm the replacement and its one additional transitive dependency, `@isaacs/nonrecursive-glob-match@1.1.0`. Separate minimatch 3.x consumers remain unchanged: they are outside this advisory and have a different API. The suggested forced eslint-config-next downgrade was not applied; Next and eslint-config-next remain matched at 16.4.5.

Upstream 11.0.1 retains CommonJS/ESM exports and supports Node `18 || 20 || >=22`; the installed typescript-estree uses the named `minimatch(filePath, pattern, { dot: true })` export in its project-service allowlist path. The installed compatibility check below verifies the major-version override at the actual parser call site. Remove/review the narrowly scoped override when upstream updates this dependency or typescript-estree changes version.

Sources: [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [patched package manifest](https://raw.githubusercontent.com/isaacs/minimatch/v11.0.1/package.json), [npm overrides documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).

### Follow-up verification

- Owner ran `npm install`: 1 package added, 1 changed; npm audited 442 packages and reported zero vulnerabilities.
- Read the fresh `/tmp/math-tutor-audit-after.json`: empty vulnerabilities object, all severity counts zero. This is the owner-provided live result, not the earlier offline empty result.
- `npm ls minimatch --all`: targeted typescript-estree dependency is 11.0.1 and overridden; other consumers remain at 3.1.5, with no invalid tree entries.
- `node /tmp/math-tutor-tooling-compat.cjs`: PASS, six matching cases (recursive globs, dotfiles, brace alternatives and nonmatches), plus the actual `@typescript-eslint/parser.parseForESLint` project-service `allowDefaultProject` path. A real temporary JavaScript file/tsconfig produced a TypeScript program and AST. Temporary fixtures were removed in `finally`.
- `npm run lint`: PASS, exit 0, zero warnings.
- `npm run typecheck`: PASS, exit 0.
- `npm run build`: PASS, exit 0; same five application routes, 404 and icon generated.
- No UI/source files changed. The existing 25/25 responsive checks remain applicable; no redundant browser run or server was started for this tooling-only change.
- All 13 original handoff file hashes remain unchanged. Only the four dependency/documentation files listed above belong in this follow-up commit.

The known ESLint 9 end-of-life limitation remains separate from the resolved advisory and is not concealed by the clean audit. No paid API calls, production data, global installs, push or deployment occurred.

## Next session

Stop at Phase 0. Only after explicit Phase 1 approval implement the Study equation UI and independent math verifier; do not add real AI or learning events early. Revisit the toolchain EOL and any audit findings before public release.
