import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import Seo from "@/components/Seo";
import {
  AppShell,
  PageContainer,
  PageIntro,
  EmptyState,
  StatusPill,
  cardClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/AppShell";

type Cue = { text: string; rationale: string };
type Choice = { id: "A"|"B"|"C"|"D"; text: string; correct: boolean; why_right?: string; why_wrong?: string };
type Step = { label: string; detail: string };

type GeneratedScenario = {
  id: number;
  user_id: string;
  topic: string;
  vignette: string;
  cues: Cue[];
  question: string;
  choices: Choice[];
  reasoning_steps: Step[];
  created_at: string;
};

const PAGE_SIZE = 10;

export default function MyScenariosPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GeneratedScenario[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string>("");

  useEffect(() => {
    // auth gate
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setSession(data.session);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    loadData(page, topic, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, page, topic, q]);

  async function loadData(pg: number, topicFilter: string, query: string) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Count (for simple pagination)
      let countQuery = supabase
        .from("generated_scenarios")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (topicFilter) countQuery = countQuery.eq("topic", topicFilter);
      if (query) countQuery = countQuery.or(`vignette.ilike.%${query}%,question.ilike.%${query}%`);

      const { count } = await countQuery;
      setTotal(count ?? 0);

      // Data page
      const from = pg * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let dataQuery = supabase
        .from("generated_scenarios")
        .select("id,user_id,topic,vignette,cues,question,choices,reasoning_steps,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (topicFilter) dataQuery = dataQuery.eq("topic", topicFilter);
      if (query) dataQuery = dataQuery.or(`vignette.ilike.%${query}%,question.ilike.%${query}%`);

      const { data, error } = await dataQuery;
      if (error) throw error;
      setRows((data as any) ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const topics = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.topic));
    return Array.from(s).sort();
  }, [rows]);

  function openInTrainer(item: GeneratedScenario) {
    // Persist the scenario so the trainer can pick it up (simple bridge).
    localStorage.setItem("pathologix:last_scenario", JSON.stringify(item));
    window.location.href = "/emtrainer"; // trainer page reads and appends it
  }

  const pageCount = total !== null ? Math.ceil((total || 0) / PAGE_SIZE) : 0;

  return (
    <AppShell>
      <Seo
        title="My Saved EMT Scenarios"
        description="Review private EMT training scenarios saved to your PathoLogix account."
        path="/my-scenarios"
        noIndex
      />
      <Header />

      <PageContainer className="space-y-6">
        {/* Title row */}
        <PageIntro
          eyebrow="Saved practice"
          title="My Scenarios"
          description="Review generated scenarios you have saved, then reopen the ones that deserve another pass."
          icon={Sparkles}
          actions={
            <Link
              href="/emtrainer"
              className={secondaryButtonClass}
              title="Back to trainer"
            >
              <ExternalLink size={16} />
              Trainer
            </Link>
          }
        />

        {/* Controls */}
        <div className={`${cardClass} flex flex-wrap items-center gap-3 p-4`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setPage(0); setQ(e.target.value); }}
              placeholder="Search vignette or question..."
              className={`${inputClass} w-64 pl-9`}
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={topic}
              onChange={(e) => { setPage(0); setTopic(e.target.value); }}
              className={`${inputClass} w-48 pl-9 pr-8`}
            >
              <option value="">All topics</option>
              {topics.length === 0 && <option disabled>No topics</option>}
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && (
            <div className={`${cardClass} p-6 text-sm text-slate-600`}>
              Loading your scenarios...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="No saved scenarios yet"
              description="Generate a weak-spot scenario from the trainer, then come back here to review it again."
              href="/emtrainer"
              actionLabel="Open trainer"
            />
          )}

          {!loading && rows.map((r) => (
            <article key={r.id} className={`${cardClass} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StatusPill tone="teal">{r.topic}</StatusPill>
                  <span className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openInTrainer(r)}
                    className={secondaryButtonClass}
                    title="Open this scenario in the Trainer"
                  >
                    Open in Trainer
                  </button>
                </div>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">{r.question}</h3>
              <p className="mt-1 text-sm text-slate-700 line-clamp-3">{r.vignette}</p>

              <ul className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-700">
                {r.choices.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="mt-[2px] font-mono text-xs">{c.id}.</span>
                    <span className={c.correct ? "font-medium text-teal-700" : ""}>{c.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="text-sm text-slate-600">
              Page <span className="font-medium">{page + 1}</span> / {pageCount}
            </div>
            <button
              className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
