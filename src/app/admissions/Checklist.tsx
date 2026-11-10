"use client";

import { useState } from "react";
import type { Requirement } from "@/data/admissions";

export default function Checklist({
  programId,
  requirements,
}: {
  programId: string;
  requirements: Requirement[];
}) {
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const ready = requirements.filter((item) => checked[`${programId}-${item.n}`]).length;

  return (
    <div className="mt-5">
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => setEnabled((value) => !value)}
        className="min-h-11 rounded-md border border-[#0f5200] px-4 py-2 text-sm font-semibold text-[#124f00] hover:bg-[#edf5ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2"
      >
        {enabled ? "Turn checklist off" : "Use checklist"}
      </button>
      {enabled && (
        <p aria-live="polite" className="mb-0 mt-3 text-sm font-semibold text-[#124f00]">
          {ready} of {requirements.length} ready
        </p>
      )}
      {enabled && (
        <p className="mb-0 mt-1 text-xs text-[#46564a]">
          This checklist is for your own tracking; it does not submit anything.
        </p>
      )}
      <ol className="m-0 mt-5 list-none space-y-3 p-0">
        {requirements.map(({ n, text }) => {
          const itemId = `${programId}-requirement-${n}`;
          return (
            <li key={n} className="flex items-start gap-3 text-base leading-7 text-[#28352d]">
              {enabled && (
                <input
                  id={itemId}
                  type="checkbox"
                  checked={Boolean(checked[`${programId}-${n}`])}
                  onChange={(event) => {
                    const isChecked = event.currentTarget.checked;
                    setChecked((previous) => ({
                      ...previous,
                      [`${programId}-${n}`]: isChecked,
                    }));
                  }}
                  className="mt-2 size-4 shrink-0 accent-[#0f5200] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2"
                />
              )}
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e6f0e5] text-sm font-bold text-[#124f00]">
                {n}
              </span>
              {enabled ? <label htmlFor={itemId}>{text}</label> : <span>{text}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
