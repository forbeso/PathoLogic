export type LearnArticleSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
};

export type LearnArticle = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: "Assessment" | "Medical" | "Exam preparation";
  readTime: string;
  published: string;
  updated: string;
  intro: string;
  keyPoints: string[];
  sections: LearnArticleSection[];
  sources: Array<{ label: string; url: string }>;
  practiceHref: string;
  practiceLabel: string;
};

export const learnArticles: LearnArticle[] = [
  {
    slug: "emt-primary-assessment-sequence",
    title: "EMT Primary Assessment Sequence: A Practical Study Guide",
    shortTitle: "EMT Primary Assessment Sequence",
    description:
      "Learn a repeatable EMT primary assessment sequence for identifying immediate life threats and deciding transport priority.",
    category: "Assessment",
    readTime: "7 min read",
    published: "2026-07-17",
    updated: "2026-07-17",
    intro:
      "The primary assessment is not simply a list to recite. It is a rapid process for recognizing instability, finding immediate life threats, treating those threats as they are discovered, and deciding how quickly the patient needs definitive care.",
    keyPoints: [
      "Confirm scene safety and appropriate PPE before patient contact.",
      "Build a general impression while approaching the patient.",
      "Assess responsiveness, airway, breathing, and circulation in a deliberate order.",
      "Manage immediate threats when found rather than waiting until the assessment is complete.",
      "Finish with a clear transport-priority decision.",
    ],
    sections: [
      {
        id: "purpose",
        heading: "What the primary assessment is designed to answer",
        paragraphs: [
          "The primary assessment answers a focused question: is this patient stable, potentially unstable, or unstable right now? It prioritizes conditions that can quickly compromise oxygenation, ventilation, perfusion, or neurologic function.",
          "A strong assessment remains systematic without becoming rigid. The sequence keeps you organized, while the patient's presentation determines how quickly you move and when you interrupt the assessment to manage a threat.",
        ],
      },
      {
        id: "sequence",
        heading: "A repeatable primary assessment sequence",
        paragraphs: [
          "Begin forming your general impression before you touch the patient. Consider age, position, apparent distress, skin appearance, work of breathing, and what the surrounding scene suggests.",
        ],
        bullets: [
          "Scene readiness: confirm safety, PPE, mechanism or nature of illness, patient count, and needed resources.",
          "General impression: decide whether the patient appears stable, potentially unstable, or unstable.",
          "Responsiveness: introduce yourself and determine whether the patient is alert or responds to verbal or painful stimuli.",
          "Airway: determine whether the airway is open and whether the patient can protect it.",
          "Breathing: assess rate, depth, effort, chest movement, and clinically important sounds.",
          "Circulation: assess pulse, major bleeding, skin findings, and signs of inadequate perfusion.",
          "Priority: decide whether immediate transport, rapid intervention, or additional assessment is appropriate.",
        ],
      },
      {
        id: "life-threats",
        heading: "Treat life threats when you find them",
        paragraphs: [
          "The primary assessment is an assessment-and-management loop. If you identify severe bleeding, an airway problem, inadequate breathing, or another immediate threat, act within your level of training and local protocol before continuing.",
          "This is why memorizing letters without understanding their purpose can fail in a scenario. The useful habit is to connect each assessment step with the decision it is meant to produce.",
        ],
        note:
          "Study cue: after every finding, ask yourself, “Does this threaten life now, and does it change transport priority?”",
      },
      {
        id: "practice",
        heading: "How to practice the sequence",
        paragraphs: [
          "Practice with varied patient positions and complaints instead of repeating one script. Say what you notice, what it means, and what you would do next. This exposes skipped observations and helps assessment order become automatic under pressure.",
          "After each scenario, review whether you recognized instability early, addressed threats in the correct order, and made a transport decision that matched the whole presentation.",
        ],
      },
    ],
    sources: [
      {
        label: "EMS.gov — EMT Instructional Guidelines: Patient Assessment",
        url: "https://www.ems.gov/assets/EMT_Instructional_Guidelines.pdf",
      },
      {
        label: "EMS.gov — 2021 National EMS Education Standards",
        url: "https://www.ems.gov/assets/EMS_Education_Standards_2021_Updated2_24_25forEO.pdf",
      },
    ],
    practiceHref: "/emtscene",
    practiceLabel: "Practice the primary assessment",
  },
  {
    slug: "emt-scene-size-up-steps",
    title: "EMT Scene Size-Up Steps Before Patient Contact",
    shortTitle: "EMT Scene Size-Up Steps",
    description:
      "Review the EMT scene size-up process, including safety, PPE, mechanism or nature of illness, patient count, and additional resources.",
    category: "Assessment",
    readTime: "6 min read",
    published: "2026-07-17",
    updated: "2026-07-17",
    intro:
      "Scene size-up begins before patient contact and continues as conditions change. Its purpose is to keep responders, patients, and bystanders from becoming part of a larger emergency while gathering the information needed to plan a safe approach.",
    keyPoints: [
      "Pause long enough to identify hazards before entering.",
      "Use PPE appropriate to the anticipated exposure.",
      "Identify the mechanism of injury or nature of illness.",
      "Confirm the number of patients and request resources early.",
      "Reassess safety whenever the scene changes.",
    ],
    sections: [
      {
        id: "safety-first",
        heading: "Start with safety, not the patient",
        paragraphs: [
          "It is natural to focus immediately on the visible patient, but an unsafe approach can create additional victims and delay care. Look for traffic, unstable structures, environmental exposure, hazardous substances, weapons, aggressive people or animals, and rescue hazards.",
          "If the scene is unsafe and cannot be made safe quickly within your role, remain at a safe location and request the specialized resources needed to control it.",
        ],
      },
      {
        id: "size-up-components",
        heading: "The core scene size-up components",
        bullets: [
          "Personal protection: select PPE based on anticipated contact and exposure.",
          "Scene safety: identify current and potential hazards, including changes in traffic, weather, crowds, or behavior.",
          "Mechanism or nature: determine what happened or what type of medical complaint brought EMS to the scene.",
          "Patient count: identify whether this is a single-patient call or an incident requiring triage and additional units.",
          "Resources: request fire, law enforcement, rescue, animal control, additional ambulances, or other support before the need becomes critical.",
          "Approach plan: decide where to enter, where equipment should be staged, and how the patient can be removed.",
        ],
        paragraphs: [
          "These observations work together. A mechanism may reveal hazards, the number of patients may change resource needs, and new information may require a different approach route.",
        ],
      },
      {
        id: "dynamic",
        heading: "Scene safety is dynamic",
        paragraphs: [
          "A scene that was safe on arrival may not remain safe. Traffic can begin moving, smoke can increase, a crowd can become agitated, or an animal can enter the approach path. Continue scanning even after patient contact.",
          "Good scene management also protects the exit route. Avoid placing equipment where it can be struck, contaminated, or block patient movement.",
        ],
      },
      {
        id: "study-errors",
        heading: "Common study mistakes",
        bullets: [
          "Treating scene size-up as words to say rather than observations to make.",
          "Approaching the patient before a visible hazard is controlled.",
          "Waiting too long to request resources.",
          "Forgetting to update the plan when conditions change.",
          "Allowing equipment placement to interfere with the safe approach or exit.",
        ],
      },
    ],
    sources: [
      {
        label: "EMS.gov — EMT Instructional Guidelines: Scene Size-Up",
        url: "https://www.ems.gov/assets/EMT_Instructional_Guidelines.pdf",
      },
      {
        label: "EMS.gov — 2021 National EMS Education Standards",
        url: "https://www.ems.gov/assets/EMS_Education_Standards_2021_Updated2_24_25forEO.pdf",
      },
    ],
    practiceHref: "/emtscene",
    practiceLabel: "Run the interactive scene size-up",
  },
  {
    slug: "recognizing-anaphylaxis-emt-assessment",
    title: "Recognizing Anaphylaxis During an EMT Assessment",
    shortTitle: "Recognizing Anaphylaxis",
    description:
      "Study the respiratory, cardiovascular, skin, gastrointestinal, and neurologic findings that can indicate anaphylaxis.",
    category: "Medical",
    readTime: "7 min read",
    published: "2026-07-17",
    updated: "2026-07-17",
    intro:
      "Anaphylaxis can progress rapidly and may involve several body systems. EMT students should learn to recognize the pattern of findings rather than waiting for one classic sign to appear.",
    keyPoints: [
      "Respiratory distress, hypotension, or airway swelling can be serious even without hives.",
      "Look for findings across respiratory, cardiovascular, skin, gastrointestinal, and neurologic systems.",
      "Rapid progression increases concern.",
      "Prioritize airway, breathing, circulation, timely treatment within scope, and transport.",
      "Follow current local protocol and medical direction.",
    ],
    sections: [
      {
        id: "pattern",
        heading: "Recognize the pattern, not just the rash",
        paragraphs: [
          "Hives, itching, flushing, and swelling are common clues, but skin findings are not present in every case. Serious respiratory or cardiovascular findings can support concern for anaphylaxis even when the skin appears normal.",
          "Ask what changed, how quickly it changed, and whether more than one body system is involved. A known exposure can support the impression, but immediate assessment should not wait for a perfectly identified trigger.",
        ],
      },
      {
        id: "findings",
        heading: "High-concern assessment findings",
        bullets: [
          "Airway and respiratory: throat tightness, voice change, stridor, wheezing, shortness of breath, increased work of breathing, or cyanosis.",
          "Cardiovascular: dizziness, fainting, tachycardia, hypotension, weak pulse, pallor, or collapse.",
          "Skin and mucosal: generalized hives, itching, flushing, or swelling of the lips, tongue, face, or throat.",
          "Gastrointestinal: abdominal pain, cramping, vomiting, or diarrhea in the context of an allergic reaction.",
          "Neurologic and behavioral: agitation, confusion, altered mental status, or a sense of impending doom.",
        ],
      },
      {
        id: "assessment",
        heading: "Assessment priorities",
        paragraphs: [
          "Begin with airway, breathing, and circulation while preparing for rapid deterioration. Determine whether the patient can speak, whether air movement is adequate, and whether perfusion appears compromised.",
          "Gather the history without delaying care: possible trigger, time of exposure, symptom onset, known allergies, previous severe reactions, and whether prescribed epinephrine is available. Treatment and assistance must remain within your certification level, local protocol, and medical direction.",
        ],
      },
      {
        id: "scenario-thinking",
        heading: "Scenario reasoning example",
        paragraphs: [
          "A patient with hives alone may initially appear less unstable than a patient with throat tightness, wheezing, low oxygen saturation, and falling blood pressure. The second pattern involves respiratory and cardiovascular compromise and should drive a higher-priority response.",
          "During practice, avoid anchoring on a single vital sign. Combine the patient's appearance, symptom progression, respiratory effort, perfusion, mental status, and vital-sign trends.",
        ],
        note:
          "This guide is educational. Real patient care must follow your current scope of practice, local protocols, and medical direction.",
      },
    ],
    sources: [
      {
        label: "CDC — Preventing and Managing Adverse Reactions",
        url: "https://www.cdc.gov/vaccines/hcp/imz-best-practices/preventing-managing-adverse-reactions.html",
      },
      {
        label: "CDC — Management of Anaphylaxis",
        url: "https://www.cdc.gov/vaccines/covid-19/clinical-considerations/managing-anaphylaxis.html",
      },
      {
        label: "EMS.gov — EMT Instructional Guidelines",
        url: "https://www.ems.gov/assets/EMT_Instructional_Guidelines.pdf",
      },
    ],
    practiceHref: "/emtscene",
    practiceLabel: "Practice the allergic emergency scene",
  },
  {
    slug: "emt-shock-vital-sign-patterns",
    title: "EMT Shock Assessment: Reading Vital-Sign Patterns",
    shortTitle: "Shock Vital-Sign Patterns",
    description:
      "Learn how EMT students can combine mental status, pulse, breathing, skin findings, and blood-pressure trends when assessing shock.",
    category: "Medical",
    readTime: "7 min read",
    published: "2026-07-17",
    updated: "2026-07-17",
    intro:
      "Shock is a problem of inadequate tissue perfusion. No single number tells the complete story, so EMT assessment should combine the patient's appearance, mental status, pulse, breathing, skin findings, blood pressure, and changes over time.",
    keyPoints: [
      "Think in patterns and trends rather than isolated vital signs.",
      "Altered mental status and worsening respiratory effort can indicate poor perfusion.",
      "A rapid or weak pulse and abnormal skin findings add important context.",
      "Hypotension is concerning, but a normal pressure does not automatically exclude compensated shock.",
      "Search for and manage the likely cause within your scope and protocol.",
    ],
    sections: [
      {
        id: "perfusion",
        heading: "Start with the concept of perfusion",
        paragraphs: [
          "Tissues require adequate circulation to receive oxygen and remove waste. Shock develops when that delivery is inadequate. The cause may involve volume loss, pump failure, abnormal vessel dilation, or obstruction, and the visible pattern can vary.",
          "For the EMT student, the first goal is not to name every subtype immediately. It is to recognize inadequate perfusion, identify likely causes from the scene and history, and prioritize appropriate care and transport.",
        ],
      },
      {
        id: "pattern",
        heading: "Build the vital-sign pattern",
        bullets: [
          "Mental status: anxiety, restlessness, confusion, reduced responsiveness, or loss of consciousness can reflect worsening perfusion.",
          "Pulse: rate, strength, regularity, and trends matter. A rapid or weak pulse may be concerning in context.",
          "Breathing: tachypnea, increased effort, or severe shortness of breath can accompany shock.",
          "Skin: temperature, moisture, pallor, flushing, or cyanosis can help characterize the presentation.",
          "Blood pressure: hypotension is a serious finding, but interpret it with the rest of the assessment and repeat it when the patient's condition changes.",
          "Trend: deterioration across repeated assessments is often more meaningful than a single measurement.",
        ],
      },
      {
        id: "context",
        heading: "Connect the pattern to the cause",
        paragraphs: [
          "The scene and complaint help explain the vital signs. External bleeding, gastrointestinal losses, allergic exposure, chest pain, infection concerns, or traumatic mechanism each changes what you should look for next.",
          "Do not let one normal value erase an otherwise concerning presentation. Likewise, avoid labeling every fast pulse as shock without considering pain, fever, anxiety, medications, and other causes.",
        ],
      },
      {
        id: "reassessment",
        heading: "Reassessment closes the loop",
        paragraphs: [
          "Repeat the primary assessment and vital signs according to patient condition and local protocol. Look for changes after positioning, bleeding control, oxygen or ventilation support, temperature management, or other interventions within your scope.",
          "A useful handoff describes the trend: what you first found, what changed, what you did, and how the patient responded.",
        ],
        note:
          "This guide does not replace local protocol or medical direction. Shock is a life-threatening emergency requiring prompt recognition and care.",
      },
    ],
    sources: [
      {
        label: "NIH/NHLBI — Cardiogenic Shock Symptoms",
        url: "https://www.nhlbi.nih.gov/health/cardiogenic-shock/symptoms",
      },
      {
        label: "NCBI Bookshelf — Shock",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK531492/",
      },
      {
        label: "EMS.gov — EMT Instructional Guidelines",
        url: "https://www.ems.gov/assets/EMT_Instructional_Guidelines.pdf",
      },
    ],
    practiceHref: "/emtrainer",
    practiceLabel: "Practice shock recognition",
  },
  {
    slug: "nremt-clinical-judgment-strategy",
    title: "NREMT Clinical Judgment Strategy for EMT Students",
    shortTitle: "NREMT Clinical Judgment Strategy",
    description:
      "Use a practical clinical-judgment framework to approach NREMT-style questions without memorizing leaked or reconstructed exam content.",
    category: "Exam preparation",
    readTime: "8 min read",
    published: "2026-07-17",
    updated: "2026-07-17",
    intro:
      "National Registry examination items assess whether candidates can apply knowledge to entry-level EMS tasks. Effective preparation therefore needs more than fact recall: it needs repeated practice identifying the patient problem, prioritizing threats, and selecting the best next action.",
    keyPoints: [
      "Read for the patient's immediate problem and current level of stability.",
      "Choose answers that fit EMT scope and widely accepted practice.",
      "Prioritize scene safety and immediate life threats before lower-priority details.",
      "Answer the question being asked rather than solving the entire call at once.",
      "Use official handbooks, course material, and legitimate practice rather than reconstructed exam questions.",
    ],
    sections: [
      {
        id: "what-is-tested",
        heading: "What the examination is trying to measure",
        paragraphs: [
          "The National Registry describes its examinations as assessments of the knowledge and ability needed for safe, effective entry-level practice. Questions are tied to real EMS tasks and reviewed for accuracy, relevance, and consistency with accepted evidence.",
          "That means a strong study plan should include explaining why an action comes first, not only identifying facts. When two answers seem plausible, the better answer usually matches the patient's immediate priority, the responder's scope, and the information given.",
        ],
      },
      {
        id: "framework",
        heading: "A five-step question framework",
        bullets: [
          "Identify the setting and your role: what can an EMT safely do at this moment?",
          "Classify stability: what findings suggest an immediate airway, breathing, circulation, neurologic, or safety threat?",
          "Notice the timeline: what has already happened, and what has not yet been assessed or treated?",
          "Read the command: is the question asking for the first action, best explanation, priority, or next step?",
          "Compare choices: remove options that are unsafe, outside scope, delayed, or aimed at a lower-priority problem.",
        ],
      },
      {
        id: "distractors",
        heading: "Why distractors feel attractive",
        paragraphs: [
          "A distractor may describe something that is generally useful but not the best action right now. Other distractors may require information you do not have, skip a prerequisite, or assume a scope of practice beyond the EMT level.",
          "Before changing an answer, state the clinical reason for the change. Avoid switching only because another option sounds more technical.",
        ],
      },
      {
        id: "practice-plan",
        heading: "Turn missed questions into better judgment",
        bullets: [
          "Name the clue you missed.",
          "State the life threat or priority the clue represents.",
          "Explain why the correct action comes before the closest distractor.",
          "Practice another scenario with the same decision pattern but different surface details.",
          "Review your current course materials and official National Registry guidance for weak domains.",
        ],
        paragraphs: [
          "This approach converts an incorrect answer into a reusable decision rule. It is more durable than memorizing the wording of one question.",
        ],
      },
      {
        id: "independence",
        heading: "Use legitimate preparation materials",
        paragraphs: [
          "National Registry examination content is protected. Do not use or share recalled, copied, or reconstructed questions. Legitimate practice should teach the underlying knowledge and judgment without pretending to reproduce live examination items.",
          "PathoLogix is an independent educational product and is not affiliated with, endorsed by, or sponsored by the National Registry of Emergency Medical Technicians.",
        ],
      },
    ],
    sources: [
      {
        label: "National Registry — EMT Candidate Handbook",
        url: "https://www.nremt.org/Handbooks/EMT/Overview",
      },
      {
        label: "National Registry — Certification Examination Overview",
        url: "https://www.nremt.org/Handbooks/Certification-Examinations/Overview",
      },
      {
        label: "National Registry — Examination Preparation",
        url: "https://www.nremt.org/Handbooks/Certification-Examinations/Examination-Preparation",
      },
    ],
    practiceHref: "/exam/nremt",
    practiceLabel: "Start an exam practice set",
  },
];

export function getLearnArticle(slug: string) {
  return learnArticles.find((article) => article.slug === slug);
}

export function getRelatedLearnArticles(article: LearnArticle, limit = 2) {
  return learnArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, limit);
}
