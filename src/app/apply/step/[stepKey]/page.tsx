import { Suspense } from "react";
import { portalSteps } from "@/lib/portal-steps";
import StepEditor from "./StepEditor";

export const dynamicParams = false;

export function generateStaticParams() {
  return portalSteps.map(({ key }) => ({ stepKey: key }));
}

export default function StepPage() {
  return <Suspense fallback={<p className="p-8 text-center text-sm text-[var(--muted)]">Loading application step…</p>}>
    <StepEditor />
  </Suspense>;
}
