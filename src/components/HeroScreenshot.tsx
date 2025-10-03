import Image from "next/image";

export default function HeroScreenshot() {
  return (
    <div className="relative rounded-2xl shadow-xl overflow-hidden border ">
      <Image
        src="/mock_screen.png"
        alt="PathoLogic mock screenshot"
        width={1200}
        height={800}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
