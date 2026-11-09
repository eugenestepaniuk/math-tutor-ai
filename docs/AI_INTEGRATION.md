# AI tutoring — Phase 2

## Status and boundaries

The production code uses the official OpenAI Node SDK and Responses Structured Outputs. No mock provider is reachable through a runtime flag or production route. Unit/component/browser tests inject providers only from `tests/`.

A real API smoke test is **not yet verified**. On 2026-11-09 the owner approved one paid request, but sandbox localhost access prevented the smoke script from reaching the local server; no provider request was made. The unrestricted Terminal result is pending. Test fixtures are not proof of live AI availability, model access or teaching quality. The default requested model remains `gpt-6-luna`; the app never silently substitutes another model.

Phase 2 adds chat and gradual hints. Related practice generation, persistent learning events and progress metrics still belong to Phase 3. The current solution and conversation stay in memory across route changes and reset on refresh.

## Local configuration and one-request smoke test

1. In your own editor, configure the ignored `.env.local` with a real `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-6-luna` and `TUTOR_ENABLED=true`. Preserve any existing file; never paste a key into chat or commit it. `.env.example` contains no real key.
2. Starting/enabling the service does not itself call OpenAI. `GET /api/tutor` only reports configuration booleans. The UI says **Not connected yet** until a successful, verified provider response.
3. Run `npm run dev -- --hostname 127.0.0.1` in Terminal.
4. After explicitly approving one model request using API credits, run in another Terminal:

   ```bash
   npm run smoke:ai -- --allow-paid
   ```

   Without `--allow-paid`, the script exits before contacting any server. It never reads a secret file or prints a key. The explicit command sends one wrong-distribution fixture to the local server, requires a real model-sourced reply and a targeted question, and rejects unavailable/guarded responses. It prints PASS and the actual guiding question only on success. Automatic SDK retries are disabled.
5. The manual UI scenario is: wrong expansion → targeted question → Hint → more explicit rule question → Hint → unfinished verified operation → Show worked step → corrected expansion. Free questions use their own composer and do not become algebra attempts. Every additional tutor request may use credits.
6. Stop the server after checking. Set `TUTOR_ENABLED=false` when live calls should be disabled. Automated browser tests force this value, own their server, and intercept tutor requests with test fixtures where required.

The API key needs separate OpenAI API access/billing. A successful request is the actual account/model-access check; configuration alone is not proof. A missing key, disabled flag, unsupported model, provider refusal, exhausted quota or timeout remains an honest unavailable state. No silent model fallback is used.

## Data flow and contracts

- `/api/check-step` remains the fast independent checker. Its shared HTTP helper bounds streamed input and verifies the browser-facing origin.
- `/api/tutor` accepts a current action, a bounded action history and a short transcript. Actions are `submit_step`, `request_hint` and `ask_question`, each with a unique ID.
- The server replays raw equations from the trusted starter using the restricted verifier. It ignores client claims of correctness and computes the state, accepted-step count, recent mistakes and permitted hint level itself.
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
- Accepted correction: `next_step`, hint depth resets. Verified final value: `completed`; questions can review the solution, but no generated follow-up is offered yet.
- Free questions do not change the mathematical state. Failed hints are not added to the client's delivered-hint history; retry uses the original request snapshot.

History is replayable client-supplied session data, not a cryptographically attested learning record. Mathematical claims are recomputed; an intentionally forged prior hint sequence is not an authentication boundary. Durable events and storage are future work.

## Errors, retries and limits

- API inputs: at most 64 actions including the current one; equations 256 characters; questions 800 characters; transcript at most eight messages of 900 characters; actual streamed body limited to 64 KiB. Model context is further trimmed to recent attempts/conversation.
- Provider: fixed official API base URL, configurable model, low reasoning effort, 1,200 maximum output tokens, 15-second server deadline, no automatic retries, `store: false`. This storage flag does not make claims about all provider retention policies.
- Client: separate math/chat drafts, loading state and duplicate-submission guards, a 20-second tutor deadline, preserved text on provider failure, and explicit retry.
- Retry reuses the same action ID and original context. A bounded two-minute in-process cache joins concurrent identical requests and reuses successful replies. Failed replies can be retried; changed content under a cached ID is rejected.
- Best-effort process limits allow at most two concurrent provider calls and thirty calls per minute. This is **not** durable/global serverless rate limiting or a provider billing hard cap. Before public deployment, add an appropriate durable limit/access gate and account-level spending controls.
- SDK logging is explicitly disabled. Raw SDK errors, secret values, student messages and internal stack traces are not logged or returned. There are no accounts, payments or production records in this phase.

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

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI TypeScript SDK](https://developers.openai.com/api/reference/typescript)
- [Responses API storage and conversation state](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
