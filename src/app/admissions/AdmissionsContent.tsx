"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APPLY_URL } from "@/config/site";
import {
  addDropText,
  applicationProcedure,
  distanceLearningTexts,
  lateRegistrationTexts,
  matriculationStatements,
} from "@/data/admissions";
import LateRegistrationTimeline from "./LateRegistrationTimeline";
import RegistrationStepper from "./RegistrationStepper";
import RequirementsTabs from "./RequirementsTabs";

const pageSections = [
  { id: "introduction", label: "Introduction" },
  { id: "student-conduct", label: "Student Conduct" },
  { id: "application-procedure", label: "Application Procedure" },
  { id: "admission-requirements", label: "Admission Requirements" },
  { id: "registration-procedures", label: "Registration Procedures" },
  { id: "add-drop", label: "Add & Drop" },
  { id: "late-registration", label: "Late Registration" },
  { id: "distance-learning-centres", label: "Distance Learning Centres" },
  { id: "matriculation", label: "Matriculation" },
];

export default function AdmissionsContent() {
  const [activeSection, setActiveSection] = useState(pageSections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    );

    pageSections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#f1f8f2] text-[#202b24]">
      <header className="bg-[#0f5200] px-5 py-9 text-white sm:px-10 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white">
              <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/#about">About</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">Admissions</li>
              </ol>
            </nav>
            <h1 className="m-0 font-serif text-3xl font-semibold sm:text-5xl">
              Admissions and Registration
            </h1>
          </div>
          <Link
            href={APPLY_URL}
            className="inline-flex min-h-12 items-center rounded-md bg-white px-5 py-3 text-sm font-bold text-[#124f00] shadow-sm hover:bg-[#e6f0e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879] focus-visible:outline-offset-2"
          >
            Apply Now <span aria-hidden="true" className="ml-3">↗</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <nav
            aria-label="Admissions sections"
            className="sticky top-[76px] z-20 min-w-0 max-w-full -mx-5 bg-[#f1f8f2] px-5 py-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:bg-transparent lg:p-0"
          >
            <ul className="m-0 flex w-full min-w-0 list-none gap-2 overflow-x-auto p-0 lg:grid lg:gap-1">
              {pageSections.map(({ id, label }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "true" : undefined}
                    className={`block min-h-11 rounded-full px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6110] focus-visible:outline-offset-2 lg:rounded-md ${
                      activeSection === id
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

          <div className="grid min-w-0 gap-12">
            <section id="introduction" aria-labelledby="introduction-title" className="scroll-mt-24">
              <h2 id="introduction-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Introduction
              </h2>
              <p className="m-0 max-w-[75ch] text-base leading-7 text-[#28352d] sm:text-lg sm:leading-8">
                The Cameroon Baptist Theological Seminary looks for students who are growing in grace and knowledge of Christ (2 Pet. 3:18) and who have a heart for being part of building God&apos;s Kingdom through the proclamation of the gospel at any cost. A student&apos;s file will not be treated until all the required information is submitted.
              </p>
            </section>

            <section id="student-conduct" aria-labelledby="student-conduct-title" className="scroll-mt-24">
              <h2 id="student-conduct-title" className="mb-5 font-serif text-3xl font-semibold text-[#321046]">
                Student Conduct
              </h2>
              <div className="grid gap-4">
                <p className="m-0 max-w-[75ch] rounded-lg border border-[#d6e5d8] bg-white p-5 text-base leading-7 text-[#28352d] sm:p-6">
                  Students are admitted into CBTS with the understanding that he or she will adhere to the school&apos;s character, statutes, ordinances, regulations, rules, and by-laws, as well as enjoy privileges offered by the school.
                </p>
                <p className="m-0 max-w-[75ch] rounded-lg border border-[#d6e5d8] bg-white p-5 text-base leading-7 text-[#28352d] sm:p-6">
                  The Seminary expects students, both on and off campus, to conduct their lives in a manner worthy of the gospel of Christ (Phil 1:27). Students will seek to be moral, ethical, and lawful in their conduct both on and off campus. The school reserves the right to withdraw admission for conduct which is contrary to the objectives of CBTS and the Cameroon Baptist Convention.
                </p>
              </div>
            </section>

            <section id="application-procedure" aria-labelledby="application-procedure-title" className="scroll-mt-24">
              <h2 id="application-procedure-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Application Procedure
              </h2>
              <p className="mb-5 max-w-[75ch] text-base leading-7 text-[#28352d]">
                The application process provides the Senate with adequate information about the applicant to aid in deciding whether the applicant is qualified to fulfill the study requirements at CBTS. The following are required in the application process:
              </p>
              <ol className="m-0 max-w-[75ch] list-none space-y-3 p-0">
                {applicationProcedure.map((text, index) => (
                  <li key={text} className="flex items-start gap-3 text-base leading-7 text-[#28352d]">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0f5200] text-sm font-bold text-white">{index + 1}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
              <p className="mb-0 mt-5 font-bold text-[#202b24]">(See admission requirements below)</p>
            </section>

            <section id="admission-requirements" aria-labelledby="admission-requirements-title" className="scroll-mt-24">
              <h2 id="admission-requirements-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Admission Requirements
              </h2>
              <p className="mb-6 max-w-[75ch] text-base leading-7 text-[#28352d]">
                Before admission into CBTS, all the admission requirements must be fulfilled. The following are the admission requirements for the different programs at CBTS.
              </p>
              <RequirementsTabs />
            </section>

            <section id="registration-procedures" aria-labelledby="registration-procedures-title" className="scroll-mt-24">
              <h2 id="registration-procedures-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Registration Procedures
              </h2>
              <p className="mb-7 max-w-[75ch] text-base leading-7 text-[#28352d]">
                Every semester begins with registration which goes on for the first two days. Each student registers in person with all the necessary documents required by the institution. The procedure for registration is as follows:
              </p>
              <RegistrationStepper />
            </section>

            <section id="add-drop" aria-labelledby="add-drop-title" className="scroll-mt-24">
              <h2 id="add-drop-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Add &amp; Drop
              </h2>
              <article className="max-w-[75ch] rounded-lg border-l-4 border-[#0f5200] bg-white p-5 shadow-sm sm:p-7">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#124f00]">
                  c. Only for B. A. and above
                </p>
                <p className="m-0 text-base leading-7 text-[#28352d]">
                  {addDropText}
                </p>
              </article>
            </section>

            <section id="late-registration" aria-labelledby="late-registration-title" className="scroll-mt-24">
              <h2 id="late-registration-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Late Registration
              </h2>
              <div className="mb-7 grid gap-3">
                {lateRegistrationTexts.map((text, index) => (
                  <p key={text} className="m-0 max-w-[75ch] rounded-lg border border-[#d6e5d8] bg-white p-5 text-base leading-7 text-[#28352d]">
                    <strong className="mr-2 text-[#124f00]">{index === 0 ? "d." : "e."}</strong>
                    {text}
                  </p>
                ))}
              </div>
              <LateRegistrationTimeline />
            </section>

            <section id="distance-learning-centres" aria-labelledby="distance-learning-title" className="scroll-mt-24">
              <h2 id="distance-learning-title" className="mb-4 font-serif text-3xl font-semibold text-[#321046]">
                Distance Learning Centres (DLCs)
              </h2>
              <article className="max-w-[75ch] rounded-lg border border-[#d6e5d8] bg-white p-5 shadow-sm sm:p-7">
                {distanceLearningTexts.map((text) => (
                  <p key={text} className="mb-4 last:mb-0 text-base leading-7 text-[#28352d]">
                    {text}
                  </p>
                ))}
              </article>
            </section>

            <section id="matriculation" aria-labelledby="matriculation-title" className="scroll-mt-24">
              <h2 id="matriculation-title" className="mb-5 font-serif text-3xl font-semibold text-[#321046]">
                Matriculation
              </h2>
              <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
                {matriculationStatements.map((text, index) => (
                  <li key={text} className="rounded-lg border border-[#d6e5d8] bg-white p-5 shadow-sm sm:p-6">
                    <span aria-hidden="true" className="mb-4 grid size-11 place-items-center rounded-full bg-[#e6f0e5] text-xl font-bold text-[#124f00]">
                      {["✦", "✓", "§"][index]}
                    </span>
                    <p className="m-0 text-base leading-7 text-[#28352d]">{text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
