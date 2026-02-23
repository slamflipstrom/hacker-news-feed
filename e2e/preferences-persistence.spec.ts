import { expect, test, type Page } from "@playwright/test";

function appRoot(page: Page) {
  return page.locator(".container").last();
}

async function waitForHydration(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const storyRead = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:read-story-ids")
      );
      const storySaved = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:saved-story-ids")
      );
      const range = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:preferred-range")
      );
      const sort = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:preferred-sort-mode")
      );
      const hideRead = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:preferred-hide-read")
      );
      const theme = await page.evaluate(() =>
        window.localStorage.getItem("hnrss:preferred-theme")
      );

      return (
        storyRead !== null &&
        storySaved !== null &&
        range !== null &&
        sort !== null &&
        hideRead !== null &&
        theme !== null
      );
    })
    .toBe(true);
}

test.describe("preferences persistence", () => {
  test("selected preferences survive reload", async ({ page }) => {
    await page.goto("/?range=24h&sort=top");
    await waitForHydration(page);

    await expect(
      appRoot(page).getByRole("heading", { name: /Top 20 Hacker News Stories/i })
    ).toBeVisible();

    await appRoot(page)
      .getByRole("group", { name: "Sort stories" })
      .getByRole("button", { name: "Most Discussed", exact: true })
      .click();
    await expect(page).toHaveURL(/sort=comments/);

    await appRoot(page).getByRole("button", { name: "Show read" }).click();
    await expect(page).toHaveURL(/hideRead=1/);

    await appRoot(page).getByRole("link", { name: "Last 30 Days" }).click();
    await expect(page).toHaveURL(/range=30d/);
    await expect(page).toHaveURL(/sort=comments/);
    await expect(page).toHaveURL(/hideRead=1/);

    await appRoot(page).getByRole("button", { name: /Cycle theme:/ }).click();
    await expect(page).toHaveURL(/theme=light/);
    await expect(appRoot(page).getByRole("button", { name: /Cycle theme: current is light/i })).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.getAttribute("data-theme"))
      )
      .toBe("light");

    await page.reload();

    await expect(page).toHaveURL(/range=30d/);
    await expect(page).toHaveURL(/sort=comments/);
    await expect(page).toHaveURL(/hideRead=1/);
    await expect(page).toHaveURL(/theme=light/);
    await expect(appRoot(page).getByRole("button", { name: "Unread only" })).toBeVisible();
    await expect(appRoot(page).getByRole("button", { name: /Cycle theme: current is light/i })).toBeVisible();
  });

  test("query params override stored preferences", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("hnrss:preferred-range", "30d");
      window.localStorage.setItem("hnrss:preferred-sort-mode", "comments");
      window.localStorage.setItem("hnrss:preferred-hide-read", "1");
      window.localStorage.setItem("hnrss:preferred-theme", "dark");
    });

    await page.goto("/?range=24h&sort=top&hideRead=0&theme=light");
    await waitForHydration(page);

    await expect(page).toHaveURL(/range=24h/);
    await expect(page).toHaveURL(/sort=top/);
    await expect(page).not.toHaveURL(/hideRead=1/);
    await expect(page).toHaveURL(/theme=light/);

    await expect(appRoot(page).getByRole("button", { name: "Show read" })).toBeVisible();
    await expect(appRoot(page).getByRole("button", { name: /Cycle theme: current is light/i })).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.getAttribute("data-theme"))
      )
      .toBe("light");
    await expect(appRoot(page).getByRole("link", { name: "Last 24 Hours" })).toHaveClass(
      /active/
    );
    await expect(
      appRoot(page)
        .getByRole("group", { name: "Sort stories" })
        .getByRole("button", { name: "Top", exact: true })
    ).toHaveClass(/active/);
  });
});
