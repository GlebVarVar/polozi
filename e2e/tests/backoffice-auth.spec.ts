import { expect, test } from "@playwright/test";
import { BO_URL } from "./urls";

test.describe("backoffice auth", () => {
  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto(`${BO_URL}/`);
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    // The 2FA management entry point must be reachable from the shell.
    await expect(page.getByRole("link", { name: "Security" })).toBeVisible();
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto(`${BO_URL}/`);
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Invalid username or password"),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
