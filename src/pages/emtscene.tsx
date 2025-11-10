import Header from "@/components/Header";
import Head from "next/head";
import ThreeDScene from "@/components/ThreeDScene";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EMTScene() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setLoading(false);
    });
  }, []);


    if (loading) return <div className="p-10 text-center">Signing you in…</div>; return (
    <div className="min-h-screen w-full">
      <Head><title>Pathologix - EMT Scenario Trainer</title></Head>
      <Header />
      
    <ThreeDScene/>
      
    </div>
  );
}
