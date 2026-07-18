import Header from "@/components/Header";
import LandingPage from "@/components/LandingPage";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";
import Seo, { SITE_URL } from "@/components/Seo";

const homeDescription =
  "Practice EMT clinical judgment with interactive scenarios, NREMT-style exam questions, flashcards, and guided patient assessments.";

export default function Home() {
  return (
    <AppShell>
      <Seo
        title="EMT Scenario Trainer and NREMT Practice"
        description={homeDescription}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "PathoLogix",
              url: SITE_URL,
              description: homeDescription,
            },
            {
              "@type": "WebApplication",
              "@id": `${SITE_URL}/#application`,
              name: "PathoLogix",
              url: SITE_URL,
              description: homeDescription,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires a modern web browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
          ],
        }}
      />
      <Analytics />
      <Header />
      <LandingPage />
    </AppShell>
  );
}
