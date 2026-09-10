import { SICK_CITY_CALLS } from "./sickCity";

/** Resolve rewards from known content; never trust an XP amount from the client. */
export function progressionAwardXp(awardId: unknown, eventType: unknown, metadata: unknown): number | null {
  if (typeof awardId !== "string" || awardId.length < 3 || awardId.length > 180) return null;
  if (eventType !== "scenario_objective" && eventType !== "scenario_complete") return null;
  if (awardId.startsWith("emt-scene:")) return eventType === "scenario_objective" ? 10 : 40;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const details = metadata as { scenarioId?: unknown; objectiveId?: unknown };
  const call = SICK_CITY_CALLS.find(candidate => candidate.id === details.scenarioId);
  if (!call) return null;
  if (eventType === "scenario_complete") {
    return details.objectiveId === "complete" && awardId === `sickcity:${call.id}:complete:v2` ? call.rewardXp : null;
  }
  const step = call.steps.find(candidate => candidate.id === details.objectiveId);
  return step && awardId === `sickcity:${call.id}:${step.id}:v2` ? 10 : null;
}
