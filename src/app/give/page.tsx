import type { Metadata } from "next";
import { translate } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";
import GivingOptions from "./GivingOptions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: translate(locale, "giveTitle"),
    description: translate(locale, "metaGiveDescription"),
  };
}

export default async function GivePage() {
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <main className="public-page mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-10 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">{t("supportSeminary")}</p>
        <h1 className="m-0 font-serif text-4xl font-semibold text-[var(--ink)] sm:text-5xl">{t("giveTitle")}</h1>
        <p className="mt-5 text-base leading-7 text-[var(--muted)]">{t("giveIntro")}</p>
      </header>
      <GivingOptions />
    </main>
  );
}
