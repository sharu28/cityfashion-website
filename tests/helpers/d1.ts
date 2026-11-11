import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPlatformProxy } from "wrangler";

const migrationsDir = path.resolve(process.cwd(), "migrations");

function migrationStatements() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .flatMap((file) =>
      fs
        .readFileSync(path.join(migrationsDir, file), "utf8")
        .replace(/--.*$/gm, "")
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean),
    );
}

/** A fresh local D1 database (the real D1 engine, via wrangler) with every migration applied. */
export async function createTestD1() {
  const persistDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-orders-test-"));
  const proxy = await getPlatformProxy<{ ORDERS_DB: D1Database }>({
    configPath: path.resolve(process.cwd(), "wrangler.jsonc"),
    persist: { path: persistDir },
  });
  const db = proxy.env.ORDERS_DB;
  await db.batch(migrationStatements().map((statement) => db.prepare(statement)));
  return {
    db,
    dispose: async () => {
      await proxy.dispose();
      fs.rmSync(persistDir, { recursive: true, force: true });
    },
  };
}
