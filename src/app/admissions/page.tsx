import type { Metadata } from "next";
import AdmissionsContent from "./AdmissionsContent";

export const metadata: Metadata = {
  title: { absolute: "Admissions and Registration | CBTS" },
  description:
    "Learn about CBTS admissions, student conduct, application and registration procedures, program requirements, distance learning, and matriculation at CBTS.",
};

export default function AdmissionsPage() {
  return <AdmissionsContent />;
}
