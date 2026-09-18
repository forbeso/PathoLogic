import dynamic from "next/dynamic";
const ClinicalSceneSession = dynamic(() => import("@/components/ClinicalSceneSession"));

export default function EMTScenePage() {
  return <ClinicalSceneSession />;
}
