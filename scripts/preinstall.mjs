import { rmSync, existsSync } from "fs";

// Remove npm/yarn lockfiles if present
for (const file of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(file)) {
    rmSync(file);
  }
}

// Enforce pnpm as the package manager
const agent = process.env.npm_config_user_agent ?? "";
if (!agent.startsWith("pnpm/")) {
  console.error("Error: Please use pnpm instead of npm or yarn.");
  console.error("  Install pnpm: https://pnpm.io/installation");
  process.exit(1);
}
