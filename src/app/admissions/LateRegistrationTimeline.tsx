const stages = [
  "Days 1-2: Registration",
  "After day 2: Penalty",
  "Second week: Penalty doubles",
  "End of week 2: Considered withdrawn",
];

export default function LateRegistrationTimeline() {
  return (
    <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-4 md:gap-0">
      {stages.map((stage, index) => (
        <li key={stage} className="relative flex items-center gap-4 md:flex-col md:items-start md:px-4 md:pt-8">
          <span
            aria-hidden="true"
            className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
              index === 3 ? "bg-[#321046]" : "bg-[#0f5200]"
            }`}
          >
            {index + 1}
          </span>
          {index < stages.length - 1 && (
            <span aria-hidden="true" className="absolute bottom-[-20px] left-[17px] top-9 w-0.5 bg-[#b8d2b5] md:bottom-auto md:left-1/2 md:right-[-50%] md:top-[17px] md:h-0.5 md:w-auto" />
          )}
          <p className="relative z-10 m-0 max-w-[22ch] rounded-md bg-[#f1f8f2] px-3 py-2 text-sm font-semibold leading-6 text-[#202b24] md:mt-4 md:bg-transparent md:px-0">
            {stage}
          </p>
        </li>
      ))}
    </ol>
  );
}
