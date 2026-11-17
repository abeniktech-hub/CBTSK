"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfigurationMessage } from "@/lib/supabase/configuration-message";
import { translate } from "@/lib/i18n";
import { useI18n } from "../../LocaleProvider";

function createSignInSchema(locale: "en" | "fr") {
  return z.object({
    email: z.string().email(translate(locale, "validEmailError")),
    password: z.string().min(1, translate(locale, "requiredPasswordError")),
  });
}

function createSignUpSchema(locale: "en" | "fr") {
  return z.object({
    firstName: z.string().trim().min(1, translate(locale, "firstNameError")),
    lastName: z.string().trim().min(1, translate(locale, "lastNameError")),
    email: z.string().email(translate(locale, "validEmailError")),
    countryCode: z.string().min(2),
    phone: z.string().trim().min(6, translate(locale, "phoneError")),
    password: z.string().min(10, translate(locale, "passwordLengthError")),
    confirmPassword: z.string(),
    consent: z.literal(true, { errorMap: () => ({ message: translate(locale, "consentError") }) }),
  }).refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: translate(locale, "passwordMatchError"),
  });
}

type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;
type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;
type Mode = "signin" | "signup" | "forgot";
type LoginClientProps = { initialMode?: "signin" | "signup" };

const fieldClass = "mt-1 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink)]";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mb-0 mt-1 text-sm text-[var(--danger)]">{message}</p> : null;
}

export default function LoginClient({ initialMode = "signin" }: LoginClientProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const signInSchema = createSignInSchema(locale);
  const signUpSchema = createSignUpSchema(locale);
  const signIn = useForm<SignInValues>({ resolver: zodResolver(signInSchema), mode: "onBlur" });
  const signUp = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: { countryCode: "+237" },
  });

  const isConfigured = createSupabaseBrowserClient() !== null;
  const password = signUp.watch("password") ?? "";
  const strength = password.length >= 14 ? 3 : password.length >= 10 ? 2 : password.length >= 6 ? 1 : 0;

  async function submitSignIn(values: SignInValues) {
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice(getSupabaseConfigurationMessage(locale));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setNotice(t("signInFailure"));
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
      setNotice(getSupabaseConfigurationMessage(locale));
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
      setNotice(t("registerFailure"));
      return;
    }
    setNotice(t("accountCreated"));
  }

  async function submitForgotPassword(email: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice(getSupabaseConfigurationMessage(locale));
      return;
    }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/apply/reset-password`,
    });
    setBusy(false);
    setNotice(t("resetEmailSent"));
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 p-4 sm:p-8 lg:grid-cols-[.9fr_1.1fr]">
      <section className="portal-login-panel order-2 rounded-2xl p-6 text-white sm:p-10 lg:order-1 lg:min-h-[590px] lg:rounded-[24px]">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#f6ecd3]">Cameroon Baptist Theological Seminary</p>
        <h1 className="m-0 max-w-[16ch] font-serif text-4xl font-semibold leading-tight sm:text-5xl">{t("portalSideTitle")}</h1>
        <p className="mt-5 max-w-[42ch] leading-7 text-white/90">{t("portalSideIntro")}</p>
        <ul className="mt-10 grid list-none gap-5 p-0 text-sm font-medium">
          {(["portalBenefitSave", "portalBenefitUpload", "portalBenefitTrack"] as const).map((key) => (
            <li key={key} className="flex items-center gap-3"><span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-white/15 text-[#f6ecd3]">✓</span>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="account-title" className="portal-card order-1 p-5 sm:p-8 lg:order-2">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--primary)]">{t("portalBrand")}</p>
            <h2 id="account-title" className="m-0 font-serif text-3xl font-semibold text-[var(--ink)]">
              {mode === "signin" ? t("signInTitle") : mode === "signup" ? t("registerTitle") : t("resetPasswordTitle")}
            </h2>
          </div>
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] font-serif font-bold text-[var(--primary)]">CB</span>
        </div>

        {!isConfigured && <p role="alert" className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--primary-soft)] p-3 text-sm text-[var(--ink)]">{getSupabaseConfigurationMessage(locale)}</p>}

        {mode === "signin" && <p className="mb-5 text-sm text-[var(--muted)]">{t("signInPrompt")}</p>}
        {mode === "signup" && <p className="mb-5 text-sm text-[var(--muted)]">{t("registerPrompt")}</p>}

        {notice && <p role="status" className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--primary-soft)] p-3 text-sm text-[var(--ink)]">{notice}</p>}

        {mode === "signin" && (
          <form noValidate onSubmit={signIn.handleSubmit(submitSignIn)} className="grid gap-4">
            <div>
              <label htmlFor="signin-email" className="text-sm font-semibold">{t("emailAddress")}</label>
              <input id="signin-email" type="email" autoComplete="email" className={fieldClass} aria-invalid={Boolean(signIn.formState.errors.email)} aria-describedby="signin-email-error" {...signIn.register("email")} />
              <FieldError id="signin-email-error" message={signIn.formState.errors.email?.message} />
            </div>
            <div>
              <label htmlFor="signin-password" className="text-sm font-semibold">{t("password")}</label>
              <input id="signin-password" type="password" autoComplete="current-password" className={fieldClass} aria-invalid={Boolean(signIn.formState.errors.password)} aria-describedby="signin-password-error" {...signIn.register("password")} />
              <FieldError id="signin-password-error" message={signIn.formState.errors.password?.message} />
            </div>
            <button type="submit" disabled={busy} className="mt-2 min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white transition-colors hover:bg-[var(--primary-strong)] disabled:opacity-60">{busy ? t("pleaseWait") : t("signInTitle")}</button>
            <button type="button" onClick={() => { setMode("forgot"); setNotice(""); }} className="min-h-11 justify-self-start text-sm font-semibold text-[var(--primary)] underline underline-offset-4">{t("forgotPassword")}</button>
            <p className="mb-0 text-sm text-[var(--muted)]">{t("newHere")} <Link href="/register" className="font-bold text-[var(--primary)] underline underline-offset-4">{t("registerNow")}</Link></p>
          </form>
        )}

        {mode === "signup" && (
          <form noValidate onSubmit={signUp.handleSubmit(submitSignUp)} className="grid gap-3 sm:grid-cols-2">
            {([
              ["firstName", t("firstName"), "given-name"],
              ["lastName", t("lastName"), "family-name"],
              ["email", t("emailAddress"), "email"],
            ] as const).map(([name, label, autocomplete]) => {
              const error = signUp.formState.errors[name];
              return <div key={name} className="sm:col-span-1">
                <label htmlFor={`signup-${name}`} className="text-sm font-semibold">{label}</label>
                <input id={`signup-${name}`} autoComplete={autocomplete} type={name === "email" ? "email" : "text"} className={fieldClass} aria-invalid={Boolean(error)} aria-describedby={`signup-${name}-error`} {...signUp.register(name)} />
                <FieldError id={`signup-${name}-error`} message={error?.message} />
              </div>;
            })}
            <div className="sm:col-span-2">
              <label htmlFor="signup-phone" className="text-sm font-semibold">{t("phoneNumber")}</label>
              <div className="mt-1 flex gap-2">
                <select aria-label="Country calling code" className="min-h-12 w-28 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-sm text-[var(--ink)]" {...signUp.register("countryCode")}>
                  <option value="+237">Cameroon +237</option><option value="+234">Nigeria +234</option><option value="+233">Ghana +233</option><option value="+1">{t("countryOther")} +1</option>
                </select>
                <input id="signup-phone" type="tel" autoComplete="tel-national" className={`${fieldClass} mt-0`} aria-invalid={Boolean(signUp.formState.errors.phone)} aria-describedby="signup-phone-error" {...signUp.register("phone")} />
              </div>
              <FieldError id="signup-phone-error" message={signUp.formState.errors.phone?.message} />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-sm font-semibold">{t("password")}</label>
              <input id="signup-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={Boolean(signUp.formState.errors.password)} aria-describedby="password-strength signup-password-error" {...signUp.register("password")} />
              <div id="password-strength" aria-label={`${t("passwordStrength")} ${strength} ${locale === "fr" ? "sur" : "of"} 3`} className="mt-2 flex gap-1">
                {[1, 2, 3].map((level) => <span key={level} className={`h-1.5 flex-1 rounded-full ${strength >= level ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />)}
              </div>
              <FieldError id="signup-password-error" message={signUp.formState.errors.password?.message} />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="text-sm font-semibold">{t("confirmPassword")}</label>
              <input id="signup-confirm-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={Boolean(signUp.formState.errors.confirmPassword)} aria-describedby="signup-confirm-password-error" {...signUp.register("confirmPassword")} />
              <FieldError id="signup-confirm-password-error" message={signUp.formState.errors.confirmPassword?.message} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input type="checkbox" className="mt-1 size-4 accent-[var(--primary)]" aria-invalid={Boolean(signUp.formState.errors.consent)} {...signUp.register("consent")} />
                <span>{t("consentPrefix")} <Link className="font-semibold text-[var(--primary)] underline" href="/privacy">{t("privacyNotice")}</Link> {t("consentSuffix")}</span>
              </label>
              <FieldError id="signup-consent-error" message={signUp.formState.errors.consent?.message} />
            </div>
            <button type="submit" disabled={busy} className="mt-2 min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white transition-colors hover:bg-[var(--primary-strong)] disabled:opacity-60 sm:col-span-2">{busy ? t("pleaseWait") : t("createAccount")}</button>
            <p className="mb-0 text-sm text-[var(--muted)] sm:col-span-2">{t("alreadyAccount")} <Link href="/login" className="font-bold text-[var(--primary)] underline">{t("login")}</Link></p>
          </form>
        )}

        {mode === "forgot" && (
          <form noValidate onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "");
            if (z.string().email().safeParse(email).success) void submitForgotPassword(email);
            else setNotice(t("validEmailError"));
          }} className="grid gap-4">
            <label htmlFor="forgot-email" className="text-sm font-semibold">{t("emailAddress")}</label>
            <input id="forgot-email" name="email" type="email" autoComplete="email" required className={fieldClass} />
            <button type="submit" disabled={busy} className="min-h-12 rounded-lg bg-[var(--primary)] px-4 font-bold text-white">{busy ? t("pleaseWait") : t("sendResetLink")}</button>
            <button type="button" onClick={() => setMode("signin")} className="min-h-11 justify-self-start text-sm font-semibold text-[var(--primary)] underline">{t("backToSignIn")}</button>
          </form>
        )}
      </section>
    </main>
  );
}
