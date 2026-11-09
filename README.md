# MathTutor AI

**Phase 3: verified related practice and persistent learning history.** Enter actual steps for a linear equation and receive specific, mathematically checked feedback. The English-language interface uses the approved problem-left/tutor-right composition, with a stacked layout on phones.

**A successful live AI response is not yet verified.** The OpenAI integration, two-way chat and progressive hints are implemented and tested with mock providers. Live calls require an explicit server opt-in and API key; configuration alone is not proof of model access. Study and Practice share the checker/tutor, and actual learning events persist locally. Static rule reminders and checker feedback remain clearly labeled.

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

No API key is needed for deterministic math checking or automated tests. For live tutoring, configure the ignored `.env.local` yourself with `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-6-luna` and `TUTOR_ENABLED=true`. Never expose credentials through `NEXT_PUBLIC_*` or commit the file. Live requests use API credits. Fonts are self-hosted; building does not fetch Google Fonts. See [AI configuration and the opt-in live smoke test](docs/AI_INTEGRATION.md).

## Reviewer flow

1. Open Study and see `3(x + 4) = 2x + 19`.
2. Click **Try sample mistake**. It only fills `3x + 4 = 2x + 19`; it does not submit or change the accepted history.
3. Press Enter or **Check My Step**. The independent checker identifies incomplete distribution and keeps the last accepted equation intact, without showing the completed expansion or final answer.
4. Submit `3x + 12 = 2x + 19`, then `x + 12 = 19`, then `x = 7`.
5. Related practice appears as soon as the mistake is corrected, then becomes prominent on completion. Open **Try related practice**, submit valid steps for its generated equation, and solve it.
6. Open **Progress** and refresh: actual attempts, unique completed exercises, corrections and follow-up outcomes stay saved. **Try again** clears only the current solution; saved learning events remain. **Clear saved history** requires confirmation on Progress.

Equivalent paths work: after expansion, `3x - 2x = 19 - 12` is accepted. A direct jump to `x=7` is mathematically accepted, with an invitation to show the expansion. Syntax errors and unchanged equations are not classified as misconceptions.

The keypad edits at the caret and can delete a selection. **Review the rule** opens a labeled static reminder. When live AI is enabled, submitting a checked step also requests contextual guidance. **Hint** gradually moves from a question to an unfinished checked operation; **Show worked step** is available at the deeper hint stage. **Ask your tutor** has its own draft and does not count a chat question as an algebra mistake. Provider failures preserve drafts and offer an explicit retry without duplicating accepted steps or student messages.

## Supported mathematics and limits

The restricted parser supports one variable (`x` or `y`), integer literals, unary signs, addition/subtraction, implicit or explicit multiplication, grouping with `()` or `[]`, and division by nonzero scalar expressions. Intermediate fractions use exact, reduced BigInt rational arithmetic. Study supplies the trusted starter in `x`; Practice generates independently verified equations in `x` or `y`, preferring positive beginner variants while supporting negative examples.

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
  study-session.tsx             # Separate Study/Practice sessions and request lifecycle
  study-workspace.tsx           # Form, keypad, rule reminder, feedback and history
  tutor-chat.tsx                # Message log, composer, progressive hints and retries
src/lib/tutor/                  # Contracts, replayed teaching state, checked examples,
                                # prose guards, prompts, process limits and SDK adapter
src/app/api/tutor/route.ts       # Configuration GET and server-verified tutoring POST
src/lib/server/http.ts          # Shared bounded-body and same-origin checks
src/lib/practice/problems.ts    # Reproducible bounded generator and verification
src/lib/learning/               # Deduplicated events, derived statistics and storage
src/components/learning/        # Persistence provider and Practice/Progress views
```

The fast math checker receives a bounded problem reference, candidate equation and previously accepted equations. The server reconstructs that problem and rechecks the entire chain; client correctness claims are rejected. Public responses omit the internal canonical answer. Tutoring additionally replays bounded raw actions, derives hint depth and passes independently verified facts to OpenAI Responses Structured Outputs. The model supplies prose, while formulas and correctness remain server-owned. The origin check uses the browser-facing Host because Next may normalize its internal request URL to localhost.

KaTeX receives only parser-generated TeX or the fixed generic rule, with `trust: false` and bounded expansion. Student text is never treated as HTML/TeX. A small owned React wrapper avoids coupling the UI to an older KaTeX wrapper dependency.

## Session and phase boundaries

Separate Study and Practice solutions, drafts, chat and actual events survive navigation and refresh through versioned browser storage. Corrupt/unknown data is preserved with a visible warning; storage failures do not masquerade as successful saves. No account or cross-device sync exists. Progress derives its statistics from deduplicated events and explains each denominator. See [learning event and storage semantics](docs/LEARNING_PROGRESS.md).

Phase 3 is implemented and verified with 119 unit/API/component/SDK tests and 21 real-browser scenarios. Phase 4 Home/Curriculum polish and Phase 5 release checks have not started. After configuration was enabled, one explicitly approved live attempt returned `provider_limit` (OpenAI 429), with no tutor prose. The deterministic distribution verdict and honest unavailable state were preserved. Successful live teaching remains unverified; there were no automatic retries. Native Web/iOS/Android expansion remains a plan: share pure TypeScript domain contracts with React Native/Expo and move to authenticated backend storage later. No native applications exist.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Vitest covers teaching-state replay, guarded model output, SDK contracts, retries/budgets, chat interaction and the math acceptance cases M01–M16, generalized distribution examples, 100 coefficient-based expansion fixtures, bounded server contracts and component interactions. M12 now checks 100 actual generated equations; further tests cover event deduplication, correction timing, follow-up outcomes, storage validation and refresh. Component tests use in-process transports to the real verifier/teaching service. Tutor scenarios inject test-only mock providers and do not establish live AI functionality.

Playwright uses the already-installed Google Chrome, starts/stops a production server when needed, and runs the correction/completion/navigation and failure/retry flows at desktop, tablet and mobile sizes. Live calls are forced off for the owned test server; new chat scenarios intercept the provider boundary with fixtures. Run the build first; no browser download is required. A restricted sandbox that blocks localhost connections cannot run this command: run it in an unrestricted Terminal instead.

Phase 2 baseline verification: 100 unit/API/component/SDK tests, lint, strict typecheck and production build pass. All 12 browser scenarios passed in the owner's unrestricted Terminal, including the test-only mock-provider chat/hint scenarios. This does not count as live OpenAI verification. Responsive QA passed all five routes at 1440/1024/768/390/360/375 (30 combinations). Phase 3 has 119 passing unit/API/component/SDK tests, green lint/typecheck/build and 21/21 browser scenarios passed in the owner's Terminal (33.2 seconds). Fresh-page responsive QA passes 30 combinations and all 18 populated states at the same six widths passed visual review. Evidence, known limitations and exact changed-file lists are in [implementation progress](docs/IMPLEMENTATION_PROGRESS.md).

## Reviewer access

A deployed demo should use the owner-configured API key in server-only host environment variables. Reviewers open the URL and use the tutor without creating a key or receiving credentials. Deployment and a real hosted-provider success check are still pending; no live demo URL is claimed here.

The source project and automated checks run without an API key. Local deterministic checking, generated practice and browser progress remain functional when AI is unavailable. Running live tutoring from a local clone requires an authorized provider configuration. The assessment's genuine-AI requirement cannot be replaced by static messages or test fixtures. See [AI verification status](docs/AI_INTEGRATION.md).

## Dependencies and source control

The dependency lockfile is included. The owner reported zero vulnerabilities after both the Phase 1 install and the OpenAI SDK/server-only install. The existing scoped minimatch override resolves the earlier tooling advisory. ESLint 9 remains end-of-life because the installed React/accessibility plugins do not declare ESLint 10 compatibility; review an ecosystem-compatible upgrade before release.

All original handoff specifications and reference PNGs remain unchanged and excluded from commits at the owner's request. A clone therefore contains implementation code and its new documentation, not the private handoff kit. No deployment, push, analytics or production data has been configured. One explicitly approved live model attempt returned a provider rate/quota failure; no successful live AI response is claimed.
