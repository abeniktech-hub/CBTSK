import { affirmation } from "@/data/affirmation";
import { articleAnchor } from "./anchors";

function ArticleLinks({ activeArticle }: { activeArticle: number }) {
  return (
    <ul className="m-0 grid list-none gap-1 p-0">
      {affirmation.map((article) => {
        const active = activeArticle === article.n;
        return (
          <li key={article.n}>
            <a
              href={`#${articleAnchor(article.n)}`}
              aria-current={active ? "true" : undefined}
              className={`block min-h-11 rounded px-3 py-3 text-sm leading-5 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2 ${
                active ? "bg-[#e6f0e5] font-bold text-[#124f00]" : "text-[#28352d] hover:bg-[#f1f8f2] hover:underline"
              }`}
            >
              {article.n}. {article.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function Toc({ activeArticle }: { activeArticle: number }) {
  return (
    <>
      <details className="mb-6 rounded-lg border border-[#cbdccf] bg-white p-4 lg:hidden">
        <summary className="min-h-11 cursor-pointer rounded-sm py-3 font-semibold text-[#124f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2">
          Jump to article
        </summary>
        <nav aria-label="Articles" className="pt-2">
          <ArticleLinks activeArticle={activeArticle} />
        </nav>
      </details>
      <nav aria-label="Articles" className="sticky top-6 hidden self-start rounded-lg border border-[#d6e5d8] bg-white p-4 shadow-sm lg:block">
        <h2 className="mb-3 mt-1 font-serif text-lg font-semibold text-[#202b24]">Articles</h2>
        <ArticleLinks activeArticle={activeArticle} />
      </nav>
    </>
  );
}
