"use client";

import Link from "next/link";
import { z } from "zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type QuoteStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

const categories = ["biblical", "theological", "educational", "moral", "ministry/mission"] as const;
const quoteSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  author: z.string().trim().max(200).nullable(),
  source: z.string().trim().min(1).max(250),
  translation: z.string().trim().max(40).nullable(),
  category: z.enum(categories),
  lang: z.enum(["en", "fr"]),
  rights_note: z.string().trim().max(500),
  status: z.enum(["DRAFT", "APPROVED", "ARCHIVED"]),
});
type QuoteInput = z.infer<typeof quoteSchema>;

const emptyQuote: QuoteInput = {
  text: "",
  author: null,
  source: "",
  translation: null,
  category: "biblical",
  lang: "en",
  rights_note: "",
  status: "DRAFT",
};

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted && character === '"' && input[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export default function QuotesAdminClient() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const isConfigured = supabase !== null;
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [form, setForm] = useState<QuoteInput>(emptyQuote);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const loadQuotes = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("quotes")
      .select("id,text,author,source,translation,category,lang,rights_note,status,created_by,approved_by,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      setMessage("Unable to load quote records.");
      return;
    }
    setQuotes(data ?? []);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    if (!supabase) return;
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace("/apply/login");
        return;
      }
      const { data: profile, error } = await supabase.from("profiles")
        .select("role").eq("id", session.session.user.id).maybeSingle();
      if (!active) return;
      if (error || !profile || !["REGISTRAR", "ADMIN"].includes(profile.role)) {
        setMessage("Staff access is required.");
        setLoading(false);
        return;
      }
      setRole(profile.role);
      setAuthorized(true);
      await loadQuotes();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadQuotes, router, supabase]);

  const visibleQuotes = useMemo(() => quotes.filter((quote) => {
    const matchesSearch = `${quote.text} ${quote.author ?? ""} ${quote.source}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch &&
      (categoryFilter === "all" || quote.category === categoryFilter) &&
      (statusFilter === "all" || quote.status === statusFilter);
  }), [categoryFilter, quotes, search, statusFilter]);

  function editQuote(quote: Quote) {
    setSelected(quote);
    setForm({
      text: quote.text,
      author: quote.author,
      source: quote.source,
      translation: quote.translation,
      category: quote.category as QuoteInput["category"],
      lang: quote.lang as QuoteInput["lang"],
      rights_note: quote.rights_note,
      status: quote.status,
    });
    setMessage("");
  }

  async function saveQuote() {
    if (!supabase) return;
    const parsed = quoteSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the quote fields.");
      return;
    }
    setBusy(true);
    const value = parsed.data;
    const { error } = await supabase.rpc("admin_upsert_quote", {
      p_id: selected?.id ?? null,
      p_text: value.text,
      p_author: value.author || null,
      p_source: value.source,
      p_translation: value.translation || null,
      p_category: value.category,
      p_lang: value.lang,
      p_rights_note: value.rights_note,
      p_status: value.status,
    });
    setBusy(false);
    if (error) {
      setMessage("Quote was not saved. Check your role, source and rights notes.");
      return;
    }
    setMessage("Quote saved.");
    setSelected(null);
    setForm(emptyQuote);
    await loadQuotes();
  }

  async function importCsv(file: File | undefined) {
    if (!file || !supabase) return;
    setImportErrors([]);
    if (file.size > 2 * 1024 * 1024) {
      setImportErrors(["CSV must be no larger than 2 MB."]);
      return;
    }
    const errors: string[] = [];
    let rows: string[][];
    try {
      rows = csvRows(await file.text());
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : "CSV could not be read."]);
      return;
    }
    const headers = rows.shift()?.map((value) => value.trim().toLowerCase()) ?? [];
    const requiredHeaders = ["text", "author", "source", "translation", "category", "lang", "rights_note", "status"];
    if (requiredHeaders.some((header) => !headers.includes(header))) {
      setImportErrors([`CSV must include: ${requiredHeaders.join(", ")}.`]);
      return;
    }
    setBusy(true);
    for (const [index, columns] of rows.entries()) {
      const input = Object.fromEntries(headers.map((header, columnIndex) => [header, columns[columnIndex] ?? ""]));
      const parsed = quoteSchema.safeParse({
        ...input,
        author: input.author || null,
        translation: input.translation || null,
      });
      if (!parsed.success) {
        errors.push(`Row ${index + 2}: ${parsed.error.issues[0]?.message ?? "Invalid quote."}`);
        continue;
      }
      const item = parsed.data;
      const { error } = await supabase.rpc("admin_upsert_quote", {
        p_id: null,
        p_text: item.text,
        p_author: item.author,
        p_source: item.source,
        p_translation: item.translation,
        p_category: item.category,
        p_lang: item.lang,
        p_rights_note: item.rights_note,
        p_status: item.status,
      });
      if (error) errors.push(`Row ${index + 2}: quote rejected by the server.`);
    }
    setBusy(false);
    setImportErrors(errors);
    setMessage(errors.length ? "CSV import completed with row errors." : "CSV import completed.");
    await loadQuotes();
  }

  if (!isConfigured || !supabase) return <p role="alert" className="mx-auto max-w-3xl p-8 text-[var(--danger)]">Portal configuration is missing.</p>;
  if (loading) return <p className="p-8 text-center text-sm">Loading quote administration…</p>;
  if (!authorized) return <p role="alert" className="mx-auto max-w-3xl p-8 text-[var(--danger)]">{message || "Staff access is required."}</p>;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/admin/applications" className="text-sm font-semibold text-[var(--primary)] underline">← Admin</Link><h1 className="mb-0 mt-3 font-serif text-3xl font-semibold">Quote administration</h1></div>
        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold">{role}</span>
      </header>

      <section className="portal-card grid gap-4 p-5 sm:p-6">
        <h2 className="m-0 font-serif text-xl font-semibold">{selected ? "Edit quote" : "Create quote"}</h2>
        <label className="grid gap-1 text-sm font-semibold">Text<textarea rows={3} maxLength={1000} value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">Author<input value={form.author ?? ""} onChange={(event) => setForm({ ...form, author: event.target.value || null })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">Source<input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">Translation<input value={form.translation ?? ""} onChange={(event) => setForm({ ...form, translation: event.target.value || null })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as QuoteInput["category"] })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Language<select value={form.lang} onChange={(event) => setForm({ ...form, lang: event.target.value as QuoteInput["lang"] })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3"><option value="en">English</option><option value="fr">French</option></select></label>
          <label className="grid gap-1 text-sm font-semibold">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as QuoteStatus })} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3"><option value="DRAFT">Draft</option><option value="APPROVED" disabled={role !== "ADMIN"}>Approved (ADMIN only)</option><option value="ARCHIVED">Archived</option></select></label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">Rights note<textarea rows={2} maxLength={500} value={form.rights_note} onChange={(event) => setForm({ ...form, rights_note: event.target.value })} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" /></label>
        <div className="portal-card border-t-2 border-t-[var(--accent)] p-4"><p className="m-0 font-serif text-lg">{form.text || "Quote preview"}</p><p className="mb-0 mt-3 text-sm text-[var(--muted)]">— {form.author ? `${form.author}, ` : ""}{form.source || "Source"}{form.translation ? ` (${form.translation})` : ""}</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void saveQuote()} className="min-h-11 rounded-lg bg-[var(--primary)] px-4 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save quote"}</button><button type="button" onClick={() => { setSelected(null); setForm(emptyQuote); }} className="min-h-11 rounded-lg border border-[var(--border)] px-4 font-semibold">Clear</button></div>
        {message && <p role="status" className="m-0 text-sm text-[var(--muted)]">{message}</p>}
      </section>

      <section className="portal-card grid gap-4 p-5 sm:p-6">
        <h2 className="m-0 font-serif text-xl font-semibold">CSV import</h2>
        <p className="m-0 text-sm text-[var(--muted)]">Columns: text, author, source, translation, category, lang, rights_note, status. Keep non-Scripture quotes sourced and rights-reviewed before approval.</p>
        <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => void importCsv(event.target.files?.[0])} className="min-h-11 rounded-lg border border-[var(--border)] p-2" />
        {importErrors.length > 0 && <ul role="alert" className="m-0 grid gap-1 text-sm text-[var(--danger)]">{importErrors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>}
      </section>

      <section className="portal-card grid gap-4 p-5 sm:p-6">
        <h2 className="m-0 font-serif text-xl font-semibold">Quote library</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold">Search<input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3"><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3"><option value="all">All statuses</option>{["DRAFT", "APPROVED", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
        <ul className="m-0 grid list-none gap-3 p-0">{visibleQuotes.map((quote) => <li key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4"><div className="min-w-0"><p className="m-0 line-clamp-2 font-serif">{quote.text}</p><p className="mb-0 mt-1 text-xs text-[var(--muted)]">{quote.category} · {quote.status} · {quote.source}</p></div><button type="button" onClick={() => editQuote(quote)} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold">Edit</button></li>)}</ul>
        {visibleQuotes.length === 0 && <p className="m-0 text-sm text-[var(--muted)]">No matching quotes.</p>}
      </section>
    </main>
  );
}
