// New adventures use the same ordered planet missions and progress store as
// balloons, shapes and trails. IDs stay independent of titles and planet names.
export const EXTRA_ADVENTURES = [
  {
    id: 'building', title: 'Building Adventure',
    description: 'Build freely with blocks or copy a little shape picture.',
    missions: [
      { key: 'free', mode: 'free', missionTitle: 'Build Anything', description: 'We are going to build with colourful blocks. Make anything you like, then tap I’m finished.' },
      { key: 'house', mode: 'copy', buildIndex: 0, missionTitle: 'Build This: Little House', description: 'We are going to build a little house with shapes.' },
      { key: 'bridge', mode: 'copy', buildIndex: 1, missionTitle: 'Build This: Little Bridge', description: 'We are going to build a little bridge with shapes.' },
      { key: 'rocket', mode: 'copy', buildIndex: 2, missionTitle: 'Build This: Little Rocket', description: 'We are going to build a little rocket with shapes.' },
    ],
  },
  {
    id: 'animals', title: 'Animal Adventure',
    description: 'Feed animals, find their homes and listen for their sounds.',
    missions: [
      { key: 'feed', mode: 'feed', missionTitle: 'Feed the Animal', description: 'We are going to give every animal its favourite food.' },
      { key: 'homes', mode: 'homes', missionTitle: 'Animal Homes', description: 'We are going to take every animal home. Drag each animal to its home.' },
      { key: 'sounds', mode: 'sounds', missionTitle: 'Hear the Sound', description: 'We are going to listen to animal sounds and find the animals that make them.' },
    ],
  },
  {
    id: 'puzzles', title: 'Puzzle Adventure',
    description: 'Put together big, simple picture puzzles.',
    missions: [
      { key: 'lion', scene: 0, missionTitle: 'Lion Puzzle', description: 'We are going to put five pieces together to make a lion picture.' },
      { key: 'cow', scene: 1, missionTitle: 'Cow Puzzle', description: 'We are going to put five pieces together to make a cow picture.' },
      { key: 'turtle', scene: 2, missionTitle: 'Turtle Puzzle', description: 'We are going to put five pieces together to make a turtle picture.' },
    ],
  },
  {
    id: 'music', title: 'Music & Movement',
    description: 'Play instruments, copy two sounds and dance along.',
    missions: [
      { key: 'play', mode: 'play', missionTitle: 'My Little Band', description: 'We are going to play drums, bongos, a bell, a piano and a xylophone. Play as long as you like, then tap the tick.' },
      { key: 'copy', mode: 'copy', missionTitle: 'Copy My Music', description: 'We are going to listen and copy two sounds, with one instrument at a time.' },
      { key: 'dance', mode: 'dance', missionTitle: 'Dance & Freeze', description: 'We are going to dance when the music plays and freeze when it stops. Let’s play three rounds!' },
    ],
  },
];

export function makeExtraAdventures(planetArt) {
  return EXTRA_ADVENTURES.map(({ missions, ...adventure }) => ({
    ...adventure,
    planets: missions.map((mission, index) => ({
      ...planetArt[index], ...mission, id: index + 1,
      activity: adventure.id, progressId: `${adventure.id}-${mission.key}`,
    })),
  }));
}
