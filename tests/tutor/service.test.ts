import { describe, expect, it, vi } from "vitest";
import { createTutorHandler, TutorProviderError } from "@/lib/tutor/service";
import { createTutorLimit } from "@/lib/tutor/limits";
import type { TutorRequest } from "@/lib/tutor/contracts";
import type { TeachingContext } from "@/lib/tutor/policy";
import { teachingContext } from "@/lib/tutor/policy";
import { fixtureReply, questionAction, stepAction, tutorRequest } from "../fixtures/tutor";

const httpRequest = (body: unknown) => new Request("http://localhost/api/tutor", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
function setup() {
  const generate = vi.fn(async (_request: TutorRequest, context: TeachingContext) => fixtureReply(context));
  const handler = createTutorHandler({ configuration: () => ({ enabled: true, configured: true }), generate });
  return { handler, generate };
}

describe("tutor boundary with mock providers only", () => {
  it("recomputes the verdict and sends verified adaptive context to the provider", async () => {
    const { handler, generate } = setup();
    const response = await handler(httpRequest(tutorRequest(stepAction("3x+4=2x+19"))));
    const body = await response.json();
    expect(body.result).toMatchObject({ verdict: "incorrect", mistakeKind: "distribution" });
    expect(body.tutor).toMatchObject({ source: "model", status: "ready", mathExample: null });
    expect(body.result).not.toHaveProperty("canonicalSolution");
    expect(generate.mock.calls[0]![1].lastCheck?.mistakeKind).toBe("distribution");
  });
  it("never lets a contradictory model change a valid mathematical verdict", async () => {
    const { handler, generate } = setup();
    generate.mockImplementationOnce(async (_data, context) => ({ ...fixtureReply(context), message: "This step is wrong." }));
    const body = await (await handler(httpRequest(tutorRequest(stepAction("3x+12=2x+19"))))).json();
    expect(body.result).toMatchObject({ verdict: "correct", canAdvance: true, mistakeKind: "none" });
    expect(body.tutor).toMatchObject({ status: "guarded", source: "checker", errorCode: "invalid_guidance" });
  });
  it("returns transparent failure without losing the independently checked result", async () => {
    const { handler, generate } = setup();
    generate.mockRejectedValueOnce(new TutorProviderError("timeout"));
    const body = await (await handler(httpRequest(tutorRequest(stepAction("3x+4=2x+19"))))).json();
    expect(body.result.mistakeKind).toBe("distribution");
    expect(body.tutor).toMatchObject({ status: "unavailable", source: null, retryable: true, errorCode: "timeout" });
    expect(JSON.stringify(body)).not.toMatch(/stack|apiKey|sk-/);
  });
  it("does not call a provider when disabled or missing configuration", async () => {
    for (const configuration of [{ enabled: false, configured: true }, { enabled: true, configured: false }]) {
      const generate = vi.fn();
      const handler = createTutorHandler({ configuration: () => configuration, generate });
      const body = await (await handler(httpRequest(tutorRequest(questionAction())))).json();
      expect(body.tutor.status).toBe("unavailable");
      expect(generate).not.toHaveBeenCalled();
    }
  });
  it("reuses an identical completed request and rejects changed content under the same ID", async () => {
    const { handler, generate } = setup();
    const request = tutorRequest(questionAction());
    const first = await (await handler(httpRequest(request))).json();
    expect(await (await handler(httpRequest(request))).json()).toEqual(first);
    expect(generate).toHaveBeenCalledTimes(1);
    expect((await handler(httpRequest({ ...request, transcript: [{ role: "student", text: "changed" }] }))).status).toBe(409);
  });
  it("allows an explicit retry after provider failure", async () => {
    const { handler, generate } = setup();
    const request = tutorRequest(questionAction());
    generate.mockRejectedValueOnce(new TutorProviderError("provider_limit"));
    expect((await (await handler(httpRequest(request))).json()).tutor.errorCode).toBe("provider_limit");
    expect((await (await handler(httpRequest(request))).json()).tutor.status).toBe("ready");
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("joins concurrent retries instead of making duplicate provider requests", async () => {
    const { handler, generate } = setup();
    const data = tutorRequest(questionAction());
    let finish!: (reply: ReturnType<typeof fixtureReply>) => void;
    generate.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const first = handler(httpRequest(data));
    const second = handler(httpRequest(data));
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    finish(fixtureReply(teachingContext(data)));
    expect(await (await first).json()).toEqual(await (await second).json());
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it("does not start a provider request after the caller has already canceled", async () => {
    const { handler, generate } = setup();
    const controller = new AbortController();
    const request = new Request(httpRequest(tutorRequest(questionAction())), { signal: controller.signal });
    controller.abort();
    const body = await (await handler(request)).json();
    expect(body.tutor.errorCode).toBe("timeout");
    expect(generate).not.toHaveBeenCalled();
  });
  it("rejects huge, forged and duplicate requests before provider invocation", async () => {
    const { handler, generate } = setup();
    const request = tutorRequest(questionAction());
    expect((await handler(httpRequest({ ...request, result: { correct: true } }))).status).toBe(400);
    expect((await handler(httpRequest({ ...request, history: [request.action] }))).status).toBe(400);
    expect((await handler(httpRequest({ ...request, transcript: Array(9).fill({ role: "student", text: "hello" }) }))).status).toBe(400);
    expect((await handler(httpRequest({ ...request, action: questionAction("x".repeat(801)) }))).status).toBe(400);
    expect((await handler(httpRequest({ text: "x".repeat(66000) }))).status).toBe(413);
    expect(generate).not.toHaveBeenCalled();
  });
  it("rejects further math after completion but allows review questions", async () => {
    const { handler } = setup();
    const history = [stepAction("x=7")];
    expect((await handler(httpRequest(tutorRequest(stepAction("2x=14"), history)))).status).toBe(409);
    const body = await (await handler(httpRequest(tutorRequest(questionAction(), history)))).json();
    expect(body.state.phase).toBe("completed");
    expect(body.result).toBeNull();
  });
});

describe("best-effort process budget", () => {
  it("caps concurrent requests and allows each release only once", () => {
    const limit = createTutorLimit();
    const a = limit.acquire()!;
    const b = limit.acquire()!;
    expect(limit.acquire()).toBeNull();
    a(); a();
    const c = limit.acquire();
    expect(c).not.toBeNull();
    expect(limit.acquire()).toBeNull();
    b(); c!();
  });
  it("caps the minute budget and resets in the next window", () => {
    let time = 0;
    const limit = createTutorLimit(() => time);
    for (let n = 0; n < 30; n++) limit.acquire()!();
    expect(limit.acquire()).toBeNull();
    time = 60_001;
    expect(limit.acquire()).not.toBeNull();
  });
});
