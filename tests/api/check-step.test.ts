import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/check-step/route";

const request = (body: unknown, headers: Record<string, string> = {}) => new Request("http://localhost/api/check-step", {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});

describe("server-authoritative check endpoint", () => {
  it("detects the error and never sends the private canonical answer", async () => {
    const response = await POST(request({ acceptedSteps: [], equation: "3x+4=2x+19" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.json();
    expect(data.result).toMatchObject({ verdict: "incorrect", mistakeKind: "distribution", canAdvance: false });
    expect(data.result).not.toHaveProperty("canonicalSolution");
    expect(data.result.message).not.toMatch(/x\s*=\s*7|3x\s*\+\s*12/);
  });
  it("replays each accepted step and verifies completion", async () => {
    const response = await POST(request({ acceptedSteps: ["3x+12=2x+19", "x+12=19"], equation: "x=7" }));
    expect((await response.json()).result).toMatchObject({ verdict: "correct", mistakeKind: "none", isComplete: true });
  });
  it("rejects forged history and client correctness claims", async () => {
    expect((await POST(request({ acceptedSteps: ["3x+4=2x+19"], equation: "x=15" }))).status).toBe(409);
    expect((await POST(request({ acceptedSteps: [], equation: "x=15", correct: true }))).status).toBe(400);
  });
  it("rejects no-op history and additional steps after a final value", async () => {
    expect((await POST(request({ acceptedSteps: ["3(x+4)=2x+19"], equation: "x=7" }))).status).toBe(409);
    expect((await POST(request({ acceptedSteps: ["x=7"], equation: "2x=14" }))).status).toBe(409);
  });
  it("handles bad input without counting a misconception", async () => {
    const data = await (await POST(request({ acceptedSteps: [], equation: "3x +=19" }))).json();
    expect(data.result).toMatchObject({ parseStatus: "invalid", verdict: "uncertain", mistakeKind: "none" });
  });
  it("rejects huge bodies, long equations and excessive history", async () => {
    expect((await POST(request({ equation: "a".repeat(17000) }, { "Content-Length": "1" }))).status).toBe(413);
    expect((await POST(request({ acceptedSteps: [], equation: "x".repeat(257) }))).status).toBe(400);
    expect((await POST(request({ acceptedSteps: Array(49).fill("x=7"), equation: "x=7" }))).status).toBe(400);
  });
  it("bounds chunked input even without Content-Length", async () => {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(9000)); controller.enqueue(new Uint8Array(9000)); controller.close(); } });
    const req = new Request("http://localhost/api/check-step", { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
    expect((await POST(req)).status).toBe(413);
  });
  it("checks content type, origin and malformed JSON", async () => {
    expect((await POST(request({}, { "Content-Type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({}, { "Content-Type": "application/jsonp" }))).status).toBe(415);
    expect((await POST(request({}, { Origin: "https://other.example" }))).status).toBe(403);
    expect((await POST(new Request("http://localhost/api/check-step", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
  });
  it("accepts the same public Host when Next normalizes its internal URL", async () => {
    const body = { acceptedSteps: [], equation: "3x+4=2x+19" };
    const response = await POST(new Request("http://localhost:3000/api/check-step", {
      method: "POST", headers: { "Content-Type": "application/json", Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" }, body: JSON.stringify(body),
    }));
    expect(response.status).toBe(200);
    expect((await response.json()).result.mistakeKind).toBe("distribution");
    expect((await POST(request(body, { Host: "localhost", Origin: "http://other.example" }))).status).toBe(403);
    expect((await POST(request(body, { Host: "localhost", Origin: "https://localhost" }))).status).toBe(403);
  });
});
