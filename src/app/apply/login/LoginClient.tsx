"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.string().email("Enter a valid email address."),
  countryCode: z.string().min(2),
  phone: z.string().trim().min(6, "Enter a valid phone number."),
  password: z.string().min(10, "Use at least 10 characters."),
  confirmPassword: z.string(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type Mode = "signin" | "signup" | "forgot";

const fieldClass = "mt-1 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink)]";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mb-0 mt-1 text-sm text-[var(--danger)]">{message}</p> : null;
}

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = useForm<SignInValues>({ resolver: zodResolver(signInSchema), mode: "onBlur" });
  const signUp = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: { countryCode: "+237" },
  });

  const password = signUp.watch("password") ?? "";
  const strength = password.length >= 14 ? 3 : password.length >= 10 ? 2 : password.length >= 6 ? 1 : 0;

  async function submitSignIn(values: SignInValues) {
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice("The application portal is not configured. Please contact the seminary.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setNotice("Unable to sign in with those details. Check them and try again.");
      setBusy(false);
      return;
    }
    await supabase.rpc("record_login_and_pick_quote");
    router.replace("/apply/dashboard");
  }

  async function submitSignUp(values: SignUpValues) {
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice("The application portal is not configured. Please contact the seminary.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: `${values.countryCode}${values.phone}`,
        },
        emailRedirectTo: `${window.location.origin}/apply/dashboard`,
      },
    });
    setBusy(false);
    if (error) {
      setNotice("Unable to create the account with those details. Check them and try again.");
      return;
    }
    setNotice("Account created. Check your email to verify your address. You may sign in after verification.");
    setMode("signin");
  }

  async function submitForgotPassword(email: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice("The application portal is not configured. Please contact the seminary.");
      return;
    }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/apply/reset-password`,
    });
    setBusy(false);
    setNotice("If the address can receive a reset email, instructions will be sent shortly.");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 p-4 sm:p-8 lg:grid-cols-[.9fr_1.1fr]">
      <section className="portal-login-panel order-2 rounded-2xl p-6 text-white sm:p-10 lg:order-1 lg:min-h-[590px] lg:rounded-[24px]">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#f6ecd3]">Cameroon Baptist Theological Seminary</p>
        <h1 className="m-0 max-w-[16ch] font-serif text-4xl font-semibold leading-tight sm:text-5xl">Your application, at your pace.</h1>
        <p className="mt-5 max-w-[42ch] leading-7 text-white/90">Welcome to the CBTS online admission portal. Create an account to begin your application.</p>
        <ul className="mt-10 grid list-none gap-5 p-0 text-sm font-medium">
          {["Save and continue later", "Secure document upload", "Track every step"].map((item) => (
            <li key={item} className="flex items-center gap-3"><span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-white/15 text-[#f6ecd3]">✓</span>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="account-title" className="portal-card order-1 p-5 sm:p-8 lg:order-2">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--primary)]">CBTS admissions</p>
            <h2 id="account-title" className="m-0 font-serif text-3xl font-semibold text-[var(--ink)]">
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
            </h2>
          </div>
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] font-serif font-bold text-[var(--primary)]">CB</span>
        </div>

        {mode !== "forgot" && (
          <div role="tablist" aria-label="Account options" className="mb-6 grid grid-cols-2 rounded-lg bg-[var(--primary-soft)] p-1">
            {(["signin", "signup"] as const).map((value) => (
              <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setNotice(""); setMode(value); }}
                className={`min-h-11 rounded-md text-sm font-semibold transition-colors ${mode === value ? "bg-[var(--card)] text-[var(--primary-strong)] shadow-sm" : "text-[var(--muted)]"}`}>
                {value === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        {notice && <p role="status" className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--primary-soft)] p-3 text-sm text-[var(--ink)]">{notice}</p>}

        {mode === "signin" && (
          <form noValidate onSubmit={signIn.handleSubmit(submitSignIn)} className="grid gap-4">
            <div>
              <label htmlFor="signin-email" className="text-sm font-semibold">Email address</label>
              <input id="signin-email" type="email" autoComplete="email" className={fieldClass} aria-invalid={Boolean(signIn.formState.errors.email)} aria-describedby="signin-email-error" {...signIn.register("email")} />
              <FieldError id="signin-email-error" message={signIn.formState.errors.email?.message} />
            </div>
            <div>
              <label htmlFor="signin-password" className="text-sm font-semibold">Password</label>
              <input id="signin-password" type="password" autoComplete="current-password" className={fieldClass} aria-invalid={Boolean(signIn.formState.errors.password)} aria-describedby="signin-password-error" {...signIn.register("password")} />
              <FieldError id="signin-password-error" message={signIn.formState.errors.password?.message} />
            </div>
            <button type="submit" disabled={busy} className="mt-2 min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white transition-colors hover:bg-[var(--primary-strong)] disabled:opacity-60">{busy ? "Please wait…" : "Sign in"}</button>
            <button type="button" onClick={() => { setMode("forgot"); setNotice(""); }} className="min-h-11 justify-self-start text-sm font-semibold text-[var(--primary)] underline underline-offset-4">Forgot password?</button>
            <p className="mb-0 text-sm text-[var(--muted)]">New here? <button type="button" onClick={() => setMode("signup")} className="font-bold text-[var(--primary)] underline underline-offset-4">Begin your application</button></p>
          </form>
        )}

        {mode === "signup" && (
          <form noValidate onSubmit={signUp.handleSubmit(submitSignUp)} className="grid gap-3 sm:grid-cols-2">
            {([
              ["firstName", "First name", "given-name"],
              ["lastName", "Last name", "family-name"],
              ["email", "Email address", "email"],
            ] as const).map(([name, label, autocomplete]) => {
              const error = signUp.formState.errors[name];
              return <div key={name} className="sm:col-span-1">
                <label htmlFor={`signup-${name}`} className="text-sm font-semibold">{label}</label>
                <input id={`signup-${name}`} autoComplete={autocomplete} type={name === "email" ? "email" : "text"} className={fieldClass} aria-invalid={Boolean(error)} aria-describedby={`signup-${name}-error`} {...signUp.register(name)} />
                <FieldError id={`signup-${name}-error`} message={error?.message} />
              </div>;
            })}
            <div className="sm:col-span-2">
              <label htmlFor="signup-phone" className="text-sm font-semibold">Phone number</label>
              <div className="mt-1 flex gap-2">
                <select aria-label="Country calling code" className="min-h-12 w-28 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-sm text-[var(--ink)]" {...signUp.register("countryCode")}>
                  <option value="+237">Cameroon +237</option><option value="+234">Nigeria +234</option><option value="+233">Ghana +233</option><option value="+1">Other +1</option>
                </select>
                <input id="signup-phone" type="tel" autoComplete="tel-national" className={`${fieldClass} mt-0`} aria-invalid={Boolean(signUp.formState.errors.phone)} aria-describedby="signup-phone-error" {...signUp.register("phone")} />
              </div>
              <FieldError id="signup-phone-error" message={signUp.formState.errors.phone?.message} />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-sm font-semibold">Password</label>
              <input id="signup-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={Boolean(signUp.formState.errors.password)} aria-describedby="password-strength signup-password-error" {...signUp.register("password")} />
              <div id="password-strength" aria-label={`Password strength ${strength} of 3`} className="mt-2 flex gap-1">
                {[1, 2, 3].map((level) => <span key={level} className={`h-1.5 flex-1 rounded-full ${strength >= level ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />)}
              </div>
              <FieldError id="signup-password-error" message={signUp.formState.errors.password?.message} />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="text-sm font-semibold">Confirm password</label>
              <input id="signup-confirm-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={Boolean(signUp.formState.errors.confirmPassword)} aria-describedby="signup-confirm-password-error" {...signUp.register("confirmPassword")} />
              <FieldError id="signup-confirm-password-error" message={signUp.formState.errors.confirmPassword?.message} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input type="checkbox" className="mt-1 size-4 accent-[var(--primary)]" aria-invalid={Boolean(signUp.formState.errors.consent)} {...signUp.register("consent")} />
                <span>I agree to the <Link className="font-semibold text-[var(--primary)] underline" href="/privacy">privacy notice</Link> and the use of my information to process this application.</span>
              </label>
              <FieldError id="signup-consent-error" message={signUp.formState.errors.consent?.message} />
            </div>
            <button type="submit" disabled={busy} className="mt-2 min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white transition-colors hover:bg-[var(--primary-strong)] disabled:opacity-60 sm:col-span-2">{busy ? "Please wait…" : "Create account"}</button>
            <p className="mb-0 text-sm text-[var(--muted)] sm:col-span-2">Already have an account? <button type="button" onClick={() => setMode("signin")} className="font-bold text-[var(--primary)] underline">Sign in</button></p>
          </form>
        )}

        {mode === "forgot" && (
          <form noValidate onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "");
            if (z.string().email().safeParse(email).success) void submitForgotPassword(email);
            else setNotice("Enter a valid email address.");
          }} className="grid gap-4">
            <label htmlFor="forgot-email" className="text-sm font-semibold">Email address</label>
            <input id="forgot-email" name="email" type="email" autoComplete="email" required className={fieldClass} />
            <button type="submit" disabled={busy} className="min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white">{busy ? "Please wait…" : "Send reset link"}</button>
            <button type="button" onClick={() => setMode("signin")} className="min-h-11 justify-self-start text-sm font-semibold text-[var(--primary)] underline">Back to sign in</button>
          </form>
        )}
      </section>
    </main>
  );
}
