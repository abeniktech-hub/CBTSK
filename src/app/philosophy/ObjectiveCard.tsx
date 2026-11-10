"use client";

import { useEffect, useRef, useState } from "react";
import type { Objective } from "@/data/objectives";

export default function ObjectiveCard({ n, keyword, body }: Objective) {
  const cardRef = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      card.classList.add("philosophy-objective--visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={cardRef}
      className={`philosophy-objective ${visible ? "philosophy-objective--visible" : ""} rounded-lg border-t-4 border-[#0f5200] bg-white p-5 shadow-sm sm:p-6`}
    >
      <div className="mb-5 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0f5200] text-lg font-bold text-white"
        >
          {n}
        </span>
        <h3 className="m-0 text-sm font-bold tracking-[0.14em] text-[#124f00]">
          {n}. {keyword}
        </h3>
      </div>
      <p className="m-0 text-base leading-7 text-[#28352d]">{body}</p>
    </li>
  );
}
