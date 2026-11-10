import type { Metadata } from "next";
import Link from "next/link";
import PresidentsTimeline from "./PresidentsTimeline";

export const metadata: Metadata = {
  title: { absolute: "History | CBTS" },
  description:
    "Explore the history of Cameroon Baptist Theological Seminary, from its 1947 beginnings in Belo and move to Ndu to the later establishment of its Kumba campus.",
};

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#f1f8f2] text-[#202b24]">
      <header className="bg-[#0f5200] px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white">
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2d879]" href="/#about">About</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">History</li>
            </ol>
          </nav>
          <h1 className="m-0 font-serif text-4xl font-semibold sm:text-5xl">History</h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <section aria-labelledby="origins-title">
          <h2 id="origins-title" className="mb-8 font-serif text-3xl font-semibold text-[#42135b] sm:text-4xl">
            Origins
          </h2>
          <div className="max-w-[70ch] text-lg leading-[1.7] text-[#28352d]">
            <h3 className="mb-5 font-serif text-2xl font-semibold text-[#42135b]">CBTS History</h3>
            <h4 className="mb-3 font-serif text-xl font-semibold text-[#42135b]">Early Beginnings</h4>
            <p className="mb-6">
              CBTS, as it is commonly called today, started in 1947 in Belo. Missionaries from the North American Baptist denomination were organizing churches at the time and saw the need to train pastors to serve in these churches. So CBTS was established. The first student body was comprised of fourteen part-time students. Rev. Don S. Ganstom was appointed as the first principal-teacher, assisted by Rev. Stephen N. Nteff and Mrs. Lois Ahrens. Clearly from the beginning the hand of the Lord was upon this educational enterprise. The student body continued to grow steadily.
            </p>
            <p className="mb-8">
              After three years of existence, CBTS was moved to Mbem in 1950. The student body continued to grow to 28 students. The growth of the school also made imperative the appointment of part-time teachers. Missionaries took turns to go to Mbem and teach for a month or more. In 1954 after considering many things, including future expansion, the school was moved to Ndu with 41 students. As the school expanded its programs, dormitories and staff quarters were constructed. During the time of 1954-1959 classes were held in temporary buildings.
            </p>

            <h4 className="mb-3 font-serif text-xl font-semibold text-[#42135b]">Changes of Name</h4>
            <p className="mb-8">
              In 1954, when the school was moved from Mbem to Ndu, the name was changed from Cameroon Baptist Mission Bible School to Baptist Bible Training Centre, Ndu. In 1973, it was again changed, but retaining the former initials, to Baptist Bible Training College to indicate its secondary level status. Then in 1983 the name was changed to Cameroon Baptist Theological Seminary, this time to show its status as a degree-offering institution. Following this change of status, in 1988 the title for the position of Principal was changed to that of President.
            </p>

            <h4 className="mb-3 font-serif text-xl font-semibold text-[#42135b]">Buildings</h4>
            <p className="mb-6">
              Between 1960 and 1972 under the leadership of Rev. Elmer C. Strauss, plans were made for the construction of new classrooms, a library/office building, and a chapel. North American Baptist churches financed these buildings. Later in 1981 an extension was added to the library, turning the old library into a reading room and making a new book stacks area and offices for the library. This was followed by some renovation of the main single students’ dormitory into several smaller room units and the building of three more adequate staff houses. Since then two rooms have been added to the library, a conference room on the eastern side and two classrooms on the western side of the building. One of the rooms on the western side now serves as the Digital Library. In 1998, The Baptist World Alliance donated funds for the construction of another extension, on the western side of the main library. This is still in the process of being furnished. The churches of the NAB provided funds for the reading tables of this extension.
            </p>
            <p className="mb-8">
              In 1985 a school for teaching missionary children (CAN) was built. In 1996 it was remodeled and made into a building for the Women’s Ministries Department, with office and classroom space, a conference room, a small sewing room, and modern kitchen facility for domestic science classes. During 1995-1996, a Child Care Centre was built. The Bethlehem Baptist Church of Minneapolis, USA also donated funds for the storey building (the Bethlehem Complex), which now provides enough space for offices, the Wycliffe Hall, and fourteen classrooms.
            </p>

            <h4 className="mb-3 font-serif text-xl font-semibold text-[#42135b]">Extension to Kumba</h4>
            <p className="mb-0">
              While the seminary continued to develop at Ndu, a need arose for a second centre on the coast. In About 2001 years ago, the plan to open an extension center of the seminary in Kumba came up. Most of the attempts in this light proved futile until the Lord blessed the efforts of Ma Alma Henderson, the wife of the former missionary to Kumba. A donation was made to that effect with the purpose of beginning the seminary. This Seminary, at the time called the Cameroon Baptist Seminary, Kumba came as an answer to the need for more coastal pastors to be involved in the ministry, especially given the distance to Ndu.
            </p>
          </div>
        </section>

        <section aria-labelledby="presidents-title" className="mt-16 border-t border-[#d6e5d8] pt-12">
          <h2 id="presidents-title" className="font-serif text-3xl font-semibold text-[#42135b] sm:text-4xl">
            Presidents of the Seminary
          </h2>
          <p className="mt-4 mb-0 text-lg leading-[1.7] text-[#28352d]">
            Since its inception, the following Presidents have led the institution:
          </p>
          <PresidentsTimeline />
        </section>

        <section aria-labelledby="campuses-title" className="mt-16 rounded-lg border-l-4 border-[#d0aa24] bg-[#f7edc7] p-6 text-[#321046] sm:p-9">
          <h2 id="campuses-title" className="mb-4 font-serif text-2xl font-semibold sm:text-3xl">
            One Seminary, Two Campuses
          </h2>
          <p className="m-0 max-w-[70ch] text-lg leading-[1.7]">
            Few years ago, the hierarchy of the CBC took a decision to have one seminary of the CBC operating on two campuses. With the on-going harmonization program, CBTS is now led by one Provost and two Deputy Provosts.
          </p>
        </section>
      </div>
    </main>
  );
}
