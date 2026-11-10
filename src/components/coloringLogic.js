export const emptyColouring = () => ({ colours: {}, past: [], future: [] });

// History belongs to each picture, so changing pages never replaces another drawing.
export function changeColouring(state, colours) {
  if (JSON.stringify(state.colours) === JSON.stringify(colours)) return state;
  return { colours, past: [...state.past, state.colours].slice(-60), future: [] };
}
export function colourRegion(state, region, colour) {
  const colours = { ...state.colours };
  if (colour === null) delete colours[region];
  else colours[region] = colour;
  return changeColouring(state, colours);
}
export function undoColouring(state) {
  if (!state.past.length) return state;
  return { colours: state.past.at(-1), past: state.past.slice(0, -1), future: [state.colours, ...state.future] };
}
export function redoColouring(state) {
  if (!state.future.length) return state;
  return { colours: state.future[0], past: [...state.past, state.colours], future: state.future.slice(1) };
}
