// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/check-step/route";
import { StudyWorkspace } from "@/components/study/study-workspace";
import { StudySessionProvider } from "@/components/study/study-session";

function mount() { return render(<StudySessionProvider><StudyWorkspace /></StudySessionProvider>); }
const serverTransport = async (url: unknown, init?: RequestInit) => String(url) === "/api/tutor"
  ? Response.json({ enabled: false, configured: false })
  : POST(new Request("http://localhost/api/check-step", init));
const postCalls = () => vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST");

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(serverTransport));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Study interaction with real verifier and an in-process API transport", () => {
  it("fills the sample without submitting, then corrects and solves with Enter", async () => {
    const user = userEvent.setup(); mount();
    const input = screen.getByLabelText("Your next step");
    await user.click(screen.getByRole("button", { name: /Try sample mistake/ }));
    expect(input).toHaveValue("3x + 4 = 2x + 19");
    expect(postCalls()).toHaveLength(0);
    await user.keyboard("{Enter}");
    await screen.findByRole("heading", { name: "Look at the distribution" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("0 accepted steps")).toBeVisible();
    for (const [index, equation] of ["3x+12=2x+19", "x+12=19", "x=7"].entries()) {
      await user.clear(input); await user.type(input, equation); await user.keyboard("{Enter}");
      await screen.findByText(`${index + 1} accepted ${index === 0 ? "step" : "steps"}`);
    }
    expect(await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 })).toBeVisible();
    expect(screen.getByText("3 accepted steps")).toBeVisible();
    expect(screen.getByText("AI unavailable", { exact: true })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Try again/ }));
    expect(screen.getByLabelText("Your next step")).toHaveValue("");
    await waitFor(() => expect(screen.getByLabelText("Your next step")).toHaveFocus());
    expect(screen.getByText("0 accepted steps")).toBeVisible();
  });
  it("supports keypad insertion at the cursor and a clearly labeled rule reminder", async () => {
    const user = userEvent.setup(); mount();
    const input = screen.getByLabelText<HTMLInputElement>("Your next step");
    await waitFor(() => expect(input).toBeEnabled());
    await user.type(input, "3x"); input.setSelectionRange(1, 1);
    await user.click(screen.getByRole("button", { name: "Insert plus" }));
    await waitFor(() => expect(input).toHaveValue("3+x"));
    await user.click(screen.getByRole("button", { name: "Delete previous character" }));
    await waitFor(() => expect(input).toHaveValue("3x"));
    await user.click(screen.getByRole("button", { name: "Review the rule" }));
    expect(screen.getByRole("button", { name: "Hide rule reminder" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Rule reminder · not an AI-generated hint")).toBeVisible();
  });
  it("preserves the draft on a network error and allows retry", async () => {
    let failed = false;
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      if (init?.method === "POST" && !failed) { failed = true; throw new Error("offline"); }
      return serverTransport(url, init);
    });
    const user = userEvent.setup(); mount();
    const input = screen.getByLabelText("Your next step");
    await waitFor(() => expect(input).toBeEnabled());
    await user.type(input, "x=7{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("checker is unavailable");
    expect(input).toHaveValue("x=7");
    await user.click(screen.getByRole("button", { name: "Check My Step" }));
    expect(await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 })).toBeVisible();
  });
  it("blocks duplicate requests while a response is pending", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation((url, init) => init?.method === "POST"
      ? new Promise<Response>(done => { resolve = done; }) : serverTransport(url, init));
    const user = userEvent.setup(); mount();
    await waitFor(() => expect(screen.getByLabelText("Your next step")).toBeEnabled());
    await user.type(screen.getByLabelText("Your next step"), "x=7");
    const button = screen.getByRole("button", { name: "Check My Step" });
    await user.dblClick(button);
    expect(postCalls()).toHaveLength(1);
    expect(button).toBeDisabled();
    resolve(await POST(new Request("http://localhost/api/check-step", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acceptedSteps: [], equation: "x=7" }) })));
    await screen.findByRole("heading", { name: "Nice work. Equation solved!", level: 3 });
  });
});
