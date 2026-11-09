# Implementation progress

## Current boundary

Phase 3 was approved by the owner on 2026-11-09 after Phase 2 commit `5b50a3b`. Related practice, real event statistics and versioned local persistence are implemented. Phase 3 is complete: 119 unit/API/component/SDK tests, lint, strict typecheck, production build and all 21 owner-terminal browser scenarios pass. Fresh responsive QA passes 30 combinations, and populated visual review passes 18 combinations. Successful live AI remains NOT VERIFIED: one approved production-route attempt returned `provider_limit` (OpenAI 429), with no tutor prose and no automatic retry. Phase 4 is not authorized.

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
- Phase 0 deferred KaTeX, Zod, OpenAI, Vitest and RTL. Phase 1 adds KaTeX, Zod, Vitest/RTL and Playwright as used dependencies; OpenAI remains deferred to Phase 2.
- MVP storage will be anonymous and local to one browser. No accounts, cloud storage, subscriptions or fabricated mastery.
- Keep `OPENAI_MODEL=gpt-6-luna` as the supplied future configuration, without claiming account availability. No real secret files are read.
- Phase 0 had no domain/model calls. Phase 1 adds the independent math endpoint, while the tutor explicitly says **AI integration pending**. No API availability is inferred from configuration.
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

## Phase 0 verification — 2026-11-08

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

## Phase 1 — Study and independent verification

### Implemented plan and file tree

- `src/lib/math/{rational,parser,linear,verifier,format,contracts}.ts`: bounded exact arithmetic, restricted AST, solution-set equivalence, general omitted-distribution evidence, controlled TeX and Zod contracts.
- `src/app/api/check-step/route.ts`: Node runtime; stream-size/content-type/origin limits; replay every accepted equation from the trusted starter; return a schema-validated public verdict without the canonical answer.
- `src/components/study/{math-text,study-session,study-workspace}.tsx`: KaTeX rendering, in-memory navigation-persistent session, real form/keypad/retry/reset controls, checker feedback, rule reminder and accepted-step history.
- Study page/root layout/app shell/CSS: primary two-column reference composition, mobile problem-first stacking, accurate metadata and honest AI state. Home copy now accurately describes available step checking.
- `tests/math/`, `tests/api/`, `tests/components/`, `tests/e2e/` plus Vitest/Playwright configuration: pure math, trust-boundary tests, in-process UI/API interaction and real-browser scenarios.

### Decisions and scope

- A small custom parser was selected over mathjs to keep the accepted grammar explicit and avoid an arbitrary evaluation surface. No eval, Function constructor or unrestricted expression engine exists.
- Exact BigInt fractions compare solution sets instead of floating-point samples. Multiplication of variable expressions and variable denominators are rejected; degenerate all/no-solution equations are distinguished.
- Omitted distribution is identified by replacing a scalar-times-group AST node with the specific unmultiplied-constant error and checking the rest of both sides. This generalizes across coefficients, signs, variables and sides. Ambiguous incorrect steps remain generic; syntax/no-op results have no misconception category.
- Zod moved into Phase 1 because the new deterministic check endpoint already creates a server boundary. The route replays history; it never trusts a client verdict or uses a model as a math judge.
- Hint-like UI is a clearly labeled static rule reminder and deterministic checker feedback, not an AI conversation. Chat/composer/provider state is deferred to Phase 2. No follow-up button/generator, learning metrics or local storage is implemented early.
- The solution survives route changes through a root context provider. Refresh deliberately resets it and the UI says so. Browser persistence and event-based progress remain Phase 3.
- Current compatible versions installed: Vitest 5.1.0, Vite 8.3.6, KaTeX 0.19.1, Zod 4.6.7, RTL 16.3.3, jsdom 27.4.0 and Playwright 1.65.0. Node minimum is 22.12.0. KaTeX uses a thin owned React wrapper and only parser-generated TeX/fixed rule content with trust disabled. Vite uses current Oxc JSX options, not deprecated esbuild configuration.

### Phase 1 checklist

- [x] Inspect status, reread specifications and inspect both provided images.
- [x] Working responsive Study input, submit, symbol insertion/deletion, rule reminder, retry/reset and completion.
- [x] Pure exact math verifier and generalized distribution classification.
- [x] Node check endpoint with Zod, bounded bodies/history and server recomputation.
- [x] Math M01–M11 and M13–M16; 100 dynamic coefficient-based test fixtures. M12 is deferred with the actual Phase 3 generator.
- [x] 54 tests across math, API and component suites; no AI mocks or model calls.
- [x] Lint, production build and strict TypeScript checks.
- [x] Responsive web-qa at 1440/1024/768/390/360/375: 30/30 combinations.
- [x] Real-browser E2E rerun: 6/6 pass after the discovered origin fix.
- [x] Final docs, cleanup and original-file exclusion review; prepare one verified Phase 1 commit as the final step.
- [x] Stop before Phase 2 and await explicit approval.

### Verification and regressions

- `npm run test`: 54/54 pass (41 math, 9 API, 4 component tests). Component tests exercise the real route/verifier through an in-process transport, including Enter, sample-fill-only behavior, keypad caret placement, rule toggle, failure/retry, duplicate prevention and reset focus.
- `npm run lint`: PASS, zero warnings.
- `npm run build`: PASS with `/api/check-step` as a Node route and all five app pages intact.
- `npm run typecheck`: PASS, exit 0, rerun after the complete source change set including the origin fix.
- Owner ran `npm install`: 107 packages added; npm reported 0 vulnerabilities across the installed dependency tree.
- Web-qa report `/tmp/math-tutor-phase1-web-qa/`: 30/30, 0 blocking findings. Study desktop/tablet/mobile screenshots visually checked; KaTeX is readable, keypad adapts to 4×2, and mobile stacks correctly. Existing no-canonical warnings remain accepted for local noindex pages; production origin is not chosen.
- The restricted-shell Playwright attempt cannot connect/bind localhost and returned EPERM. The owner ran the real suite in Terminal. Its first run failed 6/6: browser same-origin POSTs were incorrectly rejected with 403 because Next normalized the internal URL to localhost; the retry test also matched Next's extra route-announcer alert.
- Fixed origin comparison to retain the public Host with the internal request scheme, while continuing to reject different hosts/schemes. Added a regression test with an internal localhost URL and public loopback Host/Origin. Confirmed actual production HTTP statuses: wrong expansion, correction and final-value POSTs now return 200; a foreign Origin still returns 403. These requests are stateless and create no stored test records.
- Scoped the browser alert locator to the checker message. Also fixed the button's accessible name by hiding its visual Enter shortcut from assistive naming, and return focus to the input after restarting. A direct correct final-value jump is accepted with a suggestion to practise the skipped expansion.
- Owner reran `npm run test:e2e`: 6/6 PASS in 11.4s across desktop 1440, tablet 768 and mobile 390. `test-results/.last-run.json` independently confirms status `passed` and no failed test IDs. No AI provider was mocked or called.
- Final cleanup: no listeners on 3000/4173/4321/5173/8787–8789, no `--headless` processes and no web-qa profiles found. Both owned preview servers were stopped; Playwright closed its server/browser. Existing IDE processes were left alone. All 13 original handoff hashes still match and none of those files is tracked.

### Exact Phase 1 change set

27 files added or updated. Original handoff files remain excluded and unchanged.

```text
.gitignore
README.md
docs/IMPLEMENTATION_PROGRESS.md
package-lock.json
package.json
playwright.config.ts
src/app/api/check-step/route.ts
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/study/page.tsx
src/components/shell/app-shell.tsx
src/components/study/math-text.tsx
src/components/study/study-session.tsx
src/components/study/study-workspace.tsx
src/lib/math/contracts.ts
src/lib/math/format.ts
src/lib/math/linear.ts
src/lib/math/parser.ts
src/lib/math/rational.ts
src/lib/math/verifier.ts
tests/api/check-step.test.ts
tests/components/study-workspace.test.tsx
tests/e2e/study.spec.ts
tests/math/verifier.test.ts
tsconfig.json
vitest.config.mts
```

## Phase 2 — real API adapter, Socratic state and chat

### Plan and implementation

1. `src/lib/tutor/` defines bounded contracts, server-replayed teaching state, verified mathematical examples, plain-prose guards, prompts, best-effort process budgets and the OpenAI adapter.
2. `/api/tutor` supplies a configuration-only GET and a schema-validated POST. It independently replays all math from the starter; it never trusts client correctness or hint-depth claims. `src/lib/server/http.ts` shares the origin/body checks with `/api/check-step`.
3. Study now has a separate question draft, message log, loading/error/retry states and progressive Hint/Show worked step controls. Model status becomes Connected only after a real successful, accepted response; disabled/unavailable/guarded outputs are honest states.
4. Unit/API/component/SDK tests use injected mock providers only. Browser tutor scenarios intercept the provider boundary; the owned Playwright server forces `TUTOR_ENABLED=false` and refuses to reuse an unknown server.
5. `scripts/smoke-tutor.mjs` is a separate one-request live check with an explicit `--allow-paid` requirement. Setup, limits and current status are in `docs/AI_INTEGRATION.md`.

### Important decisions

- Installed the official `openai@7.53.0` and `server-only@0.0.1` locally; owner reported zero npm audit findings. No global packages or browser downloads were added.
- `OPENAI_MODEL` defaults to the supplied `gpt-6-luna`. No silent fallback or account-availability claim. The SDK uses Responses `parse`, `zodTextFormat`, low reasoning effort, 1,200 output tokens, `store:false`, a 15-second deadline and zero automatic retries.
- Live calls are disabled unless `TUTOR_ENABLED=true` and a nonempty API key is present. The key is read only by server runtime code, never inspected from a real secret file by the agent or returned to the client.
- The model receives separately labeled server facts and untrusted student context. Its schema cannot return a verdict or arbitrary formula. Server-owned examples are independently verified; prose is heuristically screened for grading contradictions, early answers/numeric claims, markup and inconsistent hint metadata. This is not a proof of every possible English claim; actual model teaching quality still needs live evaluation.
- State/hint depth are replayed from raw actions. Math is always recomputed. Client history is not a cryptographically attested record; persistence and durable learning events remain Phase 3.
- Duplicate requests with the same ID/context share an in-process promise/result cache for two minutes; changed content under a cached ID is rejected. Provider failures can be explicitly retried; a retry does not append accepted math or student messages twice. Failed hints do not advance delivered-hint history on the client.
- Best-effort limits: two concurrent provider calls and thirty per process per minute. These are not global/durable serverless controls or a billing hard cap; add durable limiting/access control before public deployment.
- Chat and math drafts remain separate. Free questions do not create algebra mistakes. Provider errors preserve text and deterministic feedback remains available. No follow-up generator, durable events or invented progress data were added.

### Verification so far

- `npm run test`: 100/100 pass across eight suites. Includes SDK-mocked request options, no-call disabled configuration, gradual hints, checked examples, contradictory model output, schema/prompt injection boundaries, timeouts/quota, duplicate/concurrent retries, cancellation, process limits and UI preservation/retry.
- `npm run lint`: PASS with zero warnings.
- `npm run typecheck`: PASS after the complete source changes.
- `npm run build`: PASS, with both Node API routes and all five app pages. One intermediate build was interrupted after a delay; the subsequent standalone typecheck and clean rerun passed.
- Read-only responsive QA: 30/30 at 1440/1024/768/390/360/375, 0 blocking findings. Additional full-page mobile composer capture is clean. Reports: `/tmp/math-tutor-phase2-web-qa/` and `/tmp/math-tutor-phase2-mobile-full/`. No submissions or AI calls were made by QA. Existing canonical warnings remain accepted for local noindex pages.
- Original preservation: all 13 original SHA-256 hashes still match; none of those files is tracked. Client static chunks contain no OpenAI SDK endpoint/API-key identifiers.
- Browser suite: owner ran `npm run test:e2e` in unrestricted Terminal: 12/12 PASS in 17.6 seconds, covering desktop/tablet/mobile baseline and mock-provider conversation/hints/failure/retry. `test-results/.last-run.json` confirms `passed` and no failed IDs. No paid API call was made by this suite.
- Live API: NOT VERIFIED, no paid calls made. The production adapter explicitly disables SDK logging to prevent verbose environment settings from printing request content. The owner explicitly approved one request on 2026-11-09. The sandbox attempt failed before connecting to localhost; no OpenAI request occurred. The owner has the exact Terminal command, and its result is pending. Do not repeat paid requests automatically.

### Phase 2 checklist

- [x] Read requirements/status and current official OpenAI documentation; preserve all original handoff files.
- [x] Server-only real SDK integration with Structured Outputs, configurable model, bounded requests, timeout and clear errors.
- [x] Independent math replay and hint policy; output guard cannot change deterministic verdicts.
- [x] Functional separate chat, loading/errors, explicit retries and progressive hints.
- [x] 100 mock-only automated tests; lint/typecheck/build green.
- [x] Responsive QA at all six widths, read-only with no paid calls.
- [x] Expanded real-browser suite with test-only mock providers: 12/12 pass.
- [x] Optional live smoke test: owner approved one request; sandbox localhost access blocked. Recorded NOT VERIFIED with exact owner-terminal instructions.
- [x] Final docs/change-set review and process cleanup checked; this change set is ready for its Phase 2 commit.
- [x] Stop at the Phase 2 boundary; the owner subsequently authorized Phase 3.

### Exact Phase 2 change set

36 source/configuration/documentation files added or updated. No original handoff files are included.

```text
.env.example
README.md
docs/AI_INTEGRATION.md
docs/IMPLEMENTATION_PROGRESS.md
package-lock.json
package.json
playwright.config.ts
scripts/smoke-tutor.mjs
src/app/api/check-step/route.ts
src/app/api/tutor/route.ts
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/study/page.tsx
src/components/study/study-session.tsx
src/components/study/study-workspace.tsx
src/components/study/tutor-chat.tsx
src/lib/server/http.ts
src/lib/tutor/contracts.ts
src/lib/tutor/examples.ts
src/lib/tutor/limits.ts
src/lib/tutor/openai-provider.ts
src/lib/tutor/policy.ts
src/lib/tutor/prompt.ts
src/lib/tutor/service.ts
tests/components/study-workspace.test.tsx
tests/components/tutor-chat.test.tsx
tests/e2e/study.spec.ts
tests/e2e/tutor.spec.ts
tests/fixtures/server-only.ts
tests/fixtures/tutor.ts
tests/tutor/openai-provider.test.ts
tests/tutor/policy.test.ts
tests/tutor/service.test.ts
tests/tutor/smoke-opt-in.test.ts
vitest.config.mts
```


## Phase 3 — related practice and persistent learning

### Scope and implementation plan

1. Add a pure bounded seeded equation generator with independent verification and repeat exclusion.
2. Share an explicit problem reference across checker/tutor boundaries; reconstruct and verify it on the server.
3. Track actual checked attempts, corrections, hints, completions and transfer outcomes with deduplicated events.
4. Persist separate Study/Practice sessions, raw actions, drafts and chat through a versioned validated browser document.
5. Reuse the Study workspace for Practice and build real-data Progress with honest empty states and a confirmed reset.
6. Verify M12, replay/storage/error contracts, full browser reference flow and responsive states. Stop before Phase 4.

```text
src/lib/practice/problems.ts         # Reproducible verified problems
src/lib/learning/{events,storage}.ts  # Pure event statistics and versioned snapshots
src/components/learning/
  learning-provider.tsx              # Safe restore/save and shared local data
  practice-view.tsx                  # Reused workspace and new-equation controls
  progress-view.tsx                  # Real metrics and explicit reset
src/components/study/study-session.tsx # Separate controllers over persisted data
```

### Decisions and boundaries

- No additional dependency, install, deployment or push. All original handoff files stay excluded.
- Related practice is offered on a correction, before main-equation completion, and highlighted afterward. Accepted steps still requiring expansion do not clear a distribution misconception.
- Both APIs and the tutor prompt use the actual generated equation, never a client verdict or a hardcoded starter in place of practice.
- The generator prefers positive examples, retains genuinely varied negative examples and verifies a unique bounded integer answer. New generation excludes all seen equations and the starter.
- Statistics derive only from checked event data. Syntax/no-op input cannot create misconception categories. Retry IDs deduplicate events, accepted steps and delivered hints. Completion counts unique equations.
- Saved data is anonymous and browser-local, not an authenticated learning record or calibrated mastery estimate. Unknown versions/corruption are preserved; quota/blocking/cross-tab changes show an honest notice. No model call or submission occurs on restore.
- Full storage semantics, metric denominators, limits and reset behavior: `docs/LEARNING_PROGRESS.md`.

### Verification results

- Unit/API/component/SDK tests: 119/119 PASS across 11 suites, including correction timing, generation weighting, persisted hint retry counts and safe smoke-configuration diagnostics.
- Lint: PASS with zero warnings. Strict typecheck: PASS including all 21 browser scenario definitions.
- Production build: PASS after all application and test-fixture changes; both API routes use the Node runtime and all five pages build successfully.
- Fresh responsive states: 30/30 across five routes at 1440/1024/768/390/360/375. No blocking findings; five accepted local canonical warnings. Reports: `/tmp/math-tutor-phase3-web-qa/`.
- Populated responsive checks: PASS for Study/Practice/Progress at all six widths (18 combinations). Portable Playwright scenarios used disposable schema-validated browser data, asserted no POSTs, no horizontal overflow and touch inputs at least 16px, and saved full-page screenshots. The web-qa reviewer inspected all 18 captures: no blocking defects. Evidence: `test-results/learning-populated-learnin-56961-ut-submitting-or-calling-AI-{desktop,tablet,mobile}/populated-{study,practice,progress}-{width}.png`. Optional Phase 4 polish: add a 16px gap above the related-practice card; the current zero gap does not block interaction.
- Browser suite: owner ran `npm run test:e2e` in unrestricted Terminal: 21/21 PASS in 33.2 seconds on desktop/tablet/mobile. Covers the full mock-provider correction/transfer flow, actual generated expansion and completion, refresh-persistent history/drafts, repeat avoidance, confirmed reset, failures/retries and populated responsive states. `test-results/.last-run.json` confirms `passed` with no failed IDs. The local sandbox attempt failed before tests with `listen EPERM`; the owner-terminal run supplies actual execution evidence. No live AI request was made by the suite.
- Final preservation/cleanup: all 13 original SHA-256 hashes match and none of those files is tracked. `.env.local` stays ignored/untracked. Client static chunks contain no OpenAI API-key/endpoint identifiers. No listeners remain on 3000/4173/4321/5173/8787–8789 and no headless Chrome remains; existing IDE processes were left alone. Test history exists only in jsdom/disposable Playwright/QA browsers; no production records were created.
- Live AI: one approved request was made after a public configuration GET confirmed enabled/configured. The real SDK produced normalized `provider_limit` (429); the local route retained an independent distribution verdict and a transparent unavailable envelope. No model prose, source or premature example appeared. Successful live teaching remains NOT VERIFIED. Raw secrets and raw SDK errors were not inspected. Do not automatically repeat the request; account rate/quota/credits need owner review first.

### Checklist

- [x] Generator and strict problem contracts; independent server reconstruction.
- [x] Deduplicated events, metric derivation and correction/follow-up timing.
- [x] Reload-persistent sessions/drafts/chat and safe storage failures/reset.
- [x] Reused Practice workspace and functional Progress.
- [x] 119 unit/API/component/SDK tests and 21 real-browser scenarios pass.
- [x] Fresh responsive QA at all six widths.
- [x] Final checks, 18 populated visual states, owner-terminal E2E result and documentation evidence.
- [x] Verified Phase 3 change set included in this commit; no push or deployment.
- [x] Stop before Phase 4; new owner approval is required.

### Exact Phase 3 change set

33 source/configuration/documentation/test files added or updated. Original handoff files and real secret files are excluded.

```text
README.md
docs/AI_INTEGRATION.md
docs/IMPLEMENTATION_PROGRESS.md
docs/LEARNING_PROGRESS.md
scripts/smoke-tutor.mjs
src/app/api/check-step/route.ts
src/app/globals.css
src/app/page.tsx
src/app/practice/page.tsx
src/app/progress/page.tsx
src/components/learning/learning-provider.tsx
src/components/learning/practice-view.tsx
src/components/learning/progress-view.tsx
src/components/shell/app-shell.tsx
src/components/study/study-session.tsx
src/components/study/study-workspace.tsx
src/lib/learning/events.ts
src/lib/learning/storage.ts
src/lib/math/contracts.ts
src/lib/practice/problems.ts
src/lib/tutor/contracts.ts
src/lib/tutor/policy.ts
src/lib/tutor/prompt.ts
tests/components/learning-flow.test.tsx
tests/components/study-workspace.test.tsx
tests/components/tutor-chat.test.tsx
tests/e2e/learning.spec.ts
tests/e2e/tutor.spec.ts
tests/fixtures/browser-tutor.ts
tests/fixtures/learning.ts
tests/learning/events-storage.test.ts
tests/learning/problems.test.ts
tests/tutor/smoke-opt-in.test.ts
```

## Next session

Phase 3 is complete and verified. With new owner approval, start Phase 4 from `docs/06_CODEX_PHASE_PROMPTS.md`: Home/Curriculum design and supporting-view polish; include the related-card spacing follow-up. The live attempt remains honestly provider-limited, so a successful real-AI check still requires restored API access and a separately approved new request. Do not repeat paid calls automatically, inspect real secret files, push or deploy without authorization.
