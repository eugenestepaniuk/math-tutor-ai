// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { HomeDashboard } from "@/components/learning/home-dashboard";
import { CurriculumView } from "@/components/learning/curriculum-view";
import { StudySessionProvider } from "@/components/study/study-session";
import { emptySession, STORAGE_KEY, type LearningData } from "@/lib/learning/storage";
import { populatedLearning } from "../fixtures/learning";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ enabled: false, configured: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function mount(children: ReactNode, data?: LearningData) {
  if (data) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return render(<StudySessionProvider><div onClick={event => event.preventDefault()}>{children}</div></StudySessionProvider>);
}
async function metric(label: string, value: string) {
  await waitFor(() => expect(within(screen.getByRole("region", { name: label })).getByText(value, { exact: true })).toBeVisible());
}

describe("real-data Home and Curriculum", () => {
  it("starts with genuine zero history and working destinations without generating activity", async () => {
    mount(<HomeDashboard />);
    await metric("Completed exercises", "0"); await metric("Checked attempts", "0");
    expect(screen.getByText("No learning history yet. Your checked steps will build a record here.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Continue learning" })).toHaveAttribute("href", "/study");
    expect(screen.getByRole("link", { name: "Explore practice" })).toHaveAttribute("href", "/practice");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).practice).toBeNull();
    expect(vi.mocked(fetch).mock.calls.every((call: unknown[]) => !((call[1] as RequestInit | undefined)?.method === "POST"))).toBe(true);
  });
  it("shows actual stored totals, current equation and mistake context", async () => {
    mount(<HomeDashboard />, populatedLearning());
    await metric("Completed exercises", "1"); await metric("Checked attempts", "5"); await metric("Corrected reasoning errors", "1");
    expect(screen.getByText("3 accepted steps", { exact: true })).toBeVisible();
    expect(screen.getByText("Your checked final value")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open practice" })).toHaveAttribute("href", "/practice");
    expect(within(screen.getByRole("region", { name: "Recent reasoning" })).getByText("Last idea to revisit: Distributive property.")).toBeVisible();
  });
  it("starts an offered related problem only on click without fabricating an attempt", async () => {
    const data = populatedLearning(); data.practice = null;
    const user = userEvent.setup(); mount(<HomeDashboard />, data);
    const link = await screen.findByRole("link", { name: "Try related practice" });
    await user.click(link);
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).practice?.problem).toEqual(data.related!.problem));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).events).toEqual(data.events);
    await metric("Checked attempts", "5");
  });
  it("makes only the implemented lesson launchable and future topics noninteractive", async () => {
    mount(<CurriculumView />);
    await screen.findByText("Ready to start", { exact: true });
    expect(screen.getByRole("link", { name: "Open lesson" })).toHaveAttribute("href", "/study");
    expect(screen.getByRole("progressbar", { name: "Available lesson completion" })).toHaveValue(0);
    const topics = screen.getByRole("list", { name: "Coming later topics" });
    expect(within(topics).getAllByText("Coming later", { exact: true })).toHaveLength(3);
    expect(within(topics).queryByRole("link")).toBeNull(); expect(within(topics).queryByRole("button")).toBeNull();
  });
  it("keeps verified lesson completion after the current solution is reset", async () => {
    const data = populatedLearning(); data.study = emptySession();
    mount(<CurriculumView />, data);
    await screen.findByText("Final value verified");
    expect(screen.getByRole("progressbar", { name: "Available lesson completion" })).toHaveValue(1);
    expect(screen.getByRole("link", { name: "Revisit lesson" })).toHaveAttribute("href", "/study");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).study.history).toEqual([]);
  });
});
