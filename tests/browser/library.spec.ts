import { expect, test } from "@playwright/test";
import songs from "../../src/data/songs.json";

test("shows every song in a minimal layout that fits the screen", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(page.locator(".song-row")).toHaveCount(songs.length);
  await expect(page.locator("body")).not.toContainText(/Qobuz|Beatport/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("library.png") });
  await page.locator(".song-row").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".song-row h2").last()).toHaveText(songs.at(-1)!.title);
  await expect(page.getByRole("searchbox")).toBeInViewport();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("searches titles and artists, suggests typos, and recovers from no results", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search songs or artists" });
  await search.fill("Dancing Queen");
  await expect(page.locator(".song-row")).toHaveCount(2);
  await expect(page.locator(".song-row h2").first()).toHaveText("Dancing Queen");
  await search.fill("dancng quuen");
  await expect(page.getByText("Closest matches")).toBeVisible();
  await expect(page.locator(".song-row h2").first()).toHaveText("Dancing Queen");
  await search.fill("tiesto");
  await expect(page.locator(".song-row").filter({ hasText: "Tiësto" }).first()).toBeVisible();
  await search.fill("zzxqqv98765");
  await expect(page.getByText("No matches", { exact: true })).toBeVisible();
  await expect(page.locator(".song-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".song-row")).toHaveCount(songs.length);
});

test("keyboard search and copying a song work", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.keyboard.press("/");
  const search = page.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("Dancing Queen");
  await page.getByRole("button", { name: "Copy Dancing Queen by ABBA", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copy Dancing Queen by ABBA", exact: true })).toHaveClass(/is-copied/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Dancing Queen — ABBA");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toBeFocused();
  await expect(page.locator(".song-row")).toHaveCount(songs.length);
});
