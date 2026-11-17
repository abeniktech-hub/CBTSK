import { headers } from "next/headers";
import type { Locale } from "./i18n";

export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get("x-cbts-locale");
  return value === "fr" ? "fr" : "en";
}

export async function getRequestPath() {
  return (await headers()).get("x-cbts-public-path") ?? "/";
}

export function isEnglishOfficialContent(pathname: string) {
  return pathname === "/history"
    || pathname === "/philosophy"
    || pathname === "/affirmation-of-faith"
    || pathname === "/admissions"
    || pathname.includes("pledge")
    || pathname === "/apply/quotes";
}
