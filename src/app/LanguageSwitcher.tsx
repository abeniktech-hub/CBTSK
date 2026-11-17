"use client";

import { useI18n } from "./LocaleProvider";
import type { Locale } from "@/lib/i18n";

function isPortalPath(pathname: string) {
  return /^\/(login|register|apply|admin)(\/|$)/.test(pathname);
}

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();

  function changeLanguage(nextLocale: Locale) {
    const currentUrl = new URL(window.location.href);
    const pathname = currentUrl.pathname;
    const basePath = pathname === "/fr"
      ? "/"
      : pathname.startsWith("/fr/")
        ? pathname.slice(3)
        : pathname;
    const portalPath = isPortalPath(basePath);
    const nextPath = nextLocale === "fr" && !portalPath
      ? `/fr${basePath === "/" ? "" : basePath}`
      : basePath;
    const secure = currentUrl.protocol === "https:" ? "; Secure" : "";
    document.cookie = `cbts-language=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    currentUrl.pathname = nextPath;
    window.location.assign(currentUrl.toString());
  }

  return (
    <nav aria-label={t("languageLabel")} className="language-switcher">
      <button type="button" aria-pressed={locale === "en"} onClick={() => changeLanguage("en")}>EN</button>
      <span aria-hidden="true">|</span>
      <button type="button" aria-pressed={locale === "fr"} onClick={() => changeLanguage("fr")}>FR</button>
    </nav>
  );
}
