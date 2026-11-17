"use client";

import { useMemo, useState } from "react";
import { campuses } from "@/data/campuses";
import { givingContactEmail, givingContactWhatsApp } from "@/config/site";

const giftTypes = [
  {
    title: "Financial gifts",
    description: "Choose a campus and contact the bursary to ask how to begin a financial gift.",
  },
  {
    title: "Books and library materials",
    description: "Choose a campus and ask how to offer books or other library materials.",
  },
  {
    title: "Other materials",
    description: "Equipment, furniture, and supplies can be offered; choose a campus to start an enquiry.",
  },
];

const whereNeeded = "Where it is needed most";
const contactEmail = givingContactEmail;
const contactWhatsApp = givingContactWhatsApp;

function isConfigured(value: string) {
  return !value.startsWith("TODO:");
}

export default function GivingOptions() {
  const [campus, setCampus] = useState(whereNeeded);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const message = useMemo(
    () => `Hello, I would like to ask about giving support to ${campus}.`,
    [campus],
  );
  const mailto = isConfigured(contactEmail)
    ? `mailto:${contactEmail}?subject=${encodeURIComponent("Giving enquiry")}&body=${encodeURIComponent(message)}`
    : null;
  const whatsappNumber = contactWhatsApp.replace(/\D/g, "");
  const whatsapp = isConfigured(contactWhatsApp) && whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  async function copyMessage() {
    setCopied(false);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {giftTypes.map((gift) => (
          <article key={gift.title} className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="m-0 font-serif text-2xl font-semibold">{gift.title}</h2>
            <p className="mb-0 mt-4 text-sm leading-6 text-[var(--muted)]">{gift.description}</p>
          </article>
        ))}
      </div>
      <section className="mt-10 rounded-xl bg-[var(--forest)] p-5 text-white sm:p-8" aria-labelledby="giving-start-title">
        <h2 id="giving-start-title" className="m-0 font-serif text-2xl font-semibold">Start a giving enquiry</h2>
        <label className="mt-5 grid max-w-lg gap-2 text-sm font-semibold">
          Campus
          <select className="min-h-12 rounded-md border border-white/30 bg-white px-3 text-[var(--ink)]" value={campus} onChange={(event) => { setCampus(event.target.value); setCopied(false); setCopyError(false); }}>
            {campuses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            <option value={whereNeeded}>{whereNeeded}</option>
          </select>
        </label>
        <p className="mt-5 rounded-md bg-white/10 p-4 text-sm leading-6" aria-live="polite">{message}</p>
        <div className="flex flex-wrap gap-3">
          {mailto && <a className="button a11y-gold-cta min-h-11 rounded-md" href={mailto}>Email the bursary</a>}
          {whatsapp && <a className="button min-h-11 rounded-md border border-white text-white" href={whatsapp} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>}
          <button type="button" className="button min-h-11 rounded-md border border-white text-white" onClick={() => void copyMessage()}>{copied ? "Message copied" : "Copy message"}</button>
        </div>
        {copyError && <p role="alert" className="mb-0 mt-3 text-sm">Could not copy the message. Please select and copy it manually.</p>}
        {!mailto && !whatsapp && <p className="mb-0 mt-4 text-sm">Giving contact options will be available once the seminary confirms its contact details.</p>}
      </section>
      <p className="mt-8 rounded-md border border-[var(--line)] bg-[var(--soft)] p-4 text-sm font-semibold text-[var(--ink)]">Online giving coming soon - contact the bursary.</p>
    </>
  );
}
