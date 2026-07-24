import { expect, test } from "@playwright/test";
import { API_URL, APP_URL, BO_URL } from "./urls";

test.describe("smoke", () => {
  test("api /health responds ok", async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("api swagger document is served", async ({ request }) => {
    const res = await request.get(`${API_URL}/api-docs/openapi.json`);
    expect(res.ok()).toBeTruthy();
    const doc = await res.json();
    expect(doc.info.title).toBe("Položi! API");
    expect(Object.keys(doc.paths)).toContain("/health");
  });

  test("app home renders", async ({ page }) => {
    await page.goto(`${APP_URL}/`);
    await expect(
      page.getByRole("heading", { name: "Dobrodošli!" }),
    ).toBeVisible();
  });

  test("app key pages load without error", async ({ page }) => {
    for (const path of [
      "/training/",
      "/exam/",
      "/schools/",
      "/stats/",
      "/settings/",
    ]) {
      const res = await page.goto(`${APP_URL}${path}`);
      expect(res?.status(), `GET ${path}`).toBeLessThan(400);
    }
  });

  test("backoffice login screen renders", async ({ page }) => {
    await page.goto(`${BO_URL}/`);
    await expect(page.getByText("Položi! Backoffice")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
