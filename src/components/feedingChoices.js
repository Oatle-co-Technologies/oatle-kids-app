import { ANIMALS } from './animalLogic.js';

// Two objects are enough for a toddler to explore without a wall of choices.
export function feedingChoices(animalId) {
  const index = ANIMALS.findIndex(animal => animal.id === animalId);
  if (index < 0) return [];
  const choices = [ANIMALS[index], ANIMALS[(index + 1) % ANIMALS.length]];
  return index % 2 ? choices.reverse() : choices;
}
