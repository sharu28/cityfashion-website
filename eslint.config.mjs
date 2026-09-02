import nextVitals from "eslint-config-next/core-web-vitals";

const config = [{ ignores: [".worktrees/**"] }, ...nextVitals];

export default config;
