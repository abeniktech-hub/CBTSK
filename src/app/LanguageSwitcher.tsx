"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "./LocaleProvider";
import type { Locale } from "@/lib/i18n";

function isPortalPath(pathname: string) {
  return /^\/(login|register|apply|admin)(\/|$)/.test(pathname);
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, t } = useI18n();

  function changeLanguage(nextLocale: Locale) {
    const basePath = pathname === "/fr"
      ? "/"
      : pathname.startsWith("/fr/")
        ? pathname.slice(3)
        : pathname;
    const portalPath = isPortalPath(basePath);
    const nextPath = nextLocale === "fr" && !portalPath
      ? `/fr${basePath === "/" ? "" : basePath}`
      : basePath;
    document.cookie = `cbts-language=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.push(nextPath);
    router.refresh();
  }

  return (
    <nav aria-label={t("languageLabel")} className="language-switcher">
      <button type="button" aria-pressed={locale === "en"} onClick={() => changeLanguage("en")}>EN</button>
      <span aria-hidden="true">|</span>
      <button type="button" aria-pressed={locale === "fr"} onClick={() => changeLanguage("fr")}>FR</button>
    </nav>
  );
}
