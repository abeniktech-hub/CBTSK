"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("The application portal is not configured.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Unable to update the password. Request a new reset link and try again.");
      return;
    }
    router.replace("/apply/dashboard");
  }

  return <main className="mx-auto max-w-lg p-5 sm:py-16">
    <form onSubmit={submit} className="portal-card grid gap-4 p-6 sm:p-8">
      <h1 className="m-0 font-serif text-3xl font-semibold">Choose a new password</h1>
      <label className="text-sm font-semibold">New password<input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} className="mt-1 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink)]" /></label>
      <button className="min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white">Update password</button>
      {message && <p role="alert" className="mb-0 text-sm text-[var(--danger)]">{message}</p>}
    </form>
  </main>;
}
