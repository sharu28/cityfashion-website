import nextVitals from "eslint-config-next/core-web-vitals";

const config = [{ ignores: [".worktrees/**", ".open-next/**", ".wrangler/**", "cloudflare-env.d.ts"] }, ...nextVitals];

export default config;
