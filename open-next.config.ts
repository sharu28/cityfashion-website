import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every public page is prerendered at build time and the catalog only changes on deploy,
// so serve the prerendered output straight from Workers static assets. Without this the
// Worker re-renders the whole homepage on every request (x-nextjs-cache: MISS).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
