"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/apply") || pathname.startsWith("/admin")) return null;
  return <Header />;
}
