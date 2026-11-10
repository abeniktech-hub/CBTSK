"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { affirmation } from "@/data/affirmation";
import ArticleCard from "./ArticleCard";
import { articleAnchor } from "./anchors";
import Toc from "./Toc";

export default function AffirmationPageContent() {
  const [activeArticle, setActiveArticle] = useState(affirmation[0].n);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    const sections = affirmation.flatMap((article) => [
      { id: articleAnchor(article.n), article: article.n },
      ...(article.subs ?? []).map((sub) => ({ id: articleAnchor(sub.n), article: article.n })),
    ]);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.id;
        const active = sections.find((section) => section.id === id);
        if (active) setActiveArticle(active.article);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <main className="faith-page min-h-screen bg-[#f1f8f2] text-[#202b24]">
      <header className="bg-[#0f5200] px-5 py-9 text-white sm:px-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white">
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/#about">About</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Affirmation of Faith</li>
            </ol>
          </nav>
          <h1 className="m-0 font-serif text-3xl font-semibold sm:text-5xl">CBTS Affirmation of Faith</h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-10 sm:py-14">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            aria-pressed={expandAll}
            onClick={() => setExpandAll((expanded) => !expanded)}
            className="min-h-11 rounded-md border border-[#124f00] bg-white px-4 py-2 text-sm font-semibold text-[#124f00] hover:bg-[#e6f0e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2"
          >
            {expandAll ? "Collapse all references" : "Expand all references"}
          </button>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-9">
          <Toc activeArticle={activeArticle} />
          <div className="grid min-w-0 gap-5">
            {affirmation.map((article) => (
              <ArticleCard key={article.n} article={article} expandAll={expandAll} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
