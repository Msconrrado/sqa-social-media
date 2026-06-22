import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30000,
  reporter: [["list"], ["html"]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
  },
});