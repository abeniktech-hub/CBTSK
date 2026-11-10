import Image from "next/image";
import PhotoCarousel, { type PhotoSlide } from "./components/photo-carousel";

const studyAreas = [
  { number: "01", title: "Biblical studies", text: "Build a thoughtful foundation in scripture, interpretation and the story of the Christian faith." },
  { number: "02", title: "Pastoral formation", text: "Grow in the practical skills and spiritual maturity that support caring, grounded ministry." },
  { number: "03", title: "Christian leadership", text: "Prepare to serve churches and communities with wisdom, humility and a sense of calling." },
];

const campusSlides: PhotoSlide[] = [
  {
    src: "/kumba-academic-complex.jpg",
    alt: "The academic complex at Cameroon Baptist Theological Seminary, Kumba Campus",
    title: "The seminary campus complex",
    detail: "Cameroon Baptist Theological Seminary · Kumba Campus",
  },
  {
    src: "/chapel-service-gathering.jpg",
    alt: "Students gathered for a chapel service during orientation",
    title: "Chapel service",
    detail: "2026/2027 academic year orientation",
  },
  {
    src: "/chapel-service-message.jpg",
    alt: "A speaker sharing a message during a chapel service",
    title: "Worship, learning and fellowship",
    detail: "2026/2027 academic year orientation",
  },
];

const chapelSlides: PhotoSlide[] = [
  { src: "/chapel-service-worship.jpg", alt: "Students standing together in worship during chapel", title: "A time of worship", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-prayer.jpg", alt: "Students and members of the seminary community in prayer", title: "Gathered in prayer", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-message.jpg", alt: "A speaker sharing a message during chapel", title: "Sharing the message", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-gathering.jpg", alt: "The chapel congregation gathered for the service", title: "Together in chapel", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-community.jpg", alt: "Members of the seminary community attending chapel", title: "The seminary community", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-worship-team.jpg", alt: "Students standing together in worship", title: "Worship in community", detail: "Chapel service · 2026/2027 orientation" },
  { src: "/chapel-service-congregation.jpg", alt: "Students and staff gathered for chapel", title: "A shared time of worship", detail: "Chapel service · 2026/2027 orientation" },
];

export default function Home() {
  return (
    <>
      <main id="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy"><p className="eyebrow"><span /> Learn deeply. Serve faithfully.</p><h1 id="hero-title">Formed for the Word.<br /><em>Sent to serve.</em></h1><p className="hero__intro">A place to grow in faith, deepen your understanding of scripture and prepare for a life of service.</p><div className="hero__actions"><a className="button button--dark" href="#admissions">Begin your enquiry <span aria-hidden="true">↗</span></a><a className="text-link" href="#study">Discover study areas <span aria-hidden="true">↓</span></a></div><p className="hero__affiliation">We are one of the campuses of Cameroon Baptist Theological Seminary (CBTS).</p></div>
          <div className="hero__visual"><PhotoCarousel slides={campusSlides} className="photo-carousel--hero" label="Kumba campus highlights" /><div className="hero__seal" aria-label="Rooted in faith, ready to serve"><span>ROOTED IN FAITH</span><b aria-hidden="true">✳</b><span>READY TO SERVE</span></div></div>
        </section>
        <section className="welcome section-wrap" id="about" aria-labelledby="welcome-title"><div className="welcome__label"><span>01</span> A campus with purpose</div><div className="welcome__body"><h2 id="welcome-title">The next chapter of your calling starts <em>here.</em></h2><p>Cameroon Baptist Theological Seminary, Kumba Campus, is one of the campuses of CBTS. We are shaping a community where theological learning and a life of service belong together.</p><a className="underlined-link" href="#contact">Get to know the campus <span aria-hidden="true">↗</span></a></div><Image className="welcome__seal" src="/cbts-logo.jpg" alt="Cameroon Baptist Theological Seminary emblem" width={130} height={130} /></section>
        <section className="leadership" id="leadership" aria-labelledby="leadership-title"><div className="leadership__portrait"><Image src="/dr-chubuin-collins-kabeleh.jpg" alt="Dr. Chubuin Collins Kabeleh, Deputy Provost and Head of Administration" width={600} height={900} sizes="(max-width: 760px) 100vw, 42vw" /></div><div className="leadership__copy"><p className="eyebrow">Leadership</p><h2 id="leadership-title">Dr. Chubuin<br /><em>Collins Kabeleh</em></h2><p className="leadership__role">Deputy Provost and Head of Administration</p><p>Dr. Chubuin Collins Kabeleh serves the seminary in this leadership role, supporting its academic and administrative work.</p><a className="underlined-link" href="mailto:info@cbts.edu.cm?subject=Enquiry%20about%20Dr.%20Chubuin%20Collins%20Kabeleh">Enquire about the seminary <span aria-hidden="true">↗</span></a></div></section>
        <section className="study section-wrap" id="study" aria-labelledby="study-title"><div className="section-heading"><div><p className="eyebrow">A foundation for a life of service</p><h2 id="study-title">Explore your <em>path.</em></h2></div><p>Discover areas of learning that connect faith, knowledge and the needs of the church.</p></div><div className="study-grid">{studyAreas.map((area) => <article className="study-item" key={area.number}><span className="study-item__number">{area.number}</span><h3>{area.title}</h3><p>{area.text}</p><a href="#admissions" aria-label={`Ask about ${area.title}`}>Ask about this area <span aria-hidden="true">↗</span></a></article>)}</div><p className="study-note">For current programme and qualification details, please contact the campus.</p></section>
        <section className="community" id="community" aria-labelledby="community-title"><PhotoCarousel slides={chapelSlides} className="photo-carousel--community" label="Chapel service photo gallery" /><div className="community__copy"><p className="eyebrow">2026/2027 academic year orientation</p><h2 id="community-title">Chapel service.<br /><em>Worship together.</em></h2><p>Students and members of the seminary community gathered for chapel during the 2026/2027 academic year orientation.</p><a className="button button--light" href="#contact">Ask about campus life <span aria-hidden="true">↗</span></a></div></section>
        <section className="admissions section-wrap" id="admissions" aria-labelledby="admissions-title"><div className="admissions__index">02 <span>YOUR NEXT STEP</span></div><div className="admissions__main"><p className="eyebrow">Admissions enquiries</p><h2 id="admissions-title">Take the first <em>step.</em></h2><p>Ask about programmes, entry requirements and the application process at Kumba Campus.</p></div><a className="button button--dark" href="mailto:admissions@cbts.edu.cm?subject=Kumba%20Campus%20admissions%20enquiry">Contact admissions <span aria-hidden="true">↗</span></a></section>
      </main>
      <footer className="site-footer" id="contact"><div className="footer-main"><a className="brand brand--footer" href="#home"><Image className="brand__logo" src="/cbts-logo.jpg" alt="" width={56} height={56} /><span className="brand__name"><strong>Cameroon Baptist</strong><span>Theological Seminary · Kumba</span></span></a><p>Kumba Campus<br />One of the campuses of CBTS<br /><a className="footer-campus-link" href="https://cbtsn.net/" target="_blank" rel="noreferrer">Visit CBTS Ndu <span aria-hidden="true">↗</span></a></p><div className="footer-links"><a href="#about">About</a><a href="#study">Study areas</a><a href="#leadership">Leadership</a><a href="#admissions">Admissions</a><a href="mailto:info@cbts.edu.cm">Email the seminary</a></div></div><div className="footer-bottom"><span>Cameroon Baptist Theological Seminary · Kumba Campus</span><span>Rooted in faith. Ready to serve.</span></div></footer>
    </>
  );
}
