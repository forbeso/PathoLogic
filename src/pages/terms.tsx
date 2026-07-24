import {
  ContactLink,
  InfoList,
  InfoPage,
  InfoSection,
} from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms of Use"
      description="The ground rules for using PathoLogix as an EMT learning and exam-preparation tool."
      path="/terms"
      updated="July 23, 2026"
    >
      <InfoSection title="Educational use">
        <p>
          PathoLogix is a study aid. It does not provide medical advice, replace an accredited EMT
          program, establish clinical competency, or substitute for local protocols, medical
          direction, or professional judgment. In an actual emergency, follow your training,
          agency policy, and authorized medical direction.
        </p>
      </InfoSection>

      <InfoSection title="Independent product">
        <p>
          PathoLogix is not affiliated with, sponsored by, or endorsed by the National Registry of
          Emergency Medical Technicians. References to NREMT-style practice describe the
          educational format, not an official exam product.
        </p>
      </InfoSection>

      <InfoSection title="Accounts">
        <p>
          You are responsible for the accuracy of your account information, protecting access to
          your account, and activity performed through it. Tell us promptly if you believe your
          account has been compromised.
        </p>
      </InfoSection>

      <InfoSection title="Acceptable use">
        <InfoList>
          <li>Do not use PathoLogix to store real patient or protected health information.</li>
          <li>Do not attempt to disrupt, reverse engineer, or gain unauthorized access to the service.</li>
          <li>Do not use the product to cheat on a live, secure, or proctored examination.</li>
          <li>Do not submit unlawful, harmful, or infringing content.</li>
        </InfoList>
      </InfoSection>

      <InfoSection title="AI-assisted content">
        <p>
          Some content may be generated or adapted with artificial intelligence. It can be
          incomplete or incorrect. Review rationales critically and verify clinical information
          against current authoritative guidance, your course materials, and local protocols.
        </p>
      </InfoSection>

      <InfoSection title="Ownership and availability">
        <p>
          PathoLogix and its original software, design, and learning content are protected by
          applicable intellectual property laws. We may update, suspend, or discontinue features,
          and may restrict accounts that violate these terms or threaten the service.
        </p>
      </InfoSection>

      <InfoSection title="Disclaimers">
        <p>
          The service is provided on an &quot;as available&quot; basis to the extent permitted by law. We do
          not guarantee exam results, certification, uninterrupted availability, or that every
          scenario reflects every jurisdiction&apos;s protocol.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>Questions about these terms can be sent to:</p>
        <ContactLink />
      </InfoSection>
    </InfoPage>
  );
}
