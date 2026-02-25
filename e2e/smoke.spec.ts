import { expect, test, type Page } from "@playwright/test";

const IS_LIVE_E2E = process.env.E2E_USE_LIVE === "1";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

async function gotoHome(page: Page): Promise<void> {
  await page.goto("/?range=24h&sort=top");
  await expect(
    appRoot(page).getByRole("heading", { name: /Top 20 Hacker News Stories/i })
  ).toBeVisible();
  await expect(appRoot(page).locator(".story-list .story-item").first()).toBeVisible();
  await expect
    .poll(async () => {
      const readKey = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:read-story-ids")
      );
      const savedKey = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:saved-story-ids")
      );
      const savedStoriesKey = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:saved-stories")
      );
      return readKey !== null && savedKey !== null && savedStoriesKey !== null;
    })
    .toBe(true);
}

function firstStoryTitleLocator(page: Page) {
  return appRoot(page).locator(".story-list .story-item").first().locator(".story-title a");
}

test.describe("HN-RSS smoke", () => {
  test("range + sort update URL and load visible stories", async ({ page }) => {
    await gotoHome(page);

    const topFirstTitle = (await firstStoryTitleLocator(page).innerText()).trim();
    expect(topFirstTitle.length).toBeGreaterThan(0);
    if (!IS_LIVE_E2E) {
      expect(topFirstTitle).toBe("Top Titan Systems");
    }

    await appRoot(page).getByRole("link", { name: "Last 7 Days" }).first().click();
    await expect(page).toHaveURL(/range=7d/);
    await expect(appRoot(page).locator(".story-list .story-item").first()).toBeVisible();

    await appRoot(page).getByRole("link", { name: "Last 24 Hours" }).first().click();
    await expect(page).toHaveURL(/range=24h/);

    await appRoot(page)
      .getByRole("group", { name: "Sort stories" })
      .first()
      .getByRole("button", { name: "Most Discussed", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/sort=comments/);
    const commentsFirstTitle = (await firstStoryTitleLocator(page).innerText()).trim();
    expect(commentsFirstTitle.length).toBeGreaterThan(0);
    if (!IS_LIVE_E2E) {
      expect(commentsFirstTitle).toBe("Comment Storm Digest");
    }
  });

  test("read + hideRead + save flow", async ({ page }) => {
    await gotoHome(page);

    const firstTitle = (await firstStoryTitleLocator(page).innerText()).trim();
    const firstItem = appRoot(page).locator(".story-list .story-item").first();

    const initialCount = await appRoot(page).locator(".story-list .story-item").count();
    await firstItem.getByRole("button", { name: "Skip" }).click();

    await appRoot(page).getByRole("button", { name: "Show read" }).first().click();
    await expect(page).toHaveURL(/hideRead=1/);
    await expect(firstStoryTitleLocator(page)).not.toHaveText(firstTitle, { timeout: 10_000 });
    await expect(appRoot(page).locator(".story-list .story-item")).toHaveCount(initialCount - 1);

    await appRoot(page).getByRole("button", { name: "Unread only" }).first().click();
    await expect(page).not.toHaveURL(/hideRead=1/);

    const saveCandidateItem = appRoot(page).locator(".story-list .story-item").nth(1);
    const savedTitle = (await saveCandidateItem.locator(".story-title a").innerText()).trim();
    const saveCandidateButton = saveCandidateItem.locator(".story-action-save");
    await expect(saveCandidateButton).toBeVisible();
    await saveCandidateButton.click();
    await expect(saveCandidateButton).toHaveAttribute("aria-pressed", "true");

    await appRoot(page)
      .getByRole("group", { name: "Story scope" })
      .getByRole("button", { name: "Saved (1)" })
      .click();
    await expect(appRoot(page).getByRole("heading", { name: /Saved Hacker News Stories/i })).toBeVisible();
    await expect(firstStoryTitleLocator(page)).toHaveText(savedTitle);

    await appRoot(page).locator(".story-list .story-item").first().locator(".story-action-save").click();
    await expect(appRoot(page).getByText("No saved stories yet.")).toBeVisible();
  });

  test("keyboard shortcuts work", async ({ page }) => {
    await gotoHome(page);
    await appRoot(page).click();

    await page.keyboard.press("t");
    await expect(page).toHaveURL(/sort=comments/);

    await page.keyboard.press("t");
    await expect(page).toHaveURL(/sort=top/);

    await page.keyboard.press("r");
    await expect(page).toHaveURL(/range=7d/);

    const activeTitle = appRoot(page).locator(".story-list .story-item.active .story-title a");
    const originalActive = (await activeTitle.innerText()).trim();

    // Regression check: j/k should still work after tabbing to interactive controls.
    await page.keyboard.press("Tab");
    await page.keyboard.press("j");
    await expect
      .poll(async () => (await activeTitle.innerText()).trim())
      .not.toBe(originalActive);

    await page.keyboard.press("k");
    await expect(activeTitle).toHaveText(originalActive);

    // Regression check: `c` should still open comments even when focus is on an interactive control.
    const focusedCommentsPopupPromise = page.waitForEvent("popup");
    await page.keyboard.press("c");
    const focusedCommentsPopup = await focusedCommentsPopupPromise;
    await expect(focusedCommentsPopup).toHaveURL(/news\.ycombinator\.com\/item\?id=/);
    await focusedCommentsPopup.close();

    // Move focus back to non-interactive surface for global action shortcuts.
    await appRoot(page).click();

    await page.keyboard.press("h");
    await expect(page).toHaveURL(/hideRead=1/);

    await page.keyboard.press("h");
    await expect(page).not.toHaveURL(/hideRead=1/);

    const activeItem = appRoot(page).locator(".story-list .story-item.active").first();
    await page.keyboard.press("s");
    await expect(activeItem.getByRole("button", { name: "Saved" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.keyboard.press("m");
    await expect(activeItem.getByText("Read")).toBeVisible();

    const enterPopupPromise = page.waitForEvent("popup");
    await page.keyboard.press("Enter");
    const enterPopup = await enterPopupPromise;
    await expect(enterPopup).toHaveURL(/https?:\/\//);
    await enterPopup.close();

    const openPopupPromise = page.waitForEvent("popup");
    await page.keyboard.press("o");
    const openPopup = await openPopupPromise;
    await expect(openPopup).toHaveURL(/https?:\/\//);
    await openPopup.close();

    const commentsPopupPromise = page.waitForEvent("popup");
    await page.keyboard.press("c");
    const commentsPopup = await commentsPopupPromise;
    await expect(commentsPopup).toHaveURL(/news\.ycombinator\.com\/item\?id=/);
    await commentsPopup.close();
  });

  test("mobile viewport has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);

    const hasOverflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflowX).toBe(false);
  });
});
