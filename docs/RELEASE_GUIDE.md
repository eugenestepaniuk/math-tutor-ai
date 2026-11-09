# Owner-run publication and reviewer handoff

These are prepared instructions, not executed actions. No remote repository, hosting project, account settings, domain or deployment was created/changed by the agent. A successful genuine-AI demo is not yet verified; read `ACCEPTANCE_REPORT.md` before submitting it as complete.

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

Enter only the variable names from `.env.example` in the appropriate Preview/Production environment. Add the key as a server secret using the owner's dashboard, never a public variable. Initially use `TUTOR_ENABLED=false`; choose `OPENAI_MODEL` explicitly or retain its documented default. Changes apply to new deployments, so redeploy after updates. [Environment variables](https://vercel.com/docs/environment-variables).

Configure an appropriate access/cost control before enabling paid AI. Check the actual account's available protection methods and costs; no plan entitlement or free password protection is assumed. Standard Protection excludes production domains. Protect all reachable aliases or keep AI disabled on any unprotected deployment. Process-local application limits alone are insufficient. [Deployment Protection](https://vercel.com/docs/deployment-protection).

For external reviewers, use the host's approved sharing mechanism. An invited protected reviewer may need a Vercel login; a sharable link can bypass deployment protection and must be treated as an access credential. It never contains the OpenAI key. Confirm access from a separate browser and revoke sharing after review. [Sharing deployments](https://vercel.com/docs/deployments/sharing-deployments).

## 4. Verify hosting before any paid smoke test

Check `/`, `/study`, `/practice`, `/progress` and `/curriculum` directly, including a refresh and mobile navigation. Confirm real HTTPS, headers, intended Node version and no client-side provider credentials. Test `/api/tutor` GET as an authorized reviewer: configuration booleans only, no model request.

From an unauthenticated client, the following **invalid** request must be rejected by the chosen host/access gate before reaching paid functionality. Replace the reserved example host; this body cannot invoke the model even if the gate is misconfigured:

```bash
curl -i --request POST --header 'Content-Type: application/json' \
  --data '{}' https://reviewer-host.example/api/tutor
```

Expect the configured authentication rejection/redirect. An application's400 validation response means the request reached the unprotected route; that is not evidence of a working access gate. Repeat the check for every reachable alias. Keep AI off until the control is actually verified or a suitable shared limiter/access design is implemented.

## 5. Genuine AI verification — separate authorization

The owner must first resolve the prior429 through the actual API account's credits/rate/usage/spend settings. Source code cannot confirm that state, and replacing a key alone does not demonstrate quota. Do not automatically retry an unresolved billing/limit error. The default model remains configurable; do not silently substitute one.

After approving one paid request and enabling the protected deployment, use the opt-in smoke command for the intended host. Local example:

```bash
npm run smoke:ai -- --allow-paid
```

The script accepts `--base=https://reviewer-host.example` for an accessible target. A protected host may require an owner-approved authenticated workflow; do not disable protection or paste a bypass token into chat/logs merely to make the script work. Use the authenticated browser reference flow if needed. Any real step, hint or chat question can consume credits and needs the appropriate authorized test scope.

Require a model-sourced targeted question for the distribution error, hint level0, no worked answer and the independent `incorrect/distribution` verdict. Local HTTP200/unavailable is not a pass. Verify the actual deployed flow as well as local access, then update the acceptance/infrastructure record with dated evidence. Remove/reset any test history in that disposable browser; there is no server learning database.

## 6. Submission and rollback

Provide a working reviewer URL, source repository, concise architecture explanation and the Web/iOS/Android roadmap from README. Reviewer access uses the owner's server configuration; the employer does not create an OpenAI key. Do not claim successful live tutoring until it has actually passed.

If the provider remains unavailable, say so plainly and distinguish deterministic functionality from mocked tutor tests. The genuine-AI requirement is still outstanding; eight local acceptance passes do not imply the full assessment passed.

If release validation fails, keep paid tutoring off and return to a previously verified commit/deployment with protection/env settings checked. See `INFRASTRUCTURE.md` for the shutdown and rollback record. No push or deployment is performed by these notes themselves.
