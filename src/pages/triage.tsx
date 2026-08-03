import Header from "@/components/Header";
import Seo from "@/components/Seo";
import MciTriageSimulation from "@/features/triage/components/MciTriageSimulation";

export default function TriagePage() {
  return (
    <div className="min-h-screen bg-[#06171d]">
      <Seo
        title="MCI Triage Simulation"
        description="Practice SALT and MUCC mass-casualty triage in an interactive eight-patient collision simulation."
        path="/triage"
      />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <MciTriageSimulation />
      </main>
    </div>
  );
}
