# Infrastructure and ownership

As of 2026-11-09. This is the record of the local prototype and the proposed reviewer deployment, not a claim that hosting has been configured.

## Current state

| Item | State | Ownership |
| --- | --- | --- |
| Application | Local Next.js/React/TypeScript app; Node 24.x pinned and locally tested on24.7.0 | Project owner |
| Repository | Local `main`; no Git remote configured at review time | Project owner controls creation, visibility and push |
| Hosting | Vercel is the planned target; no deployment was performed or verified | Owner account/project details not inspected |
| Reviewer URL | Not assigned/verified in this session | To be recorded after an authorized deployment |
| AI API | Groq Free by default; real local question/hints/chat/correction/completion and production-build request verified; no hosted check | Owner confirms Free account; separate provider key stays server-only |
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
- Existing response headers are supplied by `next.config.ts`. A strong CSP is not configured. Actual hosted HTTPS, headers, aliases and runtime must be checked after deployment.
- Process-local limits/cache are best effort. Before enabling paid tutoring, protection/shared limits must cover the actual reviewer URL **and every unprotected alias**. Standard Protection excludes production domains; never infer that a protected preview secures all URLs. [Protection scope](https://vercel.com/docs/deployment-protection).
- The current read-only readiness probe is `GET /api/tutor`; it exposes provider/readiness and free/paid assertions only, with no credentials. A successful GET does not prove model access.
- No automated deployment connection has been configured or inspected. If the owner connects Git integration, check which future pushes deploy before using it.
- The site remains noindex as an assessment prototype. Public SEO, analytics, email/DNS and native apps are outside this release scope.

## Shutdown and rollback

Local: stop the owned Next process; disabling `TUTOR_ENABLED` requires a server restart. Hosted: set it false and create a new deployment, then verify the actual reviewer URL. In an abuse incident, the owner should also restrict hosting access or revoke the affected provider key; changing an env value alone does not disable an older deployment.

For a code regression, redeploy a previously verified commit while rechecking protection and environment settings. Preserve shared Git history; use a new revert commit when appropriate, never a force-push/reset to hide the release. No rollback action was executed here.

## Outstanding owner checks

Keep the Groq account on Free, verify the actual hosted live flow; configure account ownership/2FA and appropriate hosted protection; authorize push/deployment; verify the hosted reference flow and reviewer access; record the actual URL, deployment/commit identifier, runtime and test date here. Until then, hosted readiness is NOT_VERIFIED. See `RELEASE_GUIDE.md` and `ACCEPTANCE_REPORT.md`.

## No-payment provider controls

See `FREE_AI.md`. Default Groq never reads the OpenAI key; the latter requires explicit provider selection and a separate paid allowance. Free quota is shared across visitors and not made durable by local limits. Keep any reviewer workflow within actual Free quotas; protect availability where feasible without assuming paid hosting features. No model/provider switch happens on quota errors.
