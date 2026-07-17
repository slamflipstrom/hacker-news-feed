import { expect, test, type Page } from "@playwright/test";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

function storyItems(page: Page) {
  return appRoot(page).locator(".story-list .story-item");
}

function firstStoryTitle(page: Page) {
  return storyItems(page).first().locator(".story-title a");
}

async function gotoHome(page: Page): Promise<void> {
  await page.goto("/?range=24h&sort=top");
  await expect(storyItems(page).first()).toBeVisible();
  // The muted-terms key is persisted after preference hydration, so its
  // presence means the header controls are interactive.
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem("hnrss:muted-terms")))
    .not.toBeNull();
}

test.describe("mute list", () => {
  test("muting a keyword hides matching stories, backfills, persists, and can be undone", async ({
    page,
  }) => {
    await gotoHome(page);

    const initialCount = await storyItems(page).count();
    const mutedTitle = (await firstStoryTitle(page).innerText()).trim();
    const keyword = mutedTitle.split(" ")[1].toLowerCase();

    await appRoot(page).getByRole("button", { name: /Mutes \(0\)/ }).click();
    await appRoot(page).getByLabel("Domain or keyword to mute").fill(keyword);
    await appRoot(page).getByRole("button", { name: "Mute", exact: true }).click();

    // Story is hidden and the list backfills from the over-fetched reserve.
    await expect(firstStoryTitle(page)).not.toHaveText(mutedTitle);
    await expect(storyItems(page)).toHaveCount(initialCount);
    await expect(appRoot(page).getByRole("button", { name: /Mutes \(1\)/ })).toBeVisible();

    // Persists across reload (localStorage).
    await page.reload();
    await expect(storyItems(page).first()).toBeVisible();
    await expect(firstStoryTitle(page)).not.toHaveText(mutedTitle);
    await expect(appRoot(page).getByRole("button", { name: /Mutes \(1\)/ })).toBeVisible();

    // Unmuting restores the story.
    await appRoot(page).getByRole("button", { name: /Mutes \(1\)/ }).click();
    await appRoot(page).getByRole("button", { name: `Unmute ${keyword}` }).click();
    await expect(firstStoryTitle(page)).toHaveText(mutedTitle);
  });
});
