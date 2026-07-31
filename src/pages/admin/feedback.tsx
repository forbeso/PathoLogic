import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Inbox,
  MessageSquareText,
  Search,
  ShieldAlert,
} from "lucide-react";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { supabase } from "@/lib/supabase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { reportClientIssue } from "@/lib/telemetry";
import {
  AppShell,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageContainer,
  PageIntro,
  StatusPill,
  cardClass,
  inputClass,
} from "@/components/AppShell";

type FeedbackStatus = "new" | "reviewing" | "resolved";
type FeedbackCategory = "friction" | "idea" | "content" | "bug";

type FeedbackItem = {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  rating: number;
  message: string;
  route: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const STATUS_OPTIONS: Array<{ value: FeedbackStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  friction: "Friction",
  idea: "Idea",
  content: "Content",
  bug: "Bug",
};

const STATUS_TONES: Record<FeedbackStatus, "teal" | "amber" | "slate"> = {
  new: "teal",
  reviewing: "amber",
  resolved: "slate",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await authenticatedFetch("/api/admin/feedback");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Feedback could not be loaded.");
      }
      const body = (await response.json()) as { feedback?: FeedbackItem[] };
      setFeedback(Array.isArray(body.feedback) ? body.feedback : []);
    } catch (error) {
      reportClientIssue(error, {
        context: "authenticated_api",
        code: "ADMIN_FEEDBACK_LOAD_FAILED",
        recoverable: true,
      });
      setLoadError(
        error instanceof Error
          ? error.message
          : "Feedback could not be loaded right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setLoadError("We could not verify your account. Please try again.");
        setCheckingAccess(false);
        return;
      }
      if (!data.session) {
        localStorage.setItem(
          "pathologix:redirect_after_login",
          "/admin/feedback"
        );
        void router.replace("/login");
        return;
      }
      if (data.session.user.app_metadata?.role !== "admin") {
        setAccessDenied(true);
        setCheckingAccess(false);
        return;
      }
      setCheckingAccess(false);
      void loadFeedback();
    });
  }, [loadFeedback, router]);

  const summary = useMemo(
    () => ({
      total: feedback.length,
      new: feedback.filter((item) => item.status === "new").length,
      reviewing: feedback.filter((item) => item.status === "reviewing").length,
      resolved: feedback.filter((item) => item.status === "resolved").length,
    }),
    [feedback]
  );

  const visibleFeedback = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return feedback.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!normalizedQuery) return true;
      return [item.message, item.route, item.user_id]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [categoryFilter, feedback, query, statusFilter]);

  async function updateStatus(item: FeedbackItem, status: FeedbackStatus) {
    if (item.status === status) return;
    setUpdatingId(item.id);
    setUpdateError(null);
    try {
      const response = await authenticatedFetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Feedback could not be updated.");
      }
      const body = (await response.json()) as { feedback: FeedbackItem };
      setFeedback((current) =>
        current.map((entry) =>
          entry.id === body.feedback.id ? body.feedback : entry
        )
      );
    } catch (error) {
      reportClientIssue(error, {
        context: "authenticated_api",
        code: "ADMIN_FEEDBACK_UPDATE_FAILED",
        recoverable: true,
      });
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Feedback could not be updated right now."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AppShell>
      <Seo
        title="Feedback Inbox"
        description="Review private PathoLogix beta feedback."
        path="/admin/feedback"
        noIndex
      />
      <Header />
      <PageContainer className="space-y-6">
        <PageIntro
          eyebrow="Admin"
          title="Feedback Inbox"
          description="Review what learners are reporting, find recurring friction, and keep every submission moving toward a decision."
          icon={MessageSquareText}
        />

        {checkingAccess ? (
          <LoadingState
            title="Checking access"
            description="Confirming your administrator permissions."
          />
        ) : accessDenied ? (
          <ErrorState
            title="Admin access required"
            description="This inbox contains private learner feedback and is available only to PathoLogix administrators."
          />
        ) : loadError && feedback.length === 0 ? (
          <ErrorState
            title="Feedback did not load"
            description={loadError}
            onRetry={() => void loadFeedback()}
          />
        ) : (
          <>
            <section
              aria-label="Feedback summary"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <MetricCard icon={Inbox} label="All feedback" value={summary.total} />
              <MetricCard
                icon={MessageSquareText}
                label="New"
                value={summary.new}
                tone="teal"
              />
              <MetricCard
                icon={Clock3}
                label="Reviewing"
                value={summary.reviewing}
                tone="amber"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Resolved"
                value={summary.resolved}
                tone="slate"
              />
            </section>

            <section
              aria-label="Filter feedback"
              className={`${cardClass} grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]`}
            >
              <label className="relative block">
                <span className="sr-only">Search feedback</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search message, page, or user ID"
                  className={`${inputClass} w-full pl-10`}
                />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as FeedbackStatus | "all")
                  }
                  className={`${inputClass} w-full`}
                >
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by category</span>
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as FeedbackCategory | "all"
                    )
                  }
                  className={`${inputClass} w-full`}
                >
                  <option value="all">All categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {updateError ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"
              >
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                {updateError}
              </div>
            ) : null}

            {loading ? (
              <LoadingState
                title="Loading feedback"
                description="Retrieving the latest learner submissions."
              />
            ) : visibleFeedback.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={feedback.length === 0 ? "No feedback yet" : "No matches"}
                description={
                  feedback.length === 0
                    ? "New learner feedback will appear here as soon as it is submitted."
                    : "Try changing the search or filters to see more submissions."
                }
              />
            ) : (
              <section aria-label="Feedback submissions" className="space-y-3">
                {visibleFeedback.map((item) => (
                  <article key={item.id} className={`${cardClass} p-5`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone={STATUS_TONES[item.status]}>
                            {STATUS_OPTIONS.find((option) => option.value === item.status)
                              ?.label ?? item.status}
                          </StatusPill>
                          <StatusPill>{CATEGORY_LABELS[item.category]}</StatusPill>
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            {item.rating}/5 rating
                          </span>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
                          {item.message}
                        </p>
                      </div>

                      <label className="shrink-0">
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                          Triage status
                        </span>
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void updateStatus(
                              item,
                              event.target.value as FeedbackStatus
                            )
                          }
                          aria-label={`Update status for feedback from ${formatDate(item.created_at)}`}
                          className={`${inputClass} w-full sm:w-36`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                      <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                      <span title={item.user_id}>
                        User {item.user_id.slice(0, 8)}
                      </span>
                      <Link
                        href={item.route}
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-600 dark:text-teal-300"
                      >
                        {item.route}
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
