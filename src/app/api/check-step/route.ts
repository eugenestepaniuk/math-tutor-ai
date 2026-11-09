import { CheckStepRequest, CheckStepResponse } from "@/lib/math/contracts";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";
import { jsonReply as reply, readJsonBody, RequestError, requireJsonRequest } from "@/lib/server/http";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request): Promise<Response> {
  try {
    requireJsonRequest(request);
    const json = await readJsonBody(request, MAX_BODY_BYTES);
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
  } catch (error) {
    if (error instanceof RequestError) return reply({ error: error.message }, error.status);
    return reply({ error: "The checker couldn’t finish. Your equation is still here; please try again." }, 500);
  }
}
