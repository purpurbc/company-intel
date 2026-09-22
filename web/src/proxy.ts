import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DETAIL_API_ROUTES: Array<{
  pattern: RegExp;
  apiPath: (value: string) => string;
}> = [
  {
    pattern: /^\/company\/([^/]+)\/?$/,
    apiPath: (value) => `/company/${encodeURIComponent(value)}`,
  },
  {
    pattern: /^\/county\/([^/]+)\/?$/,
    apiPath: (value) => `/county/${encodeURIComponent(value)}`,
  },
  {
    pattern: /^\/municipality\/([^/]+)\/?$/,
    apiPath: (value) => `/municipality/${encodeURIComponent(value)}`,
  },
];

/** Resolve missing detail resources before React starts streaming a 200 response. */
export async function proxy(request: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) return NextResponse.next();

  const route = DETAIL_API_ROUTES.find(({ pattern }) =>
    pattern.test(request.nextUrl.pathname),
  );
  if (!route) return NextResponse.next();

  const match = request.nextUrl.pathname.match(route.pattern);
  if (!match) return NextResponse.next();

  const response = await fetch(`${apiBase}${route.apiPath(decodeURIComponent(match[1]))}`, {
    cache: "no-store",
  });
  if (response.status !== 404) return NextResponse.next();

  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = {
  matcher: ["/company/:path*", "/county/:path*", "/municipality/:path*"],
};
