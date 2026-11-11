"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SavedQuote = { id: string; text: string; author: string | null; source: string; translation: string | null };

export default function SavedQuotesClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [message, setMessage] = useState("Loading saved quotes…");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let active = true;
    if (!supabase) {
      return;
    }
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace("/apply/login");
        return;
      }
      const { data, error } = await supabase.from("quote_favorites").select("quotes(id,text,author,source,translation)").eq("user_id", session.session.user.id);
      if (!active) return;
      if (error) {
        setMessage("Unable to load saved quotes.");
        return;
      }
      const results = (data ?? []).flatMap((row) => {
        const quote = row.quotes;
        const item = Array.isArray(quote) ? quote[0] : quote;
        return item && typeof item === "object" ? [item as SavedQuote] : [];
      });
      setQuotes(results);
      setMessage(results.length ? "" : "You have not saved any quotes yet.");
    })();
    return () => { active = false; };
  }, [router, supabase]);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <a href="/apply/dashboard" className="text-sm font-semibold text-[var(--primary)] underline">← Dashboard</a>
      <h1 className="mb-6 mt-5 font-serif text-3xl font-semibold">Saved quotes</h1>
      {(!supabase || message) && <p role="status" className="text-sm text-[var(--muted)]">{!supabase ? "The application portal is not configured." : message}</p>}
      <div className="grid gap-4">
        {quotes.map((quote) => <article key={quote.id} className="portal-card portal-quote border-t-2 border-t-[var(--accent)] p-6">
          <p className="m-0 font-serif text-xl leading-8">{quote.text}</p>
          <p className="mb-0 mt-4 text-sm text-[var(--muted)]">— {quote.author ? `${quote.author}, ` : ""}{quote.source}{quote.translation ? ` (${quote.translation})` : ""}</p>
        </article>)}
      </div>
    </main>
  );
}
