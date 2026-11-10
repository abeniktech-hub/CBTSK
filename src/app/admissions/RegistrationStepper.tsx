import { registrationCopiesNote, registrationProcedures } from "@/data/admissions";

export default function RegistrationStepper() {
  return (
    <>
      <ol className="relative m-0 list-none space-y-6 border-l-2 border-[#0f5200] pl-7 sm:ml-3 sm:pl-9">
        {registrationProcedures.map(({ label, body }, index) => (
          <li key={label} className="relative">
            <span aria-hidden="true" className="absolute -left-[38px] top-0 grid size-8 place-items-center rounded-full border-2 border-white bg-[#0f5200] text-sm font-bold text-white sm:-left-[46px]">
              {String.fromCharCode(97 + index)}
            </span>
            <article className="rounded-lg border border-[#d6e5d8] bg-white p-5 shadow-sm sm:p-7">
              <h3 className="mb-3 mt-0 font-serif text-xl font-semibold text-[#321046]">{label}</h3>
              <p className="m-0 text-base leading-7 text-[#28352d]">{body}</p>
            </article>
          </li>
        ))}
      </ol>
      <aside className="mt-6 rounded-lg border-l-4 border-[#d6ad2e] bg-[#fff9e9] p-5 text-base leading-7 text-[#28352d] sm:p-7">
        {registrationCopiesNote}
      </aside>
    </>
  );
}
