import { expect, test, type Page } from "@playwright/test";
import { mockTutor } from "../fixtures/browser-tutor";
import { parseEquation } from "../../src/lib/math/parser";
import { reduceExpression, solveEquation } from "../../src/lib/math/linear";
import { formatRational } from "../../src/lib/math/rational";
import { populatedLearning } from "../fixtures/learning";
import { STORAGE_KEY } from "../../src/lib/learning/storage";

async function metric(page: Page, label: string, value: string) {
  await expect(page.getByRole("region", { name: label, exact: true }).getByText(value, { exact: true })).toBeVisible();
}

test("mock-provider reference flow transfers the concept and persists real progress", async ({ page }) => {
  await mockTutor(page);
  await page.goto("/progress");
  await metric(page, "Completed exercises", "0"); await metric(page, "Attempts", "0");
  await expect(page.getByText("No learning history yet.")).toBeVisible();
  await page.goto("/study");
  const input = page.getByLabel("Your next step");
  await input.fill("3x+4=2x+19"); await input.press("Enter");
  await expect(page.getByText("Which terms receive the outside factor?", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try related practice" })).toHaveCount(0);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Use the distributive property to apply the outside factor to each term.", { exact: true })).toBeVisible();
  await input.fill("3x+12=2x+19"); await input.press("Enter");
  await expect(page.getByRole("link", { name: "Try related practice" })).toBeEnabled();
  await expect(input).toHaveValue("");
  await input.fill("x+12="); await page.reload();
  await expect(input).toHaveValue("x+12=");
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
  await input.fill("x=7"); await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Nice work. Equation solved!", exact: true }).first()).toBeVisible();
  const related = page.getByRole("link", { name: "Try related practice" });
  await expect(related).toBeEnabled(); await related.click();
  await expect(page).toHaveURL(/\/practice$/);
  const original = await page.getByLabel("Original problem", { exact: true }).locator(".math-text").getAttribute("aria-label");
  expect(original).toBeTruthy(); expect(original).not.toBe("3(x + 4) = 2x + 19");
  const equation = parseEquation(original!);
  const left = reduceExpression(equation.left); const right = reduceExpression(equation.right);
  const expansion = `${formatRational(left.coefficient)}*${equation.variable}+(${formatRational(left.constant)})=${formatRational(right.coefficient)}*${equation.variable}+(${formatRational(right.constant)})`;
  await input.fill(expansion); await input.press("Enter");
  await expect(input).toHaveValue("");
  const solution = solveEquation(equation);
  if (solution.kind !== "unique") throw new Error("Generated equation is not uniquely solvable");
  await input.fill(`${equation.variable}=${formatRational(solution.value)}`); await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Nice work. Equation solved!", exact: true }).first()).toBeVisible();
  await page.goto("/progress");
  await metric(page, "Completed exercises", "2"); await metric(page, "Attempts", "5");
  await metric(page, "Corrected reasoning errors", "1"); await metric(page, "Follow-up accuracy", "100%");
  await page.reload();
  await metric(page, "Completed exercises", "2"); await metric(page, "Attempts", "5");
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.evaluate(() => document.documentElement.clientWidth));
});

test("practice generation varies, retains drafts and resets only after confirmation", async ({ page }) => {
  await page.goto("/practice");
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  const original = page.getByLabel("Original problem", { exact: true }).locator(".math-text");
  const first = await original.getAttribute("aria-label");
  const input = page.getByLabel("Your next step");
  await input.fill("unfinished draft"); await page.reload();
  await expect(input).toHaveValue("unfinished draft");
  await expect(original).toHaveAttribute("aria-label", first!);
  await page.getByRole("button", { name: "Generate another", exact: true }).click();
  await expect(page.getByText("Leave this unfinished equation?")).toBeVisible();
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  await expect(input).toHaveValue("unfinished draft");
  await page.getByRole("button", { name: "Generate another", exact: true }).click();
  await page.getByRole("button", { name: "Generate another", exact: true }).click();
  await expect(original).not.toHaveAttribute("aria-label", first!);
  await expect(input).toHaveValue("");
  await page.goto("/progress"); await metric(page, "Attempts", "0");
  await page.getByRole("button", { name: "Clear saved history", exact: true }).click();
  await page.getByRole("button", { name: "Keep my history", exact: true }).click();
  await page.goto("/practice"); await expect(input).toBeVisible();
  await page.goto("/progress");
  await page.getByRole("button", { name: "Clear saved history", exact: true }).click();
  await page.getByRole("button", { name: "Clear everything", exact: true }).click();
  await page.reload(); await metric(page, "Completed exercises", "0");
  await page.goto("/practice"); await expect(page.getByRole("button", { name: "Start practice", exact: true })).toBeVisible();
});

test("populated learning views stay responsive without submitting or calling AI", async ({ page }, info) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.addInitScript(({ key, data }) => {
    if (location.origin === "http://127.0.0.1:3000") localStorage.setItem(key, JSON.stringify(data));
  }, { key: STORAGE_KEY, data: populatedLearning() });
  const widths = info.project.name === "desktop" ? [1440, 1024, 360, 375] : info.project.name === "tablet" ? [768] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const path of ["home", "study", "practice", "progress", "curriculum"]) {
      await page.goto(path === "home" ? "/" : `/${path}`);
      if (path === "home") await metric(page, "Checked attempts", "5");
      if (path === "study") await expect(page.getByRole("link", { name: "Try related practice" })).toBeVisible();
      if (path === "practice") await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
      if (path === "progress") { await metric(page, "Completed exercises", "1"); await metric(page, "Attempts", "5"); }
      if (path === "curriculum") await expect(page.getByRole("progressbar", { name: "Available lesson completion" })).toHaveJSProperty("value", 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (width <= 1024) expect(await page.locator("input:visible, textarea:visible").evaluateAll(nodes => nodes.filter(node => Number.parseFloat(getComputedStyle(node).fontSize) < 16).length)).toBe(0);
      await page.screenshot({ path: info.outputPath(`populated-${path}-${width}.png`), fullPage: true });
    }
  }
  expect(posts).toEqual([]);
});
