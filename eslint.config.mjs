import nextVitals from "eslint-config-next/core-web-vitals";

const config = [{ ignores: [".worktrees/**", ".open-next/**", ".wrangler/**", "cloudflare-env.d.ts", "**/*.d.mts", "test-results/**", "playwright-report/**"] }, ...nextVitals];

export default config;
