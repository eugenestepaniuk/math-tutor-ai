import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("requires explicit paid-call opt-in before even contacting a server", () => {
  const script = fileURLToPath(new URL("../../scripts/smoke-tutor.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "--base=http://127.0.0.1:1"], { encoding: "utf8" });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("No request sent");
  expect(result.stdout).toBe("");
});

it.each([
  [{ enabled: false, configured: true }, "TUTOR_ENABLED=true"],
  [{ enabled: true, configured: false }, "OPENAI_API_KEY"],
])("reports missing configuration without sending a model request: %j", (configuration, expected) => {
  const script = new URL("../../scripts/smoke-tutor.mjs", import.meta.url).href;
  const source = `process.argv.push('--allow-paid'); globalThis.fetch = async (_url, init) => { if (init?.method === 'POST') throw new Error('Unexpected POST'); return Response.json(${JSON.stringify(configuration)}); }; await import(${JSON.stringify(script)});`;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(expected);
  expect(result.stderr).not.toContain("Unexpected POST");
  expect(result.stdout).toBe("");
});
