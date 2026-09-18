import { anaphylaxisFestivalScenario, hypoglycemiaScenario, type SceneScenarioConfig, type SceneEvent } from './emtSceneEngine';

// SickCity owns its scene setup. Clinical assessment/treatment actions can be shared,
// but lab props and hazards must never become requirements in the city.
const citySafetyEvent: SceneEvent = 'CRASH_SCENE_INSPECTED'; // Existing engine's generic inspection event.
const cityEvents = (events?: string[]) => events?.map(event => event === 'DOG_SECURED' ? citySafetyEvent : event);
export const sickCityTeenBreathingScenario: SceneScenarioConfig = {
  ...anaphylaxisFestivalScenario,
  id: "sickcity-teen-breathing",
  dispatch: 'Teen with shortness of breath near Maple Street and 4th Avenue.',
  sceneReport: 'A teen is lying beside the sidewalk at Riverside Park. Check the immediate surroundings and safe access before approaching.',
  currentObjectiveId: 'scene-size-up',
  environmentInitialState: {...hypoglycemiaScenario.environmentInitialState},
  objectives: [
    {...hypoglycemiaScenario.objectives[0]},
    ...anaphylaxisFestivalScenario.objectives.filter(objective => !['inspect-dog','use-radio','secure-dog'].includes(objective.id)),
  ],
  interactiveObjects: [
    {...hypoglycemiaScenario.interactiveObjects[0], actions: hypoglycemiaScenario.interactiveObjects[0].actions.map(action => ({...action, description: action.id === 'inspect-medical-scene' ? 'Check the sidewalk, nearby street, and safe access to the patient.' : action.description}))},
    ...anaphylaxisFestivalScenario.interactiveObjects.filter(object => !['dog','ambulance-radio'].includes(object.id)).map(object => ({
      ...object, visibleWhen:cityEvents(object.visibleWhen), enabledWhen:cityEvents(object.enabledWhen), completedWhen:cityEvents(object.completedWhen),
      actions:object.actions.map(action=>({...action,requires:cityEvents(action.requires),
        description:action.id==='general-impression' ? 'Teen lying beside the sidewalk, visibly anxious, with flushed skin, hives, and labored breathing.' : action.description,
      })),
    })),
  ],
};
