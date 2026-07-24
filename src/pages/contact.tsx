import Link from "next/link";
import { ArrowRight, BookOpenCheck, LifeBuoy, Users } from "lucide-react";
import {
  ContactLink,
  InfoPage,
  InfoSection,
} from "@/components/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="How can we help?"
      description="Reach the PathoLogix team about your account, educational content, or an educator partnership."
      path="/contact"
    >
      <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <p className="font-bold text-slate-950">Email support</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Include the page you were using and a short description of what happened.
        </p>
        <div className="mt-4">
          <ContactLink />
        </div>
      </section>

      <InfoSection title="Account and technical help">
        <p>
          Contact us if you cannot sign in, your progress is not saving, or part of the experience
          is not working as expected. Screenshots and device details are helpful.
        </p>
      </InfoSection>

      <InfoSection title="Content corrections">
        <p>
          Clinical education deserves careful review. If a question, rationale, or scenario appears
          inaccurate, tell us the exact item and the source or protocol you believe should be
          considered.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-600"
        >
          <BookOpenCheck size={16} />
          Browse the Learning Center
          <ArrowRight size={15} />
        </Link>
      </InfoSection>

      <InfoSection title="Educators and programs">
        <p>
          We welcome conversations with EMT instructors, training officers, and education programs
          interested in testing PathoLogix or contributing expert feedback.
        </p>
        <span className="inline-flex items-center gap-2 font-bold text-slate-800">
          <Users size={16} />
          Use the subject line &quot;Educator partnership.&quot;
        </span>
      </InfoSection>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-0.5 shrink-0 text-amber-700" size={20} />
          <div>
            <h2 className="font-black text-slate-950">Not for emergency assistance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              PathoLogix support cannot provide patient-care guidance or emergency dispatch. For an
              actual emergency, contact your local emergency services.
            </p>
          </div>
        </div>
      </section>
    </InfoPage>
  );
}
