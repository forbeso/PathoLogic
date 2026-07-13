import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWeakestTopic } from "@/lib/adaptive";
import { BarChart2, Target, Flame, Clock, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import Head from "next/head";
import {
  AppShell,
  PageContainer,
  PageIntro,
  MetricCard,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";

type PerfRow = {
  user_id: string;
  topic: string;
  accuracy: number;      // 0..1
  attempts: number;
  last_practiced: string;
};

function PercentBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className={`h-2 rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProgressPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PerfRow[]>([]);
  const [sortKey, setSortKey] = useState<"topic" | "accuracy" | "attempts" | "last_practiced">("accuracy");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (!s) {
        window.location.href = "/login";
        return;
      }
      setSession(s);
      await loadPerf();
      setLoading(false);
    });
  }, []);

  async function loadPerf() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("performance")
      .select("user_id, topic, accuracy, attempts, last_practiced")
      .eq("user_id", user.id);
    if (!error && data) setRows(data as PerfRow[]);
  }

  function toggleSort(key: typeof sortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let A: any = a[sortKey];
      let B: any = b[sortKey];
      if (sortKey === "last_practiced") {
        A = new Date(a.last_practiced).getTime();
        B = new Date(b.last_practiced).getTime();
      }
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    if (!rows.length) return { attempts: 0, overallAcc: 0, topics: 0, last: null as string | null };
    const attempts = rows.reduce((s, r) => s + r.attempts, 0);
    const weighted = rows.reduce((s, r) => s + r.accuracy * r.attempts, 0);
    const overallAcc = attempts ? weighted / attempts : 0;
    const last = rows.map((r) => r.last_practiced).sort().slice(-1)[0] ?? null;
    return { attempts, overallAcc, topics: rows.length, last };
  }, [rows]);

  async function trainWeakest() {
    try {
      const topic = await getWeakestTopic();
      // leave a breadcrumb for trainer (optional)
      localStorage.setItem("pathologix:adaptive_target", topic);
      window.location.href = "/emtrainer";
    } catch (e) {
      console.error(e);
      window.location.href = "/emtrainer";
    }
  }

  return (
    <AppShell>
      <Head><title>PathoLogix - My Progress</title></Head>
      <Header />

      <PageContainer className="space-y-6">
        <PageIntro
          eyebrow="Progress dashboard"
          title="My Progress"
          description="Track accuracy, attempts, and weak domains so your next study session has a clear target."
          icon={BarChart2}
          actions={
            <>
            <button
              onClick={loadPerf}
              className={secondaryButtonClass}
            >
              Refresh
            </button>
            <button
              onClick={trainWeakest}
              className={primaryButtonClass}
              title="Open Trainer targeting your weakest topic"
            >
              <Sparkles size={16} />
              Train weakest topic
            </button>
            </>
          }
        />

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={BarChart2}
            label="Overall Accuracy"
            value={`${(totals.overallAcc * 100).toFixed(0)}%`}
            tone={totals.overallAcc >= 0.7 ? "teal" : totals.overallAcc >= 0.4 ? "amber" : "rose"}
            detail={
            <div className="mt-3">
              <PercentBar value={totals.overallAcc} />
            </div>
            }
          />

          <MetricCard icon={Flame} label="Total Attempts" value={totals.attempts} detail="Across all topics" tone="amber" />

          <MetricCard icon={Target} label="Topics Trained" value={totals.topics} detail="Unique topics with history" tone="teal" />

          <MetricCard
            icon={Clock}
            label="Last Practiced"
            value={
              <span className="text-base font-semibold">
              {totals.last ? new Date(totals.last).toLocaleString() : "-"}
              </span>
            }
            detail="Most recent update"
          />
        </section>

        {/* Table */}
        <section className={`${cardClass} p-4`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("topic")} className="inline-flex items-center gap-1">
                      Topic {sortKey === "topic" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("accuracy")} className="inline-flex items-center gap-1">
                      Accuracy {sortKey === "accuracy" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("attempts")} className="inline-flex items-center gap-1">
                      Attempts {sortKey === "attempts" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("last_practiced")} className="inline-flex items-center gap-1">
                      Last practiced {sortKey === "last_practiced" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-600">Loading...</td></tr>
                )}

                {!loading && sorted.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-600">No data yet. Answer a few questions in the trainer to see progress.</td></tr>
                )}

                {!loading && sorted.map((r) => {
                  const pct = r.accuracy * 100;
                  return (
                    <tr key={r.topic} className="border-t border-slate-100">
                      <td className="px-2 py-3 font-medium text-slate-900">{r.topic}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-40"><PercentBar value={r.accuracy} /></div>
                          <div className="tabular-nums">{pct.toFixed(0)}%</div>
                        </div>
                      </td>
                      <td className="px-2 py-3 tabular-nums">{r.attempts}</td>
                      <td className="px-2 py-3 text-slate-600">{new Date(r.last_practiced).toLocaleString()}</td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => {
                            localStorage.setItem("pathologix:adaptive_target", r.topic);
                            window.location.href = "/emtrainer";
                          }}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1 shadow-sm hover:bg-slate-50"
                        >
                          Train this topic
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer hint */}
        <p className="text-xs text-slate-500">
          Tip: accuracy is a running average. It updates each time you answer in the trainer.
        </p>
      </PageContainer>
    </AppShell>
  );
}
