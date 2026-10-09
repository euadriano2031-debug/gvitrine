import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Permite usar um Chromium já instalado no ambiente (CI/sandbox) via PW_CHROMIUM_PATH.
const chromiumPath =
  process.env["PW_CHROMIUM_PATH"] ??
  ["/opt/ms-playwright/chromium-1194/chrome-linux/chrome"].find((p) => existsSync(p));

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:8080",
    viewport: { width: 1280, height: 1000 },
    trace: "off",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

