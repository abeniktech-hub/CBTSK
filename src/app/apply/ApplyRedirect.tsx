"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfigurationMessage } from "@/lib/supabase/configuration-message";
import { useI18n } from "../LocaleProvider";

export default function ApplyRedirect() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(t("unableToCheckSession"));
        return;
      }
      router.replace(data.session ? "/apply/dashboard" : "/login");
    });
  }, [router, supabase, t]);

  return <p className="px-6 py-20 text-center text-sm text-[var(--muted)]">{!supabase ? getSupabaseConfigurationMessage(locale) : message || t("checkingApplicationAccount")}</p>;
}
