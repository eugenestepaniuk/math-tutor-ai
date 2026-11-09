# Related practice and anonymous learning history

Phase 3 shares the existing Study input, verifier and AI tutor with generated Practice problems. The generator is deterministic for a bounded seed. It chooses coefficients and an integer solution, constructs the equation, then independently verifies the unique solution using the restricted algebra engine. The public problem omits the selected answer. Positive variants are preferred; negative coefficients/constants/solutions remain available. Used equations and the starter are excluded from new generation.

Both API routes accept a strict `problem` reference (`starter` or a bounded generated seed). Each server independently reconstructs the actual equation and replays the accepted steps or raw tutor actions from that equation. An arbitrary client equation, answer, difficulty or correctness flag cannot replace the problem. The tutor prompt receives the actual generated problem rather than the starter fixture.

## Correction and transfer

A rejected mathematical attempt records a mistake; syntax failures and unchanged equations do not. An accepted transformation records a correction for unresolved mistake categories. Distribution remains unresolved if the accepted step still requires expansion. A direct verified final answer is accepted, with the existing checker invitation to explain the expansion; this MVP does not certify mastery from that jump.

A related problem becomes available when the misconception is corrected, before full completion. The main solution stays saved while the student moves to Practice. Completion makes the CTA prominent. Each related problem keeps its source problem and target mistake category. New standalone practice uses the same implemented distributive-property skill. Generating a problem alone does not record an attempt or completion.

## Events and statistics

Events have stable IDs, problem IDs, ISO timestamps and a fixed skill. Retries merge by ID. Mathematical attempts, accepted steps, mistakes, resolved mistake categories, verified completions, delivered hints and completed follow-up outcomes are separate events. Free chat is not a mathematical attempt. Failed hints are not counted as delivered; a successful retry records one hint.

- Completed exercises count unique equations with a verified final value. Re-solving the same equation does not inflate that count.
- Attempts count actual submitted inputs that received a checker response, including syntax/no-op input. Network failures do not fabricate an attempt.
- Practice accuracy is accepted transformations divided by graded correct/incorrect attempts; syntax and no-op submissions are excluded. Before graded activity it says **Not enough data**.
- Corrected reasoning errors count unresolved categories followed by an accepted correction, not every prior repeated rejection.
- Follow-up accuracy is the share of attempted related problems completed without repeating the target mistake. Unfinished checks remain in the denominator and are separately listed as in progress. Completion after repeating the mistake still counts as an exercise completion, but does not count as transfer success.
- Hints count successful delivered provider responses. Static rule reminders are not counted as AI hints.

No value is a calibrated mastery measure. The UI explains the denominators. Stored events are anonymous browser data, editable by the browser owner; they are not authenticated school records.

## Storage and failures

`mathtutor.learning.v1` stores a strict version-1 Zod document: separate Study/Practice sessions, raw actions, bounded chat/drafts, related offer, seen problem references and deduplicated events. Accepted equations, feedback and hint state are rebuilt from raw actions on restoration. Restoring never calls the AI or resubmits an attempt. Configuration, pending requests, connection status and transient retry snapshots are not persisted.

Loading validates size, version, fields, action uniqueness, supported problem references and replayable histories. Unknown/corrupt data is kept intact; the tab starts with a visible notice and avoids overwriting the original. Blocked storage and quota/size failures show a visible warning instead of claiming persistence. A change from another tab pauses saving and asks for reload, avoiding silent competing writes. This is single-browser storage, without accounts, encryption, sync or production data.

The saved document is capped at 4,000,000 characters, 20,000 events and 20,000 seen references. Each problem has the existing 64-action/48-accepted-step limits and bounded drafts/chat. If the document no longer fits, the tab keeps working and reports that recent changes are not saved; earlier valid storage is preserved. No silent history truncation is used.

Progress offers a two-step **Clear saved history** confirmation. It removes only this app's storage key and resets both solutions, drafts, chat, offers and events. Other browser storage and provided project files are untouched. Clear/reset does not make any model call.

## Checks

Unit tests include M12's 100 generated equations, exact integer solutions, coefficient/variable/difficulty variation, negative variants, repeat avoidance and forged reference rejection. Event/storage tests cover retries, syntax/no-op exclusions, correction timing, transfer success/failure, corruption, unknown versions, quotas and independent restoration. Component tests complete the learning path, reload persisted state without a model request, and confirm reset. Browser tests cover the same reference flow, actual generated expansions, refresh, new generation and confirmation at desktop/tablet/mobile widths using test-only mock providers. Additional read-only scenarios seed disposable browser storage from real verifier/event helpers and capture populated Study/Practice/Progress at 1440/1024/768/390/360/375; they assert no POSTs, no page overflow and readable touch input sizes.

See `IMPLEMENTATION_PROGRESS.md` for current execution evidence. Mock providers and seeded QA browser state are test fixtures only; neither proves a live OpenAI request or represents a user's learning history.
