import type { ComponentProps } from 'react';
import ClinicalSceneSession from './ClinicalSceneSession';
import { sickCityTeenBreathingScenario } from '@/lib/sickCityClinicalScenarios';

// City scene configuration loads with care, not with the dispatch screen.
export default function SickCityClinicalSession(props:ComponentProps<typeof ClinicalSceneSession>) {
  return <ClinicalSceneSession {...props} sickCity={props.sickCity ? {...props.sickCity,
    sceneConfig:props.initialScenarioId==='anaphylaxis'?sickCityTeenBreathingScenario:undefined,
  } : undefined}/>;
}
