import Header from "@/components/Header";
import EMTScenarioTrainer from "@/components/EmtScenarioTrainer";
import { AppShell, PageContainer, PageIntro } from "@/components/AppShell";
import { Brain, Timer } from "lucide-react";
import Seo from "@/components/Seo";
import Link from "next/link";

export default function EMTTrainerPage() {
  return (
    <AppShell>
      <Seo
        title="EMT Scenario Trainer"
        description="Practice realistic EMT calls, identify critical patient cues, choose the best next action, and review the clinical reasoning."
        path="/emtrainer"
      />
      <Header />
      <PageContainer size="normal" className="space-y-6">
        <PageIntro
          eyebrow="Scenario Trainer"
          title="Practice the call before exam day."
          description="Read the scene, commit to the best next step, then review the cues and rationale that should drive your decision."
          icon={Brain}
          actions={
            <Link
              href="/exam/nremt"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              Timed exam mode
              <Timer size={16} />
            </Link>
          }
        />
        <EMTScenarioTrainer />
      </PageContainer>
    </AppShell>
  );
}
