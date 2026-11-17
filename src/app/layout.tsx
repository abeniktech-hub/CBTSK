import type { Metadata } from "next";
import { headers } from "next/headers";
import ConditionalHeader from "./ConditionalHeader";
import ConditionalFooter from "./ConditionalFooter";
import { LocaleProvider } from "./LocaleProvider";
import { translate, type Locale } from "@/lib/i18n";
import "./globals.css";

function localizedPath(pathname: string, locale: Locale) {
  return locale === "fr" ? `/fr${pathname === "/" ? "" : pathname}` : pathname;
}

function isPortalPath(pathname: string) {
  return /^\/(login|register|apply|admin)(\/|$)/.test(pathname);
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const locale: Locale = requestHeaders.get("x-cbts-locale") === "fr" ? "fr" : "en";
  const pathname = requestHeaders.get("x-cbts-public-path") ?? "/";
  const pageTitle = pathname === "/visit-campus"
    ? translate(locale, "visitCampusTitle")
    : pathname === "/give"
      ? translate(locale, "giveTitle")
      : pathname === "/explore-degrees"
        ? translate(locale, "exploreDegreesTitle")
        : pathname === "/login"
          ? translate(locale, "signInTitle")
          : pathname === "/register"
            ? translate(locale, "registerTitle")
            : translate(locale, "metaHomeTitle");
  const description = pathname === "/visit-campus"
    ? translate(locale, "metaVisitDescription")
    : pathname === "/give"
      ? translate(locale, "metaGiveDescription")
      : pathname === "/explore-degrees"
        ? translate(locale, "metaDegreesDescription")
        : pathname === "/admissions"
          ? translate(locale, "metaAdmissionsDescription")
          : translate(locale, "metaHomeDescription");
  const alternates = isPortalPath(pathname)
    ? undefined
    : {
        canonical: localizedPath(pathname, locale),
        languages: {
          en: localizedPath(pathname, "en"),
          fr: localizedPath(pathname, "fr"),
        },
      };

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbts-kumba.example"),
    title: { default: pageTitle, template: "%s | CBTS" },
    description,
    alternates,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      locale: locale === "fr" ? "fr_CM" : "en_CM",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestHeaders = await headers();
  const locale: Locale = requestHeaders.get("x-cbts-locale") === "fr" ? "fr" : "en";
  const pathname = requestHeaders.get("x-cbts-public-path") ?? "/";

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>
          <ConditionalHeader />
          {locale === "fr" && isEnglishOfficialContent(pathname) && (
            <aside className="french-content-notice" lang="fr">{translate("fr", "englishVersionNotice")}</aside>
          )}
          <div className="flex flex-1 flex-col">{children}</div>
          <ConditionalFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
