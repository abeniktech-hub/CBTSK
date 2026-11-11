"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type LoginQuoteData = {
  id: string;
  text: string;
  author: string | null;
  source: string;
  translation: string | null;
};

function isQuote(value: unknown): value is LoginQuoteData {
  if (!value || typeof value !== "object") return false;
  const quote = value as Record<string, unknown>;
  return typeof quote.id === "string" && typeof quote.text === "string" && typeof quote.source === "string";
}

export default function LoginQuote({
  quote: initialQuote,
  userId,
}: {
  quote: LoginQuoteData | null;
  userId: string;
}) {
  const [quote, setQuote] = useState(initialQuote);
  const [anotherCount, setAnotherCount] = useState(0);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!quote) return;
    const key = `cbts-quote-seen-${userId}-${quote.id}`;
    if (!sessionStorage.getItem(key) && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [quote, userId]);

  function dismiss() {
    if (quote) sessionStorage.setItem(`cbts-quote-seen-${userId}-${quote.id}`, "true");
    if (dialogRef.current?.open) dialogRef.current.close();
  }

  async function anotherQuote() {
    if (anotherCount >= 3) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("pick_another_login_quote");
    if (error || !isQuote(data)) {
      setMessage("No other approved quote is available for this login.");
      return;
    }
    setQuote(data);
    setAnotherCount((count) => count + 1);
    setMessage("");
  }

  async function saveQuote() {
    if (!quote) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("quote_favorites").upsert(
      { user_id: userId, quote_id: quote.id },
      { onConflict: "user_id,quote_id" },
    );
    setMessage(error ? "Unable to save this quote." : "Quote saved.");
  }

  async function copyQuote() {
    if (!quote) return;
    try {
      await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author ? `${quote.author}, ` : ""}${quote.source}${quote.translation ? ` (${quote.translation})` : ""}`);
      setMessage("Quote copied.");
    } catch {
      setMessage("Unable to copy the quote.");
    }
  }

  if (!quote) return null;

  const content = (
    <>
      <p className="portal-quote m-0 font-serif text-xl leading-8 text-[var(--ink)]">{quote.text}</p>
      <p className="mb-0 mt-4 text-sm font-semibold text-[var(--muted)]">
        — {quote.author ? `${quote.author}, ` : ""}{quote.source}{quote.translation ? ` (${quote.translation})` : ""}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={anotherCount >= 3} onClick={() => void anotherQuote()} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--primary)] disabled:opacity-50">Another quote ({3 - anotherCount} left)</button>
        <button type="button" onClick={() => void saveQuote()} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--primary)]">Save</button>
        <button type="button" onClick={() => void copyQuote()} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--primary)]">Copy</button>
      </div>
      {message && <p role="status" className="mb-0 mt-3 text-sm text-[var(--muted)]">{message}</p>}
    </>
  );

  return (
    <>
      <section aria-label="Quote for this login" className="portal-card portal-quote border-t-2 border-t-[var(--accent)] p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="m-0 text-xs font-bold uppercase tracking-[.14em] text-[var(--primary)]">Quote for this login</h2>
          <button type="button" onClick={() => dialogRef.current?.showModal()} className="no-print min-h-10 px-2 text-xs font-semibold text-[var(--primary)] underline">View quote</button>
        </div>
        {content}
      </section>
      <dialog ref={dialogRef} aria-labelledby="login-quote-title" onCancel={dismiss} className="portal-card w-[min(92vw,620px)] border border-[var(--border)] p-6 text-[var(--ink)] backdrop:bg-[#17101ab3] sm:p-9">
        <div className="flex items-start justify-between gap-5">
          <h2 id="login-quote-title" className="m-0 font-serif text-2xl font-semibold">A thought for this login</h2>
          <button type="button" onClick={dismiss} aria-label="Close quote" className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] text-lg">×</button>
        </div>
        <div className="mt-6">{content}</div>
        <button type="button" onClick={dismiss} className="mt-5 min-h-11 rounded-lg bg-[var(--primary)] px-4 font-bold text-white">Continue to dashboard</button>
      </dialog>
    </>
  );
}
