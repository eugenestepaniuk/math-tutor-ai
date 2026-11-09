import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { groqTutor } from "@/lib/tutor/groq-provider";
import { tutorConfiguration, tutorProvider } from "@/lib/tutor/provider";
import { GET } from "@/app/api/tutor/route";
import { teachingContext } from "@/lib/tutor/policy";
import { fixtureReply, hintAction, stepAction, tutorRequest } from "../fixtures/tutor";

const request = () => tutorRequest(stepAction("3x+4=2x+19"));
const signal = () => new AbortController().signal;
const network = vi.fn();

beforeEach(() => {
  for (const name of ["TUTOR_PROVIDER", "GROQ_MODEL", "TUTOR_ALLOW_PAID"]) vi.stubEnv(name, undefined);
  vi.stubEnv("TUTOR_ENABLED", "true");
  vi.stubEnv("GROQ_API_KEY", "fixture-groq-key");
  vi.stubEnv("GROQ_FREE_TIER_CONFIRMED", "true");
  vi.stubEnv("OPENAI_API_KEY", "fixture-openai-key");
  vi.stubGlobal("fetch", network);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); network.mockReset(); });

function modelResponse(value: unknown) {
  return Response.json({
    id: "resp_fixture", object: "response", created_at: 0, status: "completed",
    output: [{ id: "msg_fixture", type: "message", role: "assistant", status: "completed",
      content: [{ type: "output_text", text: JSON.stringify(value), annotations: [] }],
    }],
  });
}

describe("Groq transport with the real SDK and a fake HTTP boundary", () => {
  it("uses the fixed Groq endpoint/key and strict schema without unsupported store or retries", async () => {
    const data = request();
    const context = teachingContext(data);
    network.mockResolvedValueOnce(modelResponse(fixtureReply(context)));
    expect(await tutorProvider.generate(data, context, signal())).toEqual(fixtureReply(context));
    expect(network).toHaveBeenCalledTimes(1);
    const [url, init] = network.mock.calls[0]!;
    expect(String(url)).toBe("https://api.groq.com/openai/v1/responses");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer fixture-groq-key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      model: "openai/gpt-oss-120b", reasoning: { effort: "low" }, max_output_tokens: 1200,
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(body).not.toHaveProperty("store");
    expect(body).not.toHaveProperty("tools");
    expect(body.input[0].content).toContain("distribution");
    expect(body.input[0].content).not.toContain("canonicalSolution");
    expect(body.text.format.schema.properties.hintLevel).toMatchObject({ const: 0 });
    expect(body.text.format.schema.properties.mathFocus).toMatchObject({ const: "none" });
  });

  it("accepts an explicitly configured supported Groq model", async () => {
    vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-20b");
    const data = request();
    network.mockResolvedValueOnce(modelResponse(fixtureReply(teachingContext(data))));
    await tutorProvider.generate(data, teachingContext(data), signal());
    expect(JSON.parse(network.mock.calls[0]![1].body).model).toBe("openai/gpt-oss-20b");
  });

  it("constrains hint metadata to server facts when a checked example becomes available", async () => {
    const data = tutorRequest(hintAction(), [stepAction("3x+4=2x+19"), hintAction()]);
    const context = teachingContext(data);
    expect(context.state.hintLevel).toBe(2);
    network.mockResolvedValueOnce(modelResponse(fixtureReply(context)));
    await tutorProvider.generate(data, context, signal());
    const schema = JSON.parse(network.mock.calls[0]![1].body).text.format.schema;
    expect(schema.properties.hintLevel).toMatchObject({ const: 2 });
    expect(schema.properties.mathFocus).toMatchObject({ const: "worked_example" });
    expect(schema.properties.suggestedNextAction).toMatchObject({ const: "retry_step" });
  });

  it.each([[429, "provider_limit"], [401, "not_configured"], [500, "provider_error"]])(
    "normalizes HTTP %i, never retries or falls back to paid OpenAI", async (status, code) => {
      network.mockResolvedValueOnce(Response.json({ error: { message: "private upstream details" } }, { status }));
      const data = request();
      await expect(tutorProvider.generate(data, teachingContext(data), signal())).rejects.toMatchObject({ code });
      expect(network).toHaveBeenCalledTimes(1);
      expect(String(network.mock.calls[0]![0])).toContain("api.groq.com");
    },
  );

  it("rejects incomplete/refused and malformed replies instead of making up guidance", async () => {
    const data = request();
    for (const response of [
      Response.json({ status: "incomplete", output: [] }),
      modelResponse({ message: "Missing the teaching contract" }),
    ]) {
      network.mockResolvedValueOnce(response);
      await expect(tutorProvider.generate(data, teachingContext(data), signal())).rejects.toMatchObject({ code: "provider_error" });
    }
  });
});

describe("server-owned provider and zero-spend defaults", () => {
  it("defaults to Groq even when a legacy OpenAI key and enabled flag exist", async () => {
    expect(tutorConfiguration()).toEqual({ enabled: true, configured: true, provider: "groq", model: "openai/gpt-oss-120b", freeTierConfirmed: true, paidAllowed: false });
    const configuration = await (await GET()).json();
    expect(configuration).toEqual(tutorConfiguration());
    expect(JSON.stringify(configuration)).not.toMatch(/fixture-|API_KEY|gsk-|sk-/);
    expect(network).not.toHaveBeenCalled();
  });

  it.each([
    ["GROQ_FREE_TIER_CONFIRMED", undefined, "disabled"],
    ["TUTOR_ENABLED", "false", "disabled"],
    ["GROQ_API_KEY", "", "not_configured"],
    ["GROQ_MODEL", "unknown-model", "not_configured"],
    ["TUTOR_PROVIDER", "https://untrusted.example", "not_configured"],
  ])("fails closed for %s=%s without a network request", async (name, value, code) => {
    vi.stubEnv(name, value);
    const data = request();
    await expect(tutorProvider.generate(data, teachingContext(data), signal())).rejects.toMatchObject({ code });
    expect(network).not.toHaveBeenCalled();
  });

  it("blocks explicitly selected OpenAI unless paid calls are separately allowed", async () => {
    vi.stubEnv("TUTOR_PROVIDER", "openai");
    expect(tutorConfiguration()).toMatchObject({ provider: "openai", enabled: false, configured: true, paidAllowed: false });
    const data = request();
    await expect(tutorProvider.generate(data, teachingContext(data), signal())).rejects.toMatchObject({ code: "disabled" });
    expect(network).not.toHaveBeenCalled();
    vi.stubEnv("TUTOR_ALLOW_PAID", "true");
    expect(tutorConfiguration()).toMatchObject({ enabled: true, paidAllowed: true, freeTierConfirmed: false });
  });

  it("never enables a default Groq account merely because paid access is allowed", () => {
    vi.stubEnv("GROQ_FREE_TIER_CONFIRMED", undefined);
    vi.stubEnv("TUTOR_ALLOW_PAID", "true");
    expect(tutorConfiguration()).toMatchObject({ provider: "groq", enabled: false, paidAllowed: false });
    expect(groqTutor.configuration().enabled).toBe(false);
  });
});
