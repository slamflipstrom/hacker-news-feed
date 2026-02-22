import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const MOCK_PORT = 8787;
const useLive = process.env.E2E_USE_LIVE === "1";

const appWebServer = {
  command: useLive
    ? `pnpm dev --host 127.0.0.1 --port ${PORT}`
    : `HN_API_BASE_URL=http://127.0.0.1:${MOCK_PORT}/api/v1 pnpm dev --host 127.0.0.1 --port ${PORT}`,
  port: PORT,
  reuseExistingServer: useLive ? !process.env.CI : false,
  timeout: 120_000,
};

const mockWebServer = {
  command: `node e2e/mocks/algolia-server.mjs --port ${MOCK_PORT}`,
  port: MOCK_PORT,
  reuseExistingServer: false,
  timeout: 120_000,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: useLive ? appWebServer : [mockWebServer, appWebServer],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
