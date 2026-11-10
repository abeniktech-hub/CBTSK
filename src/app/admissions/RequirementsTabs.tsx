"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { admissionPrograms } from "@/data/admissions";
import Checklist from "./Checklist";

const tabIds = admissionPrograms.map((program) => program.id);

function getHashTab(): (typeof tabIds)[number] {
  if (typeof window !== "undefined" && tabIds.includes(window.location.hash.slice(1) as (typeof tabIds)[number])) {
    return window.location.hash.slice(1) as (typeof tabIds)[number];
  }
  return "ma";
}

export default function RequirementsTabs() {
  const [activeId, setActiveId] = useState<(typeof tabIds)[number]>("ma");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activate = useCallback((id: (typeof tabIds)[number], updateHash = true) => {
    setActiveId(id);
    if (updateHash) window.history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    const syncHash = () => setActiveId(getHashTab());
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabIds.indexOf(activeId);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabIds.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabIds.length - 1;
    else return;

    event.preventDefault();
    const nextId = tabIds[nextIndex];
    tabRefs.current[nextIndex]?.focus();
    activate(nextId);
  }

  const activeProgram = admissionPrograms.find((program) => program.id === activeId) ?? admissionPrograms[0];

  return (
    <div>
      <div role="tablist" aria-label="Admission requirements by program" className="mb-6 flex flex-wrap gap-2 border-b border-[#d6e5d8]">
        {admissionPrograms.map((program, index) => (
          <button
            key={program.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`admission-tab-${program.id}`}
            type="button"
            role="tab"
            aria-selected={activeId === program.id}
            aria-controls="admission-requirements-panel"
            tabIndex={activeId === program.id ? 0 : -1}
            onClick={() => activate(program.id)}
            onKeyDown={onTabKeyDown}
            className={`min-h-11 rounded-t-md border-b-4 px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2 ${
              activeId === program.id
                ? "border-[#0f5200] bg-white text-[#124f00]"
                : "border-transparent text-[#28352d] hover:bg-white"
            }`}
          >
            {program.label}
          </button>
        ))}
      </div>
      <section
        id="admission-requirements-panel"
        role="tabpanel"
        aria-labelledby={`admission-tab-${activeId}`}
        tabIndex={0}
        className="rounded-lg border border-[#d6e5d8] bg-white p-5 shadow-sm sm:p-8"
      >
        {activeProgram.intro && (
          <p className="mb-6 max-w-[75ch] text-base leading-7 text-[#28352d]">
            {activeProgram.intro}
          </p>
        )}
        {activeProgram.leadIn && (
          <p className="mb-4 text-base font-semibold leading-7 text-[#202b24]">
            {activeProgram.leadIn}
          </p>
        )}
        <Checklist programId={activeProgram.id} requirements={activeProgram.requirements} />
      </section>
    </div>
  );
}
