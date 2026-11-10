"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import MobileMenu, { MenuLink } from "./MobileMenu";
import { menuItems, type MenuItem } from "./menuData";

function DesktopMenuItem({ item }: { item: MenuItem }) {
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
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-3 py-3 text-sm text-white hover:bg-[#124f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9f4ad] [&::-webkit-details-marker]:hidden">
          {item.label}
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
      if (window.matchMedia("(min-width: 1024px)").matches) closeMenu(false);
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
      <div className="campus-note flex min-h-9 flex-wrap items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px]">
        <span className="campus-note__dot" aria-hidden="true" />
        <span>Kumba Campus</span>
        <span aria-hidden="true">/</span>
        <span>We are one of the campuses of CBTS</span>
        <a href="https://cbtsn.net/" target="_blank" rel="noopener noreferrer" className="font-semibold">
          Visit CBTS Ndu <span aria-hidden="true">↗</span>
        </a>
      </div>
      <header className="sticky top-0 z-50 border-b-2 border-[#7fd36b] bg-[#0f5200]">
        <div className="mx-auto flex h-14 items-center justify-between px-4 lg:h-[72px] lg:px-[6.2%]">
          <Link
            href="/"
            aria-label="Cameroon Baptist Theological Seminary, Kumba Campus home"
            className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9f4ad]"
          >
            <Image
              className="h-8 w-8 shrink-0 rounded-full object-cover lg:h-10 lg:w-10"
              src="/cbts-logo.jpg"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span className="hidden text-left text-white lg:grid">
              <strong className="font-serif text-sm">Cameroon Baptist</strong>
              <span className="text-[10px] text-white/85">Theological Seminary · Kumba</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="m-0 flex list-none items-center gap-1 p-0">
              {menuItems.map((item) => (
                <DesktopMenuItem key={item.label} item={item} />
              ))}
            </ul>
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-panel"
            onClick={() => (isOpen ? closeMenu(false) : setIsOpen(true))}
            className="flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:bg-[#124f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9f4ad] lg:hidden"
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
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
