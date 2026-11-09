# Security review — local assessment prototype

Date: 2026-11-09. Scope: current source, locked dependencies, Git history, Node API boundaries and browser persistence. This is a manual threat-boundary review with available automated tools, not a penetration test or an audit of a live hosting/account configuration.

## Applicability

| Surface | Applicability |
| --- | --- |
| Next.js/React browser app and Node API | Applicable: input validation, output rendering, limits, errors, headers and secret isolation |
| Groq Free / optional paid API | Applicable: server-only key, fixed endpoint, bounded prompts/output, cancellation, replay and cost controls |
| Browser learning history | Applicable: strict version/schema, bounded data, corruption/quota handling and explicit deletion |
| Accounts, roles and cross-user records | N/A: anonymous MVP with no login, user database or resource-by-owner endpoints; no invented IDOR/RLS finding |
| Payments, webhooks, uploads, MCP and analytics | N/A: no such functionality exists |
| Hosting, provider billing and production data | External checks only: no live deployment/account settings were inspected or changed |

## Tool evidence and coverage limits

- Gitleaks 8.30.1: `gitleaks git . --redact=100 --no-banner --report-format json --report-path /tmp/math-tutor-gitleaks-history.json`. Six commits scanned; no leaks found. Real `.env.local` and other ignored secret files were not read.
- Existing ESLint also ran explicit `no-eval`, `no-implied-eval`, `no-new-func` and `no-script-url` rules against `src/` and `scripts/`: PASS. Manual source searches traced environment reads, output sinks, network calls, logging and storage. No arbitrary user-input shell/evaluation/HTML sink was found.
- Semgrep and detect-secrets are not installed. They were not installed without authorization. The focused ESLint scan is not represented as equivalent to a full Semgrep rule pack; manual logic review covers the listed boundaries.
- `npm audit --json --fetch-retries=0 --fetch-timeout=15000` failed with sandbox `ENOTFOUND`. The documented [npm Bulk Advisory endpoint](https://docs.npmjs.com/cli/v11/commands/npm-audit/#bulk-advisory-endpoint) was queried read-only for all 519 public package names/540 locked versions: HTTP200 and `{}`. All544 resolved lockfile entries use `registry.npmjs.org` and include integrity hashes. No dependency versions were changed during review. A clean advisory result is time-bound, not a guarantee of package trust.
- Final staged-diff secret scan is recorded in `IMPLEMENTATION_PROGRESS.md`. Client static bundles are checked separately for OpenAI key/endpoint identifiers. No scanner output containing secret values is printed or committed.

## Confirmed controls

`src/lib/server/http.ts` checks JSON content type and browser-facing Origin/Host, bounds the actual streamed bytes (not a claimed Content-Length), and returns no-store JSON errors. Strict Zod schemas reject added verdict/role fields, oversize histories and duplicate action IDs. Both routes reconstruct the bounded problem and recompute accepted algebra; client correctness is never authoritative.

The math parser allowlists only the restricted expression grammar with 256 characters, 128 tokens, 16 nested groups/signs and9-digit literals. Exact rational arithmetic has a magnitude bound; functions, arbitrary evaluation, powers, multiple variables and variable division are rejected. Generated problems are independently checked. Tests cover malicious/large inputs, degenerate solution sets and generalized distribution cases.

`src/lib/tutor/provider.ts` defaults to Groq Free with an owner-confirmed tariff and blocks paid OpenAI without explicit selection plus a separate paid allowance. Both adapters are server-only, create SDK clients lazily, use separate keys and fixed official endpoints, disable SDK logging/retries and bound calls to 15s/1200 output tokens. Groq uses strict Structured Outputs with server-fixed teaching metadata and omits the unsupported store parameter; optional OpenAI retains store:false. A Free confirmation is an owner assertion, not a remote billing attestation. No provider key is sent to the browser. No model tools, shell, database or privileged actions exist. Untrusted student context is separated from instructions. Model output cannot change a math verdict or supply arbitrary rendered formulas; the additional English-prose guard is heuristic, not a proof of every possible teaching claim.

React escapes chat text. KaTeX receives only AST-controlled output or a fixed identity with `trust:false`; no raw student/model HTML or TeX is injected. Links are implementation-owned. Fonts/assets are local. Browser storage contains anonymous learning data, not credentials or authentication tokens. Loading validates version, field bounds, action uniqueness and replay; unknown/corrupt records are preserved and saving is paused. Cross-tab writes, quota errors and confirmed deletion are handled visibly.

The current header configuration disables framework branding and supplies nosniff, frame denial, referrer and permission restrictions. These four headers were also observed on the local production configuration response; hosted headers remain unverified. API errors omit SDK details, keys and stack traces. Persistent logging contains no prompts, student/model text or provider credentials; guard rejections emit fixed reason identifiers only. A temporary local evaluation hook for a fixed public fixture was removed before verification. Git ignores real env/key files; all 13 private original handoff files remain excluded.

## Findings

### S01 — capped session cannot restart: fixed

- Severity: IMPORTANT availability issue; confidence high.
- Location: `src/components/study/study-workspace.tsx`, reset-area condition.
- Reproduction: restore 64 rejected actions, zero accepted steps. Input is disabled, but the previous accepted-step-only condition omitted the reset button; refresh restored the same block.
- Fix: show reset when the session is full as well as when accepted work exists. Preserve confirmation and event history. The regression failed before the fix and passes afterward;30-case E2E includes desktop/tablet/mobile recovery.

### S02 — unverified deployment runtime: fixed

- Severity: IMPORTANT release reliability issue; confidence high.
- Location: root `engines.node` in `package.json` and lockfile.
- Evidence: Vercel can select the latest available major matching a broad range, overriding project settings. The prior `>=22.12.0` could therefore move beyond the locally tested major.
- Fix: pin24.x, matching `.nvmrc` and the 125-test Node 24 build. No installed package upgrade was needed. [Official runtime selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

### S03 — public paid-API exposure needs an external gate: open release condition

- Severity: CRITICAL **if** live AI is exposed publicly without an appropriate gate/shared limit; confidence high in the source limitation. No public exposure has been established in this session.
- Location: `src/lib/tutor/limits.ts` and `src/lib/tutor/service.ts`.
- The current30/minute, two-concurrent-call limit and short idempotency cache are per process. They reset between instances/deployments and are not a global spend cap. Origin is a browser safeguard, not authentication; a script can call the public endpoint directly.
- Remediation before live public access: configure verified deployment protection covering the actual URL and all aliases, or add a suitable shared limiter/access gate; confirm the provider's actual credits/usage/spend controls. Until then keep hosted `TUTOR_ENABLED=false`. `RELEASE_GUIDE.md` includes a zero-provider-call check for the gate. No account system is added to the anonymous MVP merely to hide this deployment condition.

### S04 — CSP and deeper SAST: recommendations

A nonce/hash-based CSP and deeper Semgrep analysis would add defense in depth. CSP is not configured; it must be designed/tested with Next's inline scripts and KaTeX rather than claiming that a permissive policy proves XSS safety. No raw untrusted HTML sink was found in the scoped review. ESLint9's existing support-policy limitation is retained; the dependency advisory check did not identify a current advisory requiring an upgrade. These are recorded limitations, not invented production exploits.

## Unverified external settings

Provider credit/rate/spend settings, model access, hosting account ownership/2FA, actual HTTPS and live headers, deployment protection for every alias, runtime patch level and hosted secret access remain NOT_VERIFIED. The two historical OpenAI attempts returned 429 without tutor prose. Actual local Groq tutoring and a production-build response have now passed; Groq account tier remains owner-confirmed rather than independently attested, and hosted success remains unverified. There is no live database, backup or customer record to audit.

**Verdict: do not expose billable AI publicly until S03 and real provider access are resolved.** The deterministic local prototype and tests are reviewable now. Local pass results do not establish deployed security or a successful genuine-AI tutor.

## Free-provider follow-up — 2026-11-09

The owner's no-payment instruction supersedes a paid-only release. Groq Free is the default and never falls back to OpenAI on quota/error. Legacy OpenAI requires explicit provider selection and `TUTOR_ALLOW_PAID=true`, both absent from the free workflow. Tests use the real installed SDK with a fake HTTP boundary to verify endpoint/key separation, schema, no unsupported store field, server-fixed hint metadata, safe failures and one-request/no-fallback behavior. No dependency changed or was installed.

The prose guard now accepts generic structural counts/pronouns and genuine questions without permitting numeric values or model grading. Regression fixtures retain answer-leak and contradictory-claim rejection. Live model output is still heuristic-screened; guarded failures are honest and remain possible. This is a small observed sample, not a claim that all model prose is correct.

S03 remains a condition for any future billable public deployment. The current free path does not require funding OpenAI or enabling paid hosting protection: protect free quota/availability with appropriate controls and verify actual host/access behavior. A process limit is still not a durable global limit. Keep the provider account on Free without billing/upgrades; the application cannot enforce an external tariff if the owner later changes it. No public deployment was made.

Follow-up verification: 147 tests and the owner's fresh 30-case browser run (39.5s), lint/typecheck/build pass. Redacted Gitleaks scanned seven existing commits and all 21 staged files with no leaks; client chunks contain no provider key/endpoint identifiers. All 13 original hashes match and real env files remain untracked. No target-port listener or headless Chrome remains. The lockfile and installed dependencies are unchanged.
