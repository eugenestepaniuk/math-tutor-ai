import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("requires explicit live-call opt-in before even contacting a server", () => {
  const script = fileURLToPath(new URL("../../scripts/smoke-tutor.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "--base=http://127.0.0.1:1"], { encoding: "utf8" });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("No request sent");
  expect(result.stdout).toBe("");
});

it.each([
  [{ provider: "groq", freeTierConfirmed: true, enabled: false, configured: true }, "TUTOR_ENABLED=true"],
  [{ provider: "groq", freeTierConfirmed: true, enabled: true, configured: false }, "GROQ_API_KEY"],
])("reports missing configuration without sending a model request: %j", (configuration, expected) => {
  const script = new URL("../../scripts/smoke-tutor.mjs", import.meta.url).href;
  const source = `process.argv.push('--allow-free'); globalThis.fetch = async (_url, init) => { if (init?.method === 'POST') throw new Error('Unexpected POST'); return Response.json(${JSON.stringify(configuration)}); }; await import(${JSON.stringify(script)});`;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(expected);
  expect(result.stderr).not.toContain("Unexpected POST");
  expect(result.stdout).toBe("");
});

it.each([
  ["--allow-free", { provider: "openai", enabled: true, configured: true, paidAllowed: true }, "non-Groq provider"],
  ["--allow-free", { provider: "groq", enabled: true, configured: true, freeTierConfirmed: false }, "Groq Free account"],
  ["--allow-paid", { provider: "openai", enabled: true, configured: true, paidAllowed: false }, "Paid calls are blocked"],
])("refuses an incompatible billing mode before POST: %s %j", (flag, configuration, expected) => {
  const script = new URL("../../scripts/smoke-tutor.mjs", import.meta.url).href;
  const source = `process.argv.push(${JSON.stringify(flag)}); globalThis.fetch = async (_url, init) => { if (init?.method === 'POST') throw new Error('Unexpected POST'); return Response.json(${JSON.stringify(configuration)}); }; await import(${JSON.stringify(script)});`;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(expected);
  expect(result.stderr).not.toContain("Unexpected POST");
});

it("makes one explicit free-tier POST and labels a verified real response by provider", () => {
  const script = new URL("../../scripts/smoke-tutor.mjs", import.meta.url).href;
  const source = `process.argv.push('--allow-free'); let posts = 0;
    globalThis.fetch = async (_url, init) => {
      if (!init?.method) return Response.json({ provider: 'groq', freeTierConfirmed: true, enabled: true, configured: true });
      if (++posts > 1) throw new Error('Duplicate POST');
      return Response.json({ result: { verdict: 'incorrect', mistakeKind: 'distribution' }, state: { hintLevel: 0 }, tutor: { status: 'ready', source: 'model', mathExample: null, guidingQuestion: 'Which terms does the outside factor multiply?' } });
    }; await import(${JSON.stringify(script)}); if (posts !== 1) process.exitCode = 1;`;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('"mode":"live groq provider"');
  expect(result.stderr).toBe("");
});
