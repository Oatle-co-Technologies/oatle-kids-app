export function isSolved(tiles) { return tiles.length === 10 && tiles.every((tile, index) => tile === index); }
export function swapTiles(tiles, from, to) {
  const next = [...tiles];
  if (![from, to].every(index => Number.isInteger(index) && index >= 0 && index < next.length)) return next;
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
export function shuffleTiles() {
  const tiles = Array.from({ length: 10 }, (_, index) => index);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return isSolved(tiles) ? swapTiles(tiles, 0, 9) : tiles;
}
