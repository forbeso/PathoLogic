import Header from "@/components/Header";
import Seo from "@/components/Seo";
import MciTriageSimulation from "@/features/triage/components/MciTriageSimulation";

export default function TriagePage() {
  return (
    <div className="triage-page flex h-[100dvh] flex-col overflow-hidden bg-[#06171d]">
      <Seo
        title="MCI Triage Simulation"
        description="Practice SALT and MUCC mass-casualty triage in an interactive eight-patient collision simulation."
        path="/triage"
      />
      <Header compactOnLandscape />
      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1">
        <MciTriageSimulation />
      </main>
    </div>
  );
}
