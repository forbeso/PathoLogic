import {
  BrainCircuit,
  ChevronRight,
  ClipboardCheck,
  Layers3,
  LoaderCircle,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppShell,
  PageContainer,
  PageIntro,
  cardClass,
} from "@/components/AppShell";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import {
  getLearningGoal,
  LEARNING_GOALS,
  type LearningGoal,
} from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { trackProductEvent } from "@/lib/telemetry";

const goalIcons: Record<LearningGoal, LucideIcon> = {
  "scene-practice": Stethoscope,
  "exam-prep": ClipboardCheck,
  fundamentals: Layers3,
  "clinical-reasoning": BrainCircuit,
};

export default function WelcomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready">("checking");
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [savingGoal, setSavingGoal] = useState<LearningGoal | null>(null);
  const [error, setError] = useState("");
  const trackedStart = useRef(false);

  const selectedTitle = useMemo(
    () => LEARNING_GOALS.find((goal) => goal.id === selectedGoal)?.title,
    [selectedGoal]
  );

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session) {
        localStorage.setItem("pathologix:redirect_after_login", "/welcome");
        void router.replace("/login");
        return;
      }

      setSelectedGoal(getLearningGoal(data.session.user.user_metadata));
      setStatus("ready");
      if (!trackedStart.current) {
        trackedStart.current = true;
        trackProductEvent("onboarding_started", {
          returning: Boolean(
            data.session.user.user_metadata?.onboarding_completed_at
          ),
        });
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  const chooseGoal = async (goalId: LearningGoal, href: string) => {
    setSavingGoal(goalId);
    setError("");

    try {
      const completedAt = new Date().toISOString();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          learning_goal: goalId,
          onboarding_completed_at: completedAt,
        },
      });
      if (updateError) throw updateError;

      trackProductEvent("onboarding_completed", { goal: goalId });
      await router.replace(href);
    } catch {
      setError(
        "We could not save your choice. Check your connection and try again."
      );
      setSavingGoal(null);
    }
  };

  return (
    <AppShell>
      <Seo
        title="Choose Your Starting Point"
        description="Choose the PathoLogix EMT learning activity that best matches your current goal."
        path="/welcome"
        noIndex
      />
      <Header />
      <PageContainer size="normal" className="space-y-5">
        <PageIntro
          eyebrow="Your starting point"
          title="What are you working toward?"
          description="Choose one place to start. Every PathoLogix study mode will still be available."
          icon={Stethoscope}
        />

        {status === "checking" ? (
          <div
            className={`${cardClass} flex items-center gap-3 p-5`}
            role="status"
            aria-live="polite"
          >
            <LoaderCircle
              size={20}
              className="animate-spin text-teal-700 motion-reduce:animate-none dark:text-teal-300"
            />
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                Getting your account ready
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                This should only take a moment.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="grid gap-3 sm:grid-cols-2"
              aria-label="Learning goals"
            >
              {LEARNING_GOALS.map((goal) => {
                const Icon = goalIcons[goal.id];
                const selected = selectedGoal === goal.id;
                const saving = savingGoal === goal.id;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    disabled={savingGoal !== null}
                    onClick={() => void chooseGoal(goal.id, goal.href)}
                    className={`group min-h-[164px] rounded-lg border p-5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-65 dark:focus:ring-offset-[#08191f] ${
                      selected
                        ? "border-teal-500 bg-teal-50/95 dark:border-teal-400 dark:bg-teal-400/10"
                        : "border-[#c8dcd6] bg-white/90 hover:border-teal-400 hover:bg-white dark:border-slate-700 dark:bg-[#102329] dark:hover:border-teal-500 dark:hover:bg-[#153139]"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200">
                        {saving ? (
                          <LoaderCircle
                            size={20}
                            className="animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <Icon size={20} />
                        )}
                      </span>
                      <ChevronRight
                        size={20}
                        className="mt-2 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700 dark:text-slate-500 dark:group-hover:text-teal-300"
                      />
                    </span>
                    <span className="mt-4 block text-lg font-bold text-slate-950 dark:text-white">
                      {goal.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {goal.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTitle ? (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Current goal: {selectedTitle}
              </p>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/50 dark:text-rose-200"
              >
                {error}
              </div>
            ) : null}
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
