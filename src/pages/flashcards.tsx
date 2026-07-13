// pages/flashcards.tsx
import FlashcardTrainer from "@/components/FlashcardTrainer";
import Head from "next/head";

export default function FlashcardsPage() {
  return (
    <>
      <Head><title>PathoLogix - Flashcards</title></Head>
      <FlashcardTrainer />
    </>
  );
}
