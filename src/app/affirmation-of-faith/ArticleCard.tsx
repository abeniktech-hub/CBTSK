"use client";

import { useEffect, useRef, useState } from "react";
import type { Article } from "@/data/affirmation";
import { articleAnchor } from "./anchors";

type ArticleCardProps = {
  article: Article;
  expandAll: boolean;
};

function ScriptureReferences({
  references,
  label = "Scripture references",
}: {
  references: string;
  label?: string;
}) {
  return (
    <details className="mt-5 border-t border-[#d6e5d8] pt-4">
      <summary className="w-fit cursor-pointer rounded-sm text-sm font-semibold text-[#124f00] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-4">
        {label}
      </summary>
      <p className="mb-0 mt-3 max-w-[70ch] break-words text-sm leading-7 text-[#46564a]">{references}</p>
    </details>
  );
}

export default function ArticleCard({ article, expandAll }: ArticleCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    cardRef.current?.querySelectorAll("details").forEach((details) => {
      details.open = expandAll;
    });
  }, [expandAll]);

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#${articleAnchor(article.n)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Unable to copy link");
    }
  }

  return (
    <article
      ref={cardRef}
      id={articleAnchor(article.n)}
      aria-labelledby={`${articleAnchor(article.n)}-title`}
      className="scroll-mt-24 rounded-xl border border-[#d6e5d8] bg-white p-5 shadow-sm sm:p-8 lg:p-10"
    >
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-[#0f5200] text-sm font-bold text-white">
          {article.n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id={`${articleAnchor(article.n)}-title`} className="m-0 font-serif text-2xl font-semibold leading-tight text-[#202b24] sm:text-3xl">
              {article.title}
            </h2>
            <button
              type="button"
              onClick={copyLink}
              className="min-h-11 rounded px-2 text-sm font-medium text-[#124f00] underline underline-offset-4 hover:text-[#321046] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2"
            >
              Copy link
            </button>
            <span className="sr-only" aria-live="polite">{copyStatus}</span>
          </div>
          {article.body && <p className="mb-0 mt-4 max-w-[70ch] text-[17px] leading-[1.7] text-[#28352d]">{article.body}</p>}
        </div>
      </div>

      {article.subs && (
        <div className="mt-7 space-y-7 border-t border-[#d6e5d8] pt-6 sm:ml-14">
          {article.subs.map((sub) => (
            <section key={sub.n} id={articleAnchor(sub.n)} aria-labelledby={`${articleAnchor(sub.n)}-title`} className="scroll-mt-24">
              <h3 id={`${articleAnchor(sub.n)}-title`} className="m-0 font-serif text-xl font-semibold text-[#321046] sm:text-2xl">
                {sub.n} {sub.title}
              </h3>
              <p className="mb-0 mt-3 max-w-[70ch] text-[17px] leading-[1.7] text-[#28352d]">{sub.body}</p>
              {sub.refs && <ScriptureReferences references={sub.refs} />}
            </section>
          ))}
        </div>
      )}

      {article.refs && (
        <div className={article.subs ? "mt-7 border-t border-[#d6e5d8] pt-5 sm:ml-14" : "mt-7 border-t border-[#d6e5d8] pt-5"}>
          <ScriptureReferences
            references={article.refs}
            label={article.n === 4 ? "Scripture references for Article 4" : "Scripture references"}
          />
        </div>
      )}
    </article>
  );
}
