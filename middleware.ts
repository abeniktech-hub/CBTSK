import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./src/lib/supabase/database.types";

const localeCookie = "cbts-language";
const localeHeader = "x-cbts-locale";
const publicPathHeader = "x-cbts-public-path";

function isPortalPath(pathname: string) {
  return /^\/(login|register|apply|admin)(\/|$)/.test(pathname);
}

function isAssetPath(pathname: string) {
  return pathname.startsWith("/_next/") || pathname.includes(".");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefixedFrench = pathname === "/fr" || pathname.startsWith("/fr/");
  if (prefixedFrench) {
    const unprefixedPath = pathname === "/fr" ? "/" : pathname.slice(3);
    const responseUrl = request.nextUrl.clone();
    responseUrl.pathname = unprefixedPath;

    if (isPortalPath(unprefixedPath) || unprefixedPath.startsWith("/api/")) {
      const response = NextResponse.redirect(responseUrl);
      response.cookies.set(localeCookie, "fr", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(localeHeader, "fr");
    requestHeaders.set(publicPathHeader, unprefixedPath);
    const response = NextResponse.rewrite(responseUrl, { request: { headers: requestHeaders } });
    response.cookies.set(localeCookie, "fr", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (isAssetPath(pathname)) return NextResponse.next({ request });

  const isPortal = isPortalPath(pathname);
  const savedLocale = request.cookies.get(localeCookie)?.value === "fr" ? "fr" : "en";
  if (savedLocale === "fr" && !isPortal && !pathname.startsWith("/api/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/fr${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeader, isPortal ? savedLocale : "en");
  requestHeaders.set(publicPathHeader, pathname);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!isPortal && !pathname.startsWith("/api/")) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database, "public">(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const refreshedHeaders = new Headers(requestHeaders);
        refreshedHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: refreshedHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/:path*"],
};
