import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";

// Load .env file if it exists (local development only)
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
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    if (key && !(key in process.env)) {
      process.env[key] = value;
      loaded++;
    }
  }
  console.log(`[dev] Loaded ${loaded} variable(s) from .env`);
}

const isWindows = process.platform === "win32";
const shell = isWindows ? "cmd" : "sh";
const shellFlag = isWindows ? "/c" : "-c";

function startProcess(label, color, command, env) {
  const colors = { blue: "\x1b[34m", green: "\x1b[32m", reset: "\x1b[0m" };
  const c = colors[color] ?? colors.reset;
  const prefix = `${c}[${label}]\x1b[0m `;

  const proc = spawn(shell, [shellFlag, command], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout.on("data", (data) => {
    for (const line of data.toString().split("\n")) {
      if (line.trim()) process.stdout.write(prefix + line + "\n");
    }
  });
  proc.stderr.on("data", (data) => {
    for (const line of data.toString().split("\n")) {
      if (line.trim()) process.stderr.write(prefix + line + "\n");
    }
  });

  return proc;
}

const api = startProcess(
  "api",
  "blue",
  "pnpm --filter @workspace/api-server run dev",
  { PORT: "8080", NODE_ENV: "development" },
);

const web = startProcess(
  "web",
  "green",
  "pnpm --filter @workspace/event-platform run dev",
  { PORT: "5173", BASE_PATH: "/" },
);

function shutdown() {
  api.kill();
  web.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

let exitCount = 0;
function onExit(code, label) {
  console.log(`[dev] ${label} exited with code ${code}`);
  exitCount++;
  if (exitCount >= 2) process.exit(code ?? 0);
  else shutdown();
}

api.on("exit", (code) => onExit(code, "api"));
web.on("exit", (code) => onExit(code, "web"));
