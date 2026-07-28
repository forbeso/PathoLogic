alter table public.scenario_attempts
  drop constraint if exists scenario_attempts_scenario_id_check;

alter table public.scenario_attempts
  add constraint scenario_attempts_scenario_id_check
  check (
    scenario_id in (
      'anaphylaxis',
      'car-accident',
      'hypoglycemia',
      'opioid-overdose',
      'chest-pain'
    )
  );
