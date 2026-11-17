"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LOGIN_URL, REGISTER_URL, brandSubtitle } from "@/config/site";
import { campuses } from "@/data/campuses";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "./LocaleProvider";
import MobileMenu, { MenuLink } from "./MobileMenu";
import { menuItems, type MenuItem } from "./menuData";
import { translateMenuLabel } from "@/lib/i18n";

function DesktopMenuItem({ item }: { item: MenuItem }) {
  const { locale } = useI18n();
  if (!item.children) {
    return (
      <li>
        <MenuLink item={item} onClose={() => undefined} />
      </li>
    );
  }

  return (
    <li className="group relative">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-3 py-3 text-sm text-white hover:bg-[#124f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d879] [&::-webkit-details-marker]:hidden">
          {translateMenuLabel(locale, item.label)}
          <span aria-hidden="true" className="text-xs">⌄</span>
        </summary>
        <ul className="absolute left-0 top-full z-[70] m-0 hidden max-h-[75vh] min-w-64 list-none overflow-y-auto bg-[#145c00] p-2 shadow-xl group-hover:block group-focus-within:block">
          {item.children.map((child) => (
            <li key={child.label}>
              <MenuLink item={child} onClose={() => undefined} />
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

export default function Header() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(pathname);

  const closeMenu = useCallback((returnFocus = true) => {
    setIsOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      closeMenu();
    }
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !panelRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1280px)").matches) closeMenu(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      <nav aria-label="Campuses" className="campus-note">
        {campuses.map((campus) => {
          const external = campus.id === "ndu" && campus.externalSiteUrl;
          return (
            <Link
              key={campus.id}
              href={external ? campus.externalSiteUrl! : `/visit-campus#${campus.id}`}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {campus.name}{campus.id === "ndu" ? ` · ${t("mainCampus")}` : ` ${t("campusSuffix")}`}
            </Link>
          );
        })}
      </nav>
      <header className="sticky top-0 z-50 border-b-2 border-[#d6ad2e] bg-[#0f5200]">
        <div className="mx-auto flex h-14 items-center justify-between px-4 lg:h-[72px] lg:px-[6.2%]">
          <Link
            href="/"
            aria-label="Cameroon Baptist Theological Seminary home"
            className="flex min-w-0 items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d879] lg:gap-3"
          >
            <Image
              className="brand__logo"
              src="/cbts-logo.jpg"
              alt=""
              width={52}
              height={52}
              priority
            />
            <span className="grid min-w-0 text-left text-white">
              <strong className="truncate font-serif text-[11px] leading-tight sm:text-sm">Cameroon Baptist Theological Seminary</strong>
              {brandSubtitle && <span className="truncate text-[9px] leading-tight text-white/90 sm:text-[10px]">{brandSubtitle}</span>}
            </span>
          </Link>

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="m-0 flex list-none items-center gap-1 p-0">
              {menuItems.map((item) => (
                <DesktopMenuItem key={item.label} item={item} />
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <LanguageSwitcher />
            <Link className="header-login" href={LOGIN_URL}>{t("login")}</Link>
            <Link className="header-register a11y-gold-cta" href={REGISTER_URL}>{t("registerNow")}</Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-panel"
            onClick={() => (isOpen ? closeMenu(false) : setIsOpen(true))}
            className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:bg-[#124f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d879] xl:hidden"
          >
            <span className="sr-only">{isOpen ? t("closeMenu") : t("openMenu")}</span>
            <span aria-hidden="true" className="grid gap-[5px]">
              <span className="h-0.5 w-6 rounded bg-white" />
              <span className="h-0.5 w-6 rounded bg-white" />
              <span className="h-0.5 w-6 rounded bg-white" />
            </span>
          </button>
        </div>
        <MobileMenu isOpen={isOpen} onClose={() => closeMenu()} panelRef={panelRef} />
      </header>
    </>
  );
}
