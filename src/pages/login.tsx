import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import {
  AppShell,
  PageContainer,
  PageIntro,
  cardClass,
  inputClass,
  primaryButtonClass,
} from "@/components/AppShell";
import { ArrowRight, LockKeyhole, Mail, MailCheck, ShieldCheck } from "lucide-react";

type AuthView = "sign-in" | "sign-up" | "forgot-password";

export default function LoginPage() {
  const [view, setView] = useState<AuthView>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const navigatedRef = useRef(false);

  const continueAfterLogin = useCallback(() => {
    const to =
      localStorage.getItem("pathologix:redirect_after_login") || "/emtrainer";
    const action =
      localStorage.getItem("pathologix:post_login_action") || null;

    localStorage.removeItem("pathologix:redirect_after_login");
    localStorage.removeItem("pathologix:post_login_action");

    if (action === "startAdaptive") {
      localStorage.setItem("pathologix:trigger_on_trainer", "startAdaptive");
    }

    router.replace(to);
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !navigatedRef.current) {
        navigatedRef.current = true;
        continueAfterLogin();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session && !navigatedRef.current) {
        navigatedRef.current = true;
        continueAfterLogin();
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, [continueAfterLogin]);

  const callbackUrl = () => `${window.location.origin}/login`;

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (view === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: callbackUrl() }
        );
        if (resetError) throw resetError;
        setNotice("Check your email for a secure password reset link.");
        return;
      }

      if (view === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm your address.");
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "We could not complete that request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <Seo
        title="Sign In"
        description="Sign in to your PathoLogix EMT training account."
        path="/login"
        noIndex
      />
      <Header />
      <PageContainer size="normal" className="grid min-h-[calc(100svh-90px)] place-items-center">
        <div className="w-full max-w-md">
          <PageIntro
            eyebrow="Account access"
            title={
              view === "sign-up"
                ? "Create your account"
                : view === "forgot-password"
                  ? "Reset your password"
                  : "Sign in to PathoLogix"
            }
            description={
              view === "sign-up"
                ? "Save your progress, build a streak, and keep your practice history in one place."
                : view === "forgot-password"
                  ? "We will send a secure reset link to your email address."
                  : "Continue your EMT practice from exactly where you left off."
            }
            icon={ShieldCheck}
          />

          <div className={`${cardClass} mt-6 p-6`}>
            {view === "sign-up" ? (
              <div className="mb-5 flex gap-3 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-left">
                <MailCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-teal-700"
                  aria-hidden="true"
                />
                <div>
                  <div className="text-sm font-bold text-teal-900">
                    Email and password are all you need.
                  </div>
                  <p className="mt-1 text-sm leading-5 text-teal-800">
                    We will email you a verification link after registration.
                    Open that link to confirm your account and sign in.
                  </p>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Email address
                </span>
                <span className="relative block">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={`${inputClass} min-h-11 w-full pl-9`}
                  />
                </span>
              </label>

              {view !== "forgot-password" ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Password
                  </span>
                  <span className="relative block">
                    <LockKeyhole
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="password"
                      autoComplete={view === "sign-up" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      className={`${inputClass} min-h-11 w-full pl-9`}
                    />
                  </span>
                </label>
              ) : null}

              {error ? (
                <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div role="status" className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                  {notice}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={`${primaryButtonClass} min-h-11 w-full`}
              >
                {submitting
                  ? "Please wait..."
                  : view === "sign-up"
                    ? "Create account"
                    : view === "forgot-password"
                      ? "Send reset link"
                      : "Sign in"}
                {!submitting ? <ArrowRight size={17} /> : null}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              {view === "sign-in" ? (
                <>
                  <button type="button" onClick={() => setView("sign-up")} className="font-semibold text-teal-700 hover:text-teal-600">
                    Create an account
                  </button>
                  <button type="button" onClick={() => setView("forgot-password")} className="text-slate-600 hover:text-slate-900">
                    Forgot password?
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setView("sign-in")} className="font-semibold text-teal-700 hover:text-teal-600">
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
