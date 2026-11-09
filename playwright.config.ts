import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000", channel: "chrome", headless: true,
    screenshot: "only-on-failure", trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 960 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000",
    reuseExistingServer: false, timeout: 30_000,
    env: { TUTOR_ENABLED: "false" },
  },
});
