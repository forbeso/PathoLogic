import Seo from "@/components/Seo";
import SickCityGame from "@/components/SickCityGame";

export default function SickCityPage() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-[#06171d]">
      <Seo
        title="SickCity EMT Game"
        description="Take dispatches, move through the city, find patients, and practice EMT decision-making in a playable training shift."
        path="/sickcity"
      />
      <div className="h-full">
        <SickCityGame />
      </div>
    </div>
  );
}
