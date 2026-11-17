import Link from "next/link";
import type { Campus } from "@/data/campuses";
import { translate, type Locale } from "@/lib/i18n";
import { campusDirectionsUrl, isCampusPlaceholder } from "@/lib/campus-links";

export default function CampusCard({ campus, locale }: { campus: Campus; locale: Locale }) {
  const directions = campusDirectionsUrl(campus);
  const learnMoreHref = campus.externalSiteUrl ?? `/visit-campus#${campus.id}`;
  const external = Boolean(campus.externalSiteUrl);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <article id={`campus-${campus.id}`} className="grid content-start gap-4 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="eyebrow mb-2">{isCampusPlaceholder(campus.role) ? t("roleToBeConfirmed") : campus.role === "Main Campus" ? t("mainCampus") : campus.role}</p>
        <h3 className="m-0 font-serif text-2xl font-semibold text-[var(--ink)]">{campus.name}</h3>
        <p className="mb-0 mt-2 text-sm text-[var(--muted)]">{t("languageOfInstruction")}: {campus.languageOfInstruction === "French" && locale === "fr" ? "français" : campus.languageOfInstruction === "English" && locale === "fr" ? "anglais" : campus.languageOfInstruction}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {directions
          ? <a className="button a11y-gold-cta min-h-11 rounded-md" href={directions} target="_blank" rel="noopener noreferrer">{t("getDirections")}</a>
          : <span className="text-sm font-semibold text-[var(--muted)]">{t("directionsComingSoon")}</span>}
        <Link className="button min-h-11 rounded-md border border-[var(--forest)] text-[var(--forest)]" href={learnMoreHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{t("learnMore")}</Link>
      </div>
    </article>
  );
}
