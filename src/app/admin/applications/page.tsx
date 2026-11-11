import { Suspense } from "react";
import AdminApplicationsClient from "./AdminApplicationsClient";

export default function AdminApplicationsPage() {
  return <Suspense fallback={<p className="p-8 text-center text-sm">Loading application records…</p>}>
    <AdminApplicationsClient />
  </Suspense>;
}
