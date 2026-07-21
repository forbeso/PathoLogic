import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Seo, { SITE_URL } from "@/components/Seo";
import { AppShell, PageContainer, PageIntro, cardClass } from "@/components/AppShell";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [session, setSession] = useState<any>(null);
  
  const router = useRouter();
  const navigatedRef = useRef(false);

  useEffect(() => {
    // 1) seed current session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !navigatedRef.current) {
        navigatedRef.current = true;
        continueAfterLogin();
      }
    });

    // 2) react to new session events
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session && !navigatedRef.current) {
        navigatedRef.current = true;
        continueAfterLogin();
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function continueAfterLogin() {
    // read intent
    const to =
      localStorage.getItem("pathologix:redirect_after_login") || "/emtrainer";
    const action =
      localStorage.getItem("pathologix:post_login_action") || null;

    // clear intent so we do not loop later
    localStorage.removeItem("pathologix:redirect_after_login");
    localStorage.removeItem("pathologix:post_login_action");

    // hand off action to the destination page (trainer will read and act)
    if (action === "startAdaptive") {
      localStorage.setItem("pathologix:trigger_on_trainer", "startAdaptive");
    }

    router.replace(to);
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
          title="Sign in to PathoLogix"
          description="Keep your practice history, saved scenarios, and weak-spot training tied to your account."
          icon={ShieldCheck}
        />
      <div className={`${cardClass} mt-6 p-6`}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          redirectTo={`${SITE_URL}/login`}
          providers={["google", "github"]}  // toggle to taste
          // Magic links or password are enabled in Supabase → Auth → Providers
        />
      </div>
      </div>
    </PageContainer>
    </AppShell>
  );
}
