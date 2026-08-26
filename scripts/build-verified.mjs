import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const runtimeRoot = process.env.SITES_RUNTIME_ROOT || path.join(projectRoot, ".sites-runtime");
const vinext = path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js");

try {
  await access(vinext);
} catch {
  console.error("vinext is unavailable. Run npm ci and wait for it to finish before building.");
  process.exit(69);
}

const timeoutText = process.env.SITES_BUILD_TIMEOUT || "3m";
const timeoutMatch = timeoutText.match(/^(\d+)(ms|s|m|h)$/);
if (!timeoutMatch) {
  console.error(`Invalid SITES_BUILD_TIMEOUT: ${timeoutText}`);
  process.exit(64);
}
const units = { ms: 1, s: 1000, m: 60000, h: 3600000 };
const timeoutMs = Number(timeoutMatch[1]) * units[timeoutMatch[2]];

console.log("Running bounded vinext build...");
const child = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    SITES_ENV_READY: "1",
    SITES_PROJECT_ROOT: projectRoot,
    HOME: path.join(runtimeRoot, "home"),
    XDG_CONFIG_HOME: path.join(runtimeRoot, "xdg-config"),
    TMPDIR: path.join(runtimeRoot, "tmp"),
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: path.join(runtimeRoot, "wrangler", "logs"),
    MINIFLARE_REGISTRY_PATH: path.join(runtimeRoot, "wrangler", "registry"),
  },
  stdio: "inherit",
});

const timer = setTimeout(() => {
  console.error(`vinext build timed out after ${timeoutText}`);
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 10000).unref();
}, timeoutMs);

timer.unref();
child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
child.on("error", (error) => {
  clearTimeout(timer);
  console.error(error.message);
  process.exit(1);
});
