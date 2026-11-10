import { presidents } from "@/data/presidents";

export default function PresidentsTimeline() {
  return (
    <ol className="relative mt-8 ml-3 border-l-2 border-[#6e238e] pl-7 sm:ml-4 sm:pl-9">
      {presidents.map((president) => (
        <li className="relative pb-8 last:pb-0" key={president.name}>
          <span
            aria-hidden="true"
            className={`absolute top-1.5 -left-[35px] h-4 w-4 rounded-full border-[3px] border-[#fffaf1] sm:-left-[43px] ${
              president.end === null ? "bg-[#6e238e] ring-2 ring-[#d8b333]" : "bg-[#9a78a7]"
            }`}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="m-0 text-lg font-semibold text-[#321046]">{president.name}</h3>
            {president.end === null && (
              <span className="rounded-full bg-[#f2e3a8] px-3 py-1 text-xs font-bold text-[#321046]">
                Current
              </span>
            )}
          </div>
          <p className="mt-1 mb-0 text-base text-[#50435a]">
            {president.start}–{president.end ?? "Date"}
          </p>
        </li>
      ))}
    </ol>
  );
}
