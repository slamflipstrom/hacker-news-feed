import { expect, test, type Page } from "@playwright/test";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

async function waitForHydration(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const readKey = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:read-story-ids")
      );
      const savedKey = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:saved-story-ids")
      );
      return readKey !== null && savedKey !== null;
    })
    .toBe(true);
}

async function gotoHome(page: Page): Promise<void> {
  await page.goto("/?range=24h&sort=top");
  await expect(
    appRoot(page).getByRole("heading", { name: /Top 20 Hacker News Stories/i })
  ).toBeVisible();
  await expect(appRoot(page).locator(".story-list .story-item").first()).toBeVisible();
  await waitForHydration(page);
}

test.describe("queue behavior", () => {
  test("queue progress reflects read state and hide-read filtering", async ({ page }) => {
    await gotoHome(page);

    const queueRegion = appRoot(page).getByRole("region", { name: "Today's queue" });
    await expect(queueRegion.getByText("0/3 read")).toBeVisible();

    await appRoot(page).locator(".story-list .story-item").nth(0).getByRole("button", { name: "Skip" }).click();
    await expect(queueRegion.getByText("1/3 read")).toBeVisible();

    await appRoot(page).locator(".story-list .story-item").nth(1).getByRole("button", { name: "Skip" }).click();
    await expect(queueRegion.getByText("2/3 read")).toBeVisible();

    await appRoot(page).getByRole("button", { name: "Show read" }).click();
    await expect(page).toHaveURL(/hideRead=1/);
    await expect(queueRegion.getByText("0/3 read")).toBeVisible();

    await appRoot(page).locator(".story-list .story-item").first().getByRole("button", { name: "Skip" }).click();
    await expect(queueRegion.getByText("0/3 read")).toBeVisible();
  });
});
