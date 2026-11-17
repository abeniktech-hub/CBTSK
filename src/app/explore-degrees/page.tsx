import type { Metadata } from "next";
import Link from "next/link";
import { REGISTER_URL } from "@/config/site";
import { programmes, programmeLevels } from "@/data/programmes";
import { translate, translateProgramme } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";

function translatedLevel(locale: "en" | "fr", level: (typeof programmeLevels)[number]) {
  const keys = {
    "Fundamental Pastoral Training": "fundamentalPastoralTraining",
    Diploma: "diploma",
    "Bachelor of Arts": "bachelorOfArts",
    "Master of Arts": "masterOfArts",
  } as const;
  return translate(locale, keys[level]);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: translate(locale, "metaDegreesTitle"),
    description: translate(locale, "metaDegreesDescription"),
  };
}

export default async function ExploreDegreesPage() {
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <main className="public-page mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-10 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">{t("academicProgrammes")}</p>
        <h1 className="m-0 font-serif text-4xl font-semibold text-[var(--ink)] sm:text-5xl">{t("exploreDegreesTitle")}</h1>
      </header>
      <div className="grid gap-10">
        {programmeLevels.map((level) => {
          const items = programmes.filter((programme) => programme.level === level);
          return (
            <section key={level} aria-labelledby={`level-${programmeLevels.indexOf(level)}`}>
              <h2 id={`level-${programmeLevels.indexOf(level)}`} className="mb-4 font-serif text-3xl font-semibold text-[var(--accent)]">{translatedLevel(locale, level)}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((programme) => (
                  <article key={programme.id} className="grid content-start gap-4 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
                    <div>
                      <p className="eyebrow mb-2">{translatedLevel(locale, programme.level)}</p>
                      <h3 className="m-0 font-serif text-xl font-semibold">{translateProgramme(locale, programme.id, programme.name)}</h3>
                    </div>
                    <p className="m-0 text-sm text-[var(--muted)]">{t("detailsComingSoon")}</p>
                    <Link className="button a11y-gold-cta min-h-11 justify-self-start rounded-md" href={REGISTER_URL}>{t("registerNow")}</Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
