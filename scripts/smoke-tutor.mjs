import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const allowFree = process.argv.includes("--allow-free");
const allowPaid = process.argv.includes("--allow-paid");
if (allowFree === allowPaid) {
  console.error("No request sent. Choose --allow-free for one request on a confirmed Groq Free account, or --allow-paid for explicitly authorized OpenAI use.");
  process.exit(2);
}
const base = process.argv.find(value => value.startsWith("--base="))?.slice(7) || "http://127.0.0.1:3000";
try {
  const status = await fetch(new URL("/api/tutor", base), { signal: AbortSignal.timeout(5000) });
  assert.equal(status.status, 200, "The local tutor configuration endpoint is unavailable.");
  const configuration = await status.json();
  assert.ok(configuration.provider === "groq" || configuration.provider === "openai", "Select TUTOR_PROVIDER=groq on the server and restart it. No model request sent.");
  if (allowFree) {
    assert.equal(configuration.provider, "groq", "Free-only check refused a non-Groq provider. No model request sent.");
    assert.equal(configuration.freeTierConfirmed, true, "Confirm the actual Groq Free account, without billing, then set GROQ_FREE_TIER_CONFIRMED=true and restart. No model request sent.");
  } else {
    assert.equal(configuration.provider, "openai", "Use --allow-free for Groq. No model request sent.");
    assert.equal(configuration.paidAllowed, true, "Paid calls are blocked on the server. No model request sent.");
  }
  assert.ok(configuration.enabled, "AI tutoring is disabled. Set TUTOR_ENABLED=true and restart the server. No model request sent.");
  const keyName = configuration.provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
  assert.ok(configuration.configured, `The running server is not configured. Check ${keyName} and the selected model privately, then restart. No model request sent.`);
  const response = await fetch(new URL("/api/tutor", base), {
    method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
    body: JSON.stringify({ history: [], transcript: [], action: { id: randomUUID(), kind: "submit_step", equation: "3x+4=2x+19" } }),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, "Tutor request did not succeed.");
  const data = await response.json();
  assert.equal(data.result?.mistakeKind, "distribution");
  assert.equal(data.result?.verdict, "incorrect");
  const knownErrors = new Set(["disabled", "not_configured", "timeout", "provider_limit", "provider_error", "invalid_guidance", "request_limit"]);
  const reason = knownErrors.has(data.tutor?.errorCode) ? ` (${data.tutor.errorCode})` : "";
  assert.equal(data.tutor?.status, "ready", `Live guidance was unavailable or did not pass verification${reason}.`);
  assert.equal(data.tutor?.source, "model");
  assert.equal(data.state?.hintLevel, 0);
  assert.equal(data.tutor.mathExample, null);
  assert.ok(data.tutor.guidingQuestion?.endsWith("?"));
  console.log(JSON.stringify({ result: "PASS", mode: `live ${configuration.provider} provider`, guidingQuestion: data.tutor.guidingQuestion }));
} catch (error) {
  console.error("Live smoke test did not pass: " + (error instanceof assert.AssertionError ? error.message : "Check the local server and tutor configuration; no provider error details or secrets are printed."));
  process.exitCode = 1;
}
