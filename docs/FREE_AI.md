# Free AI setup and verification

## Decision

The owner requires no payment for the unpaid assessment. Groq Free is now the default server provider, with `openai/gpt-oss-120b`; `openai/gpt-oss-20b` is also explicitly selectable. These are open-weight models hosted by Groq, not requests to the paid OpenAI API. The installed OpenAI SDK is a transport client for Groq's documented compatible Responses API. No new package is required.

Groq documents a Free plan and strict Structured Outputs for these models. Free usage is limited; exact account quotas and future availability depend on the provider. Stay on Free without enabling billing or upgrading to Developer. The application cannot remotely prove an account's tariff. [Billing](https://console.groq.com/docs/billing-faqs), [rate limits](https://console.groq.com/docs/rate-limits), [Structured Outputs](https://console.groq.com/docs/structured-outputs), [Responses compatibility](https://console.groq.com/docs/responses-api).

This owner-approved change supersedes the private handoff's OpenAI-only deployment choice. All original handoff files remain unchanged and excluded from Git. Mathematical grading, bounded context, output verification, real progress and the Socratic teaching state remain independent of provider choice.

## Local configuration

1. Create a key at https://console.groq.com/keys in an account on **Free**. No payment or upgrade is part of this workflow.
2. In your own editor, add/update the following in the existing ignored `.env.local`. Do not overwrite the file, paste the key in chat or use a public environment variable:

   ```dotenv
   TUTOR_PROVIDER=groq
   GROQ_API_KEY=
   GROQ_MODEL=openai/gpt-oss-120b
   GROQ_FREE_TIER_CONFIRMED=true
   TUTOR_ENABLED=true
   TUTOR_ALLOW_PAID=false
   ```

3. Put the actual key only in the blank value. `GROQ_FREE_TIER_CONFIRMED=true` is the owner's confirmation of the account tier, not a provider billing lookup. Keep the account on Free for continued no-cost use.
4. Restart `npm run dev`. A read-only `GET /api/tutor` reports the selected provider, enabled/configured booleans and free/paid assertions, without a key or any model request.
5. Run `npm run smoke:ai -- --allow-free`. It refuses OpenAI or a missing Free confirmation before POST. It sends one fixed algebra fixture and requires a model-sourced targeted question with the independent distribution verdict; a local HTTP 200 by itself is insufficient.

The server never falls back to OpenAI or a different model. Groq failures, quota exhaustion, refusals, timeouts and guarded prose remain explicit failures; checking algebra and saved progress still work. No automatic SDK retry is enabled. Only the fixed official provider endpoints are allowed, with separate keys.

Legacy OpenAI remains an optional adapter with its original configurable model. It requires both explicit provider selection and `TUTOR_ALLOW_PAID=true`; neither is enabled by default. The owner's no-payment instruction does not authorize its use.

## Local live evidence — 2026-11-09

The owner created a Groq key and confirmed the Free configuration. The key file was never read by the agent. A production-server readiness GET reported `provider=groq`, `enabled=true`, `configured=true`, `freeTierConfirmed=true`, `paidAllowed=false`.

The final selected model is `openai/gpt-oss-120b`, confirmed by the read-only configuration response. The initial 20B trial produced valid guidance but showed frequent guarded output; selection of 120B was an explicit development change, never an automatic failure fallback.

| Real local interaction | Verified outcome |
| --- | --- |
| Submit `3x+4=2x+19` | Independent incorrect/distribution result; model-sourced targeted question; hint depth zero; no example/answer |
| Request a first hint | Model focuses on applying the factor to the constant term; depth one |
| Request a second hint | Model discusses the partial operation; depth two; the rendered equation comes only from the deterministic example engine |
| Ask why the factor affects the constant | Model responds to that question in the current context, retaining the checked partial example |
| Submit `3x+12=2x+19` | Independent correct verdict; model moves to collecting variables; hint depth resets to zero |
| Submit `x=7` | Independent completed verdict; model reviews the solved equation |
| Separate production-build fixture | Ready/model response with the distribution verdict and an actual targeted question |

Production question: “Which terms inside the brackets should the outside factor be applied to?” The production request/result are `/tmp/math-tutor-groq-production-{request,result}.json`; the six-action actual conversation is in `/tmp/math-tutor-groq-120b-*`, with the successful second-hint result named `hint2-evaluation-result.json`.

Development also produced guarded responses. These were never shown as AI teaching successes, and no automatic retry occurred. Across the 18 local provider attempts during implementation, nine returned ready/model and nine were guarded; this spans changing prompts, models and policy code and is not a final-version reliability benchmark. Free quota remains provider-controlled, and a future response may still be guarded or unavailable. No paid OpenAI request was sent.

Repairs from those evaluations: strict schema constants now bind hint level, example availability and next action to server facts. The prose policy distinguishes a Socratic distribution question from an affirmative grading claim, and structural counts/pronouns (two terms, each one) from a numeric answer. Digits, mathematical expressions, actual numeric values, premature answers and contradictions remain blocked. Tests cover the distinctions. Prompt descriptions and a labeled style illustration guide the model without supplying a scripted chat or fabricated response. Rejection logs contain only fixed reason identifiers (including a finite number-word category), never arbitrary student/model text, credentials or SDK errors.

All persistent application logging remains redacted. One temporary development-only capture inspected only a fixed public algebra evaluation fixture to diagnose a guard; that capture hook was removed before tests/build and is absent from runtime source. Transient fixtures contain no credentials and are not committed. The CLI smoke script itself was network-blocked in this sandbox; production verification used the same fixture over an allowed local HTTP transport, not a claim of CLI success. Automated tests replace the network and are not counted as live evidence.

Next.js dev was also found to append an agent-instruction block to the private `AGENTS.md`. Setting documented `agentRules:false` removed it and prevents recurrence. All 13 original file hashes were restored and verified; no original was added to Git.

## Reviewer access

For a hosted demo, configure the owner's Groq Free key as a server secret and keep paid access disabled. Reviewers open the URL and do not create a key. Free quota is shared by all visitors; access controls protect availability but are not a substitute for checking the actual Free account. The owner published the [Vercel demo](https://math-tutor-ai-black.vercel.app/study). Public access and 25 responsive combinations passed; a hosted Groq response passed the independent distribution check, and the owner confirmed the manual browser flow. Account tariff/ownership settings remain owner-controlled rather than independently inspected. See `RELEASE_GUIDE.md`.

## Hosted verification — 2026-11-09

The redeployed configuration reported enabled/configured true, Groq, GPT-OSS 120B, Free confirmation true and paid allowance false. One fixed hosted request returned ready/model, independent incorrect/distribution, hint level zero, no worked example and this question: “Which terms inside the brackets should receive the outside factor?” Evidence: `/tmp/math-tutor-vercel-live-{request,result}.json` and the key-free client-to-app transport trace. No actual secret file was read. This request used the owner-confirmed Free account; no paid fallback or SDK retry occurred.

The owner then reported that the complete manual website scenario worked. That statement covers their browser run; it is separate from the agent's directly observed API response and automated read-only responsive check. There is no server learning database or test record to remove; browser history remains under the user's control.
