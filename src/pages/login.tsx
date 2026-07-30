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

type AuthView =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "update-password";

export default function LoginPage() {
  const [view, setView] = useState<AuthView>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const navigatedRef = useRef(false);
  const recoveryRef = useRef(false);

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
    if (!router.isReady) return;

    let active = true;
    let recoveryTimeout: number | undefined;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const recoveryRequested =
      router.query.reset === "1" || hashParams.get("type") === "recovery";

    const enterRecovery = (hasSession: boolean) => {
      recoveryRef.current = true;
      setView("update-password");
      setRecoveryReady(hasSession);
      setNotice("");
      setError("");
    };

    if (recoveryRequested) {
      enterRecovery(false);
      recoveryTimeout = window.setTimeout(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active || session) return;
        setError(
          "This reset link is invalid or has expired. Request a new link to continue."
        );
      }, 4000);
    }

    const handleSession = (
      session: Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >["data"]["session"]
    ) => {
      if (!active || !session) return;
      if (recoveryRef.current) {
        if (recoveryTimeout) window.clearTimeout(recoveryTimeout);
        setRecoveryReady(true);
        setError("");
        return;
      }
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        continueAfterLogin();
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        enterRecovery(Boolean(session));
        if (recoveryTimeout) window.clearTimeout(recoveryTimeout);
        return;
      }
      handleSession(session);
    });

    void supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    return () => {
      active = false;
      if (recoveryTimeout) window.clearTimeout(recoveryTimeout);
      listener?.subscription?.unsubscribe?.();
    };
  }, [continueAfterLogin, router.isReady, router.query.reset]);

  const callbackUrl = (purpose: "account" | "recovery" = "account") =>
    `${window.location.origin}/login${purpose === "recovery" ? "?reset=1" : ""}`;

  async function returnToSignIn() {
    if (view === "update-password") {
      await supabase.auth.signOut();
      await router.replace("/login", undefined, { shallow: true });
    }
    recoveryRef.current = false;
    navigatedRef.current = false;
    setRecoveryReady(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setNotice("");
    setView("sign-in");
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (view === "update-password") {
        if (!recoveryReady) {
          setError(
            "This reset link is not ready. Request a new link if the problem continues."
          );
          return;
        }
        if (password !== confirmPassword) {
          setError("The passwords do not match.");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;

        await supabase.auth.signOut();
        recoveryRef.current = false;
        setRecoveryReady(false);
        setPassword("");
        setConfirmPassword("");
        setView("sign-in");
        setNotice("Password updated. Sign in with your new password.");
        void router.replace("/login", undefined, { shallow: true });
        return;
      }

      if (view === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: callbackUrl("recovery") }
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
                : view === "update-password"
                  ? "Choose a new password"
                  : view === "forgot-password"
                    ? "Reset your password"
                    : "Sign in to PathoLogix"
            }
            description={
              view === "sign-up"
                ? "Save your progress, build a streak, and keep your practice history in one place."
                : view === "update-password"
                  ? "Enter a new password for your PathoLogix account."
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
              {view !== "update-password" ? (
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
              ) : null}

              {view !== "forgot-password" ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                    {view === "update-password" ? "New password" : "Password"}
                  </span>
                  <span className="relative block">
                    <LockKeyhole
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="password"
                      autoComplete={
                        view === "sign-up" || view === "update-password"
                          ? "new-password"
                          : "current-password"
                      }
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

              {view === "update-password" ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Confirm new password
                  </span>
                  <span className="relative block">
                    <LockKeyhole
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Enter it again"
                      className={`${inputClass} min-h-11 w-full pl-9`}
                    />
                  </span>
                </label>
              ) : null}

              {view === "update-password" && !recoveryReady && !error ? (
                <div
                  role="status"
                  className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800"
                >
                  Verifying your secure reset link...
                </div>
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
                disabled={
                  submitting || (view === "update-password" && !recoveryReady)
                }
                className={`${primaryButtonClass} min-h-11 w-full`}
              >
                {submitting
                  ? "Please wait..."
                  : view === "sign-up"
                    ? "Create account"
                    : view === "update-password"
                      ? "Update password"
                      : view === "forgot-password"
                        ? "Send reset link"
                        : "Sign in"}
                {!submitting ? <ArrowRight size={17} /> : null}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              {view === "sign-in" ? (
                <>
                  <button type="button" onClick={() => setView("sign-up")} className="min-h-11 px-2 font-semibold text-teal-700 hover:text-teal-600">
                    Create an account
                  </button>
                  <button type="button" onClick={() => setView("forgot-password")} className="min-h-11 px-2 text-slate-600 hover:text-slate-900">
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void returnToSignIn()}
                  className="min-h-11 px-2 font-semibold text-teal-700 hover:text-teal-600"
                >
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
