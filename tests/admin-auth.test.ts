import { describe, expect, it } from "vitest";

import { isAllowedAdminEmail } from "@/lib/admin-auth";

describe("admin allowlist", () => {
  it("allows only the configured owner email, case-insensitively", () => {
    expect(isAllowedAdminEmail("Owner@CityFashion.Shop", "owner@cityfashion.shop")).toBe(true);
    expect(isAllowedAdminEmail("staff@cityfashion.shop", "owner@cityfashion.shop")).toBe(false);
    expect(isAllowedAdminEmail(null, "owner@cityfashion.shop")).toBe(false);
    expect(isAllowedAdminEmail("owner@cityfashion.shop", "   ")).toBe(false);
  });
});
