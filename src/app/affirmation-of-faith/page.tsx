import type { Metadata } from "next";
import AffirmationPageContent from "./AffirmationPageContent";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: { absolute: `${translate(locale, "metaAffirmationTitle")} | CBTS` },
    description: translate(locale, "metaAffirmationDescription"),
  };
}

export default function AffirmationOfFaithPage() {
  return <AffirmationPageContent />;
}
