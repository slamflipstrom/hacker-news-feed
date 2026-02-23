import { expect, test, type Page } from "@playwright/test";

const MOCK_SERVER_BASE_URL = "http://127.0.0.1:8787";

type MockMode = "normal" | "empty" | "error500";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

async function setMockMode(mode: MockMode): Promise<void> {
  const response = await fetch(`${MOCK_SERVER_BASE_URL}/__mode?value=${mode}`);
  expect(response.ok).toBe(true);
}

test.describe("server fallback states", () => {
  test.beforeEach(async () => {
    await setMockMode("normal");
  });

  test.afterEach(async () => {
    await setMockMode("normal");
  });

  test("shows server error message when feed fetch fails", async ({ page }) => {
    await setMockMode("error500");

    await page.goto("/?range=24h&sort=top");

    await expect(
      appRoot(page).getByRole("heading", { name: /Top 20 Hacker News Stories/i })
    ).toBeVisible();
    await expect(
      appRoot(page).getByText("Could not load stories right now. Please try again shortly.")
    ).toBeVisible();
    await expect(appRoot(page).locator(".story-list .story-item")).toHaveCount(0);
  });

  test("shows empty-state copy when server returns no stories", async ({ page }) => {
    await setMockMode("empty");

    await page.goto("/?range=7d&sort=top");

    await expect(
      appRoot(page).getByRole("heading", { name: /Top 20 Hacker News Stories/i })
    ).toBeVisible();
    await expect(appRoot(page).getByText("No stories found in this time range.")).toBeVisible();
    await expect(appRoot(page).locator(".story-list .story-item")).toHaveCount(0);
  });
});
