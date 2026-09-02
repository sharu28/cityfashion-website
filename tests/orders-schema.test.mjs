import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/202609020001_create_website_orders.sql";

test("orders schema is private and atomic", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");

  assert.match(sql, /create sequence public\.website_order_number_seq start with 1001/i);
  assert.match(sql, /alter table public\.orders enable row level security/i);
  assert.match(sql, /alter table public\.order_items enable row level security/i);
  assert.match(sql, /alter table public\.order_submission_attempts enable row level security/i);
  assert.match(sql, /revoke all on public\.orders from anon, authenticated/i);
  assert.match(sql, /create or replace function public\.create_website_order/i);
  assert.match(sql, /revoke execute on function public\.create_website_order/i);
  assert.match(sql, /grant execute on function public\.create_website_order/i);
});
