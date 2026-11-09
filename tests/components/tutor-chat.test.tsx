// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as checkStep } from "@/app/api/check-step/route";
import { createTutorHandler, TutorProviderError } from "@/lib/tutor/service";
import type { TeachingContext } from "@/lib/tutor/policy";
import type { TutorRequest } from "@/lib/tutor/contracts";
import { StudyWorkspace } from "@/components/study/study-workspace";
import { StudySessionProvider } from "@/components/study/study-session";
import { fixtureReply } from "../fixtures/tutor";
import { learningStats } from "@/lib/learning/events";
import { STORAGE_KEY } from "@/lib/learning/storage";

const generate = vi.fn(async (_request: TutorRequest, context: TeachingContext) => fixtureReply(context));
beforeEach(() => {
  window.localStorage.clear();
  generate.mockReset();
  generate.mockImplementation(async (_request, context) => fixtureReply(context));
  const tutor = createTutorHandler({ configuration: () => ({ enabled: true, configured: true }), generate });
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init?: RequestInit) => {
    if (String(url) === "/api/tutor" && init?.method !== "POST") return Response.json({ enabled: true, configured: true });
    const request = new Request("http://localhost" + url, init);
    return String(url) === "/api/tutor" ? tutor(request) : checkStep(request);
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const mount = () => render(<StudySessionProvider><StudyWorkspace /></StudySessionProvider>);

describe("Tutor UI using mock providers and the real teaching service", () => {
  it("shows a question first and progressively reveals only checked examples", async () => {
    const user = userEvent.setup(); mount();
    await screen.findByText("Not connected yet");
    await user.click(screen.getByRole("button", { name: /Try sample mistake/ }));
    await user.keyboard("{Enter}");
    await screen.findByText("Which terms receive the outside factor?");
    expect(screen.queryByText("Checked example")).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Hint$/ }));
    await screen.findByText("Use the distributive property to apply the outside factor to each term.");
    expect(screen.queryByText("Checked example")).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Hint$/ }));
    await screen.findByText("Checked example");
    expect(generate.mock.calls.at(-1)![1].state.hintLevel).toBe(2);
    await user.click(screen.getByRole("button", { name: "Show worked step" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Hint limit reached" })).toBeDisabled());
    expect(generate.mock.calls.at(-1)![1].state.hintLevel).toBe(3);
    expect(learningStats(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).events).hints).toBe(3);
  });
  it("answers chat without changing the math draft or counting an algebra attempt", async () => {
    const user = userEvent.setup(); mount();
    await screen.findByText("Not connected yet");
    const math = screen.getByLabelText("Your next step");
    const question = screen.getByLabelText("Ask your tutor");
    await user.type(math, "3x+4=2x+19");
    await user.type(question, "Why must I multiply both terms?{Enter}");
    await waitFor(() => expect(question).toHaveValue(""));
    expect(math).toHaveValue("3x+4=2x+19");
    expect(screen.getByText("0 accepted steps")).toBeVisible();
    expect(generate.mock.calls[0]![1].recentAttempts).toHaveLength(0);
  });
  it("preserves a failed chat draft and retries without duplicating the student message", async () => {
    generate.mockRejectedValueOnce(new TutorProviderError("timeout"));
    const user = userEvent.setup(); mount();
    await screen.findByText("Not connected yet");
    const question = screen.getByLabelText("Ask your tutor");
    await user.type(question, "Explain the bracket rule.{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("took too long");
    expect(question).toHaveValue("Explain the bracket rule.");
    await user.click(screen.getByRole("button", { name: "Retry AI guidance" }));
    await waitFor(() => expect(question).toHaveValue(""));
    expect(within(screen.getByRole("log")).getAllByText("Explain the bracket rule.")).toHaveLength(1);
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("keeps a valid math step accepted when model prose is rejected", async () => {
    generate.mockImplementationOnce(async (_request, context) => ({ ...fixtureReply(context), message: "That step is wrong." }));
    const user = userEvent.setup(); mount();
    await screen.findByText("Not connected yet");
    const math = screen.getByLabelText("Your next step");
    await user.type(math, "3x+12=2x+19{Enter}");
    await screen.findByText("Verified guidance");
    expect(screen.getByText("1 accepted step", { exact: true })).toBeVisible();
    expect(math).toHaveValue("3x+12=2x+19");
    await user.click(screen.getByRole("button", { name: "Retry AI guidance" }));
    await waitFor(() => expect(math).toHaveValue(""));
    expect(screen.getByText("1 accepted step", { exact: true })).toBeVisible();
    expect(learningStats(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).events).attempts).toBe(1);
  });
  it("does not count an unavailable hint and records its successful retry once", async () => {
    generate.mockRejectedValueOnce(new TutorProviderError("timeout"));
    const user = userEvent.setup(); mount(); await screen.findByText("Not connected yet");
    await user.click(screen.getByRole("button", { name: /^Hint$/ }));
    await screen.findByRole("alert");
    let saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(saved.study.history.filter((action: { kind: string }) => action.kind === "request_hint")).toHaveLength(0);
    expect(learningStats(saved.events).hints).toBe(0);
    await user.click(screen.getByRole("button", { name: "Retry AI guidance" }));
    await screen.findByText("Use the distributive property to apply the outside factor to each term.");
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(saved.study.history.filter((action: { kind: string }) => action.kind === "request_hint")).toHaveLength(1);
    expect(learningStats(saved.events)).toMatchObject({ hints: 1, attempts: 0 });
  });
});
