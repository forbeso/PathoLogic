import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWeakestTopic } from "@/lib/adaptive";
import { BarChart2, Target, Flame, Clock, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

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
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.08),transparent),radial-gradient(900px_500px_at_100%_0,rgba(14,165,233,0.08),transparent)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">My Progress</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPerf}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 text-sm shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={trainWeakest}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-emerald-500"
              title="Open Trainer targeting your weakest topic"
            >
              <Sparkles size={16} />
              Train weakest topic
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <BarChart2 size={16} /> Overall Accuracy
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {(totals.overallAcc * 100).toFixed(0)}%
            </div>
            <div className="mt-3">
              <PercentBar value={totals.overallAcc} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Flame size={16} /> Total Attempts
            </div>
            <div className="mt-2 text-2xl font-semibold">{totals.attempts}</div>
            <div className="mt-1 text-xs text-slate-500">Across all topics</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Target size={16} /> Topics Trained
            </div>
            <div className="mt-2 text-2xl font-semibold">{totals.topics}</div>
            <div className="mt-1 text-xs text-slate-500">Unique topics with history</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Clock size={16} /> Last Practiced
            </div>
            <div className="mt-2 text-base font-medium">
              {totals.last ? new Date(totals.last).toLocaleString() : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">Most recent update</div>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
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
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-600">Loading…</td></tr>
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
                          className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm hover:bg-slate-50"
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
      </main>
    </div>
  );
}
