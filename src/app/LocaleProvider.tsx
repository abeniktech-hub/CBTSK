"use client";

import { createContext, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import { translate, type Locale, type MessageKey } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);
  return {
    locale,
    t,
  };
}
