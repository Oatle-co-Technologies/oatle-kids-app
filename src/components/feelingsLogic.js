import { FEELINGS, LITTLE_FEELING_ROUNDS } from './feelingsData.js';

export const initialFeelingsState = () => ({ index: 0, phase: 'welcome', feeling: null, feedback: '' });
export function feelingRounds() { return LITTLE_FEELING_ROUNDS; }
export function feelingsStep(state, event) {
  const round = LITTLE_FEELING_ROUNDS[state.index];
  if (event.type === 'RESTART') return { ...initialFeelingsState(), phase: 'feeling' };
  if (event.type === 'START' && state.phase === 'welcome') return { ...state, phase: 'feeling' };
  if (event.type === 'FEELING' && state.phase === 'feeling') {
    if (!round.choices.includes(event.id)) return state;
    if (event.id !== round.target) return { ...state, feedback: `That child’s face looks ${FEELINGS[event.id].label.toLowerCase()}. ${FEELINGS[round.target].hint} Find ${FEELINGS[round.target].label.toLowerCase()}.` };
    return { ...state, phase: 'matched', feeling: event.id, feedback: `You found ${FEELINGS[event.id].label.toLowerCase()}! ${FEELINGS[event.id].hint}` };
  }
  if (event.type === 'NEXT' && state.phase === 'matched') {
    return state.index + 1 === LITTLE_FEELING_ROUNDS.length
      ? { ...state, phase: 'complete', feedback: '' }
      : { index: state.index + 1, phase: 'feeling', feeling: null, feedback: '' };
  }
  return state;
}
