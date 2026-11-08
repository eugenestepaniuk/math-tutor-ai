import { CheckStepRequest, CheckStepResponse } from "@/lib/math/contracts";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16_384;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(body);
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  // Next can normalize its internal request URL to localhost. The HTTP Host
  // retains the browser-facing authority, including a loopback IP or custom host.
  const expectedOrigin = new URL(request.url);
  const host = request.headers.get("host");
  if (host) expectedOrigin.host = host;
  if (origin && origin !== expectedOrigin.origin) return reply({ error: "Use the checker from this workspace." }, 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return reply({ error: "Send an application/json request." }, 415);
  }
  try {
    const text = await readBoundedBody(request);
    if (text === null) return reply({ error: "That request is too large." }, 413);
    let json: unknown;
    try { json = JSON.parse(text); } catch { return reply({ error: "Send a valid JSON request." }, 400); }
    const parsed = CheckStepRequest.safeParse(json);
    if (!parsed.success) return reply({ error: "Use a single equation of up to 256 characters and at most 48 accepted steps." }, 400);
    let current = STARTER_EQUATION;
    for (const accepted of parsed.data.acceptedSteps) {
      const verified = checkStep(current, accepted);
      if (!verified.canAdvance) return reply({ error: "Your step history could not be verified. Start the problem again." }, 409);
      if (verified.isComplete) return reply({ error: "This equation is already solved. Start again to practise it once more." }, 409);
      current = accepted;
    }
    const result = checkStep(current, parsed.data.equation);
    // Zod strips the internal canonical answer; it is never sent ahead of a solution.
    return reply(CheckStepResponse.parse({ result }));
  } catch {
    return reply({ error: "The checker couldn’t finish. Your equation is still here; please try again." }, 500);
  }
}
