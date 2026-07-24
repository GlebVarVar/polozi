import { expect, test } from "@playwright/test";
import { APP_URL } from "./urls";

function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("app account + progress sync", () => {
  test("a new user can register and progress becomes synced", async ({
    page,
  }) => {
    const email = uniqueEmail();

    await page.goto(`${APP_URL}/settings/`);

    // Switch the account card to the register tab (login is the default mode).
    await page.getByRole("button", { name: "Registracija" }).click();

    await page.locator("#account-email").fill(email);
    await page.locator("#account-password").fill("secret123");
    await page.locator('form button[type="submit"]').click();

    // Registration signs the user in: the card flips to the signed-in state.
    await expect(page.getByText(email)).toBeVisible();
    // ...and the progress blob is pushed to the API.
    await expect(page.getByText("Napredak sačuvan")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("registering the same email twice fails on the second attempt", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();

    // Seed the account directly through the API.
    const first = await request.post(
      `${process.env.API_URL ?? "http://localhost:3001"}/api/account/register`,
      { data: { email, password: "secret123" } },
    );
    expect(first.ok()).toBeTruthy();

    // The UI must surface an error for the duplicate registration.
    await page.goto(`${APP_URL}/settings/`);
    await page.getByRole("button", { name: "Registracija" }).click();
    await page.locator("#account-email").fill(email);
    await page.locator("#account-password").fill("secret123");
    await page.locator('form button[type="submit"]').click();

    // Still signed out — the signed-in "Prijavljeni ste kao" label never appears.
    await expect(page.getByText("Prijavljeni ste kao")).toHaveCount(0);
    await expect(page.locator("#account-email")).toBeVisible();
  });
});
