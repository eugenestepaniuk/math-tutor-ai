import { expect, test } from "@playwright/test";

test("mistake, correction, alternative steps, navigation and completion", async ({ page }) => {
  await page.goto("/study");
  const input = page.getByLabel("Your next step");
  await page.getByRole("button", { name: /Try sample mistake/ }).click();
  await expect(input).toHaveValue("3x + 4 = 2x + 19");
  await expect(page.getByText("0 accepted steps")).toBeVisible();
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Look at the distribution" })).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Review the rule" }).click();
  await expect(page.getByText("Rule reminder · not an AI-generated hint")).toBeVisible();
  await input.fill("3x+12=2x+19"); await input.press("Enter");
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
  const nav = page.locator("nav:visible").filter({ has: page.getByRole("link", { name: "Home", exact: true }) });
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "View study workspace", exact: true }).click();
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
  for (const equation of ["3x-2x=19-12", "x=7"]) {
    await input.fill(equation); await input.press("Enter");
    await expect(input).toHaveCount(equation === "x=7" ? 0 : 1);
    if (equation !== "x=7") await expect(input).toHaveValue("");
  }
  await expect(page.getByRole("heading", { name: "Nice work. Equation solved!", exact: true }).first()).toBeVisible();
  await expect(page.getByText("3 accepted steps")).toBeVisible();
  await expect(page.getByText("AI integration pending")).toBeVisible();
  await page.getByRole("button", { name: /Try again/ }).click();
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(page.getByText("0 accepted steps")).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.evaluate(() => document.documentElement.clientWidth));
});

test("API failure keeps the draft and a keyboard retry succeeds", async ({ page }) => {
  await page.goto("/study");
  const input = page.getByLabel("Your next step");
  await page.route("**/api/check-step", route => route.abort());
  await input.fill("x=7"); await input.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "checker is unavailable" })).toBeVisible();
  await expect(input).toHaveValue("x=7");
  await page.unroute("**/api/check-step");
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Nice work. Equation solved!", exact: true }).first()).toBeVisible();
});
