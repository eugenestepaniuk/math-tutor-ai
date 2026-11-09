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
