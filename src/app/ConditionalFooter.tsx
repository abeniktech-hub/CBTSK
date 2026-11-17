"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { campuses } from "@/data/campuses";
import { LOGIN_URL, REGISTER_URL } from "@/config/site";
import { useI18n } from "./LocaleProvider";
import LanguageSwitcher from "./LanguageSwitcher";

export default function ConditionalFooter() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/apply") || pathname.startsWith("/admin")) return null;

  const ndu = campuses.find((campus) => campus.id === "ndu");

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-apply flex flex-wrap items-center justify-center gap-3">
        <Link className="button a11y-gold-cta min-h-11 rounded-md" href={REGISTER_URL}>{t("registerNow")}</Link>
        <Link className="button min-h-11 rounded-md border border-[var(--forest)] text-[var(--forest)]" href={LOGIN_URL}>{t("login")}</Link>
        <LanguageSwitcher />
      </div>
      <div className="footer-main">
        <Link className="brand brand--footer" href="/">
          <Image className="brand__logo" src="/cbts-logo.jpg" alt="" width={56} height={56} />
          <span className="brand__name"><strong>Cameroon Baptist</strong><span>Theological Seminary</span></span>
        </Link>
        <p>Cameroon Baptist Theological Seminary<br />{ndu?.externalSiteUrl && <a className="footer-campus-link" href={ndu.externalSiteUrl} target="_blank" rel="noopener noreferrer">Visit CBTS Ndu <span aria-hidden="true">↗</span></a>}</p>
        <nav className="footer-links" aria-label={t("footerNavigation")}>
          <Link href="/visit-campus">{t("menuVisitCampus")}</Link>
          <Link href="/explore-degrees">{t("menuExploreDegrees")}</Link>
          <Link href="/admissions">{t("menuAdmissions")}</Link>
          <Link href="/give">{t("menuGive")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>Cameroon Baptist Theological Seminary</span>
        <span>Ambassadors of Christ as Minister of Reconciliation</span>
      </div>
    </footer>
  );
}
