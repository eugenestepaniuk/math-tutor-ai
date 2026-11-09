import type { Page } from "@playwright/test";
import { createTutorHandler, TutorProviderError } from "../../src/lib/tutor/service";
import { fixtureReply } from "./tutor";

export async function mockTutor(page: Page, failQuestionOnce = false) {
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

