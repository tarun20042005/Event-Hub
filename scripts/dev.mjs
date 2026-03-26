import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";

// Load .env file if it exists (local development only)
// On Replit, secrets are already injected into process.env automatically
if (existsSync(".env")) {
  const lines = readFileSync(".env", "utf-8").split("\n");
  let loaded = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    if (key && !(key in process.env)) {
      process.env[key] = value;
      loaded++;
    }
  }
  console.log(`[dev] Loaded ${loaded} variable(s) from .env`);
}

// Start both servers concurrently
const proc = spawn(
  "pnpm",
  [
    "exec",
    "concurrently",
    "-n",
    "api,web",
    "-c",
    "blue,green",
    "cross-env PORT=8080 pnpm --filter @workspace/api-server run dev",
    "cross-env PORT=5173 BASE_PATH=/ pnpm --filter @workspace/event-platform run dev",
  ],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

proc.on("exit", (code) => process.exit(code ?? 0));
