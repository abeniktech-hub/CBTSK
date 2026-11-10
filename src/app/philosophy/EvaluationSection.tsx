"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { evaluationObjectives } from "@/data/evaluation";

const spiritualPractices = [
  "Prayer Partners",
  "Evangelism Week",
  "Staff-Student Retreats",
  "Missions Conference",
];

export default function EvaluationSection() {
  const [activeId, setActiveId] = useState(evaluationObjectives[0].id);

  useEffect(() => {
    const headerHeight = window.matchMedia("(max-width: 760px)").matches ? 108 : 122;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: `-${headerHeight}px 0px -65% 0px`, threshold: 0 },
    );

    evaluationObjectives.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  function scrollToObjective(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    const headerHeight = window.matchMedia("(max-width: 760px)").matches ? 108 : 122;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <section
      id="evaluation"
      aria-labelledby="evaluation-title"
      className="mt-16 border-t border-[#d6e5d8] pt-12"
    >
      <h2
        id="evaluation-title"
        className="mb-8 font-serif text-3xl font-semibold text-[#321046] sm:text-4xl"
      >
        Evaluation of Objectives
      </h2>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <nav
          aria-label="Evaluation sections"
          className="sticky top-3 z-10 min-w-0 max-w-full -mx-5 bg-[#f1f8f2] px-5 py-2 sm:-mx-10 sm:px-10 lg:top-6 lg:mx-0 lg:bg-transparent lg:p-0"
        >
          <ul className="m-0 flex w-full min-w-0 list-none gap-2 overflow-x-auto p-0 lg:grid lg:gap-1">
            {evaluationObjectives.map(({ id, label }) => (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  aria-current={activeId === id ? "true" : undefined}
                  onClick={(event) => scrollToObjective(event, id)}
                  className={`block min-h-11 rounded-full px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2 lg:rounded-md ${
                    activeId === id
                      ? "bg-[#0f5200] text-white"
                      : "bg-white text-[#28352d] hover:bg-[#e6f0e5] lg:bg-transparent"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid min-w-0 gap-5">
          {evaluationObjectives.map(({ id, label, body }) => (
            <article
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              className={`evaluation-block evaluation-block--${id} min-w-0 scroll-mt-[108px] rounded-lg border border-[#d6e5d8] bg-white p-5 sm:p-7`}
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#124f00]">
                {label}
              </p>
              <h3 id={`${id}-title`} className="sr-only">
                {label}
              </h3>
              <p className="m-0 max-w-[70ch] text-base leading-7 text-[#28352d]">
                {body}
              </p>
              {id === "spiritual" && (
                <ul
                  aria-label="Spiritual development activities"
                  className="mt-5 flex list-none flex-wrap gap-2 p-0"
                >
                  {spiritualPractices.map((practice) => (
                    <li
                      key={practice}
                      className="rounded-full border border-[#b8d2b5] bg-[#edf5ec] px-3 py-1.5 text-xs font-semibold text-[#124f00]"
                    >
                      {practice}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
