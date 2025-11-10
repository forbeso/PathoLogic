// src/components/Header.tsx
import React, { useEffect, useState } from "react";
import { Ambulance } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
  >(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" passHref>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-sm">
              <Ambulance size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              PathoLogix
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Link
            href="/emtrainer"
            className="hidden sm:inline-flex rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm hover:bg-slate-50"
          >
            Practice
          </Link>

          {!session ? (
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-emerald-600 px-3 py-1 font-semibold text-white shadow hover:bg-emerald-500"
            >
              Sign in
            </Link>
          ) : (
            <UserMenu email={session.user.email} />
          )}
        </div>
      </div>
    </header>
  );
}
