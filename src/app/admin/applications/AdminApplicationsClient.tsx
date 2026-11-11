"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type ExamStatus = Database["public"]["Enums"]["exam_status"];
type History = Database["public"]["Tables"]["matricule_history"]["Row"];
type SearchResult = { id: string; matricule: string; status: ApplicationStatus; source: "current" | "history" };

const statuses: ApplicationStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ADMITTED", "WAITLISTED", "REJECTED"];
const examStatuses: ExamStatus[] = ["NOT_SCHEDULED", "SCHEDULED", "DONE"];

export default function AdminApplicationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const selectedId = searchParams.get("application");
  const isConfigured = supabase !== null;
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [matricule, setMatricule] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("DRAFT");
  const [examStatus, setExamStatus] = useState<ExamStatus>("NOT_SCHEDULED");
  const [examScore, setExamScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examVenue, setExamVenue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadApplication = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data: app, error } = await supabase.from("applications")
      .select("id,user_id,campus_id,programme_id,matricule,matricule_status,matricule_confirmed_at,matricule_confirmed_by,status,exam_score,exam_status,exam_date,exam_venue,payment_status,department,year_of_entry,submitted_at,created_at")
      .eq("id", id).maybeSingle();
    if (error || !app) {
      setApplication(null);
      setMessage("Application not found or staff access is unavailable.");
      return;
    }
    const [{ data: profile }, { data: records, error: historyError }] = await Promise.all([
      supabase.from("profiles").select("first_name,last_name").eq("id", app.user_id).maybeSingle(),
      supabase.from("matricule_history").select("id,application_id,old_value,new_value,changed_by,reason,changed_at").eq("application_id", app.id).order("changed_at", { ascending: false }),
    ]);
    setApplication(app);
    setApplicantName([profile?.first_name, profile?.last_name].filter(Boolean).join(" "));
    setHistory(records ?? []);
    setMatricule(app.matricule);
    setStatus(app.status);
    setExamStatus(app.exam_status);
    setExamScore(app.exam_score === null ? "" : String(app.exam_score));
    setExamDate(app.exam_date ?? "");
    setExamVenue(app.exam_venue ?? "");
    setMessage(historyError ? "Application loaded, but matricule history could not be loaded." : "");
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
      setAuthorized(true);
      if (selectedId) await loadApplication(selectedId);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadApplication, router, selectedId, supabase]);

  async function searchApplications(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || query.trim().length < 2) {
      setMessage("Enter at least two characters to search.");
      return;
    }
    setMessage("");
    const value = query.trim();
    const [{ data: current, error: currentError }, { data: past, error: pastError }] = await Promise.all([
      supabase.from("applications").select("id,matricule,status").ilike("matricule", `%${value}%`).limit(25),
      supabase.from("matricule_history").select("application_id,old_value,new_value").ilike("old_value", `%${value}%`).limit(25),
    ]);
    if (currentError || pastError) {
      setMessage("Search failed. Check staff access and try again.");
      return;
    }
    const matches: SearchResult[] = (current ?? []).map((item) => ({
      id: item.id, matricule: item.matricule, status: item.status, source: "current",
    }));
    for (const oldNumber of past ?? []) {
      if (matches.some((item) => item.id === oldNumber.application_id)) continue;
      const { data: app } = await supabase.from("applications").select("id,status")
        .eq("id", oldNumber.application_id).maybeSingle();
      if (app) matches.push({ id: app.id, matricule: oldNumber.old_value, status: app.status, source: "history" });
    }
    setResults(matches);
    if (!matches.length) setMessage("No application matched that matricule.");
  }

  async function saveMatricule() {
    if (!supabase || !application) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_change_matricule", {
      p_application_id: application.id,
      p_new_matricule: matricule.trim(),
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      setMessage("Matricule update failed. Confirm the format, uniqueness and reason.");
      return;
    }
    setReason("");
    setMessage("Matricule confirmed and history recorded.");
    await loadApplication(application.id);
  }

  async function saveStatus() {
    if (!supabase || !application) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_application_status", {
      p_application_id: application.id,
      p_status: status,
    });
    setBusy(false);
    if (error) {
      setMessage("Application status could not be updated.");
      return;
    }
    setMessage("Application status updated and audited.");
    await loadApplication(application.id);
  }

  async function saveExam() {
    if (!supabase || !application) return;
    const score = examScore === "" ? null : Number(examScore);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      setMessage("Exam score must be between 0 and 100.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_exam", {
      p_application_id: application.id,
      p_score: score,
      p_exam_status: examStatus,
      p_exam_date: examDate || null,
      p_exam_venue: examVenue || null,
    });
    setBusy(false);
    if (error) {
      setMessage("Exam details could not be updated.");
      return;
    }
    setMessage("Exam details updated and audited.");
    await loadApplication(application.id);
  }

  if (!isConfigured || !supabase) return <p role="alert" className="p-8 text-[var(--danger)]">Portal configuration is missing.</p>;
  if (loading) return <p className="p-8 text-center text-sm">Loading admissions administration…</p>;
  if (!authorized) return <p role="alert" className="mx-auto max-w-3xl p-8 text-[var(--danger)]">{message || "Staff access is required."}</p>;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-8">
      <header><Link href="/admin/quotes" className="text-sm font-semibold text-[var(--primary)] underline">Quote administration</Link><h1 className="mb-0 mt-3 font-serif text-3xl font-semibold">Application administration</h1></header>
      <section className="portal-card p-5 sm:p-6">
        <form onSubmit={searchApplications} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-sm font-semibold">Search current or previous matricule<input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
          <button type="submit" className="min-h-12 self-end rounded-lg bg-[var(--primary)] px-5 font-bold text-white">Search</button>
        </form>
        <ul className="mt-4 grid list-none gap-2 p-0">{results.map((result) => <li key={`${result.id}-${result.matricule}`}><button type="button" onClick={() => router.replace(`/admin/applications?application=${encodeURIComponent(result.id)}`)} className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3 text-left"><span className="font-mono">{result.matricule}</span><span>{result.status}</span><span className="text-xs text-[var(--muted)]">{result.source === "history" ? "Previous matricule" : "Current matricule"}</span></button></li>)}</ul>
      </section>

      {application && <section className="grid gap-5">
        <div className="portal-card p-5 sm:p-6"><h2 className="m-0 font-serif text-2xl font-semibold">{applicantName || "Applicant"} · {application.matricule}</h2><p className="mb-0 mt-2 text-sm text-[var(--muted)]">Created {new Date(application.created_at).toLocaleDateString()} · Payment {application.payment_status}</p></div>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="portal-card grid content-start gap-3 p-5">
            <h2 className="m-0 font-serif text-xl font-semibold">Matricule</h2>
            <label className="grid gap-1 text-sm font-semibold">Current or new matricule<input value={matricule} onChange={(event) => setMatricule(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 font-mono" /></label>
            <label className="grid gap-1 text-sm font-semibold">Reason<input value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
            <button type="button" disabled={busy || !reason.trim()} onClick={() => void saveMatricule()} className="min-h-11 justify-self-start rounded-lg bg-[var(--primary)] px-4 font-bold text-white disabled:opacity-60">Confirm matricule</button>
            <h3 className="mb-0 mt-3 text-sm font-bold">Matricule history</h3>
            <ul className="m-0 grid gap-2 pl-5 text-sm">{history.map((item) => <li key={item.id}><span className="font-mono">{item.old_value}</span> → <span className="font-mono">{item.new_value}</span> · {item.reason}</li>)}</ul>
          </section>
          <section className="portal-card grid content-start gap-3 p-5">
            <h2 className="m-0 font-serif text-xl font-semibold">Application status</h2>
            <label className="grid gap-1 text-sm font-semibold">Status<select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <button type="button" disabled={busy} onClick={() => void saveStatus()} className="min-h-11 justify-self-start rounded-lg bg-[var(--primary)] px-4 font-bold text-white disabled:opacity-60">Save status</button>
            <h2 className="mb-0 mt-4 font-serif text-xl font-semibold">Entrance exam</h2>
            <label className="grid gap-1 text-sm font-semibold">Status<select value={examStatus} onChange={(event) => setExamStatus(event.target.value as ExamStatus)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3">{examStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">Score<input type="number" min="0" max="100" step="0.01" value={examScore} onChange={(event) => setExamScore(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
            <label className="grid gap-1 text-sm font-semibold">Date<input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
            <label className="grid gap-1 text-sm font-semibold">Venue<input value={examVenue} onChange={(event) => setExamVenue(event.target.value)} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3" /></label>
            <button type="button" disabled={busy} onClick={() => void saveExam()} className="min-h-11 justify-self-start rounded-lg bg-[var(--primary)] px-4 font-bold text-white disabled:opacity-60">Save exam details</button>
          </section>
        </div>
      </section>}
      {message && <p role="status" className="text-sm text-[var(--muted)]">{message}</p>}
    </main>
  );
}
