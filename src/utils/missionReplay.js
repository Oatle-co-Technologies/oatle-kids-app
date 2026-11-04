// Achievements and the current attempt are separate: a completed mission can
// start over without losing its completion star, unlocks or a paused replay.
export function beginMissionRun(progress, id, { restart = false } = {}) {
  const completed = progress.completedMissions?.[id] ?? (id < progress.unlocked);
  const fresh = restart || (completed && progress.missionRuns?.[id] !== 'in-progress');
  return {
    ...progress,
    missions: { ...progress.missions, [id]: fresh ? 0 : progress.missions?.[id] || 0 },
    startedMissions: { ...progress.startedMissions, ...(fresh ? { [id]: false } : {}) },
    missionRuns: { ...progress.missionRuns, [id]: 'in-progress' },
  };
}

export function finishMissionRun(progress, id) {
  return {
    ...progress,
    completedMissions: { ...progress.completedMissions, [id]: true },
    startedMissions: { ...progress.startedMissions, [id]: false },
    missionRuns: { ...progress.missionRuns, [id]: 'complete' },
  };
}
