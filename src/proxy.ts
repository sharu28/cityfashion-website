import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const primaryHost = "cityfashion.shop";
const localHosts = new Set(["localhost", "127.0.0.1"]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  if (!host || localHosts.has(host)) {
    return NextResponse.next();
  }

  if (host !== primaryHost) {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.host = primaryHost;

    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|robots.txt).*)"],
};
