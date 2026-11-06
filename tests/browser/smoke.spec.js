import { expect, test } from "@playwright/test";

for (const [path, title] of [["/", /Tournament Dashboard/], ["/table", /Points Table/], ["/stats", /Player Stats/], ["/player/Alex", /Alex/], ["/missing", /Page not found/]]) {
  test(`renders ${path} without crashes or page overflow`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("page.png"), fullPage: true });
  });
}

for (const path of ["/admin", "/players"]) {
  test(`protects ${path} even with forged local storage`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem("adminAuth", "true"));
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin-login$/);
    await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });
  });
}

test("navigates from the dashboard to public standings and players", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Standings/ }).click();
  await expect(page).toHaveURL(/\/table$/);
  await page.getByRole("button", { name: /Home/ }).click();
  await page.getByRole("button", { name: /Players/ }).click();
  await expect(page).toHaveURL(/\/stats$/);
});
