import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const runtimeRoot = process.env.SITES_RUNTIME_ROOT || path.join(projectRoot, ".sites-runtime");

await Promise.all([
  mkdir(path.join(runtimeRoot, "home"), { recursive: true }),
  mkdir(path.join(runtimeRoot, "npm-cache"), { recursive: true }),
  mkdir(path.join(runtimeRoot, "xdg-config"), { recursive: true }),
  mkdir(path.join(runtimeRoot, "tmp"), { recursive: true }),
  mkdir(path.join(runtimeRoot, "wrangler", "logs"), { recursive: true }),
]);

const environment = {
  ...process.env,
  SITES_ENV_READY: "1",
  SITES_PROJECT_ROOT: projectRoot,
  HOME: path.join(runtimeRoot, "home"),
  XDG_CONFIG_HOME: path.join(runtimeRoot, "xdg-config"),
  TMPDIR: path.join(runtimeRoot, "tmp"),
  WRANGLER_WRITE_LOGS: "false",
  WRANGLER_LOG_PATH: path.join(runtimeRoot, "wrangler", "logs"),
  MINIFLARE_REGISTRY_PATH: path.join(runtimeRoot, "wrangler", "registry"),
  npm_config_cache: path.join(runtimeRoot, "npm-cache"),
  npm_config_audit: "false",
  npm_config_fund: "false",
  npm_config_update_notifier: "false",
};

for (const variable of [
  "NPM_CONFIG_CACHE",
  "npm_config_proxy",
  "npm_config_http_proxy",
  "npm_config_https_proxy",
  "NPM_CONFIG_PROXY",
  "NPM_CONFIG_HTTP_PROXY",
  "NPM_CONFIG_HTTPS_PROXY",
]) {
  delete environment[variable];
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/sites-env.mjs command [args...]");
  process.exit(64);
}

let executable = command;
if (process.platform === "win32" && !path.extname(command)) {
  executable = path.join(projectRoot, "node_modules", ".bin", `${command}.cmd`);
  try {
    await access(executable);
  } catch {
    executable = `${command}.cmd`;
  }
}
const shell = process.platform === "win32";
const child = spawn(shell ? `"${executable}"` : executable, args, {
  cwd: projectRoot,
  env: environment,
  stdio: "inherit",
  shell,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
