# Owner-run publication and reviewer handoff

The owner has published the [Vercel demo](https://math-tutor-ai-black.vercel.app/study). Public responsive routes and a real hosted Groq response passed; the owner confirmed the manual browser flow. This guide documents the release process. The agent did not push, deploy or change account/billing settings. Read ACCEPTANCE_REPORT.md and INFRASTRUCTURE.md for evidence and scope.

## 1. Inspect the local release

Use Node 24.x and the committed lockfile. Review the latest commit and clean status, then run the documented checks. A reviewer can run deterministic checking, generated practice and all automated tests without a key.

```bash
git status --short
git log --oneline -6
npm ci
npm audit
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

The browser tests use installed Google Chrome and own port3000; stop your dev/preview server first. Their server forces `TUTOR_ENABLED=false`, and mock providers are injected only from tests. Do not publish generated build folders or real secret files. `git ls-files .env.local` must print nothing. Original private specifications/reference boards are deliberately absent from Git; the implementation and new docs remain runnable without them.

## 2. Push only when the owner chooses

Create an empty GitHub repository under the owner's account with the desired visibility. Review the final source first. If no remote exists, replace the example URL before running these yourself:

```bash
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Do not force-push or overwrite an existing remote/history. If an `origin` already exists, inspect its destination privately instead of adding another one. No GitHub credential belongs in a command, chat, commit or README.

## 3. Prepare the Vercel project with live AI off

Import the chosen repository using the owner's Vercel account. Select Next.js, project root, `npm ci`, `npm run build` and default framework output. The source pins Node 24.x; verify the build uses the intended major. [Node runtime documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Enter only the variable names from `.env.example` in the appropriate Preview/Production environment. Add the key as a server secret using the owner's dashboard, never a public variable. Initially use `TUTOR_ENABLED=false`; use `TUTOR_PROVIDER=groq`, `GROQ_MODEL=openai/gpt-oss-120b`, the Free account key and `TUTOR_ALLOW_PAID=false`. Confirm the actual Free tier before setting `GROQ_FREE_TIER_CONFIRMED=true`. Changes apply to new deployments, so redeploy after updates. [Environment variables](https://vercel.com/docs/environment-variables).

Configure an appropriate access/cost control before enabling paid AI. Check the actual account's available protection methods and costs; no plan entitlement or free password protection is assumed. Standard Protection excludes production domains. Protect all reachable aliases or keep AI disabled on any unprotected deployment. Process-local application limits alone are insufficient. [Deployment Protection](https://vercel.com/docs/deployment-protection).

For external reviewers, use the host's approved sharing mechanism. An invited protected reviewer may need a Vercel login; a sharable link can bypass deployment protection and must be treated as an access credential. It never contains a provider key. Confirm access from a separate browser and revoke sharing after review. [Sharing deployments](https://vercel.com/docs/deployments/sharing-deployments).

## 4. Verify hosting before a live smoke test

Check `/`, `/study`, `/practice`, `/progress` and `/curriculum` directly, including a refresh and mobile navigation. Confirm real HTTPS, headers, intended Node version and no client-side provider credentials. Test `/api/tutor` GET as an authorized reviewer: provider/readiness and free/paid assertions only, no model request.

If an access gate is configured, verify it from an unauthenticated client. The following **invalid** request must be rejected by that gate; this is required before any future billable AI exposure. Replace the reserved example host; this body cannot invoke the model even if the gate is misconfigured:

```bash
curl -i --request POST --header 'Content-Type: application/json' \
  --data '{}' https://reviewer-host.example/api/tutor
```

Expect the configured authentication rejection/redirect. An application's400 validation response means the request reached the unprotected route; that is not evidence of a working access gate. Repeat the check for every reachable alias. Keep billable AI off until the control is actually verified or a suitable shared limiter/access design is implemented. A Groq Free demo does not require purchasing hosting protection: if exposed publicly without a gate, document shared free quota and limited availability, keep the account without billing/upgrades and retain the existing request bounds. Do not describe process-local limits as durable protection.

## 5. Genuine AI verification on the Free plan

The current no-payment path is documented in `FREE_AI.md`. Keep Groq on Free, without adding billing or upgrading to Developer, and keep paid OpenAI disabled. The account-confirmation flag is an owner assertion; the application cannot verify a tariff remotely. Exact free quota and availability are provider-controlled. [Groq billing](https://console.groq.com/docs/billing-faqs), [Free quotas](https://console.groq.com/docs/rate-limits).

After enabling the intended server, run one free-tier smoke test:

```bash
npm run smoke:ai -- --allow-free
```

The script refuses a non-Groq provider or missing Free confirmation before POST. It accepts `--base=https://reviewer-host.example` for an accessible target. A protected host may require an authenticated workflow; do not disable protection or expose bypass tokens to make a test work. Each real step, hint or chat message uses shared free quota; errors never switch to a paid provider.

Require a model-sourced targeted question for the distribution error, hint level zero, no worked answer and the independent incorrect/distribution verdict. Local HTTP 200/unavailable is not a pass. Verify progressive hints, correction and free-form questions on the actual deployed flow as well as locally, then record dated evidence. Remove test history in the disposable browser; there is no server learning database.

The optional OpenAI route remains gated by explicit provider choice and a separate paid allowance. The owner's no-payment instruction does not authorize enabling or exercising it; restoring its credits is not a release prerequisite for the Groq workflow.

## 6. Submission and rollback

Provide a working reviewer URL, source repository, concise architecture explanation and the Web/iOS/Android roadmap from README. Reviewer access uses the owner's server configuration; the employer does not create any provider key. Do not claim successful live tutoring until it has actually passed.

If the provider remains unavailable, say so plainly and distinguish deterministic functionality from mocked tutor tests. Use the latest acceptance report to distinguish local model verification from the directly checked API/QA results, owner-reported browser flow and remaining account-level limits.

If release validation fails, keep paid tutoring off and return to a previously verified commit/deployment with protection/env settings checked. See `INFRASTRUCTURE.md` for the shutdown and rollback record. No push or deployment is performed by these notes themselves.

## Employer handoff

The employer's original What to Submit message requires three items: a working demo/runnable project, source code and a brief technical approach. Put the live URL and accessible GitHub URL in the submission message, followed by a short explanation of Next.js/TypeScript, independent algebra validation, Groq-generated Socratic guidance and browser-local progress. The README contains setup, test flow and limitations. A separate video, PDF or native app is not listed as a required deliverable in that message.
