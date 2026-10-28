export const ANIMALS = [
  { id: 'bunny', name: 'Bunny', emoji: '🐰', food: '🥕', foodName: 'carrot', home: '🌿', homeName: 'meadow', sound: 'Hop hop!' },
  { id: 'monkey', name: 'Monkey', emoji: '🐵', food: '🍌', foodName: 'banana', home: '🌴', homeName: 'jungle tree', sound: 'Ooh ooh!' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', food: '🐟', foodName: 'fish', home: '🧊', homeName: 'icy home', sound: 'Honk honk!' },
];

export function byId(id) { return ANIMALS.find((animal) => animal.id === id); }

export function isRightFood(animalId, food) { return byId(animalId)?.food === food; }

export function isRightHome(animalId, home) { return byId(animalId)?.home === home; }
