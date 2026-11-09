// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { StudySessionProvider } from "@/components/study/study-session";
import { StudyWorkspace } from "@/components/study/study-workspace";
import { PracticeView } from "@/components/learning/practice-view";
import { ProgressView } from "@/components/learning/progress-view";
import { StorageNotice, useLearning } from "@/components/learning/learning-provider";
import { POST } from "@/app/api/check-step/route";
import { STORAGE_KEY } from "@/lib/learning/storage";
import { resolveProblem } from "@/lib/practice/problems";
import { solveEquation } from "@/lib/math/linear";
import { parseEquation } from "@/lib/math/parser";

function Pages() {
  const learning = useLearning();
  const [page, setPage] = useState("study");
  return <><StorageNotice /><button onClick={() => setPage("study")}>Open study</button><button onClick={() => setPage("progress")}>Open progress</button><button onClick={() => { learning.startPractice(true); setPage("practice"); }}>Open related practice</button>{page === "study" ? <StudyWorkspace /> : page === "practice" ? <PracticeView /> : <ProgressView />}</>;
}
beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init?: RequestInit) => String(url) === "/api/tutor" ? Response.json({ enabled: false, configured: false }) : POST(new Request("http://localhost/api/check-step", init))));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const mount = () => render(<StudySessionProvider><Pages /></StudySessionProvider>);

describe("persistent learning flow without an AI provider", () => {
  it("surfaces practice on correction, completes a generated follow-up, restores and resets", async () => {
    const user = userEvent.setup(); let view = mount();
    const input = screen.getByLabelText("Your next step");
    await waitFor(() => expect(input).toBeEnabled());
    await user.type(input, "3x+4=2x+19{Enter}"); await screen.findByRole("heading", { name: "Look at the distribution" });
    expect(screen.queryByRole("link", { name: "Try related practice" })).toBeNull();
    await user.clear(input); await user.type(input, "3x+12=2x+19{Enter}");
    await screen.findByRole("link", { name: "Try related practice" });
    await user.type(input, "x=7{Enter}"); await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 });
    await user.click(screen.getByRole("button", { name: "Open related practice" }));
    const practiceInput = await screen.findByLabelText("Your next step");
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    const problem = resolveProblem(saved.practice.problem);
    const answer = solveEquation(parseEquation(problem.equation));
    if (answer.kind !== "unique") throw new Error("Invalid generated problem");
    await user.type(practiceInput, `${problem.variable}=${answer.value.numerator}{Enter}`);
    await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 });
    await user.click(screen.getByRole("button", { name: "Open progress" }));
    expect(within(screen.getByRole("region", { name: "Completed exercises" })).getByText("2")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Follow-up accuracy" })).getByText("100%")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Corrected reasoning errors" })).getByText("1")).toBeVisible();
    view.unmount(); view = mount();
    await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 });
    expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "Open progress" }));
    await user.click(screen.getByRole("button", { name: "Clear saved history" }));
    expect(screen.getByText("Clear all saved learning history?")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Completed exercises" })).getByText("2")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear everything" }));
    expect(await screen.findByRole("heading", { name: "No learning history yet." })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Open study" }));
    expect(screen.getByText("0 accepted steps")).toBeVisible();
  });
  it("restores an unfinished draft and accepted steps without resubmitting", async () => {
    const user = userEvent.setup(); const view = mount();
    const input = screen.getByLabelText("Your next step"); await waitFor(() => expect(input).toBeEnabled());
    await user.type(input, "3x+12=2x+19{Enter}"); await screen.findByText("1 accepted step", { exact: true });
    await user.type(input, "x+12="); view.unmount(); mount();
    await waitFor(() => expect(screen.getByLabelText("Your next step")).toHaveValue("x+12="));
    expect(screen.getByText("1 accepted step", { exact: true })).toBeVisible();
    expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });
  it("keeps unknown-version data intact until an explicit confirmed reset", async () => {
    const original = JSON.stringify({ version: 42, data: "keep" }); window.localStorage.setItem(STORAGE_KEY, original);
    const user = userEvent.setup(); mount();
    expect(await screen.findByRole("status")).toHaveTextContent("original data has been kept");
    const input = screen.getByLabelText("Your next step"); await user.type(input, "x=7");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(original);
    await user.click(screen.getByRole("button", { name: "Open progress" }));
    await user.click(screen.getByRole("button", { name: "Clear saved history" }));
    await user.click(screen.getByRole("button", { name: "Clear everything" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).version).toBe(1));
  });
});
