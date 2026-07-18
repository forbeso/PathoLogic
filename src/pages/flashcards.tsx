// pages/flashcards.tsx
import FlashcardTrainer from "@/components/FlashcardTrainer";
import Seo from "@/components/Seo";

export default function FlashcardsPage() {
  return (
    <>
      <Seo
        title="EMT and NREMT Flashcards"
        description="Review core EMT assessments, pathophysiology, treatment priorities, and NREMT-style concepts with focused flashcards."
        path="/flashcards"
      />
      <FlashcardTrainer />
    </>
  );
}
