import {
  ContactLink,
  InfoList,
  InfoPage,
  InfoSection,
} from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="How PathoLogix collects, uses, and protects information while you use our EMT learning tools."
      path="/privacy"
      updated="July 23, 2026"
    >
      <InfoSection title="Information we collect">
        <p>We collect information needed to operate and improve PathoLogix, including:</p>
        <InfoList>
          <li>Account details such as your email address, profile name, and avatar.</li>
          <li>
            Training activity such as answers, scores, scenario progress, XP, streaks, and study
            history.
          </li>
          <li>
            Technical information such as browser type, device type, and basic product analytics.
          </li>
          <li>
            Content you submit when using AI-assisted scenario features or contacting support.
          </li>
        </InfoList>
      </InfoSection>

      <InfoSection title="How we use information">
        <p>
          We use this information to provide accounts, save progress, personalize practice,
          generate learning content, maintain security, troubleshoot problems, and understand how
          the product is used.
        </p>
      </InfoSection>

      <InfoSection title="Services we rely on">
        <p>
          PathoLogix uses service providers to deliver the product. These may include Supabase for
          authentication and data storage, OpenAI for AI-powered learning features, and Vercel for
          hosting and product analytics. Each provider processes information under its own terms
          and privacy commitments.
        </p>
      </InfoSection>

      <InfoSection title="Do not submit patient information">
        <p>
          PathoLogix is an educational product and is not designed to store protected health
          information or real patient records. Do not enter names, dates of birth, addresses,
          medical record numbers, or other information that could identify a patient.
        </p>
      </InfoSection>

      <InfoSection title="Storage, security, and retention">
        <p>
          Some preferences may be stored in your browser. Account and training data may be stored
          in our hosted database for as long as your account remains active or as reasonably needed
          to operate, secure, and improve the service. We use reasonable safeguards, but no online
          service can guarantee absolute security.
        </p>
      </InfoSection>

      <InfoSection title="Your choices">
        <p>
          You may request access to, correction of, or deletion of your account information by
          contacting us. You can also clear locally stored preferences through your browser.
        </p>
      </InfoSection>

      <InfoSection title="Children and policy updates">
        <p>
          PathoLogix is not directed to children under 13. We may update this policy as the product
          changes and will revise the date shown above when we do.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>Questions or privacy requests can be sent to:</p>
        <ContactLink />
      </InfoSection>
    </InfoPage>
  );
}
