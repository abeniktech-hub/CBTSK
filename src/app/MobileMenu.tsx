"use client";

import type { RefObject } from "react";
import { menuItems, type MenuItem } from "./menuData";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
};

function MobileMenuItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  if (item.children) {
    return (
      <li>
        <details open>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between bg-[#124f00] px-7 text-[13px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#b9f4ad] [&::-webkit-details-marker]:hidden">
            {item.label}
            <span aria-hidden="true" className="text-xs">⌄</span>
          </summary>
          <ul className="bg-[#145c00] py-1">
            {item.children.map((child) => (
              <li key={child.label}>
                <MenuLink item={child} onClose={onClose} mobile />
              </li>
            ))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <li>
      <MenuLink item={item} onClose={onClose} mobile topLevel />
    </li>
  );
}

export function MenuLink({ item, onClose, mobile = false, topLevel = false }: { item: MenuItem; onClose: () => void; mobile?: boolean; topLevel?: boolean }) {
  const className = mobile
    ? `flex min-h-11 items-center ${topLevel ? "pl-7" : "pl-[60px]"} pr-5 text-[13px] font-normal text-white hover:bg-[#176b00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b9f4ad]`
    : "block px-4 py-2 text-sm text-white hover:bg-[#176b00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b9f4ad]";

  if (!item.href) {
    return (
      <span className={`${className} cursor-not-allowed text-white/80`} aria-disabled="true" title="Link address not provided">
        {item.label}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={item.href}
      onClick={mobile ? onClose : undefined}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
    >
      {item.label}
      {item.external && <span aria-hidden="true" className="ml-2 text-[10px]">↗</span>}
    </a>
  );
}

export default function MobileMenu({ isOpen, onClose, panelRef }: MobileMenuProps) {
  return (
    <div
      ref={panelRef}
      id="mobile-navigation-panel"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed left-[10%] right-[10%] top-[58px] z-[60] overflow-y-auto overscroll-contain bg-[#145c00] text-white shadow-xl transition-[max-height,opacity,visibility] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
        isOpen
          ? "visible max-h-[calc(100dvh-58px)] opacity-100"
          : "invisible max-h-0 opacity-0"
      }`}
    >
      <nav aria-label="Main">
        <ul className="m-0 list-none p-0">
          {menuItems.map((item) => (
            <MobileMenuItem key={item.label} item={item} onClose={onClose} />
          ))}
        </ul>
      </nav>
    </div>
  );
}
