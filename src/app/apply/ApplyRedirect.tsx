"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ApplyRedirect() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage("Unable to check your session. Please try again.");
        return;
      }
      router.replace(data.session ? "/apply/dashboard" : "/apply/login");
    });
  }, [router, supabase]);

  return <p className="px-6 py-20 text-center text-sm text-[var(--muted)]">{!supabase ? "The application portal is not configured yet. Please contact the seminary." : message || "Checking your application account…"}</p>;
}
