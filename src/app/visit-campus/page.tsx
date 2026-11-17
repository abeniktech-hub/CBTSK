import type { Metadata } from "next";
import { campuses } from "@/data/campuses";
import { campusDirectionsUrl, isCampusPlaceholder } from "@/lib/campus-links";
import CopyAddressButton from "../components/CopyAddressButton";

export const metadata: Metadata = {
  title: "Visit Our Campus",
  description: "Campus contact and directions information for Cameroon Baptist Theological Seminary.",
};

export default function VisitCampusPage() {
  return (
    <main className="public-page mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-10 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Cameroon Baptist Theological Seminary</p>
        <h1 className="m-0 font-serif text-4xl font-semibold text-[var(--ink)] sm:text-5xl">Visit Our Campus</h1>
        <p className="mt-5 text-base leading-7 text-[var(--muted)]">Find contact and travel information for the seminary campuses. Some details are being confirmed.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {campuses.map((campus) => {
          const directions = campusDirectionsUrl(campus);
          return (
            <article id={campus.id} key={campus.id} className="grid content-start gap-5 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
              <header>
                <p className="eyebrow mb-2">{isCampusPlaceholder(campus.role) ? "Role to be confirmed" : campus.role}</p>
                <h2 className="m-0 font-serif text-2xl font-semibold">{campus.name}</h2>
                <p className="mb-0 mt-2 text-sm text-[var(--muted)]">Language of instruction: {campus.languageOfInstruction}</p>
              </header>
              <dl className="m-0 grid gap-3 text-sm">
                <div><dt className="font-bold">Address</dt><dd className="m-0 break-words text-[var(--muted)]">{isCampusPlaceholder(campus.address) ? "To be confirmed" : campus.address}</dd></div>
                <div><dt className="font-bold">Phone</dt><dd className="m-0 break-words text-[var(--muted)]">{isCampusPlaceholder(campus.phone) ? "To be confirmed" : campus.phone}</dd></div>
                <div><dt className="font-bold">Email</dt><dd className="m-0 break-words text-[var(--muted)]">{isCampusPlaceholder(campus.email) ? "To be confirmed" : campus.email}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-3">
                {directions
                  ? <a className="button a11y-gold-cta min-h-11 rounded-md" href={directions} target="_blank" rel="noopener noreferrer">Get directions</a>
                  : <span className="self-center text-sm font-semibold text-[var(--muted)]">Directions coming soon</span>}
                {!isCampusPlaceholder(campus.address) && campus.address.trim() && <CopyAddressButton address={campus.address} />}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
