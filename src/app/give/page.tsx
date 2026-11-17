import type { Metadata } from "next";
import GivingOptions from "./GivingOptions";

export const metadata: Metadata = {
  title: "Give",
  description: "Learn how to support Cameroon Baptist Theological Seminary.",
};

export default function GivePage() {
  return (
    <main className="public-page mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-10 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Support the seminary</p>
        <h1 className="m-0 font-serif text-4xl font-semibold text-[var(--ink)] sm:text-5xl">Give</h1>
        <p className="mt-5 text-base leading-7 text-[var(--muted)]">Choose a way to support the seminary and select where your gift may be directed.</p>
      </header>
      <GivingOptions />
    </main>
  );
}
