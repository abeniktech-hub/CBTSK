import type { Metadata } from "next";
import AdmissionsContent from "./AdmissionsContent";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: { absolute: translate(locale, "metaAdmissionsTitle") },
    description: translate(locale, "metaAdmissionsDescription"),
  };
}

export default function AdmissionsPage() {
  return <AdmissionsContent />;
}
