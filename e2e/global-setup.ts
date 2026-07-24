import { API_URL, APP_URL, BO_URL } from "./tests/urls";

// Wait until every service in the stack answers before the suite starts.
// Static sites (app/backoffice) are "ready" on any HTTP response; the API
// must return a healthy /health.
async function waitFor(
  url: string,
  label: string,
  accept: (status: number) => boolean,
  timeoutMs = 120_000,
) {
  const start = Date.now();
  let lastErr: unknown = "no response";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (accept(res.status)) {
        console.log(`[global-setup] ${label} ready (${res.status})`);
        return;
      }
      lastErr = `status ${res.status}`;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `[global-setup] ${label} not ready at ${url}: ${String(lastErr)}`,
  );
}

export default async function globalSetup() {
  await Promise.all([
    waitFor(`${API_URL}/health`, "api", (s) => s === 200),
    waitFor(`${APP_URL}/`, "app", (s) => s < 500),
    waitFor(`${BO_URL}/`, "backoffice", (s) => s < 500),
  ]);
}
