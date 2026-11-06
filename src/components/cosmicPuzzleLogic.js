export const PUZZLE_LEVELS = {
  explorer: { title: 'Explorer', columns: 5, rows: 2, pieces: 10 },
  navigator: { title: 'Navigator', columns: 4, rows: 3, pieces: 12 },
  pilot: { title: 'Pilot', columns: 4, rows: 4, pieces: 16 },
  commander: { title: 'Commander', columns: 5, rows: 4, pieces: 20 },
};

export function cosmicSolved(tiles, size) {
  return tiles.length === size && tiles.every((tile, index) => tile === index);
}

export function swapCosmicTiles(tiles, first, second) {
  const next = [...tiles];
  if (![first, second].every(index => Number.isInteger(index) && index >= 0 && index < tiles.length)) return next;
  [next[first], next[second]] = [next[second], next[first]];
  return next;
}

export function shuffleCosmicTiles(size, random = Math.random) {
  const tiles = Array.from({ length: size }, (_, index) => index);
  for (let index = size - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [tiles[index], tiles[other]] = [tiles[other], tiles[index]];
  }
  return cosmicSolved(tiles, size) ? swapCosmicTiles(tiles, 0, size - 1) : tiles;
}
