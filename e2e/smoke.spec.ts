import { expect, test, type Page } from "@playwright/test";

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
      return readKey !== null && savedKey !== null;
    })
    .toBe(true);
}

function firstStoryTitleLocator(page: Page) {
  return appRoot(page).locator(".story-list .story-item").first().locator(".story-title a");
}

test.describe("HN-RSS smoke", () => {
  test("range + sort update URL and reorder visible stories", async ({ page }) => {
    await gotoHome(page);

    const topFirstTitle = await firstStoryTitleLocator(page).innerText();

    await appRoot(page).getByRole("link", { name: "Last 7 Days" }).first().click();
    await expect(page).toHaveURL(/range=7d/);
    await expect(appRoot(page).locator(".story-list .story-item").first()).toBeVisible();

    await appRoot(page).getByRole("link", { name: "Last 24 Hours" }).first().click();
    await expect(page).toHaveURL(/range=24h/);

    await appRoot(page)
      .getByRole("group", { name: "Sort stories" })
      .first()
      .getByRole("button", { name: "Newest", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/sort=new/);
    const newestFirstTitle = await firstStoryTitleLocator(page).innerText();

    await appRoot(page)
      .getByRole("group", { name: "Sort stories" })
      .first()
      .getByRole("button", { name: "Most Commented", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/sort=comments/);
    const commentsFirstTitle = await firstStoryTitleLocator(page).innerText();

    expect(
      new Set([
        topFirstTitle.trim(),
        newestFirstTitle.trim(),
        commentsFirstTitle.trim(),
      ]).size
    ).toBeGreaterThan(1);
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

    const restoredFirstItem = appRoot(page).locator(".story-list .story-item").first();
    await restoredFirstItem.getByRole("button", { name: "Save" }).click();
    await expect(
      restoredFirstItem.getByRole("button", { name: "Saved" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("keyboard shortcuts work", async ({ page }) => {
    await gotoHome(page);
    await appRoot(page).click();

    const activeTitle = appRoot(page).locator(".story-list .story-item.active .story-title a");
    const originalActive = (await activeTitle.innerText()).trim();

    await page.keyboard.press("j");
    await expect
      .poll(async () => (await activeTitle.innerText()).trim())
      .not.toBe(originalActive);

    await page.keyboard.press("k");
    await expect(activeTitle).toHaveText(originalActive);

    const activeItem = appRoot(page).locator(".story-list .story-item.active").first();
    await page.keyboard.press("s");
    await expect(activeItem.getByRole("button", { name: "Saved" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.keyboard.press("m");
    await expect(activeItem.getByText("Read")).toBeVisible();

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
