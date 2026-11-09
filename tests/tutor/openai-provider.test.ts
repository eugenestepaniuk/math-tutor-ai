import { afterEach, describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import { openaiTutor } from "@/lib/tutor/openai-provider";
import { teachingContext } from "@/lib/tutor/policy";
import { TutorProviderError } from "@/lib/tutor/service";
import { fixtureReply, stepAction, tutorRequest } from "../fixtures/tutor";

const sdk = vi.hoisted(() => ({ parse: vi.fn(), constructor: vi.fn() }));
vi.mock("openai", () => {
  class APIError extends Error { constructor(public status: number) { super("fixture provider failure"); } }
  class APIConnectionTimeoutError extends Error {}
  class Client {
    static APIError = APIError;
    static APIConnectionTimeoutError = APIConnectionTimeoutError;
    responses = { parse: sdk.parse };
    constructor(options: unknown) { sdk.constructor(options); }
  }
  return { default: Client };
});
afterEach(() => { vi.unstubAllEnvs(); sdk.parse.mockReset(); sdk.constructor.mockReset(); });

describe("OpenAI SDK adapter (SDK mocked; no network)", () => {
  it("uses Responses Structured Outputs, bounded output and no provider storage/retries", async () => {
    vi.stubEnv("OPENAI_API_KEY", "fixture-key");
    vi.stubEnv("OPENAI_MODEL", "configured-model");
    const request = tutorRequest(stepAction("3x+4=2x+19"));
    const context = teachingContext(request);
    sdk.parse.mockResolvedValueOnce({ status: "completed", output_parsed: fixtureReply(context) });
    const signal = new AbortController().signal;
    await openaiTutor.generate(request, context, signal);
    expect(sdk.constructor).toHaveBeenCalledWith(expect.objectContaining({ timeout: 15000, maxRetries: 0, logLevel: "off", baseURL: "https://api.openai.com/v1" }));
    expect(sdk.parse).toHaveBeenCalledWith(expect.objectContaining({
      model: "configured-model", store: false, max_output_tokens: 1200,
      text: expect.objectContaining({ format: expect.objectContaining({ type: "json_schema", strict: true }) }),
    }), { signal });
    const input = sdk.parse.mock.calls[0]![0].input[0].content;
    expect(input).toContain("distribution");
    expect(input).not.toContain("canonicalSolution");
  });
  it("preserves the specified default model without silent fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "fixture-key");
    vi.stubEnv("OPENAI_MODEL", undefined);
    const request = tutorRequest(stepAction("3x+4=2x+19"));
    sdk.parse.mockResolvedValueOnce({ status: "completed", output_parsed: fixtureReply(teachingContext(request)) });
    await openaiTutor.generate(request, teachingContext(request), new AbortController().signal);
    expect(sdk.parse.mock.calls[0]![0].model).toBe("gpt-6-luna");
  });
  it("defaults to live calls disabled and never exposes the key in configuration", () => {
    vi.stubEnv("OPENAI_API_KEY", "fixture-key");
    vi.stubEnv("TUTOR_ENABLED", undefined);
    expect(openaiTutor.configuration()).toEqual({ enabled: false, configured: true });
    vi.stubEnv("TUTOR_ENABLED", "true");
    expect(openaiTutor.configuration()).toEqual({ enabled: true, configured: true });
  });
  it("handles incomplete/refused responses without creating fake tutor text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "fixture-key");
    const request = tutorRequest(stepAction("3x+4=2x+19"));
    sdk.parse.mockResolvedValueOnce({ status: "incomplete", output_parsed: null });
    await expect(openaiTutor.generate(request, teachingContext(request), new AbortController().signal)).rejects.toBeInstanceOf(TutorProviderError);
  });
  it("maps quota and credential errors to safe typed failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "fixture-key");
    const request = tutorRequest(stepAction("3x+4=2x+19"));
    for (const [status, code] of [[429, "provider_limit"], [401, "not_configured"]] as const) {
      sdk.parse.mockRejectedValueOnce(new OpenAI.APIError(status, undefined, "fixture", new Headers()));
      await expect(openaiTutor.generate(request, teachingContext(request), new AbortController().signal)).rejects.toMatchObject({ code });
    }
  });
});
