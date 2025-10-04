import EMTScenarioTrainer from "../components/EmtScenarioTrainer";
import Header from "@/components/Header";
import LandingPage from "@/pages/Landing";
import Head from 'next/head';


export default function Home() {
  return     (
  <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.10),transparent),radial-gradient(900px_500px_at_100%_0,rgba(14,165,233,0.10),transparent)]">
      <Head><title>Pathologix - EMT Scenario Trainer</title></Head>
      <Header />                
      <LandingPage />
      
  </div>
    )
}
