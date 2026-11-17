import { getMissingSupabasePublicVariables } from "./client";
import { translate, type Locale } from "@/lib/i18n";

export function getSupabaseConfigurationMessage(locale: Locale) {
  if (process.env.NODE_ENV === "production") {
    return translate(locale, "portalNotConfiguredProduction");
  }

  const missing = getMissingSupabasePublicVariables();
  const prefix = translate(locale, missing.length === 1 ? "portalNotConfiguredPrefix" : "portalNotConfiguredPrefixPlural");
  return `${prefix}: ${missing.join(", ")}. ${translate(locale, "configurationHint")}`;
}
