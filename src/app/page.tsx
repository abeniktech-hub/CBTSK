import Image from "next/image";
import Link from "next/link";
import PhotoCarousel, { type PhotoSlide } from "./components/photo-carousel";
import CampusCard from "./components/CampusCard";
import { LOGIN_URL, REGISTER_URL } from "@/config/site";
import { campuses } from "@/data/campuses";
import { translate, type MessageKey } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";

const studyAreas: { number: string; title: MessageKey; text: MessageKey }[] = [
  { number: "01", title: "studyBiblical", text: "studyBiblicalDescription" },
  { number: "02", title: "studyPastoral", text: "studyPastoralDescription" },
  { number: "03", title: "studyLeadership", text: "studyLeadershipDescription" },
];

const campusSlides: PhotoSlide[] = [
  {
    src: "/kumba-academic-complex.jpg",
    alt: "The academic complex at Cameroon Baptist Theological Seminary, Kumba Campus",
    title: "The seminary campus complex",
    detail: "Cameroon Baptist Theological Seminary · Kumba Campus",
  },
  {
    src: "/kumba-academic-complex-sign.jpg",
    alt: "The Cameroon Baptist Theological Seminary sign on the Kumba Campus academic complex",
    title: "Our campus, our community",
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

export default async function Home() {
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <>
      <main id="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__visual"><PhotoCarousel slides={campusSlides} className="photo-carousel--hero" label={t("ourCampuses")} intervalDuration={6000} /></div>
          <div className="hero__copy"><p className="eyebrow hero__motto"><span aria-hidden="true" /><strong>Ambassadors of Christ as Minister of Reconciliation</strong></p><h1 id="hero-title">{t("heroTitleFirst")}<br /><em>{t("heroTitleSecond")}</em></h1><p className="hero__intro">{t("heroIntro")}</p><div className="hero__actions"><Link className="button a11y-gold-cta rounded-md" href={REGISTER_URL}>{t("registerNow")} <span aria-hidden="true">↗</span></Link><Link className="button button--outline-light rounded-md" href={LOGIN_URL}>{t("login")}</Link><a className="text-link" href="#study">{t("discoverStudyAreas")} <span aria-hidden="true">↓</span></a></div><p className="hero__affiliation">We are one of the campuses of Cameroon Baptist Theological Seminary (CBTS).</p></div>
          <div className="hero__seal" aria-label="Cameroon Baptist Theological Seminary"><Image src="/cbts-logo.jpg" alt="" fill sizes="100px" /></div>
        </section>
        <section className="welcome section-wrap" id="about" aria-labelledby="welcome-title"><div className="welcome__label"><span>01</span> {t("welcomeEyebrow")}</div><div className="welcome__body"><h2 id="welcome-title">{t("welcomeTitlePrefix")} <em>{t("welcomeTitleHighlight")}</em></h2><p>{t("welcomeBody")}</p><a className="underlined-link" href="#contact">{t("welcomeLink")} <span aria-hidden="true">↗</span></a></div><Image className="welcome__seal" src="/cbts-logo.jpg" alt="Cameroon Baptist Theological Seminary emblem" width={130} height={130} /></section>
        <section className="campuses-section section-wrap" aria-labelledby="campuses-title">
          <div className="section-heading"><div><p className="eyebrow">Cameroon Baptist Theological Seminary</p><h2 id="campuses-title">{t("ourCampusesPrefix")} <em>{t("ourCampusesHighlight")}</em></h2></div><Link className="underlined-link" href="/visit-campus">{t("visitCampusLink")} <span aria-hidden="true">↗</span></Link></div>
          <div className="grid gap-4 md:grid-cols-3">{campuses.map((campus) => <CampusCard key={campus.id} campus={campus} locale={locale} />)}</div>
        </section>
        <section className="leadership" id="leadership" aria-labelledby="leadership-title"><div className="leadership__portrait"><Image src="/dr-chubuin-collins-kabeleh.jpg" alt="Dr. Chubuin Collins Kabeleh, Deputy Provost and Head of Administration" width={600} height={900} sizes="(max-width: 760px) 100vw, 42vw" /></div><div className="leadership__copy"><p className="eyebrow">{t("leadershipTitle")}</p><h2 id="leadership-title">Dr. Chubuin<br /><em>Collins Kabeleh</em></h2><p className="leadership__role">Deputy Provost and Head of Administration</p><p>Dr. Chubuin Collins Kabeleh serves the seminary in this leadership role, supporting its academic and administrative work.</p><a className="underlined-link" href="mailto:info@cbts.edu.cm?subject=Enquiry%20about%20Dr.%20Chubuin%20Collins%20Kabeleh">{locale === "fr" ? "Se renseigner sur le séminaire" : "Enquire about the seminary"} <span aria-hidden="true">↗</span></a></div></section>
        <section className="study section-wrap" id="study" aria-labelledby="study-title"><div className="section-heading"><div><p className="eyebrow">{locale === "fr" ? "Une base pour une vie de service" : "A foundation for a life of service"}</p><h2 id="study-title">{t("studyTitlePrefix")} <em>{t("studyTitleHighlight")}</em></h2></div><p>{t("studyIntro")}</p></div><div className="study-grid">{studyAreas.map((area) => <article className="study-item" key={area.number}><span className="study-item__number">{area.number}</span><h3>{t(area.title)}</h3><p>{t(area.text)}</p><a href="#admissions" aria-label={`${t("askAboutArea")}: ${t(area.title)}`}>{t("askAboutArea")} <span aria-hidden="true">↗</span></a></article>)}</div><p className="study-note">{t("studyDetailsComingSoon")}</p></section>
        <section className="community" id="community" aria-labelledby="community-title"><PhotoCarousel slides={chapelSlides} className="photo-carousel--community" label={locale === "fr" ? "Galerie de la chapelle" : "Chapel service photo gallery"} /><div className="community__copy"><p className="eyebrow">{locale === "fr" ? "Orientation de l'année académique 2026/2027" : "2026/2027 academic year orientation"}</p><h2 id="community-title">{t("communityTitleFirst")}<br /><em>{t("communityTitleSecond")}</em></h2><p>{t("communityIntro")}</p><a className="button button--light" href="#contact">{t("askCampusLife")} <span aria-hidden="true">↗</span></a></div></section>
        <section className="admissions section-wrap" id="admissions" aria-labelledby="admissions-title"><div className="admissions__index">02 <span>{locale === "fr" ? "VOTRE PROCHAINE ÉTAPE" : "YOUR NEXT STEP"}</span></div><div className="admissions__main"><p className="eyebrow">{t("admissionsEnquiries")}</p><h2 id="admissions-title">{t("takeFirstStep")}</h2><p>{t("admissionsDescription")}</p></div><a className="button button--dark" href="mailto:admissions@cbts.edu.cm?subject=Kumba%20Campus%20admissions%20enquiry">{t("contactAdmissions")} <span aria-hidden="true">↗</span></a></section>
        <section className="register-band" aria-labelledby="register-band-title"><div><p className="eyebrow">{locale === "fr" ? "Votre prochaine étape" : "Your next step"}</p><h2 id="register-band-title">{t("readyBegin")}</h2></div><div className="flex flex-wrap gap-3"><Link className="button a11y-gold-cta min-h-11 rounded-md" href={REGISTER_URL}>{t("registerNow")}</Link><Link className="button button--outline-light min-h-11 rounded-md" href={LOGIN_URL}>{t("login")}</Link></div></section>
      </main>
    </>
  );
}
