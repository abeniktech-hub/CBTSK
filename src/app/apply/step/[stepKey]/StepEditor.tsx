"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import { stepSchemas } from "@/domain/step-schemas";
import { MEDICAL_FORM_TEMPLATE_URL } from "@/config/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { portalSteps, type PortalStepKey } from "@/lib/portal-steps";

type Draft = Record<string, unknown>;
type ProgrammeOption = { id: string; name: string; level: string; department: string; required_referees: string[] };
type ExamDetails = { status: string; date: string | null; venue: string | null; score: number | null };
type FeeDetails = { amount: number; currency: string };
type RefereeStatus = { kind: string; status: string };
type DocumentRow = { id: string; kind: string; scan_status: string; size_bytes: number };
type DocumentRequirement = { document_kind: string; required: boolean };

const fieldClass = "mt-1 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink)]";
const textFields: Partial<Record<PortalStepKey, Array<{ name: string; label: string; type?: string }>>> = {
  personal_information: [
    { name: "first_name", label: "First name" }, { name: "last_name", label: "Last name" },
    { name: "date_of_birth", label: "Date of birth", type: "date" }, { name: "gender", label: "Gender" },
    { name: "nationality", label: "Nationality" }, { name: "id_card_number", label: "ID card number" },
    { name: "address", label: "Address" }, { name: "phone", label: "Phone", type: "tel" },
    { name: "emergency_contact", label: "Emergency contact" },
  ],
  ministerial_interest: [{ name: "notes", label: "Additional ministry interests", type: "textarea" }],
  marital_status: [{ name: "spouse_name", label: "Spouse name (if married)" }],
  pledge: [{ name: "signature", label: "Type your full name as signature" }],
  christian_experience: [
    { name: "testimony", label: "Testimony of salvation", type: "textarea" },
    { name: "call_to_ministry", label: "Call into ministry", type: "textarea" },
    { name: "church", label: "Church membership" }, { name: "pastor", label: "Pastor" },
    { name: "years", label: "Years", type: "number" }, { name: "baptism", label: "Baptism details" },
  ],
  finance: [
    { name: "source", label: "Funding source" }, { name: "sponsor_name", label: "Sponsor name (if applicable)" },
    { name: "sponsor_contact", label: "Sponsor contact (if applicable)" },
  ],
};

function isPortalStepKey(value: string): value is PortalStepKey {
  return portalSteps.some((step) => step.key === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, toJson(item)]),
    );
  }
  throw new TypeError("Form data contains a value that cannot be saved.");
}

export default function StepEditor() {
  const params = useParams<{ stepKey: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const stepKey = params.stepKey;
  const step = portalSteps.find((item) => item.key === stepKey);
  const schema = isPortalStepKey(stepKey) ? stepSchemas[stepKey] : null;
  const applicationId = search.get("application");
  const [message, setMessage] = useState("Loading draft…");
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [entryYears, setEntryYears] = useState<Array<{ year: number; label: string }>>([]);
  const [ministryAreas, setMinistryAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [refereeStatuses, setRefereeStatuses] = useState<RefereeStatus[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [uploadingKind, setUploadingKind] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [fee, setFee] = useState<FeeDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pledgeText, setPledgeText] = useState("Loading pledge…");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultValues = useMemo<Draft>(() => {
    if (stepKey === "education") return { entries: [{ institution: "", qualification: "", year: "", grade: "" }] };
    if (stepKey === "referees") return { referees: [{ kind: "Pastor", name: "", email: "", phone: "" }] };
    if (stepKey === "ministerial_interest") return { areas: [] };
    if (stepKey === "pledge") return { agreed: false, signature: "" };
    if (stepKey === "pick_course") return { campus_id: "", programme_level: "", programme_id: "", department: "", year_of_entry: "" };
    return {};
  }, [stepKey]);

  const form = useForm<Draft>({
    defaultValues,
    mode: "onBlur",
  });
  const entries = useFieldArray({ control: form.control, name: "entries" as never });
  const referees = useFieldArray({ control: form.control, name: "referees" as never });

  const saveDraft = useCallback(async (values: Draft) => {
    if (!schema || !applicationId) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Portal configuration is missing.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("step_progress").upsert(
      { application_id: applicationId, step_key: stepKey, status: "IN_PROGRESS", data: toJson(values) },
      { onConflict: "application_id,step_key" },
    );
    setSaving(false);
    setMessage(error ? "Draft could not be saved. Check your connection." : `Saved at ${new Date().toLocaleTimeString()}`);
  }, [applicationId, schema, stepKey]);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Portal configuration is missing.");
      return;
    }
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/apply/login");
        return;
      }
      if (stepKey === "pick_course") {
        const [campusResult, programmeResult, cycleResult] = await Promise.all([
          supabase.from("campuses").select("id,name").eq("active", true).order("name"),
          supabase.from("programmes").select("id,name,level,department,required_referees").eq("active", true).order("level").order("name"),
          supabase.from("admission_cycles").select("year,label").eq("active", true).order("year"),
        ]);
        if (active) {
          setCampuses(campusResult.data ?? []);
          setProgrammes(programmeResult.data ?? []);
          setEntryYears(cycleResult.data ?? []);
        }
      }
      if (stepKey === "ministerial_interest") {
        const { data: areas } = await supabase.from("ministry_areas").select("id,name").eq("active", true).order("name");
        if (active) setMinistryAreas(areas ?? []);
      }
      if (stepKey === "referees" && applicationId) {
        const { data: savedReferees } = await supabase.from("referees")
          .select("kind,status").eq("application_id", applicationId).order("created_at");
        if (active) setRefereeStatuses(savedReferees ?? []);
      }
      if ((stepKey === "credential_uploads" || stepKey === "medical_clearance") && applicationId) {
        const { data: application } = await supabase.from("applications")
          .select("programmes(level)").eq("id", applicationId).maybeSingle();
        const programme = Array.isArray(application?.programmes) ? application.programmes[0] : application?.programmes;
        if (programme?.level && stepKey === "credential_uploads") {
          const [{ data: requirements }, { data: marital }] = await Promise.all([
            supabase.from("programme_document_requirements").select("document_kind,required,requires_married").eq("programme_level", programme.level),
            supabase.from("step_progress").select("data").eq("application_id", applicationId).eq("step_key", "marital_status").maybeSingle(),
          ]);
          const maritalData = isRecord(marital?.data) ? marital.data : {};
          const married = maritalData.status === "Married";
          if (active) setDocumentRequirements((requirements ?? [])
            .filter((item) => !item.requires_married || married)
            .map(({ document_kind, required }) => ({ document_kind, required })));
        }
        const { data: uploaded } = await supabase.from("documents")
          .select("id,kind,scan_status,size_bytes").eq("application_id", applicationId);
        if (active) setDocuments(uploaded ?? []);
      }
      if (stepKey === "entrance_exam" && applicationId) {
        const { data: application } = await supabase.from("applications").select("exam_status,exam_date,exam_venue,exam_score").eq("id", applicationId).maybeSingle();
        if (active && application) setExam({
          status: application.exam_status,
          date: application.exam_date,
          venue: application.exam_venue,
          score: application.exam_score,
        });
      }
      if (stepKey === "payment" && applicationId) {
        const { data: application } = await supabase.from("applications")
          .select("payment_status,programmes(level)").eq("id", applicationId).maybeSingle();
        if (active && application) {
          setPaymentStatus(application.payment_status);
          const programme = Array.isArray(application.programmes) ? application.programmes[0] : application.programmes;
          if (programme?.level) {
            const { data: feeData } = await supabase.from("fees").select("amount,currency")
              .eq("programme_level", programme.level).eq("active", true).maybeSingle();
            if (active && feeData) setFee(feeData);
          }
        }
      }
      if (stepKey === "pledge") {
        const response = await fetch("/content/pledge.md");
        if (active && response.ok) setPledgeText(await response.text());
      }
      if (applicationId && schema) {
        const { data } = await supabase.from("step_progress").select("data").eq("application_id", applicationId).eq("step_key", stepKey).maybeSingle();
        if (active && isRecord(data?.data)) form.reset(data.data as Draft);
      }
      if (active) setMessage("Draft not saved yet");
    })();
    return () => { active = false; if (timer.current) clearTimeout(timer.current); };
  }, [applicationId, form, router, schema, stepKey]);

  useEffect(() => {
    if (!schema || !applicationId) return;
    const subscription = form.watch((values) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void saveDraft(values as Draft); }, 800);
    });
    const interval = window.setInterval(() => {
      if (form.formState.isDirty) void saveDraft(form.getValues());
    }, 20_000);
    return () => { subscription.unsubscribe(); window.clearInterval(interval); if (timer.current) clearTimeout(timer.current); };
  }, [applicationId, form, saveDraft, schema]);

  async function complete(values: Draft) {
    if (!schema || !applicationId) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (path) form.setError(path as FieldPath<Draft>, { type: "manual", message: issue.message });
      }
      const firstIssue = parsed.error.issues[0];
      setMessage(firstIssue?.message ?? "Complete the required fields.");
      const firstPath = firstIssue?.path.join(".");
      if (firstPath) form.setFocus(firstPath as FieldPath<Draft>);
      setSaving(false);
      return;
    }
    const { error } = await supabase.rpc("complete_application_step", {
      p_application_id: applicationId,
      p_step_key: stepKey,
      p_data: parsed.data,
    });
    setSaving(false);
    if (error) {
      setMessage("This step could not be marked complete. Review the required fields and try again.");
      return;
    }
    let completionMessage = "Step complete.";
    if (stepKey === "referees") {
      const { error: inviteError } = await supabase.functions.invoke("send-referee-invites", {
        body: { applicationId },
      });
      if (inviteError) completionMessage = "Referee details were saved, but requests could not be emailed. Please contact the Registrar.";
    }
    setMessage(completionMessage);
    router.replace("/apply/dashboard");
  }

  async function startPayment() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !applicationId) return;
    setPaymentMessage("Starting secure checkout…");
    const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string }>("create-payment", {
      body: { applicationId },
    });
    if (error || !data?.checkoutUrl) {
      setPaymentMessage("Payment could not be started. Contact the Registrar if this continues.");
      return;
    }
    window.location.assign(data.checkoutUrl);
  }

  async function refreshPaymentStatus() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !applicationId) return;
    const { data, error } = await supabase.from("applications").select("payment_status").eq("id", applicationId).maybeSingle();
    if (error || !data) {
      setPaymentMessage("Payment status is unavailable. Try again.");
      return;
    }
    setPaymentStatus(data.payment_status);
    setPaymentMessage(data.payment_status === "PAID" ? "Payment verified." : "Payment has not been verified yet.");
  }

  async function uploadDocument(kind: string, file: File | undefined) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !applicationId || !file) return;
    if (file.size > 5 * 1024 * 1024) {
      setDocumentMessage("Choose a file smaller than 5 MB.");
      return;
    }
    setUploadingKind(kind);
    setDocumentMessage("Uploading and checking the file…");
    const formData = new FormData();
    formData.set("applicationId", applicationId);
    formData.set("kind", kind);
    formData.set("file", file);
    const { error: uploadError } = await supabase.functions.invoke("upload-document", { body: formData });
    setUploadingKind("");
    if (uploadError) {
      setDocumentMessage("Upload rejected. Use a valid PDF, JPG or PNG smaller than 5 MB.");
      return;
    }
    const { data: uploaded, error: loadError } = await supabase.from("documents")
      .select("id,kind,scan_status,size_bytes").eq("application_id", applicationId);
    if (loadError) {
      setDocumentMessage("File uploaded, but the document list could not be refreshed.");
      return;
    }
    setDocuments(uploaded ?? []);
    setDocumentMessage("Uploaded. The document remains unavailable until its security scan is complete.");
  }

  async function accessDocument(documentId: string, action: "sign" | "delete") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error: accessError } = await supabase.functions.invoke<{ signedUrl?: string }>("document-access", {
      body: { documentId, action },
    });
    if (accessError) {
      setDocumentMessage(action === "sign" ? "Preview is available after the security scan." : "Document could not be deleted.");
      return;
    }
    if (action === "sign" && data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "delete" && applicationId) {
      const { data: uploaded } = await supabase.from("documents")
        .select("id,kind,scan_status,size_bytes").eq("application_id", applicationId);
      setDocuments(uploaded ?? []);
      setDocumentMessage("Document deleted.");
    }
  }

  if (!step || !schema) return <p className="p-8">This application step is not available.</p>;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <Link href="/apply/dashboard" className="text-sm font-semibold text-[var(--primary)] underline">← Back to dashboard</Link>
      <section className="portal-card mt-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[.15em] text-[var(--primary)]">Application step</p><h1 className="m-0 font-serif text-3xl font-semibold">{step.label}</h1></div>
          <p role="status" aria-live="polite" className="m-0 text-sm text-[var(--muted)]">{saving ? "Saving…" : message}</p>
        </div>
        <form className="mt-7 grid gap-5" onBlur={() => { if (timer.current) clearTimeout(timer.current); void saveDraft(form.getValues()); }} onSubmit={form.handleSubmit(complete)}>
          {stepKey === "pick_course" && <>
            <label className="text-sm font-semibold">Campus<select className={fieldClass} {...form.register("campus_id")}><option value="">Select a campus</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label>
            <label className="text-sm font-semibold">Programme level<select className={fieldClass} {...form.register("programme_level", { onChange: () => form.setValue("programme_id", "") })}><option value="">Select a level</option>{[...new Set(programmes.map((programme) => programme.level))].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
            <label className="text-sm font-semibold">Programme<select className={fieldClass} {...form.register("programme_id", { onChange: (event) => {
              const programme = programmes.find((item) => item.id === event.target.value);
              form.setValue("department", programme?.department ?? "");
            } })}><option value="">Select a programme</option>{programmes.filter((programme) => programme.level === form.watch("programme_level")).map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</select></label>
            <p className="m-0 text-sm text-[var(--muted)]">Department: {programmes.find((programme) => programme.id === form.watch("programme_id"))?.department || "Select a programme"}</p>
            <label className="text-sm font-semibold">Year of entry<select className={fieldClass} {...form.register("year_of_entry")}><option value="">Select a year</option>{entryYears.map(({ year, label }) => <option key={year} value={year}>{label}</option>)}</select></label>
          </>}

          {(isPortalStepKey(stepKey) ? textFields[stepKey] ?? [] : []).map(({ name, label, type }) => (
            <label key={name} className="text-sm font-semibold">{label}
              {type === "textarea" ? <textarea rows={4} className={fieldClass} {...form.register(name)} /> : <input type={type ?? "text"} className={fieldClass} {...form.register(name)} />}
              {form.formState.errors[name] && <span role="alert" className="mt-1 block text-sm text-[var(--danger)]">{String(form.formState.errors[name]?.message)}</span>}
            </label>
          ))}

          {stepKey === "education" && (
            <div className="grid gap-4">
              <h2 className="m-0 font-serif text-xl font-semibold">Education history</h2>
              {entries.fields.map((field, index) => <fieldset key={field.id} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2"><legend className="px-2 text-sm font-bold">Education {index + 1}</legend>{(["institution", "qualification", "year", "grade"] as const).map((name) => <label key={name} className="text-sm font-semibold">{name}<input className={fieldClass} {...form.register(`entries.${index}.${name}`)} /></label>)}{entries.fields.length > 1 && <button type="button" onClick={() => entries.remove(index)} className="text-left text-sm text-[var(--danger)] underline">Remove</button>}</fieldset>)}
              <button type="button" onClick={() => entries.append({ institution: "", qualification: "", year: "", grade: "" })} className="min-h-11 justify-self-start rounded-lg border border-[var(--border)] px-4 text-sm font-semibold">Add education</button>
            </div>
          )}

          {stepKey === "referees" && (
            <div className="grid gap-4">
              <h2 className="m-0 font-serif text-xl font-semibold">Referee contacts</h2>
              {refereeStatuses.length > 0 && <ul aria-label="Recommendation status" className="grid gap-2 rounded-lg bg-[var(--accent-soft)] p-4 text-sm">{refereeStatuses.map((referee, index) => <li key={`${referee.kind}-${index}`}>{referee.kind}: {referee.status === "RECEIVED" ? "Received" : "Pending"}</li>)}</ul>}
              {referees.fields.map((field, index) => <fieldset key={field.id} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2"><legend className="px-2 text-sm font-bold">Referee {index + 1}</legend>{(["kind", "name", "email", "phone"] as const).map((name) => <label key={name} className="text-sm font-semibold">{name}<input type={name === "email" ? "email" : "text"} className={fieldClass} {...form.register(`referees.${index}.${name}`)} /></label>)}{referees.fields.length > 1 && <button type="button" onClick={() => referees.remove(index)} className="text-left text-sm text-[var(--danger)] underline">Remove</button>}</fieldset>)}
              <button type="button" onClick={() => referees.append({ kind: "", name: "", email: "", phone: "" })} className="min-h-11 justify-self-start rounded-lg border border-[var(--border)] px-4 text-sm font-semibold">Add referee</button>
              <p className="m-0 text-sm text-[var(--muted)]">Recommendation requests are sent after the referee details are saved.</p>
            </div>
          )}

          {stepKey === "ministerial_interest" && <fieldset className="grid gap-3"><legend className="text-sm font-bold">Areas of ministry</legend>{ministryAreas.map((item) => <label key={item.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" value={item.name} {...form.register("areas")} className="size-4 accent-[var(--primary)]" />{item.name}</label>)}</fieldset>}
          {stepKey === "marital_status" && <label className="text-sm font-semibold">Marital status<select className={fieldClass} {...form.register("status")}><option value="">Choose one</option><option>Single</option><option>Married</option><option>Widowed</option><option>Divorced</option></select></label>}
          {stepKey === "pledge" && <div className="rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] p-4 text-sm leading-6"><div className="m-0 whitespace-pre-wrap">{pledgeText}</div><label className="mt-4 flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 accent-[var(--primary)]" {...form.register("agreed")} /><span>I agree to the pledge.</span></label></div>}
          {stepKey === "credential_uploads" && <div className="grid gap-4 rounded-lg bg-[var(--accent-soft)] p-4 text-sm leading-6">
            {documentRequirements.length === 0 && <p className="m-0">No credential requirements are currently configured. Contact the Registrar if this looks incorrect.</p>}
            {documentRequirements.map((requirement) => <label key={requirement.document_kind} className="grid gap-2 font-semibold">{requirement.document_kind.replaceAll("_", " ")}{requirement.required ? " (required)" : " (optional)"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={Boolean(uploadingKind)} onChange={(event) => void uploadDocument(requirement.document_kind, event.target.files?.[0])} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" /><span className="text-xs font-normal text-[var(--muted)]">{uploadingKind === requirement.document_kind ? "Uploading…" : "PDF, JPG or PNG; maximum 5 MB"}</span></label>)}
            {documents.filter((document) => stepKey === "credential_uploads" ? document.kind !== "medical_form" : document.kind === "medical_form").map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"><span>{document.kind.replaceAll("_", " ")} · {document.scan_status}</span><div className="flex gap-2"><button type="button" onClick={() => void accessDocument(document.id, "sign")} className="min-h-10 rounded-lg border border-[var(--border)] px-3">Preview</button><button type="button" onClick={() => void accessDocument(document.id, "delete")} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-[var(--danger)]">Delete</button></div></div>)}
            {documentMessage && <p role="status" className="m-0">{documentMessage}</p>}
          </div>}
          {stepKey === "payment" && <div className="grid gap-3 rounded-lg bg-[var(--accent-soft)] p-4 text-sm leading-6"><p className="m-0">Application fee: {fee ? `${fee.amount.toLocaleString()} ${fee.currency}` : "Fee not configured"}</p><p className="m-0">Payment status: {paymentStatus}</p>{paymentStatus !== "PAID" && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void startPayment()} className="min-h-11 rounded-lg bg-[var(--primary)] px-4 font-bold text-white">Pay by mobile money or card</button><button type="button" onClick={() => void refreshPaymentStatus()} className="min-h-11 rounded-lg border border-[var(--border)] px-4 font-semibold">Refresh payment status</button></div>}{paymentMessage && <p role="status" className="m-0">{paymentMessage}</p>}</div>}
          {stepKey === "entrance_exam" && <div className="m-0 rounded-lg bg-[var(--accent-soft)] p-4 text-sm leading-6"><p className="m-0">The entrance exam is administered in person. Score and schedule information are entered by authorized staff.</p><dl className="mt-4 grid grid-cols-2 gap-3"><dt>Status</dt><dd className="m-0">{exam?.status ?? "NOT_SCHEDULED"}</dd><dt>Date</dt><dd className="m-0">{exam?.date ?? "Not scheduled"}</dd><dt>Venue</dt><dd className="m-0">{exam?.venue ?? "Not assigned"}</dd><dt>Score</dt><dd className="m-0">{exam?.score ?? "Not yet scored"}</dd></dl></div>}
          {stepKey === "medical_clearance" && <div className="grid gap-4"><a className="text-sm font-semibold text-[var(--primary)] underline" href={MEDICAL_FORM_TEMPLATE_URL} download>Download the medical form template</a><label className="grid gap-2 text-sm font-semibold">Completed medical form<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={Boolean(uploadingKind)} onChange={(event) => void uploadDocument("medical_form", event.target.files?.[0])} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" /></label>{documents.filter((document) => document.kind === "medical_form").map((document) => <div key={document.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"><span>Medical form · {document.scan_status}</span><button type="button" onClick={() => void accessDocument(document.id, "delete")} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-[var(--danger)]">Delete</button></div>)}{documentMessage && <p role="status" className="m-0 text-sm">{documentMessage}</p>}</div>}

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
            {stepKey !== "entrance_exam" && (stepKey !== "payment" || paymentStatus === "PAID") && <button type="submit" disabled={saving} className="min-h-12 rounded-lg bg-[var(--primary)] px-5 font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Mark step complete"}</button>}
            {stepKey !== "entrance_exam" && stepKey !== "payment" && <button type="button" onClick={() => void saveDraft(form.getValues())} disabled={saving} className="min-h-12 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold">Save draft</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
