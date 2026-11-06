import { defineConfig } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run dev -- --host 127.0.0.1 --port 4173 --strictPort`, url: "http://127.0.0.1:4173", reuseExistingServer: !process.env.CI },
});
