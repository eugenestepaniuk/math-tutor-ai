# AI tutoring

## Provider decision and current status

The owner requires a no-payment assessment. Groq Free is now the default provider, using `openai/gpt-oss-120b` through the installed OpenAI SDK and Groq's compatible Responses API. This is a real model service hosted by Groq, not the paid OpenAI API and not a scripted fallback. No mock provider is reachable from a production flag or route. Mathematical validation and pedagogical verification remain independent. See `FREE_AI.md` for setup and dated live evidence.

A real local Groq sequence passed: distribution question, progressive hints at levels one and two, free-form chat, accepted correction and verified completion. A separate production-build request also passed. This verifies a small actual sample, not every possible generated teaching claim. Prior OpenAI attempts returned normalized `provider_limit` (HTTP 429) without tutor prose; those are historical failures, not a reason to fund OpenAI for this free path. No new paid OpenAI attempt is authorized or performed. No hosted demo has been verified.

## Configuration and one-request smoke test

Use the existing ignored `.env.local` in your own editor. Never expose a key through chat, Git, browser storage or `NEXT_PUBLIC_*`:

```dotenv
TUTOR_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FREE_TIER_CONFIRMED=true
TUTOR_ENABLED=true
TUTOR_ALLOW_PAID=false
```

Keep the actual Groq account on Free without adding billing/upgrading. The confirmation flag records the owner's tier check; it cannot attest an external account or prevent charges if that account is later upgraded. Only `openai/gpt-oss-120b` and `openai/gpt-oss-20b` are accepted as Groq models, with no silent model/provider fallback. [Groq billing](https://console.groq.com/docs/billing-faqs), [rate limits](https://console.groq.com/docs/rate-limits).

Restart the server after editing configuration. `GET /api/tutor` reports provider, readiness and free/paid assertions only; it never sends a model request or returns a key. The UI still says Not connected yet until a successful model response.

```bash
npm run smoke:ai -- --allow-free
```

Without an explicit mode the script makes no HTTP request. Free mode refuses OpenAI and an unconfirmed Free account before POST. It sends one fixed distribution mistake, requires a real model-sourced targeted question with no worked answer and prints PASS only after all checks. No SDK retry is enabled. A failed or guarded response is not a successful AI answer. The script accepts `--base=` for an accessible target; hosted success is separate from local success.

The legacy OpenAI adapter retains `OPENAI_API_KEY`, configurable `OPENAI_MODEL` (default `gpt-6-luna`) and `store:false`. It requires explicit `TUTOR_PROVIDER=openai` and `TUTOR_ALLOW_PAID=true`, in addition to enabling tutoring. It is never selected as a fallback. Its `--allow-paid` smoke mode is retained for explicit future authorization, not needed for this assessment.

## Data flow and contracts

- `/api/check-step` remains the fast independent checker. Its shared HTTP helper bounds streamed input and verifies the browser-facing origin.
- `/api/tutor` accepts a current action, a bounded action history and a short transcript. Actions are `submit_step`, `request_hint` and `ask_question`, each with a unique ID.
- The server replays raw equations from the independently reconstructed starter/generated problem using the restricted verifier. It ignores client claims of correctness and computes the state, accepted-step count, recent mistakes and permitted hint level itself.
- Client-provided transcript roles are quoted context, not system/assistant instructions or authoritative math. The model receives a stable instruction message, independently checked facts and explicitly untrusted student context. The internal canonical answer is omitted.
- The model returns schema-constrained prose, a guiding question, the fixed hint level, a permitted next-action tag and a choice of whether to show the server-provided example. It never supplies a mathematical verdict or arbitrary formula.
- Every displayed worked example is computed and checked independently. Prose is screened for grading contradictions, numeric/number-word answer leaks, unsupported markup, premature examples and mismatched state metadata. Rejected output is explicitly labeled verified/checker guidance, not an AI answer.

The prose guard is deliberately conservative and heuristic. It does not prove every possible English teaching claim. Mathematical grading and displayed formulas remain deterministic regardless of model output; model prose still needs evaluation with actual responses before release.

## Teaching state

- Initial error: `guided_correction`, hint level 0, focused question and no expansion/answer.
- Repeated verified errors can name the rule at level 1; syntax/no-op input is not added to misconception categories.
- Hint level 1: name the relevant rule and ask a focused question.
- Hint level 2: show an independently verified, unfinished local operation, leaving arithmetic to the student.
- Hint level 3: explicitly requested **Show worked step**, with one independently verified next step. It does not automatically complete the exercise; the student must still submit a valid solution.
- Accepted correction: `next_step`, hint depth resets. Verified final value: `completed`; questions can review the solution, and the application offers independently verified related practice.
- Free questions do not change the mathematical state. Failed hints are not added to the client's delivered-hint history; retry uses the original request snapshot.

History is replayable client-supplied session data, not a cryptographically attested learning record. Mathematical claims are recomputed; an intentionally forged prior hint sequence is not an authentication boundary. Versioned local events/storage are implemented in Phase 3; authenticated durable records remain future work.

## Errors, retries and limits

- API inputs: at most 64 actions including the current one; equations 256 characters; questions 800 characters; transcript at most eight messages of 900 characters; actual streamed body limited to 64 KiB. Model context is further trimmed to recent attempts/conversation.
- Provider: fixed official API base URL, configurable model, low reasoning effort, 1,200 maximum output tokens, 15-second server deadline, no automatic retries. The optional OpenAI adapter uses `store:false`; Groq omits that unsupported request field. Neither statement proves every provider retention policy.
- Client: separate math/chat drafts, loading state and duplicate-submission guards, a 20-second tutor deadline, preserved text on provider failure, and explicit retry.
- Retry reuses the same action ID and original context. A bounded two-minute in-process cache joins concurrent identical requests and reuses successful replies. Failed replies can be retried; changed content under a cached ID is rejected.
- Best-effort process limits allow at most two concurrent provider calls and thirty calls per minute. This is **not** durable/global serverless rate limiting or a provider billing hard cap. Before public deployment, add an appropriate durable limit/access gate and account-level spending controls.
- SDK logging is explicitly disabled. Policy rejection logs contain only a fixed reason identifier, never student/model prose. Raw SDK errors, secret values, student messages and internal stack traces are not logged or returned. There are no accounts, payments or production records in this phase.

## Verification

Automated tests cover the hint ladder, independent verdicts, generalized checked examples, prompt boundaries, unsafe model outputs, SDK request options, timeouts/quota/configuration failures, duplicate-request caching, process limits, chat draft preservation and UI retries. Browser fixtures are labeled mock-provider scenarios and never count as live verification.

Run:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

See `IMPLEMENTATION_PROGRESS.md` for exact results and live smoke-test status.

## Official documentation checked

- [Groq Responses API and Zod parsing](https://console.groq.com/docs/responses-api)
- [Groq strict Structured Outputs](https://console.groq.com/docs/structured-outputs)

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI TypeScript SDK](https://developers.openai.com/api/reference/typescript)
- [Responses API storage and conversation state](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
