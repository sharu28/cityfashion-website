// Starts the OpenNext Worker build with `wrangler dev` on a fresh local D1, for Playwright.
// Builds first when there is no build yet, or when E2E_BUILD=1.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { envFile, persistDir, workerPort, workerVars } from "./test-values.mjs";

const wrangler = path.resolve("node_modules/wrangler/bin/wrangler.js");
const openNext = path.resolve("node_modules/@opennextjs/cloudflare/dist/cli/index.js");

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Failed: ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

if (process.env.E2E_BUILD === "1" || !fs.existsSync(".open-next/worker.js")) {
  run([openNext, "build"]);
}

fs.rmSync(persistDir, { recursive: true, force: true });
fs.mkdirSync(persistDir, { recursive: true });
fs.writeFileSync(
  envFile,
  Object.entries(workerVars)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
);

run([wrangler, "d1", "migrations", "apply", "cityfashion-orders", "--local", "--persist-to", persistDir]);

const child = spawn(
  process.execPath,
  [
    wrangler,
    "dev",
    "--ip",
    "127.0.0.1",
    "--port",
    String(workerPort),
    "--persist-to",
    persistDir,
    "--env-file",
    envFile,
    "--show-interactive-dev-session=false",
  ],
  { stdio: "inherit" },
);

const stop = () => child.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (code) => process.exit(code ?? 0));
