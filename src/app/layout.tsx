import type { Metadata } from "next";
import { headers } from "next/headers";
import ConditionalHeader from "./ConditionalHeader";
import ConditionalFooter from "./ConditionalFooter";
import { LocaleProvider } from "./LocaleProvider";
import { translate, type Locale, type MessageKey } from "@/lib/i18n";
import { isEnglishOfficialContent } from "@/lib/locale-server";
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
  const pageMetadata: Record<string, { title: MessageKey; description: MessageKey }> = {
    "/": { title: "metaHomeTitle", description: "metaHomeDescription" },
    "/visit-campus": { title: "visitCampusTitle", description: "metaVisitDescription" },
    "/give": { title: "giveTitle", description: "metaGiveDescription" },
    "/explore-degrees": { title: "metaDegreesTitle", description: "metaDegreesDescription" },
    "/admissions": { title: "metaAdmissionsTitle", description: "metaAdmissionsDescription" },
    "/history": { title: "metaHistoryTitle", description: "metaHistoryDescription" },
    "/philosophy": { title: "metaPhilosophyTitle", description: "metaPhilosophyDescription" },
    "/affirmation-of-faith": { title: "metaAffirmationTitle", description: "metaAffirmationDescription" },
    "/login": { title: "signInTitle", description: "metaAdmissionsDescription" },
    "/register": { title: "registerTitle", description: "metaAdmissionsDescription" },
  };
  const keys = pageMetadata[pathname] ?? pageMetadata["/"];
  const pageTitle = translate(locale, keys.title);
  const description = translate(locale, keys.description);
  const alternates = isPortalPath(pathname)
    ? undefined
    : {
        canonical: localizedPath(pathname, locale),
        languages: {
          en: localizedPath(pathname, "en"),
          fr: localizedPath(pathname, "fr"),
          "x-default": localizedPath(pathname, "en"),
        },
      };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
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
