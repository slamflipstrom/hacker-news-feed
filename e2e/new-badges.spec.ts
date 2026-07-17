import { expect, test, type Page } from "@playwright/test";

const FIRST_SEEN_STORAGE_KEY = "hnrss:story-first-seen";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

function newBadges(page: Page) {
  return appRoot(page).locator(".story-list .status-new");
}

async function gotoHome(page: Page): Promise<void> {
  await page.goto("/?range=24h&sort=top");
  await expect(appRoot(page).locator(".story-list .story-item").first()).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        FIRST_SEEN_STORAGE_KEY
      )
    )
    .not.toBeNull();
}

test.describe("new-story badges", () => {
  test("first visit shows no badges; a story unseen last visit gets badged", async ({ page }) => {
    await gotoHome(page);

    // First-ever visit: everything is unseen, so nothing is badged as New.
    await expect(newBadges(page)).toHaveCount(0);

    // Second visit with unchanged data: nothing new, still no badges.
    await page.reload();
    await gotoHome(page);
    await expect(newBadges(page)).toHaveCount(0);

    // Simulate a story that did not exist at the last visit by removing its
    // first-seen record, then revisit.
    const firstItem = appRoot(page).locator(".story-list .story-item").first();
    const firstTitle = (await firstItem.locator(".story-title a").innerText()).trim();
    // Story cards use element ids of the form `story-{objectID}`.
    const firstStoryId = (await firstItem.getAttribute("id"))?.replace(/^story-/, "");
    expect(firstStoryId).toBeTruthy();
    await page.evaluate(
      ({ key, storyId }) => {
        const stored = JSON.parse(window.localStorage.getItem(key) ?? "{}");
        delete stored[storyId];
        window.localStorage.setItem(key, JSON.stringify(stored));
      },
      { key: FIRST_SEEN_STORAGE_KEY, storyId: firstStoryId ?? "" }
    );

    await page.reload();
    await gotoHome(page);

    await expect(newBadges(page)).toHaveCount(1);
    const badgedItem = appRoot(page)
      .locator(".story-list .story-item")
      .filter({ has: page.locator(".status-new") });
    await expect(badgedItem.locator(".story-title a")).toHaveText(firstTitle);
  });
});
