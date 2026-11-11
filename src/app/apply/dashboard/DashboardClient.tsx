"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { portalSteps } from "@/lib/portal-steps";
import LoginQuote, { type LoginQuoteData } from "./LoginQuote";

type DashboardData = {
  userId: string;
  firstName: string;
  matricule: string;
  matriculeStatus: string;
  applicationId: string;
  status: string;
  campus: string;
  programme: string;
  examScore: number | null;
  completed: string[];
  emailVerified: boolean;
  email: string;
  quote: LoginQuoteData | null;
};

const statusLabels: Record<string, string> = {
  DRAFT: "No admission yet",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ADMITTED: "Admitted",
  WAITLISTED: "Waitlisted",
  REJECTED: "Rejected",
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function parseQuote(value: unknown): LoginQuoteData | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const quote = (row as Record<string, unknown>).quotes;
  const item = Array.isArray(quote) ? quote[0] : quote;
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.text !== "string" || typeof record.source !== "string") return null;
  return {
    id: record.id,
    text: record.text,
    source: record.source,
    author: typeof record.author === "string" ? record.author : null,
    translation: typeof record.translation === "string" ? record.translation : null,
  };
}

function statusStyle(status: string) {
  if (status === "ADMITTED") return "bg-[#dff2e7] text-[#155b40]";
  if (status === "REJECTED") return "bg-[#fde9e7] text-[#8b221c]";
  if (status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "WAITLISTED") return "bg-[#f6ecd3] text-[#704d14]";
  return "bg-[var(--primary-soft)] text-[var(--primary-strong)]";
}

export default function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const supabase = createSupabaseBrowserClient();
  const isConfigured = supabase !== null;

  useEffect(() => {
    let active = true;
    if (!supabase) return;

    void (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (sessionError || !user) {
        router.replace("/apply/login");
        return;
      }

      const [profileResult, applicationResult, loginResult] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
        supabase.from("applications").select("id,matricule,matricule_status,status,exam_score,campus_id,programme_id,campuses(name),programmes(name)").eq("user_id", user.id).maybeSingle(),
        supabase.from("login_events").select("quote_id,quotes(id,text,author,source,translation)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      if (applicationResult.error) {
        setError("Unable to load your application. Please try again later.");
        setLoading(false);
        return;
      }
      const app = applicationResult.data as (Record<string, unknown> & { id: string }) | null;
      let completed: string[] = [];
      if (app) {
        const progressResult = await supabase.from("step_progress").select("step_key,status").eq("application_id", app.id);
        if (progressResult.error) {
          setError("Unable to load your application progress.");
          setLoading(false);
          return;
        }
        completed = (progressResult.data ?? [])
          .filter((step) => step.status === "COMPLETE")
          .map((step) => step.step_key);
      }
      const firstName = text(profileResult.data?.first_name, text(user.user_metadata?.first_name, "Applicant"));
      setData({
        userId: user.id,
        firstName,
        matricule: text(app?.matricule, "Pending"),
        matriculeStatus: text(app?.matricule_status, "PROVISIONAL"),
        applicationId: text(app?.id),
        status: text(app?.status, "DRAFT"),
        campus: text((app?.campuses as Record<string, unknown> | null)?.name, "Not selected"),
        programme: text((app?.programmes as Record<string, unknown> | null)?.name, "Not selected"),
        examScore: typeof app?.exam_score === "number" ? app.exam_score : null,
        completed,
        emailVerified: Boolean(user.email_confirmed_at),
        email: user.email ?? "",
        quote: parseQuote(loginResult.data),
      });
      setLoading(false);
    })();

    return () => { active = false; };
  }, [router, supabase]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!drawer) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawer]);

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace("/apply/login");
  }

  async function resendVerification() {
    if (!supabase || !data?.email || resendCooldown > 0) return;
    setResendMessage("");
    const { data: resendData, error: resendError } = await supabase.functions.invoke<{ sent?: boolean }>("resend-verification", {
      body: {},
    });
    setResendCooldown(60);
    setResendMessage(resendError
      ? "Unable to resend right now. Please try again later."
      : resendData?.sent
        ? "If the address can receive email, a verification message will be sent."
        : "Please wait before requesting another verification email.");
  }

  async function submitApplication() {
    if (!supabase || !data) return;
    const { error: submitError } = await supabase.rpc("submit_application", { p_application_id: data.applicationId });
    if (submitError) {
      setResendMessage("Unable to submit. Verify your email and complete all required steps.");
      return;
    }
    setData({ ...data, status: "SUBMITTED" });
    const { error: confirmationError } = await supabase.functions.invoke("send-submission-confirmation", {
      body: { applicationId: data.applicationId },
    });
    setResendMessage(confirmationError
      ? "Your application was submitted. Confirmation email is pending; use Retry confirmation email to try again."
      : "Your application was submitted. A confirmation email was sent.");
  }

  async function retryConfirmation() {
    if (!supabase || !data) return;
    const { error: confirmationError } = await supabase.functions.invoke("send-submission-confirmation", {
      body: { applicationId: data.applicationId },
    });
    setResendMessage(confirmationError
      ? "Confirmation email is still pending. Try again later."
      : "Confirmation email sent.");
  }

  async function copyMatricule() {
    if (!data?.matricule || data.matricule === "Pending") return;
    try {
      await navigator.clipboard.writeText(data.matricule);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!isConfigured) return <p role="alert" className="p-8 text-center text-sm text-[var(--danger)]">Portal configuration is missing. Please contact the seminary.</p>;
  if (loading) return <p className="p-8 text-center text-sm text-[var(--muted)]">Loading your application…</p>;
  if (error) return <p role="alert" className="mx-auto my-12 max-w-xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--danger)]">{error}</p>;
  if (!data) return null;

  const incompleteStep = portalSteps.find((step) => !data.completed.includes(step.key)) ?? portalSteps[0];
  const progress = Math.round((data.completed.length / portalSteps.length) * 100);
  const greetingName = data.firstName || "Applicant";

  const sideNav = (
    <nav aria-label="Application steps" className="grid gap-1">
      <Link href="/apply/dashboard" className="flex min-h-11 items-center gap-3 rounded-lg border-l-4 border-[var(--accent)] bg-[var(--primary-soft)] px-3 text-sm font-bold text-[var(--primary-strong)]">⌂ <span>Dashboard</span></Link>
      {portalSteps.map((step) => {
        const complete = data.completed.includes(step.key);
        return (
          <Link key={step.key} href={`/apply/step/${step.key}?application=${encodeURIComponent(data.applicationId)}`} onClick={() => setDrawer(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-[var(--ink)] hover:bg-[var(--primary-soft)] focus-visible:outline">
            <span aria-label={complete ? "Complete" : "Not complete"} className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? "bg-[var(--success)] text-white" : "border border-[var(--border)] text-[var(--muted)]"}`}>{complete ? "✓" : "○"}</span>
            <span>{step.label}</span>
          </Link>
        );
      })}
      <Link href="/apply/quotes" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-[var(--ink)] hover:bg-[var(--primary-soft)]">♡ <span>Saved quotes</span></Link>
      <button type="button" onClick={() => void signOut()} className="mt-3 min-h-11 rounded-lg border border-[var(--border)] px-3 text-left text-sm font-semibold text-[var(--muted)]">Sign out</button>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 sm:px-7">
        <Link href="/apply/dashboard" className="text-sm font-bold text-[var(--primary)]">CBTS · Applicant Portal</Link>
        <button type="button" aria-expanded={drawer} aria-controls="applicant-drawer" onClick={() => setDrawer(true)} className="min-h-11 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold lg:hidden">Menu</button>
        <button type="button" onClick={() => void signOut()} className="hidden min-h-11 rounded-lg px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)] lg:block">Sign out</button>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 p-4 sm:p-7 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="portal-card no-print hidden h-fit p-4 lg:sticky lg:top-24 lg:block">{sideNav}</aside>
        {drawer && (
          <div className="no-print fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
            <aside id="applicant-drawer" role="dialog" aria-modal="true" aria-label="Application navigation" onClick={(event) => event.stopPropagation()} className="h-full w-[min(86vw,340px)] overflow-y-auto bg-[var(--card)] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between"><strong>Application menu</strong><button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="size-10 rounded-full border border-[var(--border)]">×</button></div>
              {sideNav}
            </aside>
          </div>
        )}

        <main className="grid min-w-0 content-start gap-5">
          {!data.emailVerified && (
            <div role="status" className="rounded-xl border border-[#e7c984] bg-[var(--accent-soft)] p-4 text-sm text-[var(--ink)]">
              Verify your email before submitting your application. <button type="button" disabled={resendCooldown > 0} onClick={() => void resendVerification()} className="ml-1 font-bold text-[var(--primary)] underline disabled:opacity-60">{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification"}</button>
              {resendMessage && <span className="mt-2 block" role="status">{resendMessage}</span>}
            </div>
          )}
          <section aria-labelledby="welcome-title" className="portal-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
            <div><p className="mb-2 text-sm text-[var(--muted)]">{new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}</p><h1 id="welcome-title" className="m-0 font-serif text-3xl font-semibold">Welcome, {greetingName}</h1></div>
            <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusStyle(data.status)}`}>{statusLabels[data.status] ?? "No admission yet"}</span>
          </section>

          {data.quote && <LoginQuote quote={data.quote} userId={data.userId} />}

          <div className="grid gap-5 md:grid-cols-2">
            <section aria-labelledby="matricule-title" className="portal-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><h2 id="matricule-title" className="m-0 text-sm font-bold text-[var(--muted)]">Matricule</h2><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--ink)]">{data.matriculeStatus === "CONFIRMED" ? "Confirmed" : "Provisional"}</span></div>
              <p className="my-4 break-all font-mono text-xl font-bold tracking-wide text-[var(--primary)]">{data.matricule}</p>
              <button type="button" onClick={() => void copyMatricule()} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold">{copied ? "Copied" : "Copy number"}</button>
            </section>
            <section aria-labelledby="progress-title" className="portal-card flex items-center gap-5 p-5 sm:p-6">
              <div aria-label={`${data.completed.length} of 13 steps complete`} role="img" className="grid size-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${progress}%, var(--accent) ${progress}% 100%)` }}>
                <div className="grid size-[76px] place-items-center rounded-full bg-[var(--card)] text-center"><span className="text-lg font-bold">{data.completed.length}/13</span></div>
              </div>
              <div><h2 id="progress-title" className="m-0 font-serif text-xl font-semibold">Application progress</h2><p className="mb-0 mt-2 text-sm text-[var(--muted)]">Completed steps out of 13</p></div>
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[["Campus", data.campus], ["Course selection", data.programme], ["Entrance exam score", data.examScore === null ? "Not yet scored" : String(data.examScore)]].map(([label, value]) => (
              <section key={label} className="portal-card p-5"><h2 className="m-0 text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">{label}</h2><p className="mb-0 mt-3 text-lg font-semibold">{value}</p></section>
            ))}
          </div>

          <section className="portal-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div><h2 className="m-0 font-serif text-xl font-semibold">Continue your application</h2><p className="mb-0 mt-2 text-sm text-[var(--muted)]">Next up: {incompleteStep.label}</p></div>
            <Link href={`/apply/step/${incompleteStep.key}?application=${encodeURIComponent(data.applicationId)}`} className="inline-flex min-h-12 items-center rounded-lg bg-[var(--primary)] px-5 font-bold text-white hover:bg-[var(--primary-strong)]">Continue where you left off <span aria-hidden="true" className="ml-3">→</span></Link>
          </section>

          <div className="no-print flex flex-wrap gap-3">
            <Link href={`/apply/step/personal_information?application=${encodeURIComponent(data.applicationId)}`} className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">Update profile</Link>
            <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">Print application details</button>
            <button type="button" onClick={() => void submitApplication()} disabled={data.completed.length !== 13 || !data.emailVerified || data.status !== "DRAFT"} className="min-h-11 rounded-lg bg-[var(--primary)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" title="Complete all 13 steps and verify your email before submitting">Submit application</button>
            {data.status === "SUBMITTED" && <button type="button" onClick={() => void retryConfirmation()} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">Retry confirmation email</button>}
            {resendMessage && data.emailVerified && <p role="status" className="basis-full text-sm text-[var(--muted)]">{resendMessage}</p>}
          </div>
          <p className="mb-0 text-xs leading-5 text-[var(--muted)]">For account export or deletion, contact the Registrar through the seminary office. Requests are handled by staff.</p>
        </main>
      </div>
    </div>
  );
}
