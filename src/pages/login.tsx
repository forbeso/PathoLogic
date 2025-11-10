import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Head from "next/head";

export default function LoginPage() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s) router.replace("/emtrainer");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

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
