// Copies the prerendered Next.js cache into the Worker's static assets so the
// static-assets incremental cache (open-next.config.ts) can serve pages without
// re-rendering them. `opennextjs-cloudflare deploy` does this itself; this script
// makes a plain `wrangler deploy` (Cloudflare Workers Builds) do the same.
import fs from "node:fs";
import path from "node:path";

const outputDir = ".open-next";
const from = path.join(outputDir, "cache");
const to = path.join(outputDir, "assets", "cdn-cgi", "_next_cache");

if (!fs.existsSync(from)) {
  console.error(`No ${from} found. Run "opennextjs-cloudflare build" first.`);
  process.exit(1);
}

fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log(`Copied prerender cache to ${to}`);
