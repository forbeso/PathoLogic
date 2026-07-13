import Header from "@/components/Header";
import LandingPage from "@/pages/Landing";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell>
      <Head>
        <title>PathoLogix - EMT Scenario Trainer</title>
      </Head>
      <Analytics />
      <Header />
      <LandingPage />
    </AppShell>
  );
}
