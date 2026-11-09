import { expect, test, type Page } from "@playwright/test";
import { populatedLearning } from "../fixtures/learning";
import { STORAGE_KEY } from "../../src/lib/learning/storage";

const navigation = (page: Page) => page.locator('nav[aria-label="Main navigation"]:visible, nav[aria-label="Mobile navigation"]:visible');

test("fresh Home and Curriculum resume a draft without inventing progress", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Completed exercises", exact: true }).getByText("0", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Continue learning", exact: true }).click();
  const input = page.getByLabel("Your next step");
  await input.fill("x+12=");
  await navigation(page).getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "Continue learning", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(input).toHaveValue("x+12=");
  await navigation(page).getByRole("link", { name: "Curriculum", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Available lesson completion" })).toHaveJSProperty("value", 0);
  await expect(page.getByText("In progress", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Coming later topics" }).getByRole("link")).toHaveCount(0);
  await page.getByRole("link", { name: "Open lesson", exact: true }).click();
  await expect(input).toHaveValue("x+12="); await page.reload(); await expect(input).toHaveValue("x+12=");
  expect(posts).toEqual([]);
});

test("saved Home and Curriculum reflect checked history and preserve active practice", async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    if (location.origin === "http://127.0.0.1:3000") localStorage.setItem(key, JSON.stringify(data));
  }, { key: STORAGE_KEY, data: populatedLearning() });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Completed exercises", exact: true }).getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Checked attempts", exact: true }).getByText("5", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open practice", exact: true }).click();
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
  await navigation(page).getByRole("link", { name: "Curriculum", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Available lesson completion" })).toHaveJSProperty("value", 1);
  await expect(page.getByText("Final value verified", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Revisit lesson", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nice work. Equation solved!", exact: true }).first()).toBeVisible();
});
