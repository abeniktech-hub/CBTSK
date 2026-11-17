import Link from "next/link";
import type { Campus } from "@/data/campuses";
import { campusDirectionsUrl, isCampusPlaceholder } from "@/lib/campus-links";

export default function CampusCard({ campus }: { campus: Campus }) {
  const directions = campusDirectionsUrl(campus);
  const learnMoreHref = campus.externalSiteUrl ?? `/visit-campus#${campus.id}`;
  const external = Boolean(campus.externalSiteUrl);

  return (
    <article id={`campus-${campus.id}`} className="grid content-start gap-4 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="eyebrow mb-2">{isCampusPlaceholder(campus.role) ? "Role to be confirmed" : campus.role}</p>
        <h3 className="m-0 font-serif text-2xl font-semibold text-[var(--ink)]">{campus.name}</h3>
        <p className="mb-0 mt-2 text-sm text-[var(--muted)]">Language of instruction: {campus.languageOfInstruction}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {directions
          ? <a className="button a11y-gold-cta min-h-11 rounded-md" href={directions} target="_blank" rel="noopener noreferrer">Get directions</a>
          : <span className="text-sm font-semibold text-[var(--muted)]">Directions coming soon</span>}
        <Link className="button min-h-11 rounded-md border border-[var(--forest)] text-[var(--forest)]" href={learnMoreHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>Learn more</Link>
      </div>
    </article>
  );
}
