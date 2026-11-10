export const ANIMALS = [
  { id: 'dog', name: 'Dog', emoji: '🐶', food: '🦴', foodName: 'bone', home: '🏠', homeName: 'dog house', sound: 'dog bark' },
  { id: 'cat', name: 'Cat', emoji: '🐱', food: '🐟', foodName: 'fish', home: '🧺', homeName: 'cosy basket', sound: 'cat meow' },
  { id: 'cow', name: 'Cow', emoji: '🐮', food: '🌽', foodName: 'corn', home: '🚜', homeName: 'farm field', sound: 'cow sound' },
  { id: 'sheep', name: 'Sheep', emoji: '🐑', food: '🌿', foodName: 'grass', home: '⛰️', homeName: 'hillside', sound: 'sheep bleat' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', food: '🍃', foodName: 'leaves', home: '🌳', homeName: 'savannah', sound: 'elephant trumpet' },
  { id: 'horse', name: 'Horse', emoji: '🐴', food: '🥕', foodName: 'carrot', home: '🏇', homeName: 'stable', sound: 'horse neigh' },
  { id: 'pig', name: 'Pig', emoji: '🐷', food: '🍎', foodName: 'apple', home: '🛖', homeName: 'pigsty', sound: 'pig oink' },
  { id: 'duck', name: 'Duck', emoji: '🦆', food: '🫛', foodName: 'peas', home: '🏞️', homeName: 'pond', sound: 'duck quack' },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', food: '🌾', foodName: 'grain', home: '🏡', homeName: 'chicken coop', sound: 'chicken cluck' },
];

export function byId(id) { return ANIMALS.find((animal) => animal.id === id); }

export function isRightFood(animalId, food) { return byId(animalId)?.food === food; }

export function isRightHome(animalId, home) { return byId(animalId)?.home === home; }
