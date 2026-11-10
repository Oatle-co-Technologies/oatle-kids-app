export const BUILD_SIZE = 5;
export const PARTS = {
  hull: { name: 'Hull block', colour: '#d8e8fa', turns: 1 },
  window: { name: 'Window', colour: '#70e5df', turns: 1 },
  nose: { name: 'Triangle', colour: '#ffbd72', turns: 4 },
  panel: { name: 'Solar panel', colour: '#90a6ff', turns: 2 },
};
const part = (row, col, kind, turn = 0) => ({ cell: row * BUILD_SIZE + col, kind, turn });
export const SPACE_BUILDS = [
  { id: 'rocket', title: 'Rocket Rescue', location: 'Mercury launch station', brief: 'The rescue crew needs a rocket. Copy the blueprint to assemble its nose, cabin, fins and engines.', success: 'Rescue rocket ready! The crew can begin their mission.', parts: [part(0,2,'nose'),part(1,2,'window'),part(2,2,'hull'),part(2,1,'nose',3),part(2,3,'nose',1),part(3,2,'hull'),part(4,1,'nose',2),part(4,2,'nose',2),part(4,3,'nose',2)] },
  { id: 'base', title: 'Lunar Base', location: 'Earth’s Moon', brief: 'The Moon team needs a base. Build two towers, connect the rooms and turn the solar panels upright.', success: 'Lunar base complete! The Moon team is ready to explore.', parts: [part(0,1,'nose'),part(0,3,'nose'),part(1,1,'window'),part(1,3,'window'),part(2,0,'panel',1),part(2,1,'hull'),part(2,2,'window'),part(2,3,'hull'),part(2,4,'panel',1),part(3,0,'panel',1),part(3,1,'window'),part(3,2,'hull'),part(3,3,'window'),part(3,4,'panel',1),part(4,1,'hull'),part(4,2,'hull'),part(4,3,'hull')] },
  { id: 'station', title: 'Orbital Workshop', location: 'Saturn orbit', brief: 'Build a space station for the explorers. Match the solar wings, living pods and central docking port.', success: 'Space station online! The explorers have a new home in orbit.', parts: [part(0,2,'nose'),part(1,2,'hull'),part(2,0,'panel'),part(2,1,'panel'),part(2,2,'window'),part(2,3,'panel'),part(2,4,'panel'),part(3,1,'window'),part(3,2,'hull'),part(3,3,'window'),part(4,1,'hull'),part(4,2,'nose',2),part(4,3,'hull')] },
];
export function fitsBlueprint(build, placed, choice, cell) {
  if (!choice || !PARTS[choice.kind] || placed.some(p => p.cell === cell)) return false;
  return build.parts.some(p => p.cell === cell && p.kind === choice.kind && p.turn === choice.turn % PARTS[choice.kind].turns);
}
export function remainingParts(build, placed, kind) {
  return build.parts.filter(p => p.kind === kind).length - placed.filter(p => p.kind === kind).length;
}
