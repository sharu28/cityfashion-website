import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CookieConsent } from "@/components/cookie-consent";

async function openBanner() {
  render(<CookieConsent />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return screen.getByRole("dialog", { name: "Cookie choices" });
}

describe("CookieConsent", () => {
  beforeEach(() => window.localStorage.clear());

  it("offers two short choices", async () => {
    await openBanner();

    expect(screen.getByRole("button", { name: "Allow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Only necessary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("keeps its message short", async () => {
    const banner = await openBanner();

    expect(banner.textContent?.length ?? 0).toBeLessThan(140);
  });

  it("sits in a bottom corner, not across the top of the page", async () => {
    const banner = await openBanner();

    expect(banner.className).toMatch(/\bbottom-/);
    expect(banner.className).not.toMatch(/\btop-/);
  });

  it("saves the choice and closes", async () => {
    const user = userEvent.setup();
    await openBanner();

    await user.click(screen.getByRole("button", { name: "Allow" }));

    expect(window.localStorage.getItem("cityfashion_cookie_consent")).toBe("accepted");
    expect(screen.queryByRole("dialog", { name: "Cookie choices" })).not.toBeInTheDocument();
  });
});
