import type { Metadata } from "next";
import Link from "next/link";
import { objectives } from "@/data/objectives";
import EvaluationSection from "./EvaluationSection";
import ObjectiveCard from "./ObjectiveCard";

export const metadata: Metadata = {
  title: { absolute: "Educational Philosophy | CBTS" },
  description:
    "Explore CBTS's educational philosophy: biblical training that prepares Christian ministry students for spiritual, cultural, intellectual, and vocational growth.",
};

export default function PhilosophyPage() {
  return (
    <main className="min-h-screen bg-[#f1f8f2] text-[#202b24]">
      <header className="bg-[#0f5200] px-5 py-9 text-white sm:px-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white">
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              <li>
                <Link
                  className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]"
                  href="/#about"
                >
                  About
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Philosophy</li>
            </ol>
          </nav>
          <h1 className="m-0 font-serif text-3xl font-semibold sm:text-5xl">
            Educational Philosophy
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-10 sm:py-14">
        <section aria-labelledby="philosophy-intro-title">
          <h2
            id="philosophy-intro-title"
            className="mb-4 font-serif text-2xl font-semibold text-[#321046] sm:text-3xl"
          >
            Our Educational Purpose
          </h2>
          <p className="m-0 max-w-[70ch] text-lg leading-[1.7] text-[#28352d]">
            The purposes and objectives of CBTS are as follows:
          </p>
        </section>

        <section
          aria-labelledby="objectives-title"
          className="mt-10"
        >
          <h2
            id="objectives-title"
            className="mb-4 font-serif text-2xl font-semibold text-[#321046] sm:text-3xl"
          >
            Educational Objectives
          </h2>
          <p className="mb-7 max-w-[75ch] text-base leading-7 text-[#28352d] sm:text-lg sm:leading-8">
            <strong><em>Objectives:</em></strong>{" "}
            Training at CBTS integrates both theory and practice at all levels. The following general objectives are designed to define the scope and purpose of the programs offered by the Seminary. The Seminary exists to provide biblical, theological, historical, and practical training in Christian ministry for pastors, administrators, chaplains, theological teachers, and other Christian workers within the Cameroon, Africa and beyond. Graduation from this institution should enable a student to demonstrate growth and development:
          </p>

          <ol className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 sm:gap-6">
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.n} {...objective} />
            ))}
          </ol>
        </section>

        {/* Evaluation of Objectives section goes here */}
        <EvaluationSection />
      </div>
    </main>
  );
}
