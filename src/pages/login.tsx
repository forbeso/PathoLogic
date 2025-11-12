import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Head from "next/head";

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

    // clear intent so we don’t loop later
    localStorage.removeItem("pathologix:redirect_after_login");
    localStorage.removeItem("pathologix:post_login_action");

    // hand off action to the destination page (trainer will read and act)
    if (action === "startAdaptive") {
      localStorage.setItem("pathologix:trigger_on_trainer", "startAdaptive");
    }

    router.replace(to);
  }

  return (
     <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.10),transparent),radial-gradient(900px_500px_at_100%_0,rgba(14,165,233,0.10),transparent)]">
      <Head><title>Pathologix - EMT Scenario Trainer</title></Head>
      <Header />
    <div className="min-h-screen grid place-items-center bg-slate-50">
       
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Sign in to PathoLogic</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google", "github"]}  // toggle to taste
          // Magic links or password are enabled in Supabase → Auth → Providers
        />
      </div>
    </div>


      
    </div>
  );
}
