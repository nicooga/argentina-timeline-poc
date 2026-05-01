import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// En GitHub Actions, GITHUB_REPOSITORY es "owner/repo"; el base de Pages es /repo/
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  plugins: [react()],
  base: repo ? `/${repo}/` : "/",
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
