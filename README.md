# MathTutor AI

**Phase 1: Study workspace and independent algebra verification.** Enter actual steps for a linear equation and receive specific, mathematically checked feedback. The English-language interface uses the approved problem-left/tutor-right composition, with a stacked layout on phones.

**AI integration is pending.** There are no model calls, AI conversations, generated practice problems or persistent learning metrics yet. Rule reminders and checker feedback are explicitly labeled as deterministic. Phase 2 requires the owner's approval.

## Run locally

Use Node.js 24 (`.nvmrc`) and npm; the minimum is Node 22.12.0 for the test toolchain. Development was verified with Node 24.7.0 and npm 11.5.1.

```bash
npm ci
npm run dev
```

Open http://localhost:3000/study. A production preview uses:

```bash
npm run build
npm run start
```

No API key is needed. `.env.example` reserves server-only settings for Phase 2; do not add real credentials for this phase, expose them through `NEXT_PUBLIC_*`, or commit `.env.local`. Fonts are self-hosted; building does not fetch Google Fonts.

## Reviewer flow

1. Open Study and see `3(x + 4) = 2x + 19`.
2. Click **Try sample mistake**. It only fills `3x + 4 = 2x + 19`; it does not submit or change the accepted history.
3. Press Enter or **Check My Step**. The independent checker identifies incomplete distribution and keeps the last accepted equation intact, without showing the completed expansion or final answer.
4. Submit `3x + 12 = 2x + 19`, then `x + 12 = 19`, then `x = 7`.
5. See three accepted steps and verified completion. **Try again** clears the solution and returns keyboard focus to the input.

Equivalent paths work: after expansion, `3x - 2x = 19 - 12` is accepted. A direct jump to `x=7` is mathematically accepted, with an invitation to show the expansion. Syntax errors and unchanged equations are not classified as misconceptions.

The keypad edits at the caret and can delete a selection. **Review the rule** opens a labeled distributive-property reminder. It is not presented as a live AI hint. Network failures preserve the draft and allow a retry; duplicate submissions are blocked while checking.

## Supported mathematics and limits

The restricted parser supports one variable (`x` or `y`), integer literals, unary signs, addition/subtraction, implicit or explicit multiplication, grouping with `()` or `[]`, and division by nonzero scalar expressions. Intermediate fractions use exact, reduced BigInt rational arithmetic. Study currently supplies only the trusted starter problem in `x`; `y` is covered by engine fixtures.

Solution sets are compared algebraically, including unique, empty and universal cases. Only evidence-backed omitted distribution is specifically classified; other incorrect transformations receive a neutral message rather than an invented diagnosis.

Decimals, powers, functions, multiple variables, variable denominators and arbitrary JavaScript/TeX are unsupported. Multiplication and division follow ordinary left-to-right precedence; use brackets to clarify fractions. Inputs are bounded to 256 characters, 128 tokens, 16 nested groups/signs and 9-digit integer literals. Arithmetic magnitudes are bounded; overly complex/large expressions are safely rejected. The API caps actual streamed bodies at 16 KiB and histories at 48 accepted steps.

## Architecture

```text
src/app/api/check-step/route.ts   # Bounded request, Zod schema, server-side replay
src/lib/math/
  rational.ts                   # Exact bounded rational arithmetic
  parser.ts                     # Restricted AST; no eval or arbitrary execution
  linear.ts                     # Linear coefficient reduction and solution sets
  verifier.ts                   # Verdict, completion, conservative mistake evidence
  contracts.ts                  # Request and public response schemas
  format.ts                     # Controlled AST-to-TeX formatting
src/components/study/
  math-text.tsx                 # Thin React wrapper over the current KaTeX API
  study-session.tsx             # In-memory session and request lifecycle
  study-workspace.tsx           # Form, keypad, rule reminder, feedback and history
```

The client sends only the candidate equation and previously accepted equations. The server rechecks the entire chain from the trusted starter; client correctness claims are rejected. Public responses omit the internal canonical answer. The origin check uses the browser-facing Host because Next may normalize its internal request URL to localhost.

KaTeX receives only parser-generated TeX or the fixed generic rule, with `trust: false` and bounded expansion. Student text is never treated as HTML/TeX. A small owned React wrapper avoids coupling the UI to an older KaTeX wrapper dependency.

## Session and phase boundaries

The current solution survives client-side navigation within the app. **Refreshing clears it.** There is no browser storage, cross-device sync, account, progress event log or durable exercise count. Practice, Progress and Curriculum remain honest preview/empty states. No follow-up CTA is shown until a verified generator exists in Phase 3.

Planned next: Phase 2 server-only OpenAI Responses integration with schema-validated Socratic guidance; Phase 3 verified related problems and persisted learning events; Phase 4 supporting views; Phase 5 full assessment/release checks. Native Web/iOS/Android expansion remains a plan: share pure TypeScript domain contracts with React Native/Expo and move to authenticated backend storage later. No native applications exist.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Vitest covers the math acceptance cases M01–M11/M13–M16, generalized distribution examples, 100 coefficient-based expansion fixtures, bounded server contracts and component interactions. M12's actual problem-generator test belongs to Phase 3. Component tests use an in-process transport to the real route/verifier; they do not simulate an AI provider.

Playwright uses the already-installed Google Chrome, starts/stops a production server when needed, and runs the correction/completion/navigation and failure/retry flows at desktop, tablet and mobile sizes. Run the build first; no browser download is required. A restricted sandbox that blocks localhost connections cannot run this command: run it in an unrestricted Terminal instead.

Verified: 54 unit/API/component tests, all 6 real-browser E2E scenarios, lint, strict typecheck and production build pass. Responsive QA passed all five routes at 1440/1024/768/390/360/375 (30 combinations). Evidence, known limitations and the exact changed-file list are in [implementation progress](docs/IMPLEMENTATION_PROGRESS.md).

## Dependencies and source control

The dependency lockfile is included. The owner reported zero vulnerabilities after the Phase 1 install. The existing scoped minimatch override resolves the earlier tooling advisory. ESLint 9 remains end-of-life because the installed React/accessibility plugins do not declare ESLint 10 compatibility; review an ecosystem-compatible upgrade before release.

All original handoff specifications and reference PNGs remain unchanged and excluded from commits at the owner's request. A clone therefore contains implementation code and its new documentation, not the private handoff kit. No deployment, push, analytics, production data or paid API is configured.
