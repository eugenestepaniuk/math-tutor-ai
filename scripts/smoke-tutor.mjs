import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

if (!process.argv.includes("--allow-paid")) {
  console.error("No request sent. Add --allow-paid only when you approve one live model request using API credits.");
  process.exit(2);
}
const base = process.argv.find(value => value.startsWith("--base="))?.slice(7) || "http://127.0.0.1:3000";
try {
  const status = await fetch(new URL("/api/tutor", base), { signal: AbortSignal.timeout(5000) });
  const configuration = await status.json();
  assert.ok(configuration.enabled && configuration.configured, "Enable live tutoring and configure the key on the server first.");
  const response = await fetch(new URL("/api/tutor", base), {
    method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
    body: JSON.stringify({ history: [], transcript: [], action: { id: randomUUID(), kind: "submit_step", equation: "3x+4=2x+19" } }),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, "Tutor request did not succeed.");
  const data = await response.json();
  assert.equal(data.result?.mistakeKind, "distribution");
  assert.equal(data.result?.verdict, "incorrect");
  assert.equal(data.tutor?.status, "ready", "Live guidance was unavailable or did not pass verification.");
  assert.equal(data.tutor?.source, "model");
  assert.equal(data.state?.hintLevel, 0);
  assert.equal(data.tutor.mathExample, null);
  assert.ok(data.tutor.guidingQuestion?.endsWith("?"));
  console.log(JSON.stringify({ result: "PASS", mode: "live OpenAI provider", guidingQuestion: data.tutor.guidingQuestion }));
} catch (error) {
  console.error("Live smoke test did not pass: " + (error instanceof assert.AssertionError ? error.message : "Check the local server and tutor configuration; no provider error details or secrets are printed."));
  process.exitCode = 1;
}
