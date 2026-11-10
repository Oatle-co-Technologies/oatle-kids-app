export const BIG_KIDS_HOMES = [
  { id: 'reading', screen: 'map', title: 'Reading Adventure', subtitle: 'The reading observatory', image: '/adventure-homes/reading.webp', color: '#a8c9ff' },
  { id: 'writing', screen: 'writingMap', title: 'Writing and Arts', subtitle: 'The pencil workshop', image: '/adventure-homes/writing.webp', color: '#ffcb75' },
  { id: 'counting', screen: 'math', title: 'Maths Adventure', subtitle: 'The number laboratory', image: '/adventure-homes/maths.webp', color: '#8ee6e3' },
  { id: 'cosmicPuzzles', screen: 'cosmicPuzzles', title: 'Cosmic Puzzles', subtitle: 'Space Challenge Arcade', image: '/adventure-homes/puzzles.webp', color: '#e4a0ff' },
  { id: 'spaceBuilder', screen: 'spaceBuilder', title: 'Space Builder', subtitle: 'Space Challenge Arcade', image: '/adventure-homes/builder.webp', color: '#ffb495' },
  { id: 'storybooks', screen: 'storybooks', title: 'Storybook Adventure', subtitle: 'Stories live here', image: '/adventure-homes/storybooks.webp', color: '#ffdf91' },
  { id: 'feelings', screen: 'feelings', title: 'Feelings Adventure', subtitle: 'Make a Face: eyes, eyebrows and mouths', image: '/adventure-homes/feelings.webp', color: '#eab6d3' },
  { id: 'music', screen: 'music', title: 'Music Adventure', subtitle: 'Meet the notes and make your own music', image: '/adventure-homes/music.webp', color: '#c5b5ef' },
];


export function adventureEntryScreen(id) {
  return BIG_KIDS_HOMES.find(home => home.id === id)?.screen || null;
}
