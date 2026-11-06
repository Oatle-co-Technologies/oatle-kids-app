export function missionBreakDue(step, total, finished = false) {
  return !finished && Number.isInteger(step) && Number.isInteger(total) && total > 1 && step === Math.ceil(total / 2) && step < total;
}
