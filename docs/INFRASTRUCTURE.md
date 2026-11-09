# Infrastructure and ownership

As of 2026-11-09. This records the local prototype and owner-published Vercel demo, with direct checks separated from owner-reported results and uninspected account settings.

## Current state

| Item | State | Ownership |
| --- | --- | --- |
| Application | Local Next.js/React/TypeScript app; Node 24.x pinned and locally tested on24.7.0 | Project owner |
| Repository | Local `main`; GitHub URL has not been supplied to the agent | Project owner controls visibility, reviewer access and push |
| Hosting | Owner deployed to Vercel; public application and API checked on 2026-11-09 | Owner manages the account; agent did not create or deploy the project |
| Reviewer URL | [https://math-tutor-ai-black.vercel.app](https://math-tutor-ai-black.vercel.app/); Study entry at /study | Public access verified without a Vercel login |
| AI API | Groq Free by default; local flow and hosted model response verified; full hosted browser flow confirmed by owner | Owner confirms Free account; separate provider key stays server-only |
| Data | Anonymous versioned localStorage in each browser; no server database or account sync | Browser user; clear action is available |
| Domain, DNS, mail and analytics | Not required for this assessment; no such service configured by the agent | No account/domain purchase or service changes made |

The owner supplied a zero-balance OpenAI screenshot and chose no-payment Groq Free instead. Groq tier confirmation is owner-supplied; no external account dashboard, account 2FA or hosting entitlement has been independently verified. The owner chooses and maintains hosting/API accounts and any spend limits. No new dependency/scanner was installed during the final review.

## Runtime variables — names only

| Name | Scope | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Server runtime secret | Key from the owner-confirmed Groq Free account; never exposed to reviewers/browser/Git |
| `GROQ_MODEL` | Server runtime configuration | `openai/gpt-oss-120b` default; `openai/gpt-oss-20b` also supported |
| `GROQ_FREE_TIER_CONFIRMED` | Server runtime assertion | Owner checked Free account without billing; required, not a remote tariff lookup |
| `TUTOR_PROVIDER` | Server runtime configuration | Defaults to `groq`; unknown names fail closed, no automatic provider fallback |
| `TUTOR_ALLOW_PAID` | Server runtime opt-in | Defaults false; legacy OpenAI is blocked unless explicitly selected and allowed |
| `OPENAI_API_KEY` | Optional server secret | Legacy paid provider only; unnecessary for the free workflow |
| `OPENAI_MODEL` | Server runtime configuration | Configurable requested model; default `gpt-6-luna`, with no silent fallback |
| `TUTOR_ENABLED` | Server runtime configuration | Enables the selected provider only after its additional free/paid gate; true does not prove live availability |

`.env.example` is the safe template. Real `.env.local` was not inspected and remains ignored. Hosted values are entered by the owner in Vercel, separately for the intended environment. An environment-variable change affects a **new deployment**, not an already-running one. [Official environment behavior](https://vercel.com/docs/environment-variables).

## Hosting and release controls

- Next.js auto-detection, `npm ci`, `npm run build`, default Next output and the pinned24.x Node runtime. The math/tutor routes declare Node runtime; tutor duration is 20s with an internal 15s provider deadline. [Runtime selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- Existing response headers are supplied by `next.config.ts`. A strong CSP is not configured. HTTPS and the four configured response headers plus HSTS were observed on the published URL. Other aliases, account controls and the exact runtime patch were not inspected.
- Process-local limits/cache are best effort. Before enabling paid tutoring, protection/shared limits must cover the actual reviewer URL **and every unprotected alias**. Standard Protection excludes production domains; never infer that a protected preview secures all URLs. [Protection scope](https://vercel.com/docs/deployment-protection).
- The current read-only readiness probe is `GET /api/tutor`; it exposes provider/readiness and free/paid assertions only, with no credentials. A successful GET does not prove model access.
- The owner published the demo; the agent has not inspected the Git integration or automatic-deployment settings. If the owner connects Git integration, check which future pushes deploy before using it.
- The site remains noindex as an assessment prototype. Public SEO, analytics, email/DNS and native apps are outside this release scope.

## Shutdown and rollback

Local: stop the owned Next process; disabling `TUTOR_ENABLED` requires a server restart. Hosted: set it false and create a new deployment, then verify the actual reviewer URL. In an abuse incident, the owner should also restrict hosting access or revoke the affected provider key; changing an env value alone does not disable an older deployment.

For a code regression, redeploy a previously verified commit while rechecking protection and environment settings. Preserve shared Git history; use a new revert commit when appropriate, never a force-push/reset to hide the release. No rollback action was executed here.

## Owner maintenance

Keep the Groq account on Free and control reviewer source access. The exact deployed commit ID, hosting plan entitlement, account 2FA, runtime patch and other aliases were not independently inspected. No paid plan, domain or provider billing change is required or authorized by this record. GitHub source URL is still to be supplied in the employer submission. Future push/deploy decisions remain with the owner.

## No-payment provider controls

See `FREE_AI.md`. Default Groq never reads the OpenAI key; the latter requires explicit provider selection and a separate paid allowance. Free quota is shared across visitors and not made durable by local limits. Keep any reviewer workflow within actual Free quotas; protect availability where feasible without assuming paid hosting features. No model/provider switch happens on quota errors.

## Published verification — 2026-11-09

- URL: https://math-tutor-ai-black.vercel.app/; all five application routes rendered publicly without a Vercel sign-in/protection screen.
- Read-only responsive QA: 25/25 PASS at 1440/1024/768/390/360, zero blocking layout findings, JS exceptions or failed requests. Existing noindex/canonical limitations remain documented. Evidence: `/tmp/math-tutor-vercel-web-qa/`. Its Chrome profile was closed; no forms or model calls were used in that run.
- After the owner enabled tutoring and redeployed, GET /api/tutor returned enabled/configured true, provider groq, model openai/gpt-oss-120b, freeTierConfirmed true and paidAllowed false. These are application assertions, not an independent tariff check.
- One actual hosted POST for the fixed distribution mistake returned ready/model, incorrect/distribution, depth zero, no worked example and a focused question. Evidence: `/tmp/math-tutor-vercel-live-result.json`. The CLI was not used for this hosted check; direct HTTPS transport was used.
- The owner confirmed that the manual website scenario worked. This is owner-reported browser evidence, separate from the agent's API/QA observations. Progress remains in each visitor's browser; no server learning records were created by the agent.
- The agent made no push, deploy, account/billing change or real secret-file read. No provider key is provided to the employer. Current hosted verification does not attest the account's exact plan, patch level or every future model reply.
