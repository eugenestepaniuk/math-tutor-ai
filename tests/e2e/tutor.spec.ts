import { expect, test, type Page } from "@playwright/test";
import { createTutorHandler, TutorProviderError } from "../../src/lib/tutor/service";
import { fixtureReply } from "../fixtures/tutor";

async function mockTutor(page: Page, failQuestionOnce = false) {
  let failed = false;
  const handler = createTutorHandler({
    configuration: () => ({ enabled: true, configured: true }),
    async generate(request, context) {
      if (failQuestionOnce && !failed && request.action.kind === "ask_question") {
        failed = true;
        throw new TutorProviderError("timeout");
      }
      return fixtureReply(context);
    },
  });
  // Browser tests intercept the provider boundary; no OpenAI request can occur.
  await page.route("**/api/tutor", async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { enabled: true, configured: true } });
      return;
    }
    const response = await handler(new Request("http://127.0.0.1:3000/api/tutor", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: route.request().postData(),
    }));
    await route.fulfill({ status: response.status, contentType: "application/json", body: await response.text() });
  });
}

test("mock-provider conversation, progressive hints and verified correction", async ({ page }) => {
  await mockTutor(page);
  await page.goto("/study");
  await expect(page.getByText("Not connected yet", { exact: true })).toBeVisible();
  const input = page.getByLabel("Your next step");
  await input.fill("3x+4=2x+19"); await input.press("Enter");
  await expect(page.getByText("Which terms receive the outside factor?", { exact: true })).toBeVisible();
  await expect(page.getByText("Checked example", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Use the distributive property to apply the outside factor to each term.", { exact: true })).toBeVisible();
  await expect(page.getByText("Checked example", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Checked example", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Show worked step" }).click();
  await expect(page.getByRole("button", { name: "Hint limit reached" })).toBeDisabled();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.evaluate(() => document.documentElement.clientWidth));
  await input.fill("3x+12=2x+19"); await input.press("Enter");
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hint", exact: true })).toBeEnabled();
  await input.fill("x+12=19");
  const question = page.getByLabel("Ask your tutor");
  await question.fill("Can you explain keeping both sides balanced?"); await question.press("Enter");
  await expect(question).toHaveValue("");
  await expect(input).toHaveValue("x+12=19");
  await expect(page.getByText("1 accepted step", { exact: true })).toBeVisible();
});

test("mock-provider failure preserves chat and retries without duplicates", async ({ page }) => {
  await mockTutor(page, true);
  await page.goto("/study");
  await expect(page.getByText("Not connected yet", { exact: true })).toBeVisible();
  const question = page.getByLabel("Ask your tutor");
  await question.fill("Explain the bracket rule."); await question.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "took too long" })).toBeVisible();
  await expect(question).toHaveValue("Explain the bracket rule.");
  await page.getByRole("button", { name: "Retry AI guidance" }).click();
  await expect(question).toHaveValue("");
  await expect(page.getByRole("log").getByText("Explain the bracket rule.", { exact: true })).toHaveCount(1);
  await expect(page.getByText("0 accepted steps", { exact: true })).toBeVisible();
});
